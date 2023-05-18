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
import {ImageWarper} from "./ImageWarper";
import {loadImage, scaleImage} from "../helperMethods/ImageHelper";
import {MeshCanvas} from "./MeshCanvas";
import {WarpImage} from "../types/WarpImage";

export class Mesh {
	vertices: Vertex[][] = []
	polygons: Set<Polygon> = new Set<Polygon>()
	selectedPolygons: Set<Polygon> = new Set<Polygon>()
	edges: ValueSet<Edge> = new ValueSet<Edge>()
	canvas?: MeshCanvas
	warpCanvas?: MeshCanvas
	warper?: ImageWarper
	image?: WarpImage
	
	initializeMesh(dimension: Dimension): void {
		const cellCount = 5
		const maxMeshSize = 40
		const config: InitialMeshConfig = {
			cellCount: cellCount,
			maxMeshSize: maxMeshSize,
			cellSizeVertical: (dimension.width - 100) / maxMeshSize,
			cellSizeHorizontal: (dimension.height - 100) / maxMeshSize,
			cellSizeOffset: Math.floor(maxMeshSize / cellCount),
		}

		this.vertices = this.createVertices(config)
		this.edges = this.createEdges(config)
		this.polygons = this.groupPolygons(this.createPolygons(config), config.cellCount)
		this.colorPolygons()
		this.warper = new ImageWarper(this.createVertices(config))
		this.setScaledImage(testImage)
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

	private createPolygons(config: InitialMeshConfig): Polygon[][] {
		const polygons: Polygon[][] = []
		for (let i = 0; i < config.maxMeshSize ; i++) {
			polygons[i] = []
			for (let j = 0; j < config.maxMeshSize ; j++) {
				polygons[i][j] = (this.createPolygon(i, j, 1, 1, false))
			}
		}
		return polygons
	}

	createPolygon(i: number, j: number, offset: number, size: number, shouldDraw: boolean): Polygon {
		const isGreen = ((i ^ j) & 1) === 0
		let color = isGreen ? "rgba(75,139,59,0.5)" : "white"
		return new Polygon(this, {row: i * offset, col: j * offset}, size, shouldDraw, color)
	}

	private groupPolygons(polygons: Polygon[][], limit: number): Set<Polygon> {
		if (polygons.length <= limit) {
			const result = new Set<Polygon>()
			for (let row of polygons) {
				for (let polygon of row) {
					polygon.shouldDraw = true
					result.add(polygon)
				}
			}
			return result
		}
		const mergedPolygons: Polygon[][] = [];

		for (let i = 0; i < polygons.length; i += 2) {
			const newRow: Polygon[] = [];
			for (let j = 0; j < polygons[i].length; j += 2) {
				newRow.push(this.createParentPolygon(i, j, polygons))
			}
			mergedPolygons.push(newRow)
		}
		return this.groupPolygons(mergedPolygons, limit)
	}

	private createParentPolygon(i: number, j: number, polygons: Polygon[][]): Polygon {
		const parentPolygon = this.createPolygon(polygons[i][j].verticesIndices[0].row, polygons[i][j].verticesIndices[0].col, 1, polygons[i][j].edgeLength * 2, false)
		for (let k = 0; k < 2; k++) {
			for (let l = 0; l < 2; l++) {
				parentPolygon.children.push(polygons[i + k][j + l])
			}
		}
		return parentPolygon
	}

	private colorPolygons():void{
		let colored = true
		this.polygons.forEach((polygon)=>{
			polygon.setColor(colored)
			colored = !colored
			polygon.colorChildren()
		})
	}

	private createEdges(config: InitialMeshConfig): ValueSet<Edge> {
		return this.createVerticalEdges(config).union(this.createHorizontalEdges(config))
	}

	private createVerticalEdges(config: InitialMeshConfig): ValueSet<Edge> {
		const edges: ValueSet<Edge> = new ValueSet<Edge>(undirectedGraphHash)
		for (let i = 0; i < config.maxMeshSize; i+= config.cellSizeOffset) {
			for (let j = 0; j <= config.maxMeshSize; j+= config.cellSizeOffset) {
				edges.add({a: {row: i, col: j}, b: {row:  i + config.cellSizeOffset, col: j}})
			}
		}
		return edges
	}

	private createHorizontalEdges(config: InitialMeshConfig): ValueSet<Edge> {
		const edges: ValueSet<Edge> = new ValueSet<Edge>(undirectedGraphHash)
		for (let i = 0; i <= config.maxMeshSize; i+= config.cellSizeOffset) {
			for (let j = 0; j < config.maxMeshSize; j+= config.cellSizeOffset) {
				edges.add({a: {row: i, col: j}, b: {row:  i, col: j + config.cellSizeOffset}})
			}
		}
		return edges
	}

	handleSelect(mouseClick: Point): void {
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

	handleSingleVertex(mouseClick: Point): void {
		this.vertices.forEach((row) => {
			row.forEach((vertex) => {
				if (vertex.isActive && vertex.wasClicked(mouseClick)) {
					vertex.dragging = true
				}
			})
		})
	}

	handleDrag(vector: Vector): void {
		if (this.dragSelectedVertices(vector)) {
			return
		} else this.dragSelectedPolygons(vector)
	}

	private dragSelectedVertices(vector: Vector): boolean {
		let moved = false
		this.vertices.forEach((row) => {
			row.forEach((vertex) => {
				if (vertex.dragging) {
					vertex.move(vector)
					moved = true
				}
			})
		})
		return moved
	}

	private dragSelectedPolygons(vector: Vector): void {
		this.moveVertices(this.getUniqueVertices(this.polygons), vector)
	}

	private moveVertices(vertices: Vertex[], vector: Vector): void {
		vertices.forEach((vertex) => {
			vertex.move(vector)
		})
	}

	handleRelease(): void {
		this.vertices.forEach((row) => {
			row.forEach((vertex) => {
				if (vertex.dragging) {
					vertex.dragging = false
				}
			})
		})
	}

	handleRotate(degree: number): void {
		this.rotateSelectedPolygons(degree)
	}

	private rotateSelectedPolygons(degree: number): void {
		const uniqueVertices = this.getUniqueVertices(this.polygons)
		const centerPoint = calculateCenter(uniqueVertices)
		this.rotateVertices(uniqueVertices, centerPoint, degree)
	}

	private rotateVertices(vertices: Vertex[], point: Point, degree: number): void {
		vertices.forEach((vertex) => {
			vertex.rotateAround(point, degree)
		})
	}

	handleScale(scaleFactor: number): void {
		const uniqueVertices = this.getUniqueVertices(this.polygons)
		const centerPoint = calculateCenter(uniqueVertices)
		this.scaleVertices(uniqueVertices,centerPoint,scaleFactor)
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


	handleSplit(mouseClick: Point): void {
		this.polygons.forEach((shape) => {
			if (shape.hasInside(mouseClick)) {
				shape.getContainer(mouseClick)!.split()
			}
		})
	}

	draw(): void {
		if (!this.canvas) return
		this.canvas.clearCanvas()
		this.drawShapeFill(this.canvas)
		if (this.image) {
			const image = this.image.warpedImageData ?? this.image.image;
			this.canvas.drawImage(image, this.image.imagePosition);
		}
		this.drawHelpLines(this.canvas)
		this.drawHelpPoints(this.canvas)
		this.canvas.drawCanvasCenter(10, "rgba(215,0,25,1)")
	}

	drawShapeFill(painter: MeshCanvas): void {
		this.polygons.forEach((polygon) => {
			polygon.draw(painter)
		})
	}

	drawHelpLines(painter: MeshCanvas): void {
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

	drawHelpPoints(painter: MeshCanvas): void {
		for (let i = 0; i < this.vertices.length; i++) {
			for (let j = 0; j < this.vertices[i].length; j++) {
				const vertex = this.vertices[i][j]
				if (this.vertices[i][j].isActive) {
					painter.drawPoint(vertex.coordinate, vertex.drawRadius, vertex.color)
				}
			}
		}
	}
	
	setScaledImage(src: string): void {
		loadImage(src)
			.then((loadedImage) => {
				if (!this.canvas) throw new Error("meshPainter should be initialized")
				return scaleImage(loadedImage, this.canvas.dimension)
			})
			.then((scaledLoadedImage) => {
				if (!this.canvas) throw new Error("meshPainter should be initialized")
				if (!this.warpCanvas) throw new Error("warpPainter should be initialized")
				const imagePosition = {
					x: (this.canvas.dimension.width/2) - (scaledLoadedImage.width/2),
					y: (this.canvas.dimension.height/2) - (scaledLoadedImage.height/2)
				}
				this.image = {
					image: scaledLoadedImage,
					warpedImageData: undefined,
					imagePosition
				}
				this.warpCanvas.drawImage(this.image.image, this.image.imagePosition)
			})
			.then(() => this.draw())
	}
	
	initCanvas(meshPainter: MeshCanvas): void {
		this.canvas = meshPainter
		const warpCanvas = document.createElement('canvas')
		if (!warpCanvas) throw new Error("Could not create canvas for warping.")
		warpCanvas.width = meshPainter.dimension.width
		warpCanvas.height = meshPainter.dimension.height
		this.warpCanvas = new MeshCanvas(warpCanvas)
	}

	warpImage(): void {
		if (!this.warpCanvas || !this.image || !this.warper) return
		this.warpCanvas.clearCanvas()
		this.warpCanvas.drawImage(this.image.image, this.image.imagePosition)
		this.warper.warp(this.vertices, this.polygons, this.warpCanvas)
		this.image.warpedImageData = this.warpCanvas.getImageData(this.image.imagePosition, this.image.image.width, this.image.image.height)
	}
}

export const leftEyeMesh = new Mesh()
export const rightEyeMesh = new Mesh()
