import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Imagem, Pixel } from '../models/image.model';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  public isLoaded: boolean = false;
  private pic: Imagem = new Imagem();
  /** observable da imagem original */
  public originalStream = new BehaviorSubject(null);
  /** observable da imagem com alterações */
  public pictureStream = new BehaviorSubject(null);

  constructor() { }

  upload(arquivo: File): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      //if(!['image/x-portable-graymap'].includes(arquivo.type)) reject(false);
      let leitor = new FileReader();
      leitor.onloadend=(e)=>{
        const arrDados = String(leitor.result).split('\n');
        this.pic.tipo = arrDados[0];
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
        if(this.pic.tipo == 'P2') this.pic.pixels = this.loadPGM(arrDados, inicioPixels);
        if(this.pic.tipo == 'P3') this.pic.pixels = this.loadPPM(arrDados, inicioPixels);
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
    return pixels;
  }
  private loadPPM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i=i+3){
      if(dados[i]!=="")pixels.push(new Pixel(Number(dados[i]), Number(dados[i+1]), Number(dados[i+2])));
    }
    return pixels;
  }
  public getValMax(){
    if(!this.isLoaded) return 255;
    else return this.pic.valMax;
  }
  /**
   * função que inverte o valor dos pixels para deixar a imagem negativa
   */
  public negativar(){
    this.pic.pixels = this.pic.pixels.map((element: Pixel)=>{
      const max = this.pic.valMax;
      element.r = max-element.r;
      element.g = max-element.g;
      element.b = max-element.b;
      return element;
    });
    this.pictureStream.next(this.pic);
  }
  public tornarCinza(){
    if(this.pic.tipo == "P2") return;
    this.pic.pixels = this.pic.pixels.map((element: Pixel)=>{
      //const media = Math.floor((element.r + element.g + element.b)/3);
      const media = Math.floor(0.299*element.r+0.587*element.g+0.114*element.b)
      element.r = media;
      element.g = media;
      element.b = media;
      return element;
    });
    this.pic.tipo = "P2"
    this.pictureStream.next(this.pic);
  }
  public tornarPB(val: number){
    this.pic.pixels = this.pic.pixels.map((element: Pixel)=>{
      const media = Math.floor(0.299*element.r+0.587*element.g+0.114*element.b)
      /** shorthand if sao perguntas sucedidas de ?(o valor caso seja verdade) e depois : (caso seja falso) */
      element.r = media > val ? this.pic.valMax : 0;
      element.g = media > val ? this.pic.valMax : 0;
      element.b = media > val ? this.pic.valMax : 0;
      return element;
    });
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
  public addRuido(qtd, b, w){
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
    let largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j, value=0;
        let mask = this.calcVizinho3x3(i, j, index, [1,1,1,1,1,1,1,1,1]); 
        for(let aux = 0; aux<9; aux++) value+=mask[aux];
        value = value/9;
        if(value<0) value = 0;
        if(value>this.pic.valMax) value = this.pic.valMax;
        //console.log(index, value);
        this.pic.pixels[index].r = Math.round(value);
        this.pic.pixels[index].g = Math.round(value);
        this.pic.pixels[index].b = Math.round(value);
      }
    this.pictureStream.next(this.pic);
  }
  public mediana(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let largura = this.pic.largura, altura = this.pic.altura;
    for(let i=0; i<altura; i++)
      for(let j=0; j<largura; j++){
        let  index = i*largura+j;
        let mask = this.calcVizinho3x3(i, j, index, [1,1,1,1,1,1,1,1,1]); 
        this.bubbleSort(mask, mask.length);
        this.pic.pixels[index].r = mask[4];
        this.pic.pixels[index].g = mask[4];
        this.pic.pixels[index].b = mask[4];
      }
    this.pictureStream.next(this.pic);
  }
  public sobel(){
    if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
    let magnitude = [], largura = this.pic.largura, altura = this.pic.altura, copiaX, copiaY;
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
        magnitude.push(Math.sqrt((valueX * valueX)+(valueY * valueY)));
      }
    let minmax = this.getMinMax(magnitude);
    for(let i=0; i<magnitude.length; i++){
      magnitude[i] = 255*((magnitude[i]-minmax[0])/(minmax[1]-minmax[0]));
      this.pic.pixels[i].r = magnitude[i];
      this.pic.pixels[i].g = magnitude[i];
      this.pic.pixels[i].b = magnitude[i];
    }
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
  private convol3x3(pixels, mask1){
    let mask2 = [0,0,0,0,0,0,0,0,0];
    mask2[0] = pixels[0] * mask1[0];
    mask2[1] = pixels[1] * mask1[1];
    mask2[2] = pixels[2] * mask1[2];
    mask2[3] = pixels[3] * mask1[3];
    mask2[4] = pixels[4] * mask1[4];
    mask2[5] = pixels[5] * mask1[5];
    mask2[6] = pixels[6] * mask1[6];
    mask2[7] = pixels[7] * mask1[7];
    mask2[8] = pixels[8] * mask1[8];
    return mask2;
  }
  private calcVizinho3x3(i, j, index, mask1){
    let mask2 ;
    let largura = this.pic.largura, altura = this.pic.altura;
    //console.log(index);
    if(index == 0){//canto superior esquerdo
      //console.log('teste1', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+0);
      mask2 = this.convol3x3([
        this.pic.pixels[index].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r, 
        this.pic.pixels[index].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r, 
        this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r], 
        mask1);
      //console.log('teste1F');
    }
    else if(index == largura-1){//canto superior direito
      //console.log('teste2','index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(largura-1));
      mask2 = this.convol3x3([
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r],
        mask1);
      //console.log('teste2F');
    }
    else if(index == (altura-1)*largura){//canto inferior esquerdo
      //console.log('teste3', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura-1)*largura);
      mask2 = this.convol3x3([
        this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r,
        this.pic.pixels[index].r,this.pic.pixels[index].r,this.pic.pixels[index+1].r],
        mask1);
      //console.log('teste3F');
    }
    else if(index == altura*largura-1){//canto inferior direito
      //console.log('teste4', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura*largura-1));
      mask2 = this.convol3x3([
        this.pic.pixels[(i-1)*largura+(j-1)].r,this.pic.pixels[(i-1)*largura+(j)].r,this.pic.pixels[(i-1)*largura+(j)].r,
        this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r,
        this.pic.pixels[index-1].r,this.pic.pixels[index].r,this.pic.pixels[index].r],
        mask1);
      //console.log('teste4F');
    }
    else if(index == i*largura){//borda esquerda
      //console.log('teste5', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(i*largura));
      mask2 = this.convol3x3([
        this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r],
        mask1);
      //console.log('teste5F');
    }
    else if(index == (i+1)*largura-1){//borda direita
      //console.log('teste6', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+((i+1)*largura-1));
      mask2 = this.convol3x3([
        this.pic.pixels[(i-1)*largura+(j-1)].r, this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j)].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j)].r],
        mask1);
      //console.log('teste6F');
    }
    else if(index < largura){//borda cima
      //console.log('teste7', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '<'+largura);
      mask2 = this.convol3x3([
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r],
        mask1);
      //console.log('teste7F');
    }
    else if(index > (altura-1)*largura){//borda baixo
      //console.log('teste8', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '>'+(altura-1)*largura);
      mask2 = this.convol3x3([
        this.pic.pixels[(i-1)*largura+(j-1)].r, this.pic.pixels[(i-1)*largura+j].r, this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r],
        mask1);
      //console.log('teste8F');
    }
    else{
      //console.log('teste9', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura);
      mask2 = this.convol3x3([
        this.pic.pixels[(i-1)*largura+(j-1)].r, this.pic.pixels[(i-1)*largura+(j)].r, this.pic.pixels[(i-1)*largura+(j+1)].r,
        this.pic.pixels[index-1].r, this.pic.pixels[index].r, this.pic.pixels[index+1].r,
        this.pic.pixels[(i+1)*largura+(j-1)].r, this.pic.pixels[(i+1)*largura+(j)].r, this.pic.pixels[(i+1)*largura+(j+1)].r],
        mask1);
      //console.log('teste9F');
    }
    return mask2;
  }
}
