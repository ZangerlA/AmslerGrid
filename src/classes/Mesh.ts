import { Dimension } from "../customHooks/UseWindowDimensions"
import { calculateCenter } from "../helperMethods/calculateCenter"
import { getUniqueArray } from "../helperMethods/getUniqueArray"
import { loadImage, scaleImage } from "../helperMethods/ImageHelper"
import { undirectedGraphHash, ValueSet } from "../helperMethods/ValueSet"
import testImage from "../testimage.jpg"
import { Point } from "../types/Coordinate"
import { Edge } from "../types/Edge"
import { InitialMeshConfig } from "../types/InitialMeshConfig"
import { MeshIndex } from "../types/MeshIndex"
import { MeshData } from "../types/SaveFile"
import { Vector } from "../types/Vector"
import { ImageWarper, Unsubscribe } from "./ImageWarper"
import { MeshCanvas } from "./MeshCanvas"
import { Polygon } from "./Polygon"
import { Vertex } from "./Vertex"

export class Mesh {
	public vertices: Vertex[][] = []
	public selectedPolygons: Set<Polygon> = new Set<Polygon>()
	public selectedVertex?: Vertex
	public edges: ValueSet<Edge> = new ValueSet<Edge>(undirectedGraphHash)
	public polygons: Set<Polygon> = new Set<Polygon>()
	public canvas: MeshCanvas
	public warper: ImageWarper
	public shouldDrawImage = false
	private imageData?: ImageData

	constructor(canvas: MeshCanvas, dimension: Dimension) {
		this.canvas = canvas
		const meshConfig = this.getMeshConfig(dimension)
		this.vertices = this.createVertices(meshConfig)
		this.edges = this.createEdges(meshConfig)
		this.polygons = this.createPolygons(meshConfig)
		this.warper = new ImageWarper(this.createVertices(meshConfig), this.polygons)
		this.setScaledImage(testImage)
		this.initWarpingCanvas()
	}

	public subscribe(): Unsubscribe {
		return this.warper.subscribeDistortion((distortedImage) => {
			if ( distortedImage ) {
				this.imageData = distortedImage
				this.draw()
			}
		})
	}

	public setScaledImage(src: string): void {
		loadImage(src)
			.then((loadedImage) => {
				if ( !this.canvas ) throw new Error("meshPainter should be initialized")
				return scaleImage(loadedImage, this.canvas.dimension)
			})
			.then((scaledLoadedImage) => {
				if ( !this.canvas ) throw new Error("meshPainter should be initialized")
				if ( !this.warper ) throw new Error("warper should be initialized")
				const imagePosition = {
					x: (this.canvas.dimension.width / 2) - (scaledLoadedImage.width / 2),
					y: (this.canvas.dimension.height / 2) - (scaledLoadedImage.height / 2),
				}
				this.warper.setImage(scaledLoadedImage)
				this.warper.imagePosition = imagePosition
			})
	}

	public initWarpingCanvas(): void {
		const warpCanvas = document.createElement("canvas")
		if ( !warpCanvas ) throw new Error("Could not create canvas for warping.")
		warpCanvas.width = this.canvas.dimension.width
		warpCanvas.height = this.canvas.dimension.height
		this.warper.canvas = new MeshCanvas(warpCanvas)
	}

	public handleSelect(mouseClick: Point): void {
		this.polygons.forEach((polygon) => {
			const container = polygon.getContainer(mouseClick)
			if ( container === undefined ) {
				return
			}
			if ( this.selectedPolygons.has(container) ) {
				this.selectedPolygons.delete(container)
			} else {
				this.selectedPolygons.add(container)
			}
		})
	}

	public handleSingleVertex(mouseClick: Point): void {
		this.vertices.forEach((row) => {
			row.forEach((vertex) => {
				if ( vertex.referenceCounterIsPositive() && vertex.wasClicked(mouseClick) ) {
					this.selectedVertex = vertex
				}
			})
		})
	}

	public handleDrag(vector: Vector): void {
		if ( this.dragSelectedVertices(vector) ) {
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
			if ( shape.hasInside(mouseClick) ) {
				shape.getContainer(mouseClick)!.split()
			}
		})
	}

	public handleMerge(mouseClick: Point): void {
		this.polygons.forEach((shape) => {
			if ( shape.hasInside(mouseClick) ) {
				const polygon = shape.getParentContainer(mouseClick, shape)
				polygon?.merge()
			}
		})
	}

	public draw(canvas?: MeshCanvas): void {
		if ( !canvas ) {
			canvas = this.canvas
		}
		canvas.clearCanvas()

		if ( this.shouldDrawImage && this.warper.imagePosition ) {
			const tmp = this.imageData ?? this.warper.getImageAsData()
			if ( tmp ) {
				canvas.drawImage(tmp, this.warper.imagePosition)
			}
		} else {
			this.drawShapeFill(canvas)
			this.drawHelpLines(canvas)
			this.drawHelpPoints(canvas)
		}
		const max = this.vertices[this.vertices.length - 1][this.vertices[0].length - 1].coordinate
		canvas.drawCanvasCenter({ width: max.x + 50, height: max.y + 50 }, 10, "rgba(215,0,25,1)")
	}

	public warpImage(): void {
		this.warper.pushWarp(this.vertices)
	}

	public isWarping(): boolean {
		return this.warper.tasks.size > 0
	}

	public clearSelected(): void {
		this.selectedPolygons.clear()
	}

	public toggleImage(): void {
		this.shouldDrawImage = !this.shouldDrawImage
		if ( this.shouldDrawImage ) {
			this.warpImage()
		}
		this.draw()
	}

	public toJSON(): any {
		const polygons = []
		for ( let polygon of this.polygons ) {
			polygons.push(polygon)
		}
		return {
			vertices: this.vertices,
			polygons: polygons,
			edges: this.edges.toArray(),
			shouldDrawImage: this.shouldDrawImage,
		}
	}

	public restoreFromFile(data: MeshData): void {
		this.edges = new ValueSet<Edge>(undirectedGraphHash)
		for ( let edge of data.edges ) {
			this.edges.add(edge)
		}
		for ( let i = 0; i < this.vertices.length; i++ ) {
			for ( let j = 0; j < this.vertices.at(0)!.length; j++ ) {
				this.vertices[i][j].coordinate = data.vertices[i][j].coordinate
				this.vertices[i][j].drawRadius = data.vertices[i][j].drawRadius
				this.vertices[i][j].color = data.vertices[i][j].color
				this.vertices[i][j].referenceCounter = data.vertices[i][j].referenceCounter
				this.vertices[i][j].wasMoved = data.vertices[i][j].wasMoved
			}
		}
		let count = 0
		for ( let polygon of this.polygons ) {
			polygon.restoreFromFile(data.polygons.at(count)!)
			count++
		}
	}

	private getMeshConfig(dimension: Dimension) {
		const cellCount = 5
		const maxMeshSize = 40
		return {
			cellCount: cellCount,
			maxMeshSize: maxMeshSize,
			cellSizeVertical: (dimension.width - 100) / maxMeshSize,
			cellSizeHorizontal: (dimension.height - 100) / maxMeshSize,
			cellSizeOffset: Math.floor(maxMeshSize / cellCount),
		}
	}

	private createVertices(config: InitialMeshConfig): Vertex[][] {
		const vertices: Vertex[][] = []
		for ( let i = 0; i <= config.maxMeshSize; i++ ) {
			vertices[i] = []
			for ( let j = 0; j <= config.maxMeshSize; j++ ) {
				vertices[i][j] = this.createVertex(i, j, config)
			}
		}
		return vertices
	}

	private createVertex(i: number, j: number, config: InitialMeshConfig): Vertex {
		const coordinate: Point = {
			x: (config.cellSizeVertical * j) + 50,
			y: (config.cellSizeHorizontal * i) + 50,
		}
		const vertex = new Vertex(coordinate)

		return vertex
	}

	private createPolygons(config: InitialMeshConfig): Set<Polygon> {
		const polygons: Set<Polygon> = new Set<Polygon>()
		for ( let i = 0; i < config.cellCount; i++ ) {
			for ( let j = 0; j < config.cellCount; j++ ) {
				polygons.add(this.createPolygon(i, j, config.cellSizeOffset, config.cellSizeOffset))
			}
		}
		return polygons
	}

	private createPolygon(i: number, j: number, offset: number, size: number): Polygon {
		const isGreen = ((i ^ j) & 1) === 0
		const color = isGreen ? "rgba(75,139,59,0.5)" : "white"
		const polygon = new Polygon(this, { row: i * offset, col: j * offset }, size, color)
		polygon.initializeReferences()
		return polygon
	}

	private createEdges(config: InitialMeshConfig): ValueSet<Edge> {
		return this.createVerticalEdges(config).union(this.createHorizontalEdges(config))
	}

	private createVerticalEdges(config: InitialMeshConfig): ValueSet<Edge> {
		const edges: ValueSet<Edge> = new ValueSet<Edge>(undirectedGraphHash)
		for ( let i = 0; i < config.maxMeshSize; i += config.cellSizeOffset ) {
			for ( let j = 0; j <= config.maxMeshSize; j += config.cellSizeOffset ) {
				edges.add({ a: { row: i, col: j }, b: { row: i + config.cellSizeOffset, col: j } })
			}
		}
		return edges
	}

	private createHorizontalEdges(config: InitialMeshConfig): ValueSet<Edge> {
		const edges: ValueSet<Edge> = new ValueSet<Edge>(undirectedGraphHash)
		for ( let i = 0; i <= config.maxMeshSize; i += config.cellSizeOffset ) {
			for ( let j = 0; j < config.maxMeshSize; j += config.cellSizeOffset ) {
				edges.add({ a: { row: i, col: j }, b: { row: i, col: j + config.cellSizeOffset } })
			}
		}
		return edges
	}

	private dragSelectedVertices(vector: Vector): boolean {
		if ( this.selectedVertex ) {
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

	private drawShapeFill(painter: MeshCanvas): void {
		this.polygons.forEach((polygon) => {
			polygon.draw(painter)
		})
	}

	private drawHelpLines(painter: MeshCanvas): void {
		this.edges.forEach((edge) => {
			const from: Point = {
				x: this.vertices[edge.a.row][edge.a.col].coordinate.x,
				y: this.vertices[edge.a.row][edge.a.col].coordinate.y,
			}
			const to: Point = {
				x: this.vertices[edge.b.row][edge.b.col].coordinate.x,
				y: this.vertices[edge.b.row][edge.b.col].coordinate.y,
			}
			painter.drawLine(from, to)
		})
	}

	private drawHelpPoints(painter: MeshCanvas): void {
		for ( let i = 0; i < this.vertices.length; i++ ) {
			for ( let j = 0; j < this.vertices[i].length; j++ ) {
				const vertex = this.vertices[i][j]
				if ( this.vertices[i][j].referenceCounterIsPositive() ) {
					painter.drawPoint(vertex.coordinate, vertex.drawRadius, vertex.color)
				}
			}
		}
	}
}