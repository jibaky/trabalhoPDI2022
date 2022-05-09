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
    this.pic.pixels = this.pic.pixels.map((element: Pixel)=>{
      //const media = Math.floor((element.r + element.g + element.b)/3);
      const media = Math.floor(0.299*element.r+0.587*element.g+0.114*element.b)
      element.r = media;
      element.g = media;
      element.b = media;
      return element;
    });
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
    for(let i=0; i <this.pic.pixels.length; i++){
      if(freq[this.pic.pixels[i].r]===undefined){
        freq[this.pic.pixels[i].r]=1;
      } else freq[this.pic.pixels[i].r] = freq[this.pic.pixels[i].r]+1;
    }
    return freq;
  }
  private getFreqAcc(freq){
    let tam = Object.keys(freq);
    let fAcc = {};
    for(let i=0; i<tam.length; i++){
      if(i==0) fAcc[tam[i]] = freq[tam[i]];
      else fAcc[tam[i]] = freq[tam[i]] + fAcc[tam[i-1]];
    }
    return fAcc;
  }
  private eqFreq(){
    if(this.pic.tipo == 'P3') {
      console.log("wrong type");
      return null;
    };
    let freq = this.getHistograma();
    let fAcc = this.getFreqAcc(freq);
    let tam = Object.keys(freq);
    let nCinza = this.pic.valMax, nCol = this.pic.largura, nLin = this.pic.altura;
    let fEq = {};
    for(let i=0; i<tam.length; i++) fEq[tam[i]] = Math.max(0,Math.round((nCinza*fAcc[tam[i]])/(nCol*nLin))-1);
    return fEq;
  }
  public equalizarHistograma(){
    let fEq = this.eqFreq();
    for(let i=0; i<this.pic.pixels.length; i++){
      this.pic.pixels[i].r = fEq[this.pic.pixels[i].r];
      this.pic.pixels[i].g = fEq[this.pic.pixels[i].g];
      this.pic.pixels[i].b = fEq[this.pic.pixels[i].b];
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

}
