import {Node} from "./Node";
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
import {ImageWarper} from "./ImageWarper";

export class Mesh {
	nodes: Node[][] = []
	private polygons: Set<Polygon> = new Set<Polygon>()
	selectedPolygons: Set<Polygon> = new Set<Polygon>()
	edges: ValueSet<Edge> = new ValueSet<Edge>()
	private warper?: ImageWarper

	initializeMesh(dimension: Dimension): void {
		const cellCount = 5
		const maxMeshSize = 40
		const config: InitialMeshConfig = {
			cellCount: cellCount,
			maxMeshSize: maxMeshSize,
			cellSizeVertical: (dimension.currentDimension.width - 100) / maxMeshSize,
			cellSizeHorizontal: (dimension.currentDimension.height - 100) / maxMeshSize,
			cellSizeOffset: Math.floor(maxMeshSize / cellCount),
		}

		this.nodes = this.createNodes(config)
		this.edges = this.createEdges(config)
		this.polygons = this.groupPolygons(this.createPolygons(config), config.cellCount)
		this.colorPolygons()
		//this.warper = new ImageWarper(this.nodes, this.polygons)
	}

	private createNodes(config: InitialMeshConfig): Node[][] {
		const nodes: Node[][] = []
		for (let i = 0; i <= config.maxMeshSize; i++) {
			nodes[i] = []
			for (let j = 0; j <= config.maxMeshSize; j++) {
				nodes[i][j] = this.createNode(i, j, config)
			}
		}
		return nodes
	}

	private createNode(i: number, j: number, config: InitialMeshConfig): Node {
		const coordinate: Coordinate = {
			x: (config.cellSizeVertical * j) + 50,
			y: (config.cellSizeHorizontal * i) + 50
		}
		const node = new Node(coordinate)
		if (i % config.cellSizeOffset === 0 && j % config.cellSizeOffset === 0) {
			node.isActive = true
		}
		return node
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
				newRow.push(this.createParentPolygon(i, j, polygons));
			}
			mergedPolygons.push(newRow);
		}
		return this.groupPolygons(mergedPolygons, limit)
	}

	private createParentPolygon(i: number, j: number, polygons: Polygon[][]): Polygon {
		const parentPolygon = this.createPolygon(polygons[i][j].nodes[0].row, polygons[i][j].nodes[0].col, 1, polygons[i][j].edgeLength * 2, false)
		for (let k = 0; k < 2; k++) {
			for (let l = 0; l < 2; l++) {
				parentPolygon.children.push(polygons[i + k][j + l]);
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

	handleSingleNode(mouseClick: Coordinate): void {
		this.nodes.forEach((row) => {
			row.forEach((node) => {
				if (node.isActive && node.wasClicked(mouseClick)) {
					node.dragging = true
				}
			})
		})
	}

	handleDrag(vector: Vector): void {
		if (this.dragSelectedNodes(vector)) {
			return
		} else this.dragSelectedPolygons(vector)
	}

	private dragSelectedNodes(vector: Vector): boolean {
		let moved = false
		this.nodes.forEach((row) => {
			row.forEach((node) => {
				if (node.dragging) {
					node.move(vector)
					moved = true
				}
			})
		})
		return moved
	}

	private dragSelectedPolygons(vector: Vector) {
		this.moveNodes(this.getUniqueSelectedNodes(), vector)
	}

	private moveNodes(nodeIndices: MeshIndex[], vector: Vector): void {
		nodeIndices.forEach((index) => {
			this.nodes[index.row][index.col].move(vector)
		})
	}

	handleRelease(): void {
		this.nodes.forEach((row) => {
			row.forEach((node) => {
				if (node.dragging) {
					node.dragging = false
				}
			})
		})
	}

	handleRotate(degree: number): void {
		this.rotateSelectedPolygons(degree)
	}

	private rotateSelectedPolygons(degree: number) {
		const uniqueNodes = this.getUniqueSelectedNodes()
		const centerPoint = calculateCenter(uniqueNodes)
		this.rotateNodes(uniqueNodes, centerPoint, degree)
	}

	private rotateNodes(nodeIndices: MeshIndex[], point: Coordinate, degree: number): void {
		nodeIndices.forEach((index) => {
			this.nodes[index.row][index.col].rotateAround(point, degree)
		})
	}

	handleScale(scaleFactor: number) {
		const uniqueNodes = this.getUniqueSelectedNodes()
		const centerPoint = calculateCenter(uniqueNodes)
		this.scaleNodes(uniqueNodes,centerPoint,scaleFactor)
	}

	private scaleNodes(nodeIndices: MeshIndex[], centerPoint: Coordinate, scalingFactor: number) {
		nodeIndices.forEach((index) => {
			this.nodes[index.row][index.col].scale(scalingFactor, centerPoint)
		})
	}

	private getUniqueSelectedNodes(): MeshIndex[]{
		let nodeIndices: MeshIndex[] = []
		this.selectedPolygons.forEach((polygon) => {
			nodeIndices.push(...polygon.gatherNodes([]))
		})
		return getUniqueArray(nodeIndices)
	}

	handleSplit(mouseClick: Coordinate) {
		this.polygons.forEach((shape) => {
			if (shape.hasInside(mouseClick)) {
				shape.getContainer(mouseClick)!.split()
			}
		})
	}

	draw(ctx: CanvasRenderingContext2D, dimension: Dimension): void {
		ctx.clearRect(0, 0, dimension.currentDimension.width, dimension.currentDimension.height)
		this.drawShapeFill(ctx)
		this.drawHelpLines(ctx)
		this.drawHelpPoints(ctx)
		this.drawCenterPoint(ctx, dimension)
	}

	drawShapeFill(ctx: CanvasRenderingContext2D): void {
		this.polygons.forEach((polygon) => {
			polygon.draw(ctx)
		})
	}

	drawHelpLines(ctx: CanvasRenderingContext2D) {
		this.edges.forEach((edge) => {
			ctx.beginPath()
			ctx.moveTo(this.nodes[edge.a.row][edge.a.col].coordinate.x, this.nodes[edge.a.row][edge.a.col].coordinate.y)
			ctx.lineTo(this.nodes[edge.b.row][edge.b.col].coordinate.x, this.nodes[edge.b.row][edge.b.col].coordinate.y)
			ctx.stroke()
		})
	}

	drawHelpPoints(ctx: CanvasRenderingContext2D) {
		for (let i = 0; i < this.nodes.length; i++) {
			for (let j = 0; j < this.nodes[i].length; j++) {
				const node = this.nodes[i][j]
				if (this.nodes[i][j].isActive) {
					this.drawPoint(ctx, node.coordinate, node.drawRadius, node.color)
				}
			}
		}
	}

	drawCenterPoint(ctx: CanvasRenderingContext2D, dimension: Dimension) {
		const coordinate: Coordinate = {
			x: dimension.currentDimension.width / 2,
			y: dimension.currentDimension.height / 2
		}
		this.drawPoint(ctx, coordinate, 10, "rgba(215,0,25,1)")
	}

	drawPoint(ctx: CanvasRenderingContext2D, coordinate: Coordinate, radius: number, color: string) {
		ctx.beginPath()
		ctx.moveTo(coordinate.x, coordinate.y)
		ctx.fillStyle = color
		ctx.arc(coordinate.x, coordinate.y, radius, 0, Math.PI * 2, false)
		ctx.fill()
	}

	getNodeFor(index: MeshIndex) {
		return this.nodes[index.row][index.col]
	}
}

export const MeshInstance = new Mesh()