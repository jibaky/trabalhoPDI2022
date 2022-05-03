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
  @ViewChild('drawR') myCanvasR: ElementRef;
  @ViewChild('drawG') myCanvasG: ElementRef;
  @ViewChild('drawB') myCanvasB: ElementRef;

  constructor(public servico: ImageService) { }

  drawOnCanvas(canvas: ElementRef, pic: Imagem, pesoR: number = 1, pesoG: number = 1, pesoB: number = 1 ){
    //console.log(this.myCanvas);
    const context = canvas.nativeElement.getContext('2d');
    canvas.nativeElement.width = pic.largura;
    canvas.nativeElement.height = pic.altura;
    for(let i = 0; i<pic.pixels.length; i++){
      context.fillStyle = `rgb(${pic.pixels[i].r*pesoR}, ${pic.pixels[i].g*pesoG}, ${pic.pixels[i].b*pesoB})`;
      context.fillRect(i%pic.largura, Math.floor(i/pic.largura), 1, 1);
    }
  }

  ngAfterViewInit(): void {
    this.servico.pictureStream.pipe(
      filter((v)=> v != null)      
    ).subscribe((updatedPicture: Imagem)=>{
      this.drawOnCanvas(this.myCanvas, updatedPicture);
      this.drawOnCanvas(this.myCanvasR, updatedPicture, 1, 0, 0);
      this.drawOnCanvas(this.myCanvasG, updatedPicture, 0, 1, 0);
      this.drawOnCanvas(this.myCanvasB, updatedPicture, 0, 0, 1);
    });
  }

}
