import { Component, OnInit } from '@angular/core';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public servico: ImageService) { }

  limiarPB: number = 128;
  ruido: number = 10;
  textoR: any = 0;
  textoG: any = 0;
  textoB: any = 0;
  textoH: any = 0;
  textoS: any = 0;
  textoL: any = 0;

  undo(){
    this.servico.undo();
  }

  negativar(){
    this.servico.negativar();
  }

  tornarCinza(){
    this.servico.tornarCinza();
  }

  tornarPB(){
    this.servico.tornarPB(this.limiarPB);
  }

  equalizarHistograma(){
    this.servico.equalizarHistograma();
  }

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

  media(){
    this.servico.media();
  }

  mediana(){
    this.servico.mediana();
  }

  sobel(){
    this.servico.sobel();
  }

  ruidoPreto(){
    this.servico.addRuido(this.ruido/100, 1, 0);
  }

  ruidoBranco(){
    this.servico.addRuido(this.ruido/100, 0, 1);
  }

  saltPepper(){
    this.servico.addRuido(this.ruido/100, 1, 1);
  }

  ngOnInit(): void {
  }
  

}
