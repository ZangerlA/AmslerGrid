import {Node} from "./Node";
import {MeshIndex} from "../types/MeshIndex";
import {MeshInstance} from "./Mesh";
import {Coordinate} from "../types/Coordinate";
import {calculateCenter} from "../helperMethods/calculateCenter";

export class Polygon {
    nodes: MeshIndex[] = []
    children: Polygon[] = []
    edgeLength: number
    color: string
    shouldDraw: boolean = false
    
    constructor(meshIndex: MeshIndex, edgeLength: number, shouldDraw: boolean, color: string) {
        this.shouldDraw = shouldDraw
        this.color = color
        this.edgeLength = edgeLength
        this.setPolygonNodes(meshIndex.row, meshIndex.col)
    }

    private setPolygonNodes(row: number, col: number) {
        for (let i = col; i <= col + this.edgeLength; i++) {
            this.nodes.push({row: row, col: i})
        }
        for (let i = row + 1; i <= row + this.edgeLength; i++) {
            this.nodes.push({row: i, col: col + this.edgeLength})
        }
        for (let i = col + this.edgeLength - 1; i >= col; i--) {
            this.nodes.push({row: row + this.edgeLength, col: i})
        }
        for (let i = row + this.edgeLength - 1; i >= row; i--) {
            this.nodes.push({row: i, col: col})
        }
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.hasChildren()){
            this.children.forEach((childShape)=>{
                childShape.draw(ctx)
            })
        }else{
            const shapeNodes : Node[] = this.getOwnActiveNodes()
            ctx.beginPath()
            ctx.moveTo(shapeNodes[0].coordinate.x, shapeNodes[0].coordinate.y)
            shapeNodes.forEach((node) => {
                if (node.isActive) {
                    ctx.lineTo(node.coordinate.x, node.coordinate.y)
                }
            })
            ctx.fillStyle = this.color
            ctx.fill()
            if (MeshInstance.selectedPolygons.has(this)){
                ctx.fillStyle = "rgba(33,33,114,0.5)"
                ctx.fill()
            }
        }
    }

    gatherNodes(nodeIndices: MeshIndex[] = []): MeshIndex[] {
        if (this.hasChildren()) {
            this.children.forEach((childShape) => {
                childShape.gatherNodes(nodeIndices);
            });
        } else {
            nodeIndices.push(...this.nodes);
        }
        return nodeIndices;
    }

    hasInside(mouseClick: Coordinate): boolean {
        let result: boolean = false
        this.children.forEach((child) => {
            if (child.shouldDraw) {
                result = child.hasInside(mouseClick)
            }
        })
        if (!result) {
            result = this.inside(mouseClick.x, mouseClick.y, this.getOwnActiveNodes())
        }
        return result
    }

    getContainer(mouseClick: Coordinate): Polygon | undefined {
        if (!this.hasInside(mouseClick)) {
            return undefined
        }
        else if (this.hasChildren()) {
            for (let child of this.children) {
                const container = child.getContainer(mouseClick)
                if (container) {
                    return container
                }
            }
        }
        else return this
    }

    split(): void {
        if (this.edgeLength === 1) {
            return
        }
        MeshInstance.selectedPolygons.delete(this)

        const childEdgeLength = this.edgeLength / 2

        for (let i = 0; i < this.nodes.length; i+= childEdgeLength) {
            const node = MeshInstance.nodes[this.nodes[i].row][this.nodes[i].col]
            if (!node.isActive) {
                node.isActive = true

                const prevPointIndex = this.nodes[i - childEdgeLength]
                const nextPointIndex = this.nodes[i + childEdgeLength]
                node.coordinate = calculateCenter([prevPointIndex, nextPointIndex])
            }
        }

        const centerNodeRow = this.nodes[0].row + childEdgeLength;
        const centerNodeCol = this.nodes[0].col + childEdgeLength;
        const centerNode = MeshInstance.nodes[centerNodeRow][centerNodeCol];
        if (!centerNode.isActive) {
            centerNode.isActive = true

            const ul = this.nodes[0]
            const ur = this.nodes[this.edgeLength]
            const lr = this.nodes[this.edgeLength*2]
            const ll = this.nodes[this.edgeLength*3]

            centerNode.coordinate = calculateCenter([ul, ur, lr, ll])
        }

        this.children.push(
            new Polygon({row: this.nodes[0].row, col: this.nodes[0].col}, childEdgeLength, true, "rgba(75,139,59,0.5)"),
            new Polygon({row: this.nodes[childEdgeLength].row, col: this.nodes[childEdgeLength].col}, childEdgeLength, true,"white"),
            new Polygon({row: centerNodeRow, col: centerNodeCol}, childEdgeLength, true, "rgba(75,139,59,0.5)"),
            new Polygon({row: this.nodes[this.nodes.length - childEdgeLength - 1].row, col: this.nodes[this.nodes.length - childEdgeLength - 1].col}, childEdgeLength, true, "white"),
        );

        this.children.forEach((child)=>{
            MeshInstance.selectedPolygons.add(child)
        })
        
        this.removeOwnEdges()
        this.children.forEach((childPolygon) => childPolygon.addOwnEdges())
    }

    private addOwnEdges(): void {
        for (let i = 0; i < 4; i++) {
            const edge = {a: this.nodes[this.edgeLength*i], b: this.nodes[this.edgeLength*(i+1)]}
            const halfEdge = {a: this.nodes[this.edgeLength*i], b: this.nodes[this.edgeLength*(i+1) - this.edgeLength/2]}
            if (this.edgeLength === 1 || !MeshInstance.edges.has(halfEdge)){
                MeshInstance.edges.add(edge)
            }
        }
    }

    private removeOwnEdges(): void {
        for (let i = 0; i < 4; i++) {
            MeshInstance.edges.delete({a: this.nodes[this.edgeLength*i], b: this.nodes[this.edgeLength*(i+1)]})
        }
    }

    private getOwnActiveNodes(): Node[] {
        let nodes: Node[] = []
        this.nodes.forEach((index) => {
            const node = MeshInstance.nodes[index.row][index.col]
            if((node.isActive)){
                nodes.push(node)
            }
        })
        nodes.pop()
        return nodes
    }

    private inside(x: number, y: number, nodes: Node[]): boolean {
        // ray-casting algorithm based on
        // https://en.wikipedia.org/wiki/Point_in_polygon
        // found on
        // https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
        let result = false
        for (let k = 0, l = nodes.length - 1; k < nodes.length; l = k++) {
            const xi = nodes[k].coordinate.x, yi = nodes[k].coordinate.y
            const xj = nodes[l].coordinate.x, yj = nodes[l].coordinate.y
            const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            if (intersect) result = !result
        }
        return result
    }

    public hasChildren(): boolean {
        return !(this.children.length === 0)
    }
}