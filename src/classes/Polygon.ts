import {Vertex} from "./Vertex";
import {MeshIndex} from "../types/MeshIndex";
import {Mesh} from "./Mesh";
import {Point} from "../types/Coordinate";
import {calculateCenter} from "../helperMethods/calculateCenter";
import {MeshCanvas} from "./MeshCanvas";
import {PolygonData} from "../types/SaveFile";

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
		if (this.hasChildren()) {
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
		if (this.hasChildren()) {
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
		} else if (this.hasChildren()) {
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
				vertex.wasMoved = this.moved()
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
			/* Need to calculate Center for all active Vertices not only for corners!!!
			let allVertices: Vertex[] = []
			for (let j = 0; j < this.verticesIndices.length; j++) {
				const meshIndex = this.verticesIndices.at(j)
				allVertices.push(this.toVertex(meshIndex!))
			}
			centerVertex.coordinate = calculateCenter(allVertices)*/
			centerVertex.wasMoved = this.moved()
		}

        this.children.push(
            new Polygon(this.mesh, {row: this.verticesIndices[0].row, col: this.verticesIndices[0].col}, childEdgeLength, true, "rgba(75,139,59,0.5)"),
            new Polygon(this.mesh, {row: this.verticesIndices[childEdgeLength].row, col: this.verticesIndices[childEdgeLength].col}, childEdgeLength, true,"white"),
            new Polygon(this.mesh, {row: centerVertexRow, col: centerVertexCol}, childEdgeLength, true, "rgba(75,139,59,0.5)"),
            new Polygon(this.mesh, {row: this.verticesIndices[this.verticesIndices.length - childEdgeLength - 1].row, col: this.verticesIndices[this.verticesIndices.length - childEdgeLength - 1].col}, childEdgeLength, true, "white"),
        );

		this.removeOwnEdges()
		this.children.forEach((childPolygon) => {
			if (wasDeleted) {
				this.mesh.selectedPolygons.add(childPolygon)
			}
			childPolygon.shouldDraw = true
			childPolygon.addOwnEdges()
		})
	}

	public gatherChildren(result: Polygon[]): Polygon[] {
		if (this.hasChildren()) {
			this.children.forEach((childShape) => {
				childShape.gatherChildren(result);
			});
		} else {
			result.push(this);
		}
		return result;
	}

	moved(): boolean {
		return this.verticesIndices.some((vertexIndex) => this.toVertex(vertexIndex).isActive && this.toVertex(vertexIndex).wasMoved)
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
	
	public toVertex(meshIndex: MeshIndex): Vertex {
		return this.mesh.vertices[meshIndex.row][meshIndex.col]
	}

    public hasChildren(): boolean {
        return !(this.children.length === 0)
    }

	public toJSON(): any {
		return {
			verticesIndices: this.verticesIndices,
			children: this.children,
			edgeLength: this.edgeLength,
			color: this.color,
			shouldDraw: this.shouldDraw
		};
	}

	public restoreFromFile(data: PolygonData): void {
		this.verticesIndices = data.verticesIndices
		this.edgeLength = data.edgeLength
		this.color = data.color
		this.shouldDraw = data.shouldDraw

		if (data.children.length != 0) {
			this.split()
			for (let i = 0; i < 4; i++) {
				this.children.at(i)?.restoreFromFile(data.children.at(i))
			}
		}
	}

}