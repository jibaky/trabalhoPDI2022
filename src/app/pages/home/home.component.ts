import { Component, OnInit } from '@angular/core';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public servico: ImageService) { }
  textoR: any = 0;
  textoG: any = 0;
  textoB: any = 0;
  textoH: any = 0;
  textoS: any = 0;
  textoL: any = 0;
  raioPassada: any = 77;
  limiar: number = 1;
  ruido: number = 10;
  Cnumber: any = 1;
  Gamma: any = 1;

  converterRGB2HSL(r, g, b){
    let arr = this.servico.RGBtoHSL(r, g, b);
    this.textoH = arr[0];
    this.textoS = arr[1];
    this.textoL = arr[2];
  }

  converterHSL2RGB(h, s, l){
    let arr = this.servico.HSltoRGB(h, s, l);
    this.textoR = arr[0];
    this.textoG = arr[1];
    this.textoB = arr[2];
  }
  
  undo(){
    this.servico.undo();
  }

  negativar(){
    this.servico.negativar();
  }

  tornarCinza(){
    this.servico.tornarCinza();
  }

  compEscDin(){
    console.log(this.Cnumber, this.Gamma)
    this.servico.compEscDin(this.Cnumber, this.Gamma);
  }

  binarizacao(){
    this.servico.binarizacao(this.limiar);
  }

  limiarizacao(){
    this.servico.limiarizacao(this.limiar);
  }

  equalizarHistograma(){
    this.servico.equalizarHistograma();
  }

  media(){
    this.servico.media();
  }

  mediana(){
    this.servico.mediana();
  }

  pontoMin(){
    this.servico.pontoMinimo();
  }

  pontoMax(){
    this.servico.pontoMaximo();
  }

  pontoMed(){
    this.servico.pontoMedio();
  }

  laplace(){
    this.servico.lap();
  }

  laplaceSharp(){
    this.servico.laplaceSharp();
  }

  sobel(){
    this.servico.sobel();
  }

  ruidoPreto(){
    this.servico.addRuidoAleatorio(this.ruido/100, 1, 0);
  }

  ruidoBranco(){
    this.servico.addRuidoAleatorio(this.ruido/100, 0, 1);
  }

  ruidoLocal(x,y){
    this.servico.addRuidoLocal(x,y);
  }

  saltPepper(){
    this.servico.addRuidoAleatorio(this.ruido/100, 1, 1);
  }

  dct(){
    this.servico.dct();
  }

  idct(){
    this.servico.idct();
  }

  pseudoCores(){
    this.servico.pseudoCor();
  }

  // LapOfGau(){
  //   this.servico.lapOfGau();
  // }

  otsuL(){
    this.limiar = Math.round(this.servico.otsu())
    this.limiarizacao();
  }
  otsuB(){
    this.limiar = Math.round(this.servico.otsu())
    this.binarizacao();
  }
  
  passaBaixa(){
    this.servico.passaBaixa(this.raioPassada);
  }

  passaAlta(){
    this.servico.passaAlta(this.raioPassada);
  }

  ngOnInit(): void {
    this.servico.getHue();
  }
  

}
