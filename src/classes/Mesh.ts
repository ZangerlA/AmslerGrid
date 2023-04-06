import {Node} from "./Node";
import {Shape} from "./Shape";
import {Dimension} from "../customHooks/UseWindowDimensions";
import {Coordinate} from "../types/Coordinate";
import {MeshIndex, ShapeMeshIndex} from "../types/MeshIndex";
import {Vector} from "../types/Vector";
import {getUniqueArray} from "../helperMethods/Array";

interface Mesh {
    nodes: Node[][], 
    shapes: Shape[],
    initialCellCount: number, 
    maxMeshSize: number, 
    selectedShapes: Shape[],
    selectedNodes: Node[],
    initializeMesh: (dimension: Dimension) => void,
    groupShapes: (shapes: Shape[][], limit: number) => Shape[][],
    handleSelect: (coordinate: Coordinate) => void,
    handleSingleNode: (mouseClick: Coordinate) => void,
    handleDrag: (vector: Vector, coordinate: Coordinate) => void,
    handleRotate: (degree: number, mouseClick: Coordinate) => void,
    handleSplit: (mouseClick: Coordinate) => void,
    moveNodes: (nodeIndices: MeshIndex[], vector: Vector) => void,
    rotateNodes: (nodeIndices: MeshIndex[], point: Coordinate, degree: number) => void,
    draw: (ctx: CanvasRenderingContext2D, dimension: Dimension) => void,
    drawHelpLines: (ctx: CanvasRenderingContext2D) => void,
    drawHelpPoints: (ctx: CanvasRenderingContext2D) => void,
    drawCenterPoint: (ctx: CanvasRenderingContext2D, dimension: Dimension) => void,
    drawPoint: (ctx: CanvasRenderingContext2D, coordinate: Coordinate, radius: number, color: string) => void,
    drawShapeFill: (ctx: CanvasRenderingContext2D) => void,
    findBoundaryNodes: (nodeIndices: MeshIndex[]) => MeshIndex[],
    calculateCenterOfNodes: (nodeIndices: MeshIndex[]) => Coordinate,
    createShapeMeshIndices: (i: number, j: number, offset: number) => ShapeMeshIndex,
}

export const Mesh: Mesh = {
    nodes: [],
    shapes: [],
    initialCellCount: 5,
    maxMeshSize: 40,
    selectedShapes: [],
    selectedNodes: [],

    initializeMesh(dimension: Dimension): void {
        const cellSizeHorizontal = (dimension.currentDimension.height - 100) / this.maxMeshSize
        const cellSizeVertical = (dimension.currentDimension.width - 100) / this.maxMeshSize
        const initialCellIndexOffset = Math.floor(this.maxMeshSize/this.initialCellCount)
        //const shapes: Shape[] = []
        const shapes: Shape[][] = []
        let colored: boolean = true
        for (let i = 0; i <= this.maxMeshSize; i++) {
            this.nodes[i] = []
            if(i+1 <= this.maxMeshSize) {
                shapes[i] = []
            }

            for (let j = 0; j <= this.maxMeshSize; j++) {
                const coordinate: Coordinate = {x: (cellSizeVertical*j)+50, y: (cellSizeHorizontal*i)+50}
                this.nodes[i][j] = new Node(coordinate)
                if (i + 1 <= this.maxMeshSize && j + 1 <= this.maxMeshSize){
                    const shapeMeshIndex = this.createShapeMeshIndices(i, j, 1)
                    shapes[i][j] = new Shape(shapeMeshIndex, false, undefined)
                }

                if ((i + initialCellIndexOffset) % initialCellIndexOffset == 0 && (j + initialCellIndexOffset) % initialCellIndexOffset == 0){
                    this.nodes[i][j].isActive = true
                    if (i + initialCellIndexOffset <= this.maxMeshSize && j + initialCellIndexOffset <= this.maxMeshSize){
                        const shapeMeshIndices = this.createShapeMeshIndices(i, j, initialCellIndexOffset)
                        // console.log(shapeMeshIndices)
                        // const meshIndices: MeshIndex[] =[{row: i, col: j}, {row: i, col: j + initialCellIndexOffset},  {row: i + initialCellIndexOffset, col: j + initialCellIndexOffset}, {row: i + initialCellIndexOffset, col:j}]
                        if (colored){
                            //shapes.push(new Shape( shapeMeshIndices,true, "rgba(75,139,59,0.5)"))
                        }else {
                            //shapes.push(new Shape( shapeMeshIndices,true))
                        }
                        colored = !colored
                    }
                }
            }

        }
        // console.log(shapes)
        // this.shapes = shapes
        this.shapes = this.groupShapes(shapes, this.initialCellCount).flat()
        this.shapes.forEach((shape) => shape.shouldDraw = true)
        console.log(this.shapes)
    },

    groupShapes(shapes: Shape[][], limit: number): Shape[][] {
        if (shapes.length <= limit) {
            return shapes
        }
        const mergedShapes: Shape[][] = [];
        const mergeFactor = 2

        for (let i = 0; i < shapes.length; i += mergeFactor) {
            const newRow: Shape[] = [];


            for (let j = 0; j < shapes[i].length; j += mergeFactor) {

                // Calculate the indices for the parent shape
                const newMeshIndices: ShapeMeshIndex = {
                    ul: shapes[i][j].meshIndices.ul,
                    ur: shapes[i][j + mergeFactor - 1].meshIndices.ur,
                    ll: shapes[i + mergeFactor - 1][j].meshIndices.ll,
                    lr: shapes[i + mergeFactor - 1][j + mergeFactor - 1].meshIndices.lr,
                };

                const newShape = new Shape(newMeshIndices, false);

                // Add children from the merged shapes
                for (let k = 0; k < mergeFactor; k++) {
                    for (let l = 0; l < mergeFactor; l++) {
                        newShape.shapes.push(shapes[i + k][j + l]);
                    }
                }

                newRow.push(newShape);
            }

            mergedShapes.push(newRow);
        }
        return this.groupShapes(mergedShapes, limit)
    },

    handleSelect(mouseClick: Coordinate): void {
        this.shapes.forEach((shape) => {
            if (!shape.contains(mouseClick)) {
                return
            }
            const containerShape = shape.getContainer(mouseClick)
            console.log(containerShape)
            if (containerShape != undefined && this.selectedShapes.includes(containerShape)) {
                this.selectedShapes = this.selectedShapes.filter((s) => s != containerShape)
            }
            else if (containerShape != undefined) {
                this.selectedShapes.push(containerShape)
            }
        })
        console.log(this.selectedShapes)
    },

    handleSingleNode(mouseClick: Coordinate): void {
        /*
        this.shapes.forEach((shape) => {
            if (this.nodes[shape.meshIndices.ul.row][shape.meshIndices.ul.col].wasClicked(mouseClick) ||
                this.nodes[shape.meshIndices.ul.row][shape.meshIndices.ul.col].wasClicked(mouseClick) ||
                this.nodes[shape.meshIndices.ul.row][shape.meshIndices.ul.col].wasClicked(mouseClick) ||
                this.nodes[shape.meshIndices.ul.row][shape.meshIndices.ul.col].wasClicked(mouseClick)
            ) {

            }
        })

         */

        this.nodes.forEach((row) => {
            row.forEach((node) => {
                if (node.isActive && node.wasClicked(mouseClick)) {
                    this.selectedNodes.push(node)
                }
            })
        })


    },

    handleDrag(vector: Vector, mouseClick: Coordinate): void {
        if (this.selectedNodes.length != 0) {
            this.selectedNodes.forEach((node) => {
                node.move(vector)
            })
            return
        }
        let shouldDrag = false
        let nodeIndices: MeshIndex[] = []
        this.selectedShapes.forEach((shape) => {
            if (shape.contains(mouseClick)) {
                shouldDrag = true
            }
        })
        if (shouldDrag) {
            this.selectedShapes.forEach((shape) => {
                nodeIndices.push(...shape.gatherNodes([]))
            })
            console.log(nodeIndices)
            this.moveNodes(getUniqueArray(nodeIndices), vector)
        }
    },

    handleRotate(degree: number, mousePosition: Coordinate): void {
        let shouldRotate = false
        let nodeIndices: MeshIndex[] = []
        this.selectedShapes.forEach((shape) => {
            if (shape.contains(mousePosition)) {
                shouldRotate = true
            }
        })
        if (shouldRotate) {
            this.selectedShapes.forEach((shape) => {
                nodeIndices.push(...shape.gatherNodes([]))
            })
            const uniqueNodes = getUniqueArray(nodeIndices)
            const centerPoint = this.calculateCenterOfNodes(this.findBoundaryNodes(uniqueNodes))
            this.rotateNodes(uniqueNodes, centerPoint, degree)
        }
    },

    handleSplit (mouseClick: Coordinate) {
        console.log("before", this.shapes)
        this.shapes.forEach((shape) => {
            if (shape.contains(mouseClick)) {
                shape.getContainer(mouseClick)!.split()
            }
        })
        console.log("after", this.shapes)
    },

    moveNodes(nodeIndices: MeshIndex[], vector: Vector): void {
        nodeIndices.forEach((index) => {
            this.nodes[index.row][index.col].move(vector)
        })
    },

    rotateNodes(nodeIndices: MeshIndex[], point: Coordinate, degree: number): void {
        nodeIndices.forEach((index) => {
            this.nodes[index.row][index.col].rotateAround(point, degree)
        })
    },

    draw(ctx: CanvasRenderingContext2D, dimension: Dimension): void {
        ctx.clearRect(0, 0, dimension.currentDimension.width, dimension.currentDimension.height)
        this.drawShapeFill(ctx)
        this.drawHelpLines(ctx)
        this.drawHelpPoints(ctx)
        this.drawCenterPoint(ctx, dimension)
    },

    drawShapeFill(ctx: CanvasRenderingContext2D):void{
        this.shapes.forEach((shape) => {
            const shapeNodes : Node[] = shape.getOwnNodes()
            ctx.beginPath()
            ctx.moveTo(shapeNodes[0].coordinate.x,shapeNodes[0].coordinate.y)
            shapeNodes.forEach((node) => {
                ctx.lineTo(node.coordinate.x, node.coordinate.y)
            })
            ctx.closePath()
            ctx.fillStyle = shape.color
            ctx.fill()

        })
        this.selectedShapes.forEach((shape) => {
            console.log(this.selectedShapes)
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
    },

    drawHelpLines(ctx: CanvasRenderingContext2D) {
        //horizontal lines
        for (let i = 0; i < this.nodes.length; i++) {
            ctx.beginPath()
            ctx.moveTo(this.nodes[i][0].coordinate.x,this.nodes[i][0].coordinate.y)
            for (let j = 0; j < this.nodes[i].length; j++) {

                const node = this.nodes[i][j]
                if (node.isActive){
                    //console.log(this.nodes[i][j])
                    ctx.lineTo(node.coordinate.x, node.coordinate.y)
                }
            }
            ctx.stroke()
            ctx.closePath()
        }
        //vertical lines
        for (let i = 0; i < this.nodes.length; i++) {
            ctx.beginPath()
            ctx.moveTo(this.nodes[0][i].coordinate.x,this.nodes[0][i].coordinate.y)
            for (let j = 0; j < this.nodes[i].length; j++) {
                const node = this.nodes[j][i]
                if (node.isActive){
                    ctx.lineTo(node.coordinate.x, node.coordinate.y)
                }
            }
            ctx.stroke()
            ctx.closePath()
        }
    },

    drawHelpPoints(ctx: CanvasRenderingContext2D) {
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes[i].length; j++) {
                const node = this.nodes[i][j]
                if (this.nodes[i][j].isActive) {
                    this.drawPoint(ctx, node.coordinate, node.drawRadius, "black")
                }
            }
        }
    },

    drawCenterPoint(ctx: CanvasRenderingContext2D, dimension: Dimension) {
        const coordinate: Coordinate = {x: dimension.currentDimension.width/2, y: dimension.currentDimension.height/2}
        this.drawPoint(ctx, coordinate, 10, "red")
    },

    drawPoint(ctx: CanvasRenderingContext2D, coordinate: Coordinate, radius: number, color: string) {
        ctx.beginPath()
        ctx.moveTo(coordinate.x, coordinate.y)
        ctx.fillStyle = color
        ctx.arc(coordinate.x, coordinate.y, radius, 0, Math.PI*2, false)
        ctx.fill()
    },

    findBoundaryNodes(meshIndices: MeshIndex[]) : MeshIndex[] {
        return meshIndices.filter((meshIndex) => {
            for (let nodeIndex of meshIndices) {
                if (meshIndex.row <= nodeIndex.row || meshIndex.row >= nodeIndex.row) {
                    return true
                }
                else if (meshIndex.col <= nodeIndex.col || meshIndex.col >= nodeIndex.col) {
                    return true
                }
                else return false
            }
        })
    },

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
    },

    createShapeMeshIndices(i: number, j: number, offset: number): ShapeMeshIndex {
        return  {
            ul: {row: i, col: j},
            ur: {row: i, col: j + offset},
            ll: {row: i + offset, col:j},
            lr: {row: i + offset, col: j + offset}
        }
    },
}