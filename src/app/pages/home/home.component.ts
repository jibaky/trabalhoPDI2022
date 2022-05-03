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

  negativar(){
    this.servico.negativar();
  }

  tornarCinza(){
    this.servico.tornarCinza();
  }

  tornarPB(){
    this.servico.tornarPB(this.limiarPB);
  }

  ngOnInit(): void {
  }

}
