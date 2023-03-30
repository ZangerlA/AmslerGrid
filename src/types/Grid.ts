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
    initialCellCount = 5
    maxGridSize: number = 20
    selected: SelectedPolygons[] = []

    updateSelected(selected: SelectedPolygons[]): void {
        this.selected = selected
    }

    calculateGrid(dimension: Dimension): void {
        const cellSizeHorizontal = (dimension.currentDimension.width - 100) / this.maxGridSize
        const cellSizeVertical = (dimension.currentDimension.height - 100) / this.maxGridSize
        const newPoints: Point[][] = [];
        for (let i = 0; i <= this.maxGridSize; i++) {
            newPoints[i] = []
            for (let j = 0; j <= this.maxGridSize; j++) {
                newPoints[i][j] = new Point((cellSizeHorizontal*i)+50, (cellSizeVertical*j)+50)
                //console.log(Math.floor(this.maxGridSize/this.initialCellCount))
                if ((i+Math.floor(this.maxGridSize/this.initialCellCount))%Math.floor(this.maxGridSize/this.initialCellCount) == 0 && (j+Math.floor(this.maxGridSize/this.initialCellCount))%Math.floor(this.maxGridSize/this.initialCellCount) == 0){
                    newPoints[i][j].shouldDraw = true
                }
            }
        }
        console.log(newPoints)
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

    findNextRow(row: number, col: number): number {
        for (let i = row + 1; i < this.gridPoints.length; i++) {
            if (this.gridPoints[i][col].shouldDraw) {
                return i
            }
        }
        return -1
    }

    findNextCol(row: number, col: number): number {
        for (let i = col + 1; i < this.gridPoints.length; i++) {
            if (this.gridPoints[row][i].shouldDraw) {
                return i
            }
        }
        return -1
    }
    
    findContainingPoints(mouseClick: Coordinate): PointIndex[] {
        let result: PointIndex[] = []

        for (let i = 0; i < this.gridPoints.length; i++) {
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                if (this.gridPoints[i][j].shouldDraw && this.gridPoints[i][j].wasClicked(mouseClick)) {
                    result[0] = {i: i, j: j}
                    return result
                }
            }
        }
    
        for (let i = 0; i < this.gridPoints.length; i++) {
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                if (this.insideMesh(i,j) && this.gridPoints[i][j].shouldDraw) {
                    const polygon = this.getPolygon(i,j)
                    if(this.inside(mouseClick, polygon)) {
                        result[0] = {i: i, j: j}
                        result[1] = {i: this.findNextRow(i,j), j: j}
                        result[2] = {i: this.findNextRow(i,j), j: this.findNextCol(i,j)}
                        result[3] = {i: i, j: this.findNextCol(i,j)}
                        //console.log(i,j)
                        return result
                    }
                }
            }
        }
        return result
    }

    getPolygon(i: number, j: number): Point[] {
        return [this.gridPoints[i][j], this.gridPoints[this.findNextRow(i,j)][j], this.gridPoints[this.findNextRow(i,j)][this.findNextCol(i,j)], this.gridPoints[i][this.findNextCol(i,j)]]
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
        let counteri:number = 0
        let counterj:number = 0
        let next: number = 0
        for (let i = 0; i < this.gridPoints.length; i++) {
            if (next == i){
                counteri++
            }
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                const point= this.gridPoints[i][j]
                if (point.shouldDraw ){
                    ctx.beginPath()
                    ctx.moveTo(point.x, point.y)
                    if (this.insideMesh(i,j) && this.findNextRow(i,j) != -1 && this.findNextCol(i,j) != -1 && this.gridPoints[this.findNextRow(i,j)][this.findNextCol(i,j)].shouldDraw){
                        ctx.lineTo(this.gridPoints[this.findNextRow(i,j)][j].x, this.gridPoints[this.findNextRow(i,j)][j].y)
                        ctx.lineTo(this.gridPoints[this.findNextRow(i,j)][this.findNextCol(i,j)].x, this.gridPoints[this.findNextRow(i,j)][this.findNextCol(i,j)].y)
                        ctx.lineTo(this.gridPoints[i][this.findNextCol(i,j)].x, this.gridPoints[i][this.findNextCol(i,j)].y)
                        ctx.lineTo(this.gridPoints[i][j].x, this.gridPoints[i][j].y)
                        ctx.stroke()
                    }
                    ctx.closePath()
                    if (this.selected.length == 0){
                        if((counteri+counterj+2)%2 == 0){
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
                        if (!selectedPolygon && (counteri+counterj+2)%2 == 0){
                            console.log("also paint")
                            ctx.fillStyle = "rgba(75,139,59,0.5)";
                            ctx.fill()
                        }
                    }
                    counterj++
                    next = this.findNextRow(i,j)
                }
            }

        }
    }

    drawHelpPoints(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        for (let i = 0; i < this.gridPoints.length; i++) {
            for (let j = 0; j < this.gridPoints[i].length; j++) {
                if (this.gridPoints[i][j].shouldDraw) {
                    const coordinate = this.gridPoints[i][j]
                    ctx.moveTo(this.gridPoints[i][j].x, this.gridPoints[i][j].y)
                    ctx.fillStyle = "black";
                    ctx.arc(coordinate.x, coordinate.y, this.gridPoints[i][j].drawRadius, 0, Math.PI*2, false)
                    ctx.fill()
                }
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