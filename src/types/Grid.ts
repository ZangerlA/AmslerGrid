import {Point} from "./Point";
import {Vector} from "./Shape";
import {Dimension} from "../customHooks/UseWindowDimensions";

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
        ctx.clearRect(0, 0, dimension.currentDimension.width, dimension.currentDimension.height)
        this.drawGridLines(ctx)
        this.drawHelpPoints(ctx)
        this.drawCenterPoint(ctx, dimension)
    }

    findContainingPoints(mouseClick: Point): Point[] {
        return []
    }

    drawGridLines(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
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
                ctx.arc(coordinate.x, coordinate.y, 7, 0, Math.PI*2, false)
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