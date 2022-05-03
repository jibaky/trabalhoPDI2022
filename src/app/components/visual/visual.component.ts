import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { filter } from 'rxjs';
import { Imagem } from 'src/app/models/image.model';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-visual',
  templateUrl: './visual.component.html',
  styleUrls: ['./visual.component.scss']
})
export class VisualComponent {

  @ViewChild('draw') myCanvas: ElementRef;

  constructor(private servico: ImageService) { }

  drawOnCanvas(pic: Imagem){
    //console.log(this.myCanvas);
    const context = this.myCanvas.nativeElement.getContext('2d');
    this.myCanvas.nativeElement.width = pic.largura;
    this.myCanvas.nativeElement.height = pic.altura;
    for(let i = 0; i<pic.pixels.length; i++){
      context.fillStyle = `rgb(${pic.pixels[i].r}, ${pic.pixels[i].g}, ${pic.pixels[i].b})`;
      context.fillRect(i%pic.largura, Math.floor(i/pic.largura), 1, 1);
    }
  }

  ngAfterViewInit(): void {
    this.servico.pictureStream.pipe(
      filter((v)=> v != null)      
    ).subscribe((updatedPicture: Imagem)=>{
      this.drawOnCanvas(updatedPicture);
    });
  }

}
