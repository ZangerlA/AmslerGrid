import {Node} from "./Node";
import {Polygon} from "./Polygon";
import {Dimension} from "../customHooks/UseWindowDimensions";
import {Coordinate} from "../types/Coordinate";
import {MeshIndex} from "../types/MeshIndex";
import {Vector} from "../types/Vector";
import {getUniqueArray} from "../helperMethods/Array";
import {InitialMeshConfig} from "../types/InitialMeshConfig";

export class Mesh {
    nodes: Node[][] = []
    private selectedNodes: Node[] = []
    private polygons: Polygon[] = []
    private selectedPolygons: Polygon[] = []

    initializeMesh(dimension: Dimension): void {
        const cellCount = 5
        const maxMeshSize = 40
        const config: InitialMeshConfig = {
            cellCount: cellCount,
            maxMeshSize: maxMeshSize,
            cellSizeVertical: (dimension.currentDimension.width - 100) / maxMeshSize,
            cellSizeHorizontal: (dimension.currentDimension.height - 100) / maxMeshSize,
            cellSizeOffset: Math.floor(maxMeshSize / cellCount),
        }
        
        this.nodes = this.createNodes(config)
        this.polygons = this.createPolygons(config)
    }
    
    private createNodes(config: InitialMeshConfig): Node[][] {
        const nodes: Node[][] = []
        for (let i = 0; i <= config.maxMeshSize; i++) {
            nodes[i] = []
            for (let j = 0; j <= config.maxMeshSize; j++) {
                nodes[i][j] = this.createNode(i, j, config)
            }
        }
        return nodes
    }
    
    private createNode(i: number, j: number, config: InitialMeshConfig): Node {
        const coordinate: Coordinate = {
            x: (config.cellSizeVertical * j) + 50,
            y: (config.cellSizeHorizontal * i) + 50
        }
        const node = new Node(coordinate)
        if (i % config.cellSizeOffset === 0 && j % config.cellSizeOffset === 0){
            node.isActive = true
        }
        return node
    }
    
    private createPolygons(config: InitialMeshConfig): Polygon[] {
        const polygons: Polygon[] = []
        for (let i = 0; i < config.cellCount; i ++) {
            for (let j = 0; j < config.cellCount; j++) {
                polygons.push(this.createPolygon(i, j, config))
            }
        }
        return polygons
    }
    
    private createPolygon(i: number, j: number, config: InitialMeshConfig): Polygon {
        const isGreen = ((i ^ j) & 1) === 0 // Chess pattern
        const color = isGreen ? "rgba(75,139,59,0.5)" : "white"
        return new Polygon({row: i * config.cellSizeOffset, col: j * config.cellSizeOffset}, config.cellSizeOffset, true, color)
    }

    handleSelect(mouseClick: Coordinate): void {
        this.polygons.forEach((polygon) => {
            const container = polygon.getContainer(mouseClick)
            if (container === undefined) {
                return
            }
            if (this.selectedPolygons.includes(container)) {
                this.removePolygonFromSelected(container)
            }
            else {
                this.selectedPolygons.push(container)
            }
        })
    }
    
    private removePolygonFromSelected(polygon: Polygon): void {
        this.selectedPolygons = this.selectedPolygons.filter((polygon2) => polygon2 !== polygon)
    }

    handleSingleNode(mouseClick: Coordinate): void {
        this.nodes.forEach((row) => {
            row.forEach((node) => {
                if (node.isActive && node.wasClicked(mouseClick)) {
                    this.selectedNodes.push(node)
                }
            })
        })
    }

    handleDrag(vector: Vector): void {
        if (this.dragSelectedNodes(vector)) {
            console.log("hi")
            return
        }
        else this.dragSelectedPolygons(vector)
    }
    
    private dragSelectedNodes(vector: Vector): boolean {
        let wasMoved = false;
        this.selectedNodes.forEach((node) => {
            node.move(vector)
            wasMoved = true
        })
        return wasMoved
    }
    
    private dragSelectedPolygons(vector: Vector) {
        let nodeIndices: MeshIndex[] = []
        this.selectedPolygons.forEach((shape) => {
            nodeIndices.push(...shape.gatherNodes([]))
        })
        this.moveNodes(getUniqueArray(nodeIndices), vector)
    }
    
    private moveNodes(nodeIndices: MeshIndex[], vector: Vector): void {
        nodeIndices.forEach((index) => {
            this.nodes[index.row][index.col].move(vector)
        })
    }
    
    handleRelease(): void {
        this.selectedNodes = []
    }

    handleRotate(degree: number): void {
        this.rotateSelectedPolygons(degree)
    }
    
    private rotateSelectedPolygons(degree: number) {
        let nodeIndices: MeshIndex[] = []
        this.selectedPolygons.forEach((shape) => {
            nodeIndices.push(...shape.gatherNodes([]))
        })
        const uniqueNodes = getUniqueArray(nodeIndices)
        const centerPoint = this.calculateCenterOfNodes(uniqueNodes)
        this.rotateNodes(uniqueNodes, centerPoint, degree)
    }
    
    private rotateNodes(nodeIndices: MeshIndex[], point: Coordinate, degree: number): void {
        nodeIndices.forEach((index) => {
            this.nodes[index.row][index.col].rotateAround(point, degree)
        })
    }

    handleSplit (mouseClick: Coordinate) {
        this.polygons.forEach((shape) => {
            if (shape.hasInside(mouseClick)) {
                shape.getContainer(mouseClick)!.split()
            }
        })
    }
    
    draw(ctx: CanvasRenderingContext2D, dimension: Dimension): void {
        ctx.clearRect(0, 0, dimension.currentDimension.width, dimension.currentDimension.height)
        this.drawShapeFill(ctx)
        this.drawHelpLines(ctx)
        this.drawHelpPoints(ctx)
        this.drawCenterPoint(ctx, dimension)
    }

    drawShapeFill(ctx: CanvasRenderingContext2D):void{
        this.polygons.forEach((shape) => {
            shape.draw(ctx)
        })
        this.selectedPolygons.forEach((shape) => {
            const shapeNodes : Node[] = shape.getOwnNodes()
            ctx.beginPath()
            ctx.moveTo(shapeNodes[0].coordinate.x,shapeNodes[0].coordinate.y)
            shapeNodes.forEach((node) => {
                ctx.lineTo(node.coordinate.x, node.coordinate.y)
            })
            ctx.closePath()
            if (shape.color === "white"){
                ctx.fillStyle = "rgba(40,40,100,0.7)"
            }else {
                ctx.fillStyle = "grey"
            }
            ctx.fill()
        })
    }

    colorShape(ctx: CanvasRenderingContext2D, shape: Polygon): void {
        if (shape.hasChildren()){
            shape.children.forEach((shape)=>{
                this.colorShape(ctx, shape)
            })
        }else{
            const shapeNodes : Node[] = shape.getOwnNodes()
            ctx.beginPath()
            ctx.moveTo(shapeNodes[0].coordinate.x,shapeNodes[0].coordinate.y)
            shapeNodes.forEach((node) => {
                ctx.lineTo(node.coordinate.x, node.coordinate.y)
            })
            ctx.closePath()
            ctx.fillStyle = shape.color
            ctx.fill()
        }
    }

    drawHelpLines(ctx: CanvasRenderingContext2D) {
        //horizontal lines
        for (let i = 0; i < this.nodes.length; i++) {
            ctx.beginPath()
            for (let j = 0; j < this.nodes[i].length; j++) {
                const node = this.nodes[i][j]
                if (node.isActive ){
                    ctx.lineTo(node.coordinate.x, node.coordinate.y)
                }
            }
            ctx.stroke()
            ctx.closePath()
        }
        //vertical lines
        for (let i = 0; i < this.nodes.length; i++) {
            ctx.beginPath()
            for (let j = 0; j < this.nodes[i].length; j++) {
                const node = this.nodes[j][i]
                if (node.isActive){
                    ctx.lineTo(node.coordinate.x, node.coordinate.y)
                }
            }
            ctx.stroke()
            ctx.closePath()
        }
        let lastActiveHorizontalNodeIndex = 0;
        let lastActiveVerticalNodeIndex = 0;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes[i].length; j++) {

            }
        }
    }

    drawHelpPoints(ctx: CanvasRenderingContext2D) {
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes[i].length; j++) {
                const node = this.nodes[i][j]
                if (this.nodes[i][j].isActive) {
                    this.drawPoint(ctx, node.coordinate, node.drawRadius, "black")
                }
            }
        }
    }

    drawCenterPoint(ctx: CanvasRenderingContext2D, dimension: Dimension) {
        const coordinate: Coordinate = {x: dimension.currentDimension.width/2, y: dimension.currentDimension.height/2}
        this.drawPoint(ctx, coordinate, 10, "red")
    }

    drawPoint(ctx: CanvasRenderingContext2D, coordinate: Coordinate, radius: number, color: string) {
        ctx.beginPath()
        ctx.moveTo(coordinate.x, coordinate.y)
        ctx.fillStyle = color
        ctx.arc(coordinate.x, coordinate.y, radius, 0, Math.PI*2, false)
        ctx.fill()
    }

    calculateCenterOfNodes(meshIndices: MeshIndex[]): Coordinate {
        const centerPoint: Coordinate = {x: 0, y: 0}
        for (let meshIndex of meshIndices) {
            const node = this.nodes[meshIndex.row][meshIndex.col]
            centerPoint.x += node.coordinate.x
            centerPoint.y += node.coordinate.y
        }
        centerPoint.x = centerPoint.x / meshIndices.length
        centerPoint.y = centerPoint.y / meshIndices.length
        return centerPoint
    }
}

export const MeshInstance = new Mesh()