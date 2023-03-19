import {Point} from "./Point";

type GridIndex = {
    row: number,
    col: number
}

export type Vector = {
    x: number,
    y: number,
}

export class Shape {
    gridIndex: GridIndex[] = []
    shapes: Shape[] = []

    constructor(private grid: Point[][]) {
    }


    move(vector: Vector): void {
        if (this.hasChildren()) {
            this.shapes.forEach((shape) => shape.move(vector))
        }
        else {
            this.gridIndex.forEach((gridIndex) => {
                const oldPoint = this.grid[gridIndex.row][gridIndex.col]
                const newPoint = {x: oldPoint.x + vector.x, y: oldPoint.y + vector.y}
                //this.grid[gridIndex.row][gridIndex.col] = newPoint
            })
        }
    }

    movePoint(vector: Vector): void {

    }

    rotate(): void{

    }

    contains(point: Point): boolean {
        return false
    }

    private hasChildren(): boolean {
        return !(this.shapes.length == 0)
    }
}