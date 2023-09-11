import { Dimension } from "../customHooks/UseWindowDimensions"
import { Point } from "../types/Coordinate"
import { Vertex } from "./Vertex"

export class MeshCanvas {
	public dimension: Dimension
	public ctx: CanvasRenderingContext2D
	private canvas: HTMLCanvasElement

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
		const ctx = canvas.getContext("2d", { willReadFrequently: true })
		if ( !ctx ) throw new Error("Unable to get 2D context from canvas")
		this.ctx = ctx
		this.dimension = { width: canvas.width, height: canvas.height }
	}

	public getImageData(upperLeft?: Point, width?: number, height?: number): ImageData {
		if ( upperLeft !== undefined && width !== undefined && height !== undefined ) {
			return this.ctx.getImageData(upperLeft.x, upperLeft.y, width, height)
		} else return this.ctx.getImageData(0, 0, this.dimension.width, this.dimension.height)
	}

	public drawCanvasCenter(dimension: Dimension, radius: number, color: string): void {
		const centerPoint: Point = {
			x: dimension.width / 2,
			y: dimension.height / 2,
		}
		this.drawPoint(centerPoint, radius, color)
	}

	public drawPolygon(vertices: Vertex[], fillColor: string, overlayColor?: string): void {
		this.ctx.beginPath()
		this.ctx.moveTo(vertices[0].coordinate.x, vertices[0].coordinate.y)
		vertices.forEach((vertex) => {
			if ( vertex.referenceCounterIsPositive() ) {
				this.ctx.lineTo(vertex.coordinate.x, vertex.coordinate.y)
			}
		})
		this.ctx.lineTo(vertices[0].coordinate.x, vertices[0].coordinate.y)
		this.ctx.fillStyle = fillColor
		this.ctx.fill()
		if ( overlayColor !== undefined ) {
			this.ctx.fillStyle = "rgba(33,33,114,0.5)"
			this.ctx.fill()
		}
	}

	public clearCanvas(): void;
	public clearCanvas(upperLeft: Point, width: number, height: number): void;
	public clearCanvas(upperLeft?: Point, width?: number, height?: number): void {
		if ( upperLeft !== undefined && width !== undefined && height !== undefined ) {
			this.ctx.clearRect(upperLeft.x, upperLeft.y, width, height)
		} else {
			this.ctx.clearRect(0, 0, this.dimension.width, this.dimension.height)
		}
	}

	public drawPoint(point: Point, radius: number, color: string): void {
		this.ctx.beginPath()
		this.ctx.moveTo(point.x, point.y)
		this.ctx.fillStyle = color
		this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2, false)
		this.ctx.fill()
	}

	public drawLine(from: Point, to: Point) {
		this.ctx.beginPath()
		this.ctx.moveTo(from.x, from.y)
		this.ctx.lineTo(to.x, to.y)
		this.ctx.stroke()
	}

	public drawImage(image: HTMLImageElement, upperLeft: Point, scaledWidth?: number, scaledHeight?: number): void
	public drawImage(image: ImageData, upperLeft: Point): void
	public drawImage(image: HTMLImageElement | ImageData, upperLeft: Point, scaledWidth?: number, scaledHeight?: number): void {
		if ( image instanceof HTMLImageElement ) {
			if ( scaledWidth !== undefined && scaledHeight !== undefined ) {
				this.ctx.drawImage(image, upperLeft.x, upperLeft.y, scaledWidth, scaledHeight)
			} else {
				this.ctx.drawImage(image, upperLeft.x, upperLeft.y)
			}
		} else if ( image instanceof ImageData ) {
			this.ctx.putImageData(image, upperLeft.x, upperLeft.y)
		} else {
			throw new Error("Invalid arguments")
		}
	}

	public download(filename = "distorted-image.png") {
		const link = document.createElement("a")
		link.href = this.canvas.toDataURL("image/png")
		link.download = filename
		link.click()
	}

	public getDataURL(filename = "distorted-image.png") {
		const link = document.createElement("a")
		return this.canvas.toDataURL("image/png")
	}

	public toDataURL(): string {
		return this.canvas.toDataURL()
	}

	public getMeshBoundingBox(vertices: Vertex[][]): { upperLeft: Point, lowerRight: Point } {
		let minX = Infinity
		let minY = Infinity
		let maxX = -Infinity
		let maxY = -Infinity

		vertices.forEach(row => {
			row.forEach(vertex => {
				minX = Math.min(minX, vertex.coordinate.x)
				minY = Math.min(minY, vertex.coordinate.y)
				maxX = Math.max(maxX, vertex.coordinate.x)
				maxY = Math.max(maxY, vertex.coordinate.y)
			})
		})

		return {
			upperLeft: { x: minX, y: minY },
			lowerRight: { x: maxX, y: maxY },
		}
	}

	public getMeshImageData(vertices: Vertex[][]): ImageData {
		const boundingBox = this.getMeshBoundingBox(vertices)
		const width = boundingBox.lowerRight.x - boundingBox.upperLeft.x
		const height = boundingBox.lowerRight.y - boundingBox.upperLeft.y
		return this.ctx.getImageData(boundingBox.upperLeft.x - 50, boundingBox.upperLeft.y - 50, width + 100, height + 100)
	}

	public getMeshDataURL(vertices: Vertex[][]): string {
		// Step 1: Get the ImageData of the mesh area
		const imageData = this.getMeshImageData(vertices)

		// Step 2: Draw that ImageData on another (temporary) canvas
		const tempCanvas = document.createElement("canvas")
		tempCanvas.width = imageData.width
		tempCanvas.height = imageData.height

		const tempCtx = tempCanvas.getContext("2d")
		if ( tempCtx ) {
			tempCtx.putImageData(imageData, 0, 0)
		}

		// Step 3: Return the Base64 encoded image
		return tempCanvas.toDataURL()
	}
}