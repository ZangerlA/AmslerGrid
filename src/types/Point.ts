import {Vector} from "./Shape";
import {Coordinate} from "./Grid";

export class Point {
    x: number = 0
    y: number = 0
    drawRadius: number = 7

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
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        const newX = Math.cos(angle) * dx - Math.sin(angle) * dy + point.x;
        const newY = Math.sin(angle) * dx + Math.cos(angle) * dy + point.y;
        this.x = newX;
        this.y = newY;
    }

    wasClicked(mouseClick: Coordinate): boolean {
        const distance = Math.sqrt((this.x - mouseClick.x) ** 2 + (this.y - mouseClick.y) ** 2)
        return distance <= this.drawRadius;
    }
}