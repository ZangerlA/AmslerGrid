import {Vertex} from "./Vertex";
import {MeshIndex} from "../types/MeshIndex";
import {MeshInstance} from "./Mesh";
import {Coordinate} from "../types/Coordinate";
import {calculateCenter} from "../helperMethods/calculateCenter";

export class Polygon {
    vertices: MeshIndex[] = []
    children: Polygon[] = []
    edgeLength: number
    color: string
    shouldDraw: boolean = false
    
    constructor(meshIndex: MeshIndex, edgeLength: number, shouldDraw: boolean, color: string) {
        this.shouldDraw = shouldDraw
        this.color = color
        this.edgeLength = edgeLength
        this.setPolygonVertices(meshIndex.row, meshIndex.col)
    }

    private setPolygonVertices(row: number, col: number) {
        for (let i = col; i <= col + this.edgeLength; i++) {
            this.vertices.push({row: row, col: i})
        }
        for (let i = row + 1; i <= row + this.edgeLength; i++) {
            this.vertices.push({row: i, col: col + this.edgeLength})
        }
        for (let i = col + this.edgeLength - 1; i >= col; i--) {
            this.vertices.push({row: row + this.edgeLength, col: i})
        }
        for (let i = row + this.edgeLength - 1; i >= row; i--) {
            this.vertices.push({row: i, col: col})
        }
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.hasActiveChildren()){
            this.children.forEach((childShape)=>{
                childShape.draw(ctx)
            })
        }else{
            const shapeVertices : Vertex[] = this.getOwnActiveVertices()
            ctx.beginPath()
            ctx.moveTo(shapeVertices[0].coordinate.x, shapeVertices[0].coordinate.y)
            shapeVertices.forEach((vertex) => {
                if (vertex.isActive) {
                    ctx.lineTo(vertex.coordinate.x, vertex.coordinate.y)
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

    gatherVertices(vertexIndices: MeshIndex[] = []): MeshIndex[] {
        if (this.hasActiveChildren()) {
            this.children.forEach((childShape) => {
                childShape.gatherVertices(vertexIndices);
            });
        } else {
            vertexIndices.push(...this.vertices);
        }
        return vertexIndices;
    }

    hasInside(mouseClick: Coordinate): boolean {
        for (const child of this.children) {
            if (child.shouldDraw && child.hasInside(mouseClick)) {
                return true;
            }
        }
        return this.inside(mouseClick.x, mouseClick.y, this.getOwnActiveVertices());
    }

    getContainer(mouseClick: Coordinate): Polygon | undefined {
        if (!this.hasInside(mouseClick)) {
            return undefined
        }
        else if (this.hasActiveChildren()) {
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

        let wasDeleted = MeshInstance.selectedPolygons.delete(this)

        const childEdgeLength = this.edgeLength / 2

        for (let i = 0; i < this.vertices.length; i+= childEdgeLength) {
            const vertex = MeshInstance.vertices[this.vertices[i].row][this.vertices[i].col]
            if (!vertex.isActive) {
                vertex.isActive = true

                const prevPointIndex = this.vertices[i - childEdgeLength]
                const nextPointIndex = this.vertices[i + childEdgeLength]
                vertex.coordinate = calculateCenter([prevPointIndex, nextPointIndex])
            }
        }

        const centerVertexRow = this.vertices[0].row + childEdgeLength;
        const centerVertexCol = this.vertices[0].col + childEdgeLength;
        const centerVertex = MeshInstance.vertices[centerVertexRow][centerVertexCol];
        if (!centerVertex.isActive) {
            centerVertex.isActive = true

            const ul = this.vertices[0]
            const ur = this.vertices[this.edgeLength]
            const lr = this.vertices[this.edgeLength*2]
            const ll = this.vertices[this.edgeLength*3]

            centerVertex.coordinate = calculateCenter([ul, ur, lr, ll])
        }
        this.removeOwnEdges()
        this.children.forEach((childPolygon) => {
            if (wasDeleted){
                MeshInstance.selectedPolygons.add(childPolygon)
            }
            childPolygon.shouldDraw = true
            childPolygon.addOwnEdges()
        })
    }

    gatherActiveChildren(result: Polygon[]): Polygon[] {
        if (this.hasActiveChildren()) {
            this.children.forEach((childShape) => {
                childShape.gatherActiveChildren(result);
            });
        } else {
            result.push(this);
        }
        return result;
    }

    private addOwnEdges(): void {
        for (let i = 0; i < 4; i++) {
            const edge = {a: this.vertices[this.edgeLength*i], b: this.vertices[this.edgeLength*(i+1)]}
            const halfEdge = {a: this.vertices[this.edgeLength*i], b: this.vertices[this.edgeLength*(i+1) - this.edgeLength/2]}
            if (this.edgeLength === 1 || !MeshInstance.edges.has(halfEdge)){
                MeshInstance.edges.add(edge)
            }
        }
    }

    private removeOwnEdges(): void {
        for (let i = 0; i < 4; i++) {
            MeshInstance.edges.delete({a: this.vertices[this.edgeLength*i], b: this.vertices[this.edgeLength*(i+1)]})
        }
    }

    private getOwnActiveVertices(): Vertex[] {
        let vertices: Vertex[] = []
        this.vertices.forEach((index) => {
            const vertex = MeshInstance.vertices[index.row][index.col]
            if((vertex.isActive)){
                vertices.push(vertex)
            }
        })
        vertices.pop()
        return vertices
    }

    private inside(x: number, y: number, vertices: Vertex[]): boolean {
        // ray-casting algorithm based on
        // https://en.wikipedia.org/wiki/Point_in_polygon
        // found on
        // https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
        let result = false
        for (let k = 0, l = vertices.length - 1; k < vertices.length; l = k++) {
            const xi = vertices[k].coordinate.x, yi = vertices[k].coordinate.y
            const xj = vertices[l].coordinate.x, yj = vertices[l].coordinate.y
            const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            if (intersect) result = !result
        }
        return result
    }

    public hasActiveChildren(): boolean {
        return this.children.some((child) => child.shouldDraw)
    }

    public colorChildren() {
        this.children[0].color = "rgba(75,139,59,0.5)"
        this.children[1].color = "white"
        this.children[2].color = "white"
        this.children[3].color = "rgba(75,139,59,0.5)"

        for (let i = 0; i < this.children.length; i++) {
            let polygon = this.children[i]
            if (polygon.children.length !== 0){
                polygon.colorChildren()
            }
        }
    }

    public setColor(colored: boolean){
        if (colored){
            this.color = "rgba(75,139,59,0.5)"
        }else{
            this.color = "white"
        }
    }
    
    moved(): boolean {
        return this.vertices.some((vertexIndex) => MeshInstance.vertices[vertexIndex.row][vertexIndex.col].isActive && MeshInstance.vertices[vertexIndex.row][vertexIndex.col].wasMoved)
    }
}