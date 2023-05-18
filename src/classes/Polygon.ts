import {Vertex} from "./Vertex";
import {MeshIndex} from "../types/MeshIndex";
import {Mesh} from "./Mesh";
import {Point} from "../types/Coordinate";
import {calculateCenter} from "../helperMethods/calculateCenter";
import {MeshCanvas} from "./MeshCanvas";

export class Polygon {
	mesh: Mesh
	verticesIndices: MeshIndex[] = []
	children: Polygon[] = []
	edgeLength: number
	color: string
	shouldDraw: boolean = false
	
	constructor(mesh: Mesh, meshIndex: MeshIndex, edgeLength: number, shouldDraw: boolean, color: string) {
		this.mesh = mesh
		this.shouldDraw = shouldDraw
		this.color = color
		this.edgeLength = edgeLength
		this.setPolygonVertices(meshIndex.row, meshIndex.col)
	}
	
	draw(painter: MeshCanvas): void {
		if (this.hasActiveChildren()) {
			this.children.forEach((childShape) => {
				childShape.draw(painter)
			})
		} else {
			const shapeVertices: Vertex[] = this.getOwnActiveVertices()
			const fillColor = this.mesh.selectedPolygons.has(this) ? "rgba(33,33,114,0.5)" : undefined
			painter.drawPolygon(shapeVertices, this.color, fillColor)
		}
	}
	
	gatherVerticesIndices(vertexIndices: MeshIndex[] = []): MeshIndex[] {
		if (this.hasActiveChildren()) {
			this.children.forEach((childShape) => {
				childShape.gatherVerticesIndices(vertexIndices);
			});
		} else {
			vertexIndices.push(...this.verticesIndices);
		}
		return vertexIndices;
	}
	
	hasInside(mouseClick: Point): boolean {
		for (const child of this.children) {
			if (child.shouldDraw && child.hasInside(mouseClick)) {
				return true;
			}
		}
		return this.inside(mouseClick.x, mouseClick.y, this.getOwnActiveVertices());
	}
	
	getContainer(mouseClick: Point): Polygon | undefined {
		if (!this.hasInside(mouseClick)) {
			return undefined
		} else if (this.hasActiveChildren()) {
			for (let child of this.children) {
				const container = child.getContainer(mouseClick)
				if (container) {
					return container
				}
			}
		} else return this
	}
	
	split(): void {
		if (this.edgeLength === 1) {
			return
		}
		
		let wasDeleted = this.mesh.selectedPolygons.delete(this)
		
		const childEdgeLength = this.edgeLength / 2
		
		for (let i = 0; i < this.verticesIndices.length; i += childEdgeLength) {
			const vertex = this.mesh.vertices[this.verticesIndices[i].row][this.verticesIndices[i].col]
			if (!vertex.isActive) {
				vertex.isActive = true
				
				const prevPointIndex = this.toVertex(this.verticesIndices[i - childEdgeLength])
				const nextPointIndex = this.toVertex(this.verticesIndices[i + childEdgeLength])
				vertex.coordinate = calculateCenter([prevPointIndex, nextPointIndex])
			}
		}
		
		const centerVertexRow = this.verticesIndices[0].row + childEdgeLength;
		const centerVertexCol = this.verticesIndices[0].col + childEdgeLength;
		const centerVertex = this.mesh.vertices[centerVertexRow][centerVertexCol];
		if (!centerVertex.isActive) {
			centerVertex.isActive = true
			
			const ul = this.toVertex(this.verticesIndices[0])
			const ur = this.toVertex(this.verticesIndices[this.edgeLength])
			const lr = this.toVertex(this.verticesIndices[this.edgeLength * 2])
			const ll = this.toVertex(this.verticesIndices[this.edgeLength * 3])
			
			centerVertex.coordinate = calculateCenter([ul, ur, lr, ll])
		}
		this.removeOwnEdges()
		this.children.forEach((childPolygon) => {
			if (wasDeleted) {
				this.mesh.selectedPolygons.add(childPolygon)
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
			if (polygon.children.length !== 0) {
				polygon.colorChildren()
			}
		}
	}
	
	public setColor(colored: boolean) {
		if (colored) {
			this.color = "rgba(75,139,59,0.5)"
		} else {
			this.color = "white"
		}
	}
	
	moved(): boolean {
		return this.verticesIndices.some((vertexIndex) => this.mesh.vertices[vertexIndex.row][vertexIndex.col].isActive && this.mesh.vertices[vertexIndex.row][vertexIndex.col].wasMoved)
	}
	
	private setPolygonVertices(row: number, col: number) {
		for (let i = col; i <= col + this.edgeLength; i++) {
			this.verticesIndices.push({row: row, col: i})
		}
		for (let i = row + 1; i <= row + this.edgeLength; i++) {
			this.verticesIndices.push({row: i, col: col + this.edgeLength})
		}
		for (let i = col + this.edgeLength - 1; i >= col; i--) {
			this.verticesIndices.push({row: row + this.edgeLength, col: i})
		}
		for (let i = row + this.edgeLength - 1; i >= row; i--) {
			this.verticesIndices.push({row: i, col: col})
		}
	}
	
	private addOwnEdges(): void {
		for (let i = 0; i < 4; i++) {
			const edge = {
				a: this.verticesIndices[this.edgeLength * i],
				b: this.verticesIndices[this.edgeLength * (i + 1)]
			}
			const halfEdge = {
				a: this.verticesIndices[this.edgeLength * i],
				b: this.verticesIndices[this.edgeLength * (i + 1) - this.edgeLength / 2]
			}
			if (this.edgeLength === 1 || !this.mesh.edges.has(halfEdge)) {
				this.mesh.edges.add(edge)
			}
		}
	}
	
	private removeOwnEdges(): void {
		for (let i = 0; i < 4; i++) {
			this.mesh.edges.delete({
				a: this.verticesIndices[this.edgeLength * i],
				b: this.verticesIndices[this.edgeLength * (i + 1)]
			})
		}
	}
	
	private getOwnActiveVertices(): Vertex[] {
		return this.verticesIndices
			.filter((vertexIndex) => this.toVertex(vertexIndex).isActive)
			.map((vertexIndex) => this.toVertex(vertexIndex))
	}
	
	private inside(x: number, y: number, vertices: Vertex[]): boolean {
		// ray-casting algorithm based on
		// https://en.wikipedia.org/wiki/Point_in_polygon
		// found on
		// https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
		let result = 0
		for (let k = 0, l = vertices.length - 1; k < vertices.length; l = k++) {
			const xi = vertices[k].coordinate.x, yi = vertices[k].coordinate.y
			const xj = vertices[l].coordinate.x, yj = vertices[l].coordinate.y
			const intersect: any = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
			result = intersect ^ result
		}
		return result === 1
	}
	
	private toVertex(meshIndex: MeshIndex): Vertex {
		return this.mesh.vertices[meshIndex.row][meshIndex.col]
	}
}