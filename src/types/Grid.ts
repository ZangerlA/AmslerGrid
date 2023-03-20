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
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
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
    
    contains(ul: Point, ur: Point, ll: Point, click: Coordinate): boolean {
        return ul.x < click.x && ul.y < click.y && ur.x > click.x && ll.y > click.y
    }
    
    redraw(ctx: CanvasRenderingContext2D, dimension: Dimension): void {
        ctx.clearRect(0, 0, dimension.currentDimension.width, dimension.currentDimension.height)
        this.drawGridLines(ctx)
        this.drawHelpPoints(ctx)
        this.drawCenterPoint(ctx, dimension)
    }

    drawGridLines(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.fillStyle = "green";
        for (let i = 0; i < this.points.length; i++) {
            ctx.moveTo(this.points[i][0].x, this.points[i][0].y)
            for (let j = 0; j < this.points[i].length; j++) {
                const point = this.points[i][j]
                ctx.lineTo(point.x, point.y)
                if (i+1 < this.points.length){
                    ctx.lineTo(this.points[i+1][j].x, this.points[i+1][j].y)
                }
                ctx.moveTo(point.x, point.y)
            }
        }
        ctx.stroke()
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