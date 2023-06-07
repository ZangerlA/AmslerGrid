import {Vertex} from "./Vertex";
import {Polygon} from "./Polygon";
import {Dimension} from "../customHooks/UseWindowDimensions";
import {Point} from "../types/Coordinate";
import {MeshIndex} from "../types/MeshIndex";
import {Vector} from "../types/Vector";
import {getUniqueArray} from "../helperMethods/getUniqueArray";
import {InitialMeshConfig} from "../types/InitialMeshConfig";
import {Edge} from "../types/Edge";
import {undirectedGraphHash, ValueSet} from "../helperMethods/ValueSet";
import {calculateCenter} from "../helperMethods/calculateCenter";
import testImage from "../testimage.jpg"
import {ImageWarper, Unsubscribe} from "./ImageWarper";
import {loadImage, scaleImage} from "../helperMethods/ImageHelper";
import {MeshCanvas} from "./MeshCanvas";

export class Mesh {
	public vertices: Vertex[][] = []
	public selectedPolygons: Set<Polygon> = new Set<Polygon>()
	public selectedVertex?: Vertex
	public edges: ValueSet<Edge> = new ValueSet<Edge>()
	private polygons: Set<Polygon> = new Set<Polygon>()
	private canvas: MeshCanvas
	private warper: ImageWarper
	private imageData?: ImageData
	public shouldDrawImage = false

	constructor(canvas: MeshCanvas, dimension: Dimension) {
		this.canvas = canvas
		const meshConfig = this.getMeshConfig(dimension)
		this.warper = new ImageWarper(this.createVertices(meshConfig), this.polygons)
		this.vertices = this.createVertices(meshConfig)
		this.edges = this.createEdges(meshConfig)
		this.polygons = this.createPolygons(meshConfig)
		this.setScaledImage(testImage)
	}

	private getMeshConfig(dimension: Dimension) {
		const cellCount = 5
		const maxMeshSize = 40
		return  {
			cellCount: cellCount,
			maxMeshSize: maxMeshSize,
			cellSizeVertical: (dimension.width - 100) / maxMeshSize,
			cellSizeHorizontal: (dimension.height - 100) / maxMeshSize,
			cellSizeOffset: Math.floor(maxMeshSize / cellCount),
		}
	}

	public subscribe(): Unsubscribe {
		if (!this.warper) throw new Error("warper should be initialized")
		return this.warper.subscribeDistortion((distortedImage) => {
			if (distortedImage) {
				this.imageData = distortedImage
				this.draw()
			}
		})
	}

	private createVertices(config: InitialMeshConfig): Vertex[][] {
		const vertices: Vertex[][] = []
		for (let i = 0; i <= config.maxMeshSize; i++) {
			vertices[i] = []
			for (let j = 0; j <= config.maxMeshSize; j++) {
				vertices[i][j] = this.createVertex(i, j, config)
			}
		}
		return vertices
	}

	private createVertex(i: number, j: number, config: InitialMeshConfig): Vertex {
		const coordinate: Point = {
			x: (config.cellSizeVertical * j) + 50,
			y: (config.cellSizeHorizontal * i) + 50
		}
		const vertex = new Vertex(coordinate)
		if (i % config.cellSizeOffset === 0 && j % config.cellSizeOffset === 0) {
			vertex.isActive = true
		}
		return vertex
	}

	private createPolygons(config: InitialMeshConfig): Set<Polygon> {
		const polygons: Set<Polygon> = new Set<Polygon>()
		for (let i = 0; i < config.cellCount; i++) {
			for (let j = 0; j < config.cellCount; j++) {
				polygons.add(this.createPolygon(i, j, config.cellSizeOffset, config.cellSizeOffset))
			}
		}
		return polygons
	}

	private createPolygon(i: number, j: number, offset: number, size: number): Polygon {
		const isGreen = ((i ^ j) & 1) === 0
		const color = isGreen ? "rgba(75,139,59,0.5)" : "white"
		return new Polygon(this, {row: i * offset, col: j * offset}, size, true, color)
	}

	private createEdges(config: InitialMeshConfig): ValueSet<Edge> {
		return this.createVerticalEdges(config).union(this.createHorizontalEdges(config))
	}

	private createVerticalEdges(config: InitialMeshConfig): ValueSet<Edge> {
		const edges: ValueSet<Edge> = new ValueSet<Edge>(undirectedGraphHash)
		for (let i = 0; i < config.maxMeshSize; i += config.cellSizeOffset) {
			for (let j = 0; j <= config.maxMeshSize; j += config.cellSizeOffset) {
				edges.add({a: {row: i, col: j}, b: {row: i + config.cellSizeOffset, col: j}})
			}
		}
		return edges
	}

	private createHorizontalEdges(config: InitialMeshConfig): ValueSet<Edge> {
		const edges: ValueSet<Edge> = new ValueSet<Edge>(undirectedGraphHash)
		for (let i = 0; i <= config.maxMeshSize; i += config.cellSizeOffset) {
			for (let j = 0; j < config.maxMeshSize; j += config.cellSizeOffset) {
				edges.add({a: {row: i, col: j}, b: {row: i, col: j + config.cellSizeOffset}})
			}
		}
		return edges
	}

	public setScaledImage(src: string): void {
		loadImage(src)
			.then((loadedImage) => {
				if (!this.canvas) throw new Error("meshPainter should be initialized")
				return scaleImage(loadedImage, this.canvas.dimension)
			})
			.then((scaledLoadedImage) => {
				if (!this.canvas) throw new Error("meshPainter should be initialized")
				if (!this.warper) throw new Error("warper should be initialized")
				const imagePosition = {
					x: (this.canvas.dimension.width / 2) - (scaledLoadedImage.width / 2),
					y: (this.canvas.dimension.height / 2) - (scaledLoadedImage.height / 2)
				}
				this.warper.setImage(scaledLoadedImage)
				this.warper.imagePosition = imagePosition
			})
			.then(() => this.draw())
	}

	public initCanvas(meshPainter: MeshCanvas): void {
		this.canvas = meshPainter
		const warpCanvas = document.createElement('canvas')
		if (!warpCanvas) throw new Error("Could not create canvas for warping.")
		if (!this.warper) throw new Error("Warper should be initialized.")
		warpCanvas.width = meshPainter.dimension.width
		warpCanvas.height = meshPainter.dimension.height
		this.warper.canvas = new MeshCanvas(warpCanvas)
	}
	
	public handleSelect(mouseClick: Point): void {
		this.polygons.forEach((polygon) => {
			const container = polygon.getContainer(mouseClick)
			if (container === undefined) {
				return
			}
			if (this.selectedPolygons.has(container)) {
				this.selectedPolygons.delete(container)
			} else {
				this.selectedPolygons.add(container)
			}
		})
	}
	
	public handleSingleVertex(mouseClick: Point): void {
		this.vertices.forEach((row) => {
			row.forEach((vertex) => {
				if (vertex.isActive && vertex.wasClicked(mouseClick)) {
					this.selectedVertex = vertex
				}
			})
		})
	}
	
	public handleDrag(vector: Vector): void {
		if (this.dragSelectedVertices(vector)) {
			return
		} else this.dragSelectedPolygons(vector)
	}
	
	public handleRelease(): void {
		this.selectedVertex = undefined
	}
	
	public handleRotate(degree: number): void {
		this.rotateSelectedPolygons(degree)
	}
	
	public handleScale(scaleFactor: number): void {
		const uniqueVertices = this.getUniqueVertices(this.selectedPolygons)
		const centerPoint = calculateCenter(uniqueVertices)
		this.scaleVertices(uniqueVertices, centerPoint, scaleFactor)
	}
	
	public handleSplit(mouseClick: Point): void {
		this.polygons.forEach((shape) => {
			if (shape.hasInside(mouseClick)) {
				shape.getContainer(mouseClick)!.split()
			}
		})
	}
	
	private dragSelectedVertices(vector: Vector): boolean {
		if (this.selectedVertex) {
			this.selectedVertex.move(vector)
			return true
		} else return false
	}
	
	private dragSelectedPolygons(vector: Vector): void {
		this.moveVertices(this.getUniqueVertices(this.selectedPolygons), vector)
	}
	
	private moveVertices(vertices: Vertex[], vector: Vector): void {
		vertices.forEach((vertex) => {
			vertex.move(vector)
		})
	}
	
	private rotateSelectedPolygons(degree: number): void {
		const uniqueVertices = this.getUniqueVertices(this.selectedPolygons)
		const centerPoint = calculateCenter(uniqueVertices)
		this.rotateVertices(uniqueVertices, centerPoint, degree)
	}
	
	private rotateVertices(vertices: Vertex[], point: Point, degree: number): void {
		vertices.forEach((vertex) => {
			vertex.rotateAround(point, degree)
		})
	}
	
	private scaleVertices(vertices: Vertex[], centerPoint: Point, scalingFactor: number): void {
		vertices.forEach((vertex) => {
			vertex.scale(scalingFactor, centerPoint)
		})
	}
	
	private getUniqueVertices(polygons: Set<Polygon>): Vertex[] {
		let vertexIndices: MeshIndex[] = []
		polygons.forEach((polygon) => {
			vertexIndices.push(...polygon.gatherVerticesIndices([]))
		})
		let vertices: Vertex[] = vertexIndices.map((curr) => this.vertices[curr.row][curr.col])
		return getUniqueArray(vertices)
	}

	public draw(): void {
		if (!this.canvas) return
		this.canvas.clearCanvas()

		if (this.shouldDrawImage && this.warper && this.warper.imagePosition) {
			const tmp = this.imageData ?? this.warper.getImageAsData()

			if (tmp) {
				this.canvas.drawImage(tmp, this.warper.imagePosition)
			}
		}
		else {
			this.drawShapeFill(this.canvas)
			this.drawHelpLines(this.canvas)
			this.drawHelpPoints(this.canvas)
		}
		this.canvas.drawCanvasCenter(10, "rgba(215,0,25,1)")
	}
	
	private drawShapeFill(painter: MeshCanvas): void {
		this.polygons.forEach((polygon) => {
			polygon.draw(painter)
		})
	}
	
	private drawHelpLines(painter: MeshCanvas): void {
		this.edges.forEach((edge) => {
			const from: Point = {
				x: this.vertices[edge.a.row][edge.a.col].coordinate.x,
				y: this.vertices[edge.a.row][edge.a.col].coordinate.y
			}
			const to: Point = {
				x: this.vertices[edge.b.row][edge.b.col].coordinate.x,
				y: this.vertices[edge.b.row][edge.b.col].coordinate.y
			}
			painter.drawLine(from, to)
		})
	}
	
	private drawHelpPoints(painter: MeshCanvas): void {
		for (let i = 0; i < this.vertices.length; i++) {
			for (let j = 0; j < this.vertices[i].length; j++) {
				const vertex = this.vertices[i][j]
				if (this.vertices[i][j].isActive) {
					painter.drawPoint(vertex.coordinate, vertex.drawRadius, vertex.color)
				}
			}
		}
	}

	public warpImage(): void {
		if (!this.warper) return
		this.warper.pushWarp(this.vertices)
	}

	public clearSelected() {
		this.selectedPolygons.clear()
	}

	public toggleImage(): void {
		this.shouldDrawImage = !this.shouldDrawImage
		if (this.shouldDrawImage) {
			this.warpImage()
		}
		else {
			this.draw()
		}
	}
}