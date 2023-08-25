import {Dimension} from "../customHooks/UseWindowDimensions";
import {Point} from "../types/Coordinate";
import {Vertex} from "./Vertex";
import {ImageWarper} from "./ImageWarper";

export class MeshCanvas {
	public dimension: Dimension
	private canvas: HTMLCanvasElement
	public ctx: CanvasRenderingContext2D
	
	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
		const ctx = canvas.getContext("2d", {willReadFrequently: true})
		if (!ctx) throw new Error("Unable to get 2D context from canvas")
		this.ctx = ctx;
		this.dimension = {width: canvas.width, height: canvas.height}
	}
	
	public getImageData(upperLeft?: Point, width?: number, height?: number): ImageData {
		if (upperLeft !== undefined && width !== undefined && height !== undefined) {
			return this.ctx.getImageData(upperLeft.x, upperLeft.y, width, height);
		} else return this.ctx.getImageData(0, 0, this.dimension.width, this.dimension.height);
	}
	
	public drawCanvasCenter(radius: number, color: string): void {
		const centerPoint: Point = {
			x: this.dimension.width / 2,
			y: this.dimension.height / 2
		}
		this.drawPoint(centerPoint, radius, color)
	}
	
	public drawPolygon(vertices: Vertex[], fillColor: string, overlayColor?: string): void {
		this.ctx.beginPath()
		this.ctx.moveTo(vertices[0].coordinate.x, vertices[0].coordinate.y)
		vertices.forEach((vertex) => {
			if (vertex.referenceCounterIsPositive()) {
				this.ctx.lineTo(vertex.coordinate.x, vertex.coordinate.y)
			}
		})
		this.ctx.lineTo(vertices[0].coordinate.x, vertices[0].coordinate.y)
		this.ctx.fillStyle = fillColor
		this.ctx.fill()
		if (overlayColor !== undefined) {
			this.ctx.fillStyle = "rgba(33,33,114,0.5)"
			this.ctx.fill()
		}
	}
	
	public clearCanvas(): void;
	public clearCanvas(upperLeft: Point, width: number, height: number): void;
	public clearCanvas(upperLeft?: Point, width?: number, height?: number): void {
		if (upperLeft !== undefined && width !== undefined && height !== undefined) {
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
	public drawImage(image: HTMLImageElement, upperLeft: Point, scaledWidth?: number, scaledHeight?: number ): void
	public drawImage(image: ImageData, upperLeft: Point): void
	public drawImage(image: HTMLImageElement | ImageData, upperLeft: Point, scaledWidth?: number, scaledHeight?: number): void {
		if (image instanceof HTMLImageElement) {
			if (scaledWidth !== undefined && scaledHeight !== undefined) {
				this.ctx.drawImage(image, upperLeft.x, upperLeft.y, scaledWidth, scaledHeight)
			} else {
				this.ctx.drawImage(image, upperLeft.x, upperLeft.y)
			}
		} else if (image instanceof ImageData) {
			this.ctx.putImageData(image, upperLeft.x, upperLeft.y)
		} else {
			throw new Error("Invalid arguments")
		}
	}
	
	public download(filename = 'distorted-image.png') {
		const link = document.createElement('a');
		link.href = this.canvas.toDataURL('image/png');
		link.download = filename;
		link.click();
	}
	
	public toDataURL(): string {
		return this.canvas.toDataURL()
	}
	
}