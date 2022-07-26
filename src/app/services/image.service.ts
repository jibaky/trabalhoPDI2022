import { i18nMetaToJSDoc } from '@angular/compiler/src/render3/view/i18n/meta';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Imagem, Pixel } from '../models/image.model';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  public isLoaded: boolean = false;
  public canUndo: boolean = false;
  public isLaplace: boolean = false;
  public magnitude = [];
  public gX: any = [];
  public gY: any = [];
  private color = [//preto azul ciano verde amarelo
    {r:0, g:0, b:0},
    {r:0, g:0, b:255},
    {r:0, g:255, b:255},
    {r:0, g:255, b:0},
    {r:255, g:255, b:0}
  ];
  private hue = [];
  private pic: Imagem = new Imagem();
  private pic2: Imagem = new Imagem();
  /** observable da imagem original */
  public originalStream = new BehaviorSubject(null);
  /** observable da imagem com alterações */
  public pictureStream = new BehaviorSubject(null);
  public lapOfGauStream = new BehaviorSubject(null);

  constructor() { }

  public getNewPic(){
    let arr = [this.pic.tipo+'\n'+this.pic.largura+' '+this.pic.altura+'\n'+this.pic.valMax]
    if(this.pic.tipo == 'P2'){
      for(let i = 0; i<this.pic.pixels.length; i++){
        arr = arr.concat('\n'+this.pic.pixels[i].r);
      }
      let file = new File(arr, 'newPic.pgm', {type: 'text/plain'})
      return file;
    }
    else{
      for(let i = 0; i<this.pic.pixels.length;i++){
        arr = arr.concat('\n'+this.pic.pixels[i].r+' '+this.pic.pixels[i].g+' '+this.pic.pixels[i].b);
      }
      let file = new File(arr, 'newPic.ppm', {type: 'text/plain'})
      return file;
    }
  }
  public getValMax(){
    if(!this.isLoaded) return 255;
    else return this.pic.valMax;
  }

  public getAltura(){
    return this.pic.altura;
  }

  public getLargura(){
    return this.pic.largura;
  }

  public getSobel(x: number,y: number){
    const largura = this.pic.largura, index = y*largura+x;
    if(this.magnitude[index] == undefined || this.gX[index] == undefined || this.gY[index] == undefined)
    return [0,0,0];
    else return [this.magnitude[index], this.gX[index], this.gY[index]];
  }

  upload(arquivo: File): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      //if(!['image/x-portable-graymap'].includes(arquivo.type)) reject(false);
      let leitor = new FileReader();
      leitor.onloadend=(e)=>{
        const arrDados = String(leitor.result).split('\n');
        this.pic.tipo = arrDados[0];
        this.pic2.tipo = this.pic.tipo;
        const d = arrDados[1].split(' ');
        let inicioPixels = 3;
        if(d.length == 1) {
          this.pic.largura = Number(arrDados[1]);
          this.pic.altura = Number(arrDados[2]);
          this.pic.valMax = Number(arrDados[3]);
          inicioPixels = 4;
        }
        else{
          this.pic.largura = Number(d[0]);
          this.pic.altura = Number(d[1]);
          this.pic.valMax = Number(arrDados[2]);
        }
        this.pic2.largura = this.pic.largura;
        this.pic2.altura = this.pic.altura;
        this.pic2.valMax = this.pic.valMax;
        if(this.pic.tipo == 'P2') {
          this.pic.pixels = this.loadPGM(arrDados, inicioPixels);
          this.pic2.pixels = this.loadPGM(arrDados, inicioPixels);
        }
        if(this.pic.tipo == 'P3') {
          this.pic.pixels = this.loadPPM(arrDados, inicioPixels);
          this.pic2.pixels = this.loadPPM(arrDados, inicioPixels);
        }
        //console.log(this.pic.pixels);
        this.originalStream.next(this.pic);
        this.pictureStream.next(this.pic);
        this.isLoaded = true;
        resolve(true);
      };
      leitor.readAsText(arquivo);

    });
  }
  private loadPGM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i++){
      if(dados[i]!=="")pixels.push(new Pixel(Number(dados[i])));
    }
    this.magnitude = [];
    this.gX = [];
    this.gY = [];
    return pixels;
  }
  private loadPPM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i=i+3){
      if(dados[i]!=="")pixels.push(new Pixel(Number(dados[i]), Number(dados[i+1]), Number(dados[i+2])));
    }
    this.magnitude = [];
    this.gX = [];
    this.gY = [];
    return pixels;
  }
  public undo(){
    if(this.isLaplace){
      for(let i=0; i<this.pic.pixels.length; i++){
        this.pic2.pixels[i].r = this.pic.pixels[i].r;
        this.pic2.pixels[i].g = this.pic.pixels[i].g;
        this.pic2.pixels[i].b = this.pic.pixels[i].b;
      }
    }
    for(let i=0; i<this.pic.pixels.length; i++){
      this.pic.pixels[i].r = this.pic2.pixels[i].r;
      this.pic.pixels[i].g = this.pic2.pixels[i].g;
      this.pic.pixels[i].b = this.pic2.pixels[i].b;
    }
    this.canUndo = false;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  /**
   * função que inverte o valor dos pixels para deixar a imagem negativa
   */
  public negativar(){
    for(let i=0; i<this.pic.pixels.length; i++){
      const max = this.pic.valMax;
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = max-this.pic.pixels[i].r;
      this.pic.pixels[i].g = max-this.pic.pixels[i].g;
      this.pic.pixels[i].b = max-this.pic.pixels[i].b;
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public tornarCinza(){
    if(this.pic.tipo == "P2") return;
    for(let i=0; i<this.pic.pixels.length; i++){
      //const media = Math.floor((element.r + element.g + element.b)/3);
      const media = Math.floor(0.299*this.pic.pixels[i].r+0.587*this.pic.pixels[i].g+0.114*this.pic.pixels[i].b)
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = media;
      this.pic.pixels[i].g = media;
      this.pic.pixels[i].b = media;
    }
    this.pic.tipo = "P2"
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public limiarizacao(val: number){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens cinza, do tipo .pgm");
    for(let i=0; i<this.pic.pixels.length; i++){
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      /** shorthand if sao perguntas sucedidas de ?(o valor caso seja verdade) e depois : (caso seja falso) */
      this.pic.pixels[i].r = this.pic.pixels[i].r >= val ? this.pic.pixels[i].r : 0;
      this.pic.pixels[i].g = this.pic.pixels[i].g >= val ? this.pic.pixels[i].g : 0;
      this.pic.pixels[i].b = this.pic.pixels[i].b >= val ? this.pic.pixels[i].b : 0;
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public binarizacao(val: number){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens cinza, do tipo .pgm");
    for(let i=0; i<this.pic.pixels.length; i++){
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      /** shorthand if sao perguntas sucedidas de ?(o valor caso seja verdade) e depois : (caso seja falso) */
      this.pic.pixels[i].r = this.pic.pixels[i].r >= val ? this.pic.valMax : 0;
      this.pic.pixels[i].g = this.pic.pixels[i].g >= val ? this.pic.valMax : 0;
      this.pic.pixels[i].b = this.pic.pixels[i].b >= val ? this.pic.valMax : 0;
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public compEscDin(c: number, gamma: number){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens cinza, do tipo .pgm");
    let pixels = [];
    for(let i=0; i<this.pic.pixels.length; i++){
      let S = c*Math.pow(this.pic.pixels[i].r, gamma);
      pixels.push(S);
    }
    let minmax = this.getMinMax(pixels);
    for(let i = 0; i<pixels.length; i++){
      let S = 255*((pixels[i]-minmax[0])/(minmax[1]-minmax[0]));
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = Math.round(S);
      this.pic.pixels[i].g = Math.round(S);
      this.pic.pixels[i].b = Math.round(S);
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  private getHistograma(){
    let freq = {};
    for(let i=0; i < this.pic.pixels.length; i++){
      if(freq[this.pic.pixels[i].b]===undefined){
        freq[this.pic.pixels[i].b]=1;
      } else freq[this.pic.pixels[i].b] = freq[this.pic.pixels[i].b]+1;
    }
    return freq;
  }
  private getFreqAcc(freq){
    let tam = Object.keys(freq);
    let fAcc = {};
    for(let i=0; i < tam.length; i++){
      if(i==0) fAcc[tam[i]] = freq[tam[i]];
      else fAcc[tam[i]] = freq[tam[i]] + fAcc[tam[i-1]];
    }
    return fAcc;
  }
  private eqFreq(){
    let freq = this.getHistograma();
    let fAcc = this.getFreqAcc(freq);
    let tam = Object.keys(freq);
    let nCinza = this.pic.valMax, nCol = this.pic.largura, nLin = this.pic.altura;
    let fEq = {};
    for(let i=0; i<tam.length; i++) fEq[tam[i]] = Math.max(0,Math.round((nCinza*fAcc[tam[i]])/(nCol*nLin))-1);
    return fEq;
  }
  private pixelsToHSL(){
    this.pic.valMax = 240;
    for(let i=0; i< this.pic.pixels.length; i++){
      let arr = this.RGBtoHSL(this.pic.pixels[i].r, this.pic.pixels[i].g,this.pic.pixels[i].b);
      this.pic.pixels[i].r = arr[0];
      this.pic.pixels[i].g = arr[1];
      this.pic.pixels[i].b = arr[2];
    }
  }
  private pixelsToRGB(){
    this.pic.valMax = 255;
    for(let i=0; i< this.pic.pixels.length; i++){
      let arr = this.HSltoRGB(this.pic.pixels[i].r, this.pic.pixels[i].g,this.pic.pixels[i].b);
      this.pic.pixels[i].r = arr[0];
      this.pic.pixels[i].g = arr[1];
      this.pic.pixels[i].b = arr[2];
    }
  }
  public equalizarHistograma(){
    if(this.pic.tipo == "P2"){
      let fEq = this.eqFreq();
      for(let i=0; i<this.pic.pixels.length; i++){
        this.pic2.pixels[i].r = this.pic.pixels[i].r;
        this.pic2.pixels[i].g = this.pic.pixels[i].g;
        this.pic2.pixels[i].b = this.pic.pixels[i].b;
        this.pic.pixels[i].r = fEq[this.pic.pixels[i].r];
        this.pic.pixels[i].g = fEq[this.pic.pixels[i].g];
        this.pic.pixels[i].b = fEq[this.pic.pixels[i].b];
      }
    }
    else{
      this.pixelsToHSL();
      let fEq = this.eqFreq();
      for(let i=0; i<this.pic.pixels.length; i++) this.pic.pixels[i].b = fEq[this.pic.pixels[i].b];
      this.pixelsToRGB();
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public RGBtoHSL(r, g, b){
    if(r>255 || g>255 || b>255){
      alert("nao funciona com valores maiores do que 255");
      return [0,0,0]
    }
    r/=255, g/=255, b/=255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax-cmin,
        h=0, s=0, l=0;
    
    if(delta == 0) h=0;
    else if(cmax == r) h = ((g - b) / delta) % 6;
    else if(cmax == g) h = (b - r) / delta + 2;
    else  h = (r - g) / delta + 4;
    h = Math.round(h*40);
    if( h < 0 ) h+=240;

    l = (cmax+cmin)/2;

    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = +(s * 240);
    l = +(l * 240);

    return [Math.round(h),Math.round(s),Math.round(l)]
  }
  private hue2rgb(p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  public HSltoRGB(h, s, l){
    if(h>239 || s>240 || l>240){
      alert("nao funciona com valores maiores do que 240");
      return [0,0,0]
    }
    h /= 240, s /= 240, l /= 240
    let r, g, b;
    if(s == 0) r = g = b = l; //escala de cinza
    else{
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = this.hue2rgb(p, q, h + 1/3);
      g = this.hue2rgb(p, q, h);
      b = this.hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)]
  }
  public addRuidoAleatorio(qtd, b, w){
    for(let i=0; i < this.pic.pixels.length; i++){
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
    }
    let cor;
    qtd = Math.round(qtd * this.pic.pixels.length);
    for(let i=0; i < qtd; i++){
      let x = Math.floor(Math.random()*(this.pic.largura - 0)+0);
      let y = Math.floor(Math.random()*(this.pic.altura - 0)+0);
      if(b && w) cor = Math.round(Math.random());
      else if (b) cor = 0;
      else if (w) cor = 255;
      if (cor == 1) cor = 255
      let index = y*this.pic.largura+x;
      this.pic.pixels[index].r = cor;
      this.pic.pixels[index].g = cor;
      this.pic.pixels[index].b = cor;
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public addRuidoLocal(x, y){
    let largura = this.pic.largura, cor = 0,index = y*largura+x
    let media = (this.pic.pixels[index].r + this.pic.pixels[index].g + this.pic.pixels[index].b)/3
    if(media <= 127) cor = 255
    for(let i = -1; i<2; i++){
      for(let j = -1; j<2; j++){
        index = (y+i)*largura+(x+j)
        if(this.pic.pixels[index] != undefined){
          this.pic.pixels[index].r = cor
          this.pic.pixels[index].g = cor
          this.pic.pixels[index].b = cor
        }
      }
    }
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  private bubbleSort(arr, tam){
    if (tam <= 1) return;
    let acc, aux;
    for(let i=1; i<tam; i++){
      acc = 0;
      for(let j=0; j<tam-i; j++){
        if(arr[j]>arr[j+1]){
          aux = arr[j];
          arr[j] = arr[j+1];
          arr[j+1] = aux;
          acc++;
        }
      }
      if(acc == 0) return;
    }
  }
  public media(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j, value=0;
        let mask = this.calcVizinho3x3(i, j, index, [1,1,1,1,1,1,1,1,1]); 
        for(let aux = 0; aux<9; aux++) value+=mask[aux];
        value = value/9;
        pixels.push(Math.round(value));
      }
      for(let i = 0; i<pixels.length; i++){
        this.pic2.pixels[i].r = this.pic.pixels[i].r;
        this.pic2.pixels[i].g = this.pic.pixels[i].g;
        this.pic2.pixels[i].b = this.pic.pixels[i].b;
        this.pic.pixels[i].r = pixels[i];
        this.pic.pixels[i].g = pixels[i];
        this.pic.pixels[i].b = pixels[i];
      }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public mediana(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j;
        let mask = this.calcVizinho3x3(i, j, index, [1,1,1,1,1,1,1,1,1]); 
        this.bubbleSort(mask, mask.length);
        pixels.push(mask[4]);
      }
    for(let i = 0; i<pixels.length; i++){
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = pixels[i];
      this.pic.pixels[i].g = pixels[i];
      this.pic.pixels[i].b = pixels[i];
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }

  public pontoMinimo(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j;
        let mask = this.calcVizinho3x3(i, j, index, [1,1,1,1,1,1,1,1,1]); 
        this.bubbleSort(mask, mask.length);
        pixels.push(mask[0]);
      }
    for(let i = 0; i<pixels.length; i++){
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = pixels[i];
      this.pic.pixels[i].g = pixels[i];
      this.pic.pixels[i].b = pixels[i];
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }

  public pontoMaximo(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j;
        let mask = this.calcVizinho3x3(i, j, index, [1,1,1,1,1,1,1,1,1]); 
        this.bubbleSort(mask, mask.length);
        pixels.push(mask[8]);
      }
    for(let i = 0; i<pixels.length; i++){
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = pixels[i];
      this.pic.pixels[i].g = pixels[i];
      this.pic.pixels[i].b = pixels[i];
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }

  public pontoMedio(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j;
        let mask = this.calcVizinho3x3(i, j, index, [1,1,1,1,1,1,1,1,1]); 
        this.bubbleSort(mask, mask.length);
        pixels.push(Math.round((mask[8]+mask[0])/2));
      }
    for(let i = 0; i<pixels.length; i++){
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = pixels[i];
      this.pic.pixels[i].g = pixels[i];
      this.pic.pixels[i].b = pixels[i];
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public lap(){
    this.laplace()
    this.lapOfGau(this.pic2)
    this.isLaplace = true
    this.canUndo = true
  }
  public laplace(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j, value=0;
        let mask = this.calcVizinho3x3(i, j, index, [0,-1,0,-1,4,-1,0,-1,0]); 
        for(let aux = 0; aux<9; aux++) value+=mask[aux];
        value = Math.abs(value);
        pixels.push(Math.round(value));
      }
      for(let i=0; i<pixels.length; i++){
        this.pic2.pixels[i].r = this.pic.pixels[i].r;
        this.pic2.pixels[i].g = this.pic.pixels[i].g;
        this.pic2.pixels[i].b = this.pic.pixels[i].b;
        this.pic.pixels[i].r = pixels[i];
        this.pic.pixels[i].g = pixels[i];
        this.pic.pixels[i].b = pixels[i];
      }
    this.pictureStream.next(this.pic);
  }

  public lapOfGau(imagem: Imagem){
    if(imagem.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = imagem.largura, altura = imagem.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j, value=0;
        let mask = this.calcVizinho5x5(i, j, index, [0,0,-1,0,0,0,-1,-2,-1,0,-1,-2,16,-2,-1,0,-1,-2,-1,0,0,0,-1,0,0]); 
        for(let aux = 0; aux<25; aux++) value+=mask[aux];
        value = Math.abs(value);
        pixels.push(Math.round(value));
      }
      let minmax = this.getMinMax(pixels)
      for(let i=0; i<pixels.length; i++){
        let pixelEq = 255*((pixels[i]-minmax[0])/(minmax[1]-minmax[0]));
        this.pic.pixels[i].r = imagem.pixels[i].r
        this.pic.pixels[i].g = imagem.pixels[i].g
        this.pic.pixels[i].b = imagem.pixels[i].b
        imagem.pixels[i].r = pixelEq;
        imagem.pixels[i].g = pixelEq;
        imagem.pixels[i].b = pixelEq;
      }
    this.lapOfGauStream.next(imagem);
  }

  public laplaceSharp(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let pixels = [], largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j, value=0;
        let mask = this.calcVizinho3x3(i, j, index, [0,-1,0,-1,5,-1,0,-1,0]); 
        for(let aux = 0; aux<9; aux++) value+=mask[aux];
        value = Math.abs(value);
        pixels.push(Math.round(value));
      }
      for(let i=0; i<pixels.length; i++){
        this.pic2.pixels[i].r = this.pic.pixels[i].r;
        this.pic2.pixels[i].g = this.pic.pixels[i].g;
        this.pic2.pixels[i].b = this.pic.pixels[i].b;
        this.pic.pixels[i].r = pixels[i];
        this.pic.pixels[i].g = pixels[i];
        this.pic.pixels[i].b = pixels[i];
      }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }

  public sobel(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let magnitude = [], largura = this.pic.largura, altura = this.pic.altura, copiaX, copiaY;
    this.gX = [];
    this.gY = [];
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j, valueX = 0, valueY = 0;
        copiaX = this.calcVizinho3x3(i, j, index, [-1,0,1,-2,0,2,-1,0,1]);
        copiaY = this.calcVizinho3x3(i, j, index, [-1,-2,-1,0,0,0,1,2,1]);
        for(let aux = 0; aux<copiaX.length; aux++){
          valueX += copiaX[aux];
          valueY += copiaY[aux];
        }
        valueX = valueX/4;
        valueY = valueY/4;
        this.gX.push(valueX);
        this.gY.push(valueY);
        magnitude.push(Math.sqrt((valueX * valueX)+(valueY * valueY)));
      }
    let minmax = this.getMinMax(magnitude);
    for(let i=0; i<magnitude.length; i++){
      magnitude[i] = 255*((magnitude[i]-minmax[0])/(minmax[1]-minmax[0]));
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = magnitude[i];
      this.pic.pixels[i].g = magnitude[i];
      this.pic.pixels[i].b = magnitude[i];
    }
    this.magnitude = magnitude;
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  private getMinMax(arr){
    let min =  9007199254740991, max = -9007199254740991;
    for(let i = 0; i<arr.length; i++){
      if(arr[i]<min) min = arr[i];
      if(arr[i]>max) max = arr[i];
    }
    return [min, max]
  }
  private convol(pixels, mask1){
    let mask2 = [ ];
    for(let i = 0; i<mask1.length; i++){
      mask2.push(pixels[i] * mask1[i])
    }
    return mask2;
  }
  private calcVizinho3x3(i, j, index, mask1){
    let mask2 ;
    let largura = this.pic.largura, altura = this.pic.altura;
    //console.log(index);
    if(index == 0){//canto superior esquerdo
      //console.log('teste1', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+0);
      mask2 = this.convol([
        this.pic.pixels[index].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r, 
        this.pic.pixels[index].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r, 
        this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r], 
        mask1);
      //console.log('teste1F');
    }
    else if(index == largura-1){//canto superior direito
      //console.log('teste2','index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(largura-1));
      mask2 = this.convol([
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r],
        mask1);
      //console.log('teste2F');
    }
    else if(index == (altura-1)*largura){//canto inferior esquerdo
      //console.log('teste3', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura-1)*largura);
      mask2 = this.convol([
        this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,
        this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r],
        mask1);
      //console.log('teste3F');
    }
    else if(index == altura*largura-1){//canto inferior direito
      //console.log('teste4', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura*largura-1));
      mask2 = this.convol([
        this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,
        this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
        this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r],
        mask1);
      //console.log('teste4F');
    }
    else if(index == i*largura){//borda esquerda
      //console.log('teste5', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(i*largura));
      mask2 = this.convol([
        this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r],
        mask1);
      //console.log('teste5F');
    }
    else if(index == (i+1)*largura-1){//borda direita
      //console.log('teste6', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+((i+1)*largura-1));
      mask2 = this.convol([
        this.pic.pixels[(i-1)*largura+(j-1)].r, this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j)].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r],
        mask1);
      //console.log('teste6F');
    }
    else if(index < largura){//borda cima
      //console.log('teste7', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '<'+largura);
      mask2 = this.convol([
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r],
        mask1);
      //console.log('teste7F');
    }
    else if(index > (altura-1)*largura){//borda baixo
      //console.log('teste8', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '>'+(altura-1)*largura);
      mask2 = this.convol([
        this.pic.pixels[(i-1)*largura+(j-1)].r, this.pic.pixels[(i-1)*largura+j].r, this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r],
        mask1);
      //console.log('teste8F');
    }
    else{
      //console.log('teste9', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura);
      mask2 = this.convol([
        this.pic.pixels[(i-1)*largura+(j-1)].r, this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r],
        mask1);
      //console.log('teste9F');
    }
    return mask2;
  }

  private calcVizinho5x5(i, j, index, mask1){
    let mask2 ;
    let largura = this.pic.largura, altura = this.pic.altura;
    // console.log('index convol: '+index);
    if(index == 0){//canto superior esquerdo
      //console.log('teste1', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+0);
      mask2 = this.convol([
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r
          ], mask1);
      //console.log('teste1F');
    }
    else if(index == 1){
      mask2 = this.convol([
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r
          ], mask1);
    }
    else if(index == largura-2){
      mask2 = this.convol([
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+1)].r
          ], mask1);
    }
    else if(index == largura-1){//canto superior direito
    //console.log('teste2','index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(largura-1));
    mask2 = this.convol([
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r
          ], mask1);
    //console.log('teste2F');
    }
    else if(index == largura){
      mask2 = this.convol([
          this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r
          ], mask1);
    }
    else if(index == largura+1){
      mask2 = this.convol([
          this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r
          ], mask1);
    }
    else if(index == 2*largura-2){
      mask2 = this.convol([
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+1)].r
          ], mask1);
    }
    else if(index == 2*largura-1){
      mask2 = this.convol([
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r
          ], mask1);
    }
    else if(index == (altura-2)*largura){
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r
          ], mask1);
    }
    else if(index == (altura-2)*largura+1){
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r
          ], mask1);
    }
    else if(index == (altura-1)*largura-2){
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+1)].r
          ], mask1);
    }
    else if(index == (altura-1)*largura-1){
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r
          ], mask1);
    }
    else if(index == (altura-1)*largura){//canto inferior esquerdo
      //console.log('teste3', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura-1)*largura);
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r
          ], mask1);
      //console.log('teste3F');
    }
    else if(index == (altura-1)*largura+1){
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r
          ], mask1);
    }
    else if(index == altura*largura-2){
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r
          ], mask1);
    }
    else if(index == altura*largura-1){//canto inferior direito
      //console.log('teste4', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura*largura-1));
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r
          ], mask1);
      //console.log('teste4F');
    }
    else if(index>largura+1 && index<2*largura-2){//semiborda cima
      mask2 = this.convol([
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r,
          ], mask1);
    }
    else if(index == i*largura+1){//semiborda esquerda
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-1].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r,
          ], mask1);
    }
    else if(index == (i+1)*largura-2){//semiborda direita
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+1].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,
          ], mask1);
    }
    else if(index>(altura-2)*largura+1 && index<(altura-1)*largura-2){//semiborda baixo
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          ], mask1);
    }
    else if(index < largura){//borda cima
      //console.log('teste7', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '<'+largura);
      mask2 = this.convol([
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r
          ], mask1);
      //console.log('teste7F');
    }
    else if(index == i*largura){//borda esquerda
      //console.log('teste5', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(i*largura));
       console.log((i+2)*largura+(j), i, largura, j)
       mask2 = this.convol([
           this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
           this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
           this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
           this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
           this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r
           ], mask1);
     //console.log('teste5F');
     }
    else if(index == (i+1)*largura-1){//borda direita
      //console.log('teste6', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+((i+1)*largura-1));
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j)].r
          ], mask1);
      //console.log('teste6F');
    }
    else if(index > (altura-1)*largura){//borda baixo
      //console.log('teste8', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '>'+(altura-1)*largura);
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r
          ], mask1);
      //console.log('teste8F');
    }
    else{
      //console.log('teste9', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura);
      mask2 = this.convol([
          this.pic.pixels[(i-2)*largura+(j-2)].r,this.pic.pixels[(i-2)*largura+(j-1)].r,this.pic.pixels[(i-2)*largura+(j)].r,this.pic.pixels[(i-2)*largura+(j+1)].r,this.pic.pixels[(i-2)*largura+(j+2)].r,
          this.pic.pixels[(i-1)*largura+(j-2)].r,this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,this.pic.pixels[(i-1)*largura+(j+2)].r,
          this.pic.pixels[index-2].r,this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,this.pic.pixels[index+2].r,
          this.pic.pixels[(i+1)*largura+(j-2)].r,this.pic.pixels[(i+1)*largura+(j-1)].r,this.pic.pixels[(i+1)*largura+(j)].r,this.pic.pixels[(i+1)*largura+(j+1)].r,this.pic.pixels[(i+1)*largura+(j+2)].r,
          this.pic.pixels[(i+2)*largura+(j-2)].r,this.pic.pixels[(i+2)*largura+(j-1)].r,this.pic.pixels[(i+2)*largura+(j)].r,this.pic.pixels[(i+2)*largura+(j+1)].r,this.pic.pixels[(i+2)*largura+(j+2)].r
          ], mask1);
      //console.log('teste9F');
    }
   return mask2;
  }

  private createSubImage(i0){
    let novo: Imagem = new Imagem();
    novo.tipo = this.pic.tipo
    novo.valMax = this.pic.valMax
    novo.largura = 8
    novo.altura = 8
    novo.pixels = []
    for(let i=0; i<8; i++){
      for(let j=0; j<8; j++){
        let ind = i0+j
        novo.pixels.push(new Pixel(this.pic.pixels[ind].r));
      }
      i0+=this.pic.largura
    }
    return novo
  }

  // public applyDct(){
  //   if(this.pic.altura % 8 !=0 || this.pic.largura % 8!=0) return alert("imagem nao compativel")
  //   let arri = [0], arrj = [0], indices = [], largura = this.pic.largura
  //   for(let i = 1; i<this.pic.altura; i++) if(i%8 == 0) arri.push(i)
  //   for(let j = 1; j<this.pic.largura; j++) if(j%8 == 0) arrj.push(j)
  //   for(let i = 0; i<arri.length; i++){
  //     for(let j = 0; j<arrj.length; j++){
  //       indices.push(arri[i]*largura+arrj[j])
  //     }
  //   }
  //   for(let aux = 0; aux<indices.length; aux++){
  //     let ind = indices[aux]
  //     let novo = this.createSubImage(ind)
  //     this.dct(novo)
  //     for(let i = 0; i<8; i++){
  //       for(let j = 0; j<8; j++){
  //         this.pic.pixels[ind+j].r = novo.pixels[i*8+j].r
  //         this.pic.pixels[ind+j].g = novo.pixels[i*8+j].g
  //         this.pic.pixels[ind+j].b = novo.pixels[i*8+j].b
  //       }
  //       ind+=this.pic.largura
  //     }
  //   }
  //   this.canUndo = false;
  //   this.pictureStream.next(this.pic);
  // }

  public dct(){
    const pi = 3.142857,  m = this.pic.altura, n = this.pic.largura;
    // const pi = 3.141592, m = this.pic.altura, n = this.pic.largura;
    let dct0 = [];
    for(let i=0; i<m; i++){
      for(let j=0; j<n; j++){
        let ci, cj, sum = 0;
        if(i==0) ci = 1/Math.sqrt(m);
        else ci = Math.sqrt(2)/Math.sqrt(m);
        if(j == 0) cj = 1/Math.sqrt(n);
        else cj = Math.sqrt(2)/Math.sqrt(n);
        
        for(let k=0; k<m; k++){
          for(let l=0; l<n; l++){
            let index = k*n+l;
            let cosY = Math.cos((2*k+1)*i*pi/(2*m))
            let cosX = Math.cos((2*l+1)*j*pi/(2*n))
            let dct1 = this.pic.pixels[index].r * cosY * cosX;
            sum = sum + dct1;
          }
        }
        dct0.push(ci*cj*sum);
      }
    }
    // let minmax = this.getMinMax(this.dct0);
    for(let i=0; i<this.pic.pixels.length; i++){
      // let dct1 =Math.round(255*((this.dct0[i]-minmax[0])/(minmax[1]-minmax[0])));
      let dct1 = dct0[i]
      this.pic2.pixels[i].r = this.pic.pixels[i].r
      this.pic2.pixels[i].g = this.pic.pixels[i].g
      this.pic2.pixels[i].b = this.pic.pixels[i].b
      this.pic.pixels[i].r = dct1;
      this.pic.pixels[i].g = dct1;
      this.pic.pixels[i].b = dct1;
    }
    this.canUndo = true
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }

  // public applyIdct(){
  //   if(this.pic.altura % 8 !=0 || this.pic.largura % 8!=0) return alert("imagem nao compativel")
  //   let arri = [0], arrj = [0], indices = [], largura = this.pic.largura
  //   for(let i = 1; i<this.pic.altura; i++) if(i%8 == 0) arri.push(i)
  //   for(let j = 1; j<this.pic.largura; j++) if(j%8 == 0) arrj.push(j)
  //   for(let i = 0; i<arri.length; i++){
  //     for(let j = 0; j<arrj.length; j++){
  //       indices.push(arri[i]*largura+arrj[j])
  //     }
  //   }
  //   for(let aux = 0; aux<indices.length; aux++){
  //     let ind = indices[aux]
  //     let novo = this.createSubImage(ind)
  //     this.idct(novo)
  //     for(let i = 0; i<8; i++){
  //       for(let j = 0; j<8; j++){
  //         this.pic.pixels[ind+j].r = novo.pixels[i*8+j].r
  //         this.pic.pixels[ind+j].g = novo.pixels[i*8+j].g
  //         this.pic.pixels[ind+j].b = novo.pixels[i*8+j].b
  //       }
  //       ind+=this.pic.largura
  //     }
  //   }
  //   this.canUndo = false;
  //   this.pictureStream.next(this.pic);
  // }

  public idct(){
    const pi = 3.142857, m = this.pic.altura, n = this.pic.largura;
    // const pi = 3.141592, m = this.pic.altura, n = this.pic.largura;
    let idct0 = [];
    for(let i=0; i<m; i++){
      for(let j=0; j<n; j++){
        let ci, cj, sum = 0;
        if(i==0) ci = 1/Math.sqrt(m);
        else ci = Math.sqrt(2)/Math.sqrt(m);
        if(j == 0) cj = 1/Math.sqrt(n);
        else cj = Math.sqrt(2)/Math.sqrt(n);
        
        for(let k=0; k<m; k++){
          for(let l=0; l<n; l++){
            let index = k*n+l;
            let cosY = Math.cos((2*k+1)*i*pi/(2*m))
            let cosX = Math.cos((2*l+1)*j*pi/(2*n))
            let dct1 = ci*cj*this.pic.pixels[index].r * cosY * cosX;
            sum = sum + dct1; 
          }
        }
        idct0.push(sum);
      }
    }
    let minmax = this.getMinMax(idct0);
    for(let i=0; i<this.pic.pixels.length; i++){
      let idct1 = Math.round(255*((idct0[i]-minmax[0])/(minmax[1]-minmax[0])))
      //let idct1 = idct0[i]
      this.pic.pixels[i].r = idct1;
      this.pic.pixels[i].g = idct1;
      this.pic.pixels[i].b = idct1;
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pictureStream.next(this.pic);
  }
  public getHue(){
    for(let i = 0; i<this.color.length-1; i++){
      let currentColor = this.color[i], nextColor = this.color[i+1]
      for(let j = 0; j<256; j++){
        let r=0, g=0, b=0;
        if( i>0 && j == 0) j++
        if(currentColor.r<nextColor.r)
          r = currentColor.r + j;
        else if(currentColor.r == nextColor.r)
          r = currentColor.r 
        else r = currentColor.r - j;

        if(currentColor.g<nextColor.g)
          g = currentColor.g + j;
        else if(currentColor.g == nextColor.g)
          g = currentColor.g 
        else g = currentColor.g - j;

        if(currentColor.b<nextColor.b)
          b = currentColor.b + j;
        else if(currentColor.b == nextColor.b)
          b = currentColor.b 
        else b = currentColor.b - j;

        this.hue.push({r:r, g:g, b:b})
      }
    }
  }

  public pseudoCor(){
    for(let i=0; i<this.pic.pixels.length; i++){
      let index = Math.round((this.hue.length-1) * this.pic.pixels[i].r)/255;
      this.pic2.pixels[i].r = this.pic.pixels[i].r;
      this.pic2.pixels[i].g = this.pic.pixels[i].g;
      this.pic2.pixels[i].b = this.pic.pixels[i].b;
      this.pic.pixels[i].r = this.hue[index].r;
      this.pic.pixels[i].g = this.hue[index].g;
      this.pic.pixels[i].b = this.hue[index].b;
    }
    this.canUndo = true;
    this.isLaplace = false;
    this.pic.tipo = "P3"
    this.pictureStream.next(this.pic);
  }
  
  public passaAlta(raio){
    for(let i = 0; i<this.pic.altura; i++){
      for(let j = 0; j<this.pic.altura; j++){
        let index = i*this.pic.largura+j
        this.pic2.pixels[i].r = this.pic.pixels[i].r;
        this.pic2.pixels[i].g = this.pic.pixels[i].g;
        this.pic2.pixels[i].b = this.pic.pixels[i].b;
        if(Math.sqrt((i*i)+(j*j))<raio){
          this.pic.pixels[index].r = 0
          this.pic.pixels[index].g = 0
          this.pic.pixels[index].b = 0
        }
      }
    }
    // this.canUndo = true
    // this.pictureStream.next(this.pic);
    this.idct()
  }

  public passaBaixa(raio){
    for(let i = 0; i<this.pic.altura; i++){
      for(let j = 0; j<this.pic.altura; j++){
        let index = i*this.pic.largura+j
        this.pic2.pixels[i].r = this.pic.pixels[i].r;
        this.pic2.pixels[i].g = this.pic.pixels[i].g;
        this.pic2.pixels[i].b = this.pic.pixels[i].b;
        if(Math.sqrt((i*i)+(j*j))>raio){
          this.pic.pixels[index].r = 0
          this.pic.pixels[index].g = 0
          this.pic.pixels[index].b = 0
        }
      }
    }
    // this.canUndo = true
    // this.pictureStream.next(this.pic);
    this.idct()
  }
  public otsu(){
    let hist = this.getHistograma(), arr = Object.keys(hist), qtd = this.pic.pixels.length
    let sigma = []
    // console.log(hist)
    for(let i = 0; i<arr.length; i++){
      let wb=0, wf=0, ub=0, uf=0, th = Number(arr[i])
      // while(th == undefined) continue
      // console.log(th)
      for(let j = 0; Number(arr[j]) < th; j++){
        let arj = Number(arr[j])
        let histj = Number(hist[arj])
        // console.log(j, 'A', wb, histj, arj, ub, arj*histj)
        wb += histj
        ub += arj*histj
        // console.log(j, 'B', wb, histj, arj, ub, arj*histj)
      }
      for(let j = i; j<arr.length; j++){
        let arj = Number(arr[j])
        let histj = Number(hist[arj])
        // console.log(j, 'C', wb, histj, arj, ub, arj*histj)
        wf += histj
        uf += arj*histj
        // console.log(j, 'D', wb, histj, arj, ub, arj*histj)
      }
      if(wb != 0) ub = ub/wb
      else ub = 0
      if(wf != 0) uf = uf/wf
      else uf = 0
      wb = wb/qtd
      wf = wf/qtd
      sigma.push([wb*wf*Math.pow(ub-uf, 2), Number(arr[i])])
      // console.log(wb, ub, wf, uf, wb*wf*Math.pow(ub-uf, 2))
    }
    let aux = []
    for(let i=0; i<sigma.length; i++){
      aux.push(sigma[i][0])
    }
    let minmax = this.getMinMax(aux)
    for(let i=0; i<sigma.length; i++){
      if(sigma[i][0] == minmax[1]) return sigma[i][1]
    }
  }
}