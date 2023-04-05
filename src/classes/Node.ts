import {Vector} from "../types/Vector";
import {Coordinate} from "../types/Coordinate";


export class Node {
    coordinate: Coordinate = {x: 0, y: 0}
    drawRadius: number = 7
    isActive: boolean = false

    constructor(coordinate: Coordinate) {
        this.coordinate.x = coordinate.x
        this.coordinate.y = coordinate.y
    }
    move(vector: Vector): void {
        this.coordinate.x += vector.x
        this.coordinate.y += vector.y
    }

    rotateAround(point: Coordinate, degree: number): void {
        const angle = degree * Math.PI / 180.0
        const dx = this.coordinate.x - point.x;
        const dy = this.coordinate.y - point.y;
        const newX = Math.cos(angle) * dx - Math.sin(angle) * dy + point.x;
        const newY = Math.sin(angle) * dx + Math.cos(angle) * dy + point.y;
        this.coordinate.x = newX;
        this.coordinate.y = newY;
    }

    wasClicked(mouseClick: Coordinate): boolean {
        const distance = Math.sqrt((this.coordinate.x - mouseClick.x) ** 2 + (this.coordinate.y - mouseClick.y) ** 2)
        return distance <= this.drawRadius;
    }
}