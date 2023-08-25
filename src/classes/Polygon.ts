import {Vertex} from "./Vertex";
import {MeshIndex} from "../types/MeshIndex";
import {Mesh} from "./Mesh";
import {Point} from "../types/Coordinate";
import {calculateCenter} from "../helperMethods/calculateCenter";
import {MeshCanvas} from "./MeshCanvas";
import {PolygonData} from "../types/SaveFile";

export class Polygon {
	public mesh: Mesh
	public verticesIndices: MeshIndex[] = []
	public edgeLength: number
	public  children: Polygon[] = []
	private color: string
	
	public constructor(mesh: Mesh, meshIndex: MeshIndex, edgeLength: number, color: string) {
		this.mesh = mesh
		this.color = color
		this.edgeLength = edgeLength
		this.setPolygonVertices(meshIndex.row, meshIndex.col)
	}

	public initializeReferences(): void {
		for (let i = 0; i < 4; i++) {
			this.toVertex(this.verticesIndices[this.edgeLength * i]).increaseReferenceCounter()
		}
	}
	
	public draw(painter: MeshCanvas): void {
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
	
	public gatherVerticesIndices(vertexIndices: MeshIndex[] = []): MeshIndex[] {
		if (this.hasChildren()) {
			this.children.forEach((childShape) => {
				childShape.gatherVerticesIndices(vertexIndices)
			});
		} else {
			vertexIndices.push(...this.verticesIndices)
		}
		return vertexIndices
	}
	
	public hasInside(mouseClick: Point): boolean {
		for (const child of this.children) {
			if (child.hasInside(mouseClick)) {
				return true
			}
		}
		return this.inside(mouseClick.x, mouseClick.y, this.getOwnActiveVertices())
	}
	
	public getContainer(mouseClick: Point): Polygon | undefined {
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

	public getParentContainer(mouseClick: Point, parent: Polygon): Polygon | undefined {
		if (!this.hasInside(mouseClick)) {
			return undefined
		} else if (this.hasChildren()) {
			for (let child of this.children) {
				const container = child.getParentContainer(mouseClick, this)
				if (container) {
					return container
				}
			}
		}
		for (let child of parent.children) {
			if (child.hasChildren()) return undefined
		}

		return parent
	}
	
	public split(): void {
		if (this.edgeLength === 1) {
			return
		}
		const wasDeleted = this.mesh.selectedPolygons.delete(this)
		const childEdgeLength = this.edgeLength / 2

		const centerVertexRow = this.verticesIndices[0].row + childEdgeLength
		const centerVertexCol = this.verticesIndices[0].col + childEdgeLength
		const centerVertex = this.mesh.vertices[centerVertexRow][centerVertexCol]

		const ul = this.toVertex(this.verticesIndices[0])
		const ur = this.toVertex(this.verticesIndices[this.edgeLength])
		const lr = this.toVertex(this.verticesIndices[this.edgeLength * 2])
		const ll = this.toVertex(this.verticesIndices[this.edgeLength * 3])
		const cornervertices = [ul,ur,lr,ll]

		const activeVertices = this.getOwnActiveVertices()
		const filteredVertices = activeVertices.filter((vertex) => vertex.wasMoved || cornervertices.includes(vertex))
		
		//Need moved active vertices for correct calculation
		centerVertex.coordinate = calculateCenter(filteredVertices)

		this.recalculateVertexPosition([ul,ur,lr,ll], childEdgeLength)

		const polygon1 = new Polygon(this.mesh, {row: this.verticesIndices[0].row, col: this.verticesIndices[0].col}, childEdgeLength, "rgba(75,139,59,0.5)")
		const polygon2 = new Polygon(this.mesh, {row: this.verticesIndices[childEdgeLength].row, col: this.verticesIndices[childEdgeLength].col}, childEdgeLength, "white")
		const polygon3 = new Polygon(this.mesh, {row: centerVertexRow, col: centerVertexCol}, childEdgeLength, "rgba(75,139,59,0.5)")
		const polygon4 = new Polygon(this.mesh, {row: this.verticesIndices[this.verticesIndices.length - childEdgeLength].row, col: this.verticesIndices[this.verticesIndices.length - childEdgeLength].col}, childEdgeLength, "white")
		polygon1.initializeReferences()
		polygon2.initializeReferences()
		polygon3.initializeReferences()
		polygon4.initializeReferences()

        this.children.push(
            polygon1,
			polygon2,
			polygon3,
			polygon4
        );

		this.removeOwnEdges()
		this.children.forEach((childPolygon) => {
			if (wasDeleted) {
				this.mesh.selectedPolygons.add(childPolygon)
			}
			childPolygon.addOwnEdges()
		})
	}

	//Recalculates the Coordinates of the new active Vertices to center of edges
	public recalculateVertexPosition(corners: Vertex[],childEdgeLength: number): void {
		if (!this.toVertex(this.verticesIndices[childEdgeLength]).referenceCounterIsPositive()){
			this.toVertex(this.verticesIndices[childEdgeLength]).coordinate = calculateCenter([corners[0], corners[1]])
		}
		if (!this.toVertex(this.verticesIndices[childEdgeLength * 3]).referenceCounterIsPositive()){
			this.toVertex(this.verticesIndices[childEdgeLength * 3]).coordinate = calculateCenter([corners[1], corners[2]])
		}
		if (!this.toVertex(this.verticesIndices[childEdgeLength * 5]).referenceCounterIsPositive()){
			this.toVertex(this.verticesIndices[childEdgeLength * 5]).coordinate = calculateCenter([corners[2], corners[3]])
		}
		if (!this.toVertex(this.verticesIndices[childEdgeLength * 7]).referenceCounterIsPositive()){
			this.toVertex(this.verticesIndices[childEdgeLength * 7]).coordinate = calculateCenter([corners[3], corners[0]])
		}
	}
	
	public merge(): void {
		if (this.edgeLength === 8 && !this.hasChildren()) {
			return
		}
		for (let child of this.children) {
			child.getOwnActiveVertices().forEach(vertex => {
				vertex.decreaseReferenceCounter()
				console.log(vertex)
			})
			child.removeOwnEdges()
		}

		const ul = this.toVertex(this.verticesIndices[0])
		const ur = this.toVertex(this.verticesIndices[this.edgeLength])
		const lr = this.toVertex(this.verticesIndices[this.edgeLength * 2])
		const ll = this.toVertex(this.verticesIndices[this.edgeLength * 3])

		ul.wasMoved = true
		ur.wasMoved = true
		lr.wasMoved = true
		ll.wasMoved = true

		this.children = []
		this.addOwnEdges()
	}

	public gatherChildren(result: Polygon[]): Polygon[] {
		if (this.hasChildren()) {
			this.children.forEach((childShape) => {
				childShape.gatherChildren(result)
			});
		} else {
			result.push(this)
		}
		return result
	}

	public moved(): boolean {
		return this.verticesIndices.some((vertexIndex) => this.toVertex(vertexIndex).referenceCounterIsPositive() && this.toVertex(vertexIndex).wasMoved)
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
		};
	}

	public restoreFromFile(data: PolygonData): void {
		console.log(data)
		this.verticesIndices = data.verticesIndices
		this.edgeLength = data.edgeLength
		this.color = data.color

		if (data.children) {
			for (let i = 0; i < data.children.length; i++) {
				const childData = data.children.at(i)
				if (!childData) throw new Error("Error reading polygon data from file. Child polygon not found")
				const childPolygon = new Polygon(this.mesh, childData.verticesIndices[0], childData.edgeLength, childData.color)
				this.children.push(childPolygon)
				childPolygon.restoreFromFile(childData)
			}
		}
	}

	private setPolygonVertices(row: number, col: number): void {
		for (let i = col; i <= col + this.edgeLength; i++) {
			this.verticesIndices.push({row: row, col: i})
		}
		for (let i = row + 1; i <= row + this.edgeLength; i++) {
			this.verticesIndices.push({row: i, col: col + this.edgeLength})
		}
		for (let i = col + this.edgeLength - 1; i >= col; i--) {
			this.verticesIndices.push({row: row + this.edgeLength, col: i})
		}
		for (let i = row + this.edgeLength - 1; i >= row + 1; i--) {
			this.verticesIndices.push({row: i, col: col})
		}
	}

	private addOwnEdges(): void {
		for (let i = 0; i < 3; i++) {
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
		const edge = {
			a: this.verticesIndices[this.edgeLength * 3],
			b: this.verticesIndices[0]
		}
		const halfEdge = {
			a: this.verticesIndices[this.edgeLength * 3],
			b: this.verticesIndices[this.verticesIndices.length - this.edgeLength / 2]
		}
		if (this.edgeLength === 1 || !this.mesh.edges.has(halfEdge)) {
			this.mesh.edges.add(edge)
		}
	}

	private removeOwnEdges(): void {
		for (let i = 0; i < 3; i++) {
			this.mesh.edges.delete({
				a: this.verticesIndices[this.edgeLength * i],
				b: this.verticesIndices[this.edgeLength * (i + 1)]
			})
		}
		this.mesh.edges.delete({
			a: this.verticesIndices[this.edgeLength * 3],
			b: this.verticesIndices[0]
		})
	}

	private getOwnActiveVertices(): Vertex[] {
		return this.verticesIndices
			.filter((vertexIndex) => this.toVertex(vertexIndex).referenceCounterIsPositive())
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
}