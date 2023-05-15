import {Vertex} from "./Vertex";
import {Polygon} from "./Polygon";
import {Dimension} from "../customHooks/UseWindowDimensions";
import {Coordinate} from "../types/Coordinate";
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
import {Simulate} from "react-dom/test-utils";
import load = Simulate.load;
import {ImageWarper2} from "./ImageWarper2";

export class Mesh {
	vertices: Vertex[][] = []
	polygons: Set<Polygon> = new Set<Polygon>()
	selectedPolygons: Set<Polygon> = new Set<Polygon>()
	edges: ValueSet<Edge> = new ValueSet<Edge>()
	warper?: ImageWarper
	image: HTMLImageElement = new Image()
	warpedImageData?: ImageData
	imagePosition: Coordinate = {x:0, y:0}
	canvas?: HTMLCanvasElement
	canvasDimension: Dimension = {width: 0, height: 0}
	warpingCanvas?: HTMLCanvasElement
	
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
		const coordinate: Coordinate = {
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
		return new Polygon({row: i * offset, col: j * offset}, size, shouldDraw, color)
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
		const parentPolygon = this.createPolygon(polygons[i][j].vertices[0].row, polygons[i][j].vertices[0].col, 1, polygons[i][j].edgeLength * 2, false)
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

	handleSelect(mouseClick: Coordinate): void {
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

	handleSingleVertex(mouseClick: Coordinate): void {
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
		this.moveVertices(this.getUniqueSelectedVertices(), vector)
	}

	private moveVertices(vertexIndices: MeshIndex[], vector: Vector): void {
		vertexIndices.forEach((index) => {
			this.vertices[index.row][index.col].move(vector)
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
		const uniqueVertices = this.getUniqueSelectedVertices()
		const centerPoint = calculateCenter(uniqueVertices)
		this.rotateVertices(uniqueVertices, centerPoint, degree)
	}

	private rotateVertices(vertexIndices: MeshIndex[], point: Coordinate, degree: number): void {
		vertexIndices.forEach((index) => {
			this.vertices[index.row][index.col].rotateAround(point, degree)
		})
	}

	handleScale(scaleFactor: number): void {
		const uniqueVertices = this.getUniqueSelectedVertices()
		const centerPoint = calculateCenter(uniqueVertices)
		this.scaleVertices(uniqueVertices,centerPoint,scaleFactor)
	}

	private scaleVertices(vertexIndices: MeshIndex[], centerPoint: Coordinate, scalingFactor: number): void {
		vertexIndices.forEach((index) => {
			this.vertices[index.row][index.col].scale(scalingFactor, centerPoint)
		})
	}

	private getUniqueSelectedVertices(): MeshIndex[]{
		let vertexIndices: MeshIndex[] = []
		this.selectedPolygons.forEach((polygon) => {
			vertexIndices.push(...polygon.gatherVertices([]))
		})
		return getUniqueArray(vertexIndices)
	}

	handleSplit(mouseClick: Coordinate): void {
		this.polygons.forEach((shape) => {
			if (shape.hasInside(mouseClick)) {
				shape.getContainer(mouseClick)!.split()
			}
		})
	}

	draw(ctx: CanvasRenderingContext2D, dimension: Dimension): void {
		ctx.clearRect(0, 0, dimension.width, dimension.height)
		this.drawShapeFill(ctx)
		this.drawImage(ctx)
		this.drawHelpLines(ctx)
		this.drawHelpPoints(ctx)
		this.drawCenterPoint(ctx, dimension)
	}

	drawShapeFill(ctx: CanvasRenderingContext2D): void {
		this.polygons.forEach((polygon) => {
			polygon.draw(ctx)
		})
	}

	drawHelpLines(ctx: CanvasRenderingContext2D): void {
		this.edges.forEach((edge) => {
			ctx.beginPath()
			ctx.moveTo(this.vertices[edge.a.row][edge.a.col].coordinate.x, this.vertices[edge.a.row][edge.a.col].coordinate.y)
			ctx.lineTo(this.vertices[edge.b.row][edge.b.col].coordinate.x, this.vertices[edge.b.row][edge.b.col].coordinate.y)
			ctx.stroke()
		})
	}

	drawHelpPoints(ctx: CanvasRenderingContext2D): void {
		for (let i = 0; i < this.vertices.length; i++) {
			for (let j = 0; j < this.vertices[i].length; j++) {
				const vertex = this.vertices[i][j]
				if (this.vertices[i][j].isActive) {
					this.drawPoint(ctx, vertex.coordinate, vertex.drawRadius, vertex.color)
				}
			}
		}
	}

	drawCenterPoint(ctx: CanvasRenderingContext2D, dimension: Dimension): void {
		const coordinate: Coordinate = {
			x: dimension.width / 2,
			y: dimension.height / 2
		}
		this.drawPoint(ctx, coordinate, 10, "rgba(215,0,25,1)")
	}

	drawPoint(ctx: CanvasRenderingContext2D, coordinate: Coordinate, radius: number, color: string): void {
		ctx.beginPath()
		ctx.moveTo(coordinate.x, coordinate.y)
		ctx.fillStyle = color
		ctx.arc(coordinate.x, coordinate.y, radius, 0, Math.PI * 2, false)
		ctx.fill()
	}

	drawImage(ctx: CanvasRenderingContext2D): void {
		if (this.warpedImageData) {
			console.log("distorted")
			ctx.putImageData(this.warpedImageData, this.imagePosition.x, this.imagePosition.y)
		}
		else {
			console.log("original")
			ctx.drawImage(this.image, this.imagePosition.x, this.imagePosition.y)
		}
	}
	
	setScaledImage(src: string): void {
		const ctx = (this.canvas!.getContext('2d'))!
		loadImage(src)
			.then((loadedImage) => scaleImage(loadedImage, this.canvasDimension))
			.then((scaledLoadedImage) => {
				this.image = scaledLoadedImage
				this.imagePosition.x = (this.canvasDimension.width/2) - (scaledLoadedImage.width/2)
				this.imagePosition.y = (this.canvasDimension.height/2) - (this.image.height/2)
				this.warpingCanvas?.getContext("2d")!.drawImage(this.image,this.imagePosition.x,this.imagePosition.y)
			})
			.then(() => this.draw(ctx, this.canvasDimension))
	}
	
	setCanvas(canvas: HTMLCanvasElement): void {
		this.canvas = canvas
		this.canvasDimension = {width: this.canvas.width, height: this.canvas.height}
		this.warpingCanvas = document.createElement('canvas')
		this.warpingCanvas.width = canvas.width
		this.warpingCanvas.height = canvas.height
	}

	warpImage(): void {
		const ctx = this.canvas!.getContext('2d')!
		const warpCtx = this.warpingCanvas?.getContext("2d")!
		warpCtx.clearRect(0,0,this.warpingCanvas!.width, this.warpingCanvas!.height)
		warpCtx.drawImage(this.image,this.imagePosition.x,this.imagePosition.y)
		this.warper!.warp(this.vertices, this.polygons, this.warpingCanvas!)
		this.warpedImageData = warpCtx.getImageData(this.imagePosition.x,this.imagePosition.y, this.image.width, this.image.height)
		//this.warper!.download(this.warpingCanvas!)
		this.draw(ctx, this.canvasDimension)
	}
}

export const MeshInstance = new Mesh()