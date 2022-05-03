export class Pixel{
    r: number;
    g: number;
    b: number;

    constructor(r = 0, g = null, b = null){
        this.r = r;
        this.g = g === null ? r : g;
        this.b = b === null ? r : b;
    }
}

export class Imagem{
    tipo: String;
    altura: number;
    largura: number;
    /** valor maximo de pixel da imagem */
    valMax: number;
    pixels: Pixel[];
}