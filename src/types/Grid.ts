import {Point} from "./Point";
import {Vector} from "./Shape";
import {Dimension} from "../customHooks/UseWindowDimensions";
import {SelectedPolygons} from "../components/Canvas";

export type PointIndex = {
    i: number,
    j: number,
}

export type Coordinate = {
    x: number,
    y: number,
}

export class Grid {
    gridPoints: Point[][] = []
    startingGrid: Point[][] = []
    initialCellCount = 7
    selected: SelectedPolygons[] = []

    updateSelected(selected: SelectedPolygons[]): void {
        this.selected = selected
    }

    calculateGrid(dimension: Dimension): void {
        const cellSizeHorizontal = (dimension.currentDimension.width - 100) / this.initialCellCount
        const cellSizeVertical = (dimension.currentDimension.height - 100) / this.initialCellCount
        const newPoints: Point[][] = [];
        for (let i = 0; i < this.initialCellCount + 1; i++) {
            newPoints[i] = []
            for (let j = 0; j < this.initialCellCount + 1; j++) {
                newPoints[i][j] = new Point((cellSizeHorizontal*i)+50, (cellSizeVertical*j)+50)
            }
        }
        this.gridPoints = newPoints
    }

    movePoints(points: PointIndex[], vector: Vector, dimension: Dimension, ctx: CanvasRenderingContext2D): void {
        points.forEach((pointIndex) => this.gridPoints[pointIndex.i][pointIndex.j].move(vector))
        this.redraw(ctx, dimension)
    }

    rotatePoints(points: PointIndex[], point: Point, degree: number, dimension: Dimension, ctx: CanvasRenderingContext2D): void {
        points.forEach((pointIndex) => this.gridPoints[pointIndex.i][pointIndex.j].rotateAround(point, degree))
        this.redraw(ctx, dimension)
    }
    
    findContainingPoints(mouseClick: Coordinate): PointIndex[] {
        let result: PointIndex[] = []

        for (let i = 0; i < this.gridPoints.length; i++) {
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                if (this.gridPoints[i][j].wasClicked(mouseClick)) {
                    result[0] = {i: i, j: j}
                    return result
                }
            }
        }
    
        for (let i = 0; i < this.gridPoints.length; i++) {
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                if (this.insideMesh(i,j)) {
                    const polygon = this.getPolygon(i,j)
                    if(this.inside(mouseClick, polygon)) {
                        result[0] = {i: i, j: j}
                        result[1] = {i: i+1, j: j}
                        result[2] = {i: i+1, j: j+1}
                        result[3] = {i: i, j: j+1}
                        //console.log(i,j)
                        return result
                    }
                }
            }
        }
        return result
    }

    getPolygon(i: number, j: number): Point[] {
        return [this.gridPoints[i][j], this.gridPoints[i+1][j], this.gridPoints[i+1][j+1], this.gridPoints[i][j+1]]
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
        return j+1 < this.gridPoints.length && i+1 < this.gridPoints[i].length
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

        for (let i = 0; i < this.gridPoints.length; i++) {
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                const point = this.gridPoints[i][j]
                ctx.beginPath()
                ctx.moveTo(point.x, point.y)
                if (i+1 < this.gridPoints.length && j+1 < this.gridPoints[i].length){
                    ctx.lineTo(this.gridPoints[i+1][j].x, this.gridPoints[i+1][j].y)
                    ctx.lineTo(this.gridPoints[i+1][j+1].x, this.gridPoints[i+1][j+1].y)
                    ctx.lineTo(this.gridPoints[i][j+1].x, this.gridPoints[i][j+1].y)
                    ctx.lineTo(this.gridPoints[i][j].x, this.gridPoints[i][j].y)
                }
                ctx.stroke()
                ctx.closePath()
                if (this.selected.length == 0){
                    if((i+j+2)%2 == 0){
                        ctx.fillStyle = "rgba(75,139,59,0.5)";
                        ctx.fill()
                    }
                }else{
                    let selectedPolygon: boolean = false;
                    for (let polygon of this.selected){
                        if (polygon[0].i == i && polygon[0].j == j){
                            selectedPolygon = true
                            ctx.fillStyle = "rgba(40,40,100,0.7)";
                            ctx.fill()
                        }
                    }
                    if (!selectedPolygon && (i+j+2)%2 == 0){
                        ctx.fillStyle = "rgba(75,139,59,0.5)";
                        ctx.fill()
                    }
                }
            }
        }
    }

    drawHelpPoints(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        for (let i = 0; i < this.gridPoints.length; i++) {
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                const coordinate = this.gridPoints[i][j]
                ctx.moveTo(this.gridPoints[i][j].x, this.gridPoints[i][j].y)
                ctx.fillStyle = "black";
                ctx.arc(coordinate.x, coordinate.y, this.gridPoints[i][j].drawRadius, 0, Math.PI*2, false)
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