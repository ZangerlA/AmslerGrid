import {Vector} from "./Shape";

export class Point {
    x: number = 0
    y: number = 0
    drawRadius: number = 10

    constructor(x:number, y:number) {
        this.x = x
        this.y = y
    }
    move(vector: Vector): void {
        this.x += vector.x
        this.y += vector.y
    }

    rotateAround(point: Point, degree: number): void {
        const angle = degree * Math.PI / 180.0
        this.x = Math.cos(angle) * (this.x - point.x) - Math.sin(angle) * (this.y - point.y) + point.x
        this.y = Math.sin(angle) * (this.x - point.x) - Math.cos(angle) * (this.y - point.y) + point.y
    }

    wasClicked(mouseClick: Point): boolean {
        const distance = Math.sqrt((this.x - mouseClick.x) ** 2 + (this.y - mouseClick.y) ** 2)
        return distance <= this.drawRadius;
    }
}