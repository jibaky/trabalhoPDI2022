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
}
