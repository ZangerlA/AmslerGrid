import {Polygon} from "./Polygon";
import {Node} from "./Node";
import {Coordinate} from "../types/Coordinate";
import {MeshInstance} from "./Mesh";

type PixelValue = {
	r: number,
	g: number,
	b: number,
	a: number,
}
export class ImageWarper {
	private originalMesh: Node[][]
	private originalPolygon: Set<Polygon>
	private originalImage: HTMLImageElement
	private canvas: HTMLCanvasElement
	private ctx: CanvasRenderingContext2D

	constructor(image: HTMLImageElement, originalMesh: Node[][], originalPolygons: Set<Polygon>) {
		this.originalMesh = originalMesh
		this.originalPolygon = originalPolygons
		this.originalImage = image;
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
		this.canvas.width = image.width;
		this.canvas.height = image.height;
		this.ctx.drawImage(image, 0, 0, image.width, image.height);
	}
	
	applyDistortion(distortedMesh: Node[][], distortedPolygons: Set<Polygon>) {
		const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const pixels = imageData.data;
		const originalPixels = originalImageData.data;
		
		for (let y = 0; y < this.canvas.height; y++) {
			for (let x = 0; x < this.canvas.width; x++) {
				const index = (y * this.canvas.width + x) * 4;
				/*
				const relPos = this.getRelativePosition({x, y},);
				const originalPos = interpolateOriginalPosition(relPos);
				
				const origIndex = (Math.floor(originalPos.y) * this.canvas.width + Math.floor(originalPos.x)) * 4;
				
				pixels[index] = originalPixels[origIndex];
				pixels[index + 1] = originalPixels[origIndex + 1];
				pixels[index + 2] = originalPixels[origIndex + 2];
				pixels[index + 3] = originalPixels[origIndex + 3];
				 */
			}
		}
		
		this.ctx.putImageData(imageData, 0, 0);
	}

	private interpolate(pixel: Coordinate, polygon: Polygon): Coordinate {
		const [ul, ur, lr, ll] = this.getPolygonBoundaries(polygon)

		const x = ul.x * (1 - pixel.x) * (1 - pixel.y) +
			ur.x * pixel.x * (1 - pixel.y) +
			lr.x * pixel.x * pixel.y +
			ll.x * (1 - pixel.x) * pixel.y;

		const y = ul.y * (1 - pixel.x) * (1 - pixel.y) +
			ur.y * pixel.x * (1 - pixel.y) +
			lr.y * pixel.x * pixel.y +
			ll.y * (1 - pixel.x) * pixel.y;

		return { x, y };
	}

	private getRelativePosition(pixel: Coordinate, polygon: Polygon): Coordinate {
		const [ul, ur, lr, ll] = this.getPolygonBoundaries(polygon)

		const denom = (ur.x - ul.x) * (ll.y - lr.y) - (ll.x - lr.x) * (ur.y - ul.y);

		const x = ((pixel.x - ul.x) * (ll.y - lr.y) - (pixel.y - ul.y) * (ll.x - lr.x)) / denom;
		const y = ((pixel.x - ul.x) * (ur.y - ul.y) - (pixel.y - ul.y) * (ur.x - ul.x)) / denom;

		return { x, y };
	}

	private getPolygonBoundaries(polygon: Polygon): Coordinate[] {
		const result = []
		result.push(MeshInstance.getNodeFor(polygon.nodes[0]).coordinate)
		result.push(MeshInstance.getNodeFor(polygon.nodes[polygon.edgeLength]).coordinate)
		result.push(MeshInstance.getNodeFor(polygon.nodes[2 * polygon.edgeLength]).coordinate)
		result.push(MeshInstance.getNodeFor(polygon.nodes[3 * polygon.edgeLength]).coordinate)
		return result
	}
}