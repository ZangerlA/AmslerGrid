import {Point} from "./Point";
import {Vector} from "./Shape";
import {Dimension} from "../customHooks/UseWindowDimensions";

export type PointIndex = {
    i: number,
    j: number,
}

export type Coordinate = {
    x: number,
    y: number,
}

export class Grid {
    points: Point[][] = []
    startingGrid: Point[][] = []
    initialCellCount = 5



    calculateGrid(dimension: Dimension): void {
        const cellSizeHorizontal = (dimension.currentDimension.width - 100) / this.initialCellCount
        const cellSizeVertical = (dimension.currentDimension.height - 100) / this.initialCellCount
        const newPoints: Point[][] = [];
        for (let i = 0; i < 6; i++) {
            newPoints[i] = []
            for (let j = 0; j < 6; j++) {
                newPoints[i][j] = new Point((cellSizeHorizontal*i)+50, (cellSizeVertical*j)+50)
            }
        }
        this.points = newPoints
        this.startingGrid = newPoints
    }

    movePoints(points: Point[], vector: Vector, dimension: Dimension, ctx: CanvasRenderingContext2D): void {
        points.forEach((point) => point.move(vector))
        this.redraw(ctx, dimension)
    }
    
    findContainingPoints(mouseClick: Coordinate): PointIndex[] {
        let result: PointIndex[] = []
    
        for (let i = 0; i < this.points.length; i++) {
            for (let j = 0; j < this.points[i].length; j++) {
                if (this.points[i][j].wasClicked(mouseClick)) {
                    result[0] = {i: i, j: j}
                    return result
                }
                
                if (this.insideMesh(i,j)) {
                    const polygon = [this.points[i][j], this.points[i+1][j], this.points[i+1][j+1], this.points[i][j+1]]
                    if(this.inside(mouseClick, polygon)) {
                        result[0] = {i: i, j: j}
                        result[1] = {i: i+1, j: j}
                        result[2] = {i: i+1, j: j+1}
                        result[3] = {i: i, j: j+1}
                        console.log(i,j)
                        return result
                    }
                }
            }
        }
        return result
    }
    
    inside(point: Coordinate, polygon: Point[]): boolean {
        // ray-casting algorithm based on
        // https://en.wikipedia.org/wiki/Point_in_polygon
        // found on
        // https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
        const x = point.x, y = point.y;
        let inside = false;
        
        for (let k = 0, l = polygon.length - 1; k < polygon.length; l = k++) {
            const xi = polygon[k].x, yi = polygon[k].y;
            const xj = polygon[l].x, yj = polygon[l].y;
            const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    };
    
    insideMesh(i: number, j: number): boolean {
        return j+1 < this.points.length && i+1 < this.points[i].length
    }
    
    redraw(ctx: CanvasRenderingContext2D, dimension: Dimension): void {
        ctx.clearRect(0, 0, dimension.currentDimension.width, dimension.currentDimension.height)
        this.drawGridLines(ctx)
        this.drawHelpPoints(ctx)
        this.drawCenterPoint(ctx, dimension)
    }

    drawClicked(ctx:CanvasRenderingContext2D, points:PointIndex[]): void{
        ctx.fillStyle = "green"

    }
    drawGridLines(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "rgba(75,139,59,0.5)";
        for (let i = 0; i < this.points.length; i++) {
            for (let j = 0; j < this.points[i].length; j++) {
                const point = this.points[i][j]
                ctx.beginPath()
                ctx.moveTo(point.x, point.y)
                if (i+1 < this.points.length && j+1 < this.points[i].length){
                    ctx.lineTo(this.points[i+1][j].x, this.points[i+1][j].y)
                    ctx.lineTo(this.points[i+1][j+1].x, this.points[i+1][j+1].y)
                    ctx.lineTo(this.points[i][j+1].x, this.points[i][j+1].y)
                    ctx.lineTo(this.points[i][j].x, this.points[i][j].y)
                }
                ctx.stroke()
                ctx.closePath()
                if ((i+j+2)%2 == 0){
                    ctx.fill()
                }
            }
        }
    }

    drawHelpPoints(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        for (let i = 0; i < this.points.length; i++) {
            for (let j = 0; j < this.points[i].length; j++) {
                const coordinate = this.points[i][j]
                ctx.moveTo(this.points[i][j].x, this.points[i][j].y)
                ctx.fillStyle = "black";
                ctx.arc(coordinate.x, coordinate.y, this.points[i][j].drawRadius, 0, Math.PI*2, false)
                ctx.fill()
            }
        }
    }

    drawCenterPoint(ctx: CanvasRenderingContext2D, dimension: Dimension) {
        const center = new Point(dimension.currentDimension.width/2,dimension.currentDimension.height/2)

        ctx.beginPath()
        ctx.fillStyle = "red";
        ctx.arc(center.x, center.y, 10, 0, Math.PI*2, false)
        ctx.fill()
    }
}