import {Vertex} from "./Vertex";
import {Polygon} from "./Polygon";
import {Point} from "../types/Coordinate";
import {MeshCanvas} from "./MeshCanvas";
import {Dimension} from "../customHooks/UseWindowDimensions";

export class ImageWarper {
	public canvas?: MeshCanvas
	public image?: HTMLImageElement
	public imagePosition?: Point
	private readonly originalMesh: Vertex[][]
	
	constructor(originalMesh: Vertex[][]) {
		this.originalMesh = originalMesh
	}
	
	warp(distortedMesh: Vertex[][], polygons: Set<Polygon>): void {
		if (!this.canvas) return
		this.resetWarpCanvas()
		const originalImageData = this.canvas.getImageData()
		const originalPixels = originalImageData.data;
		
		let activePolygons: Polygon[] = []
		polygons.forEach((polygon) => {
			activePolygons.push(...polygon.gatherActiveChildren([]))
		})
		const movedPolygons = activePolygons.filter((polygon) => polygon.moved())
		for (let i = 0; i < movedPolygons.length; i++) {
			const polygon = movedPolygons[i];
			const bbox = this.getBoundingBox(this.originalMesh, polygon, this.canvas.dimension);
			this.canvas.clearCanvas({x: bbox.minX, y: bbox.minY}, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY)
		}
		
		const imageData = this.canvas.getImageData()
		const pixels = imageData.data;
		const test = []
		
		for (let i = 0; i < movedPolygons.length; i++) {
			const polygon = movedPolygons[i];
			const bbox = this.getBoundingBox(distortedMesh, polygon, this.canvas.dimension);
			test.push(bbox)
			for (let y = bbox.minY; y <= bbox.maxY; y++) {
				for (let x = bbox.minX; x <= bbox.maxX; x++) {
					if (polygon.hasInside({x, y})) {
						const index = ((y) * this.canvas.dimension.width + (x)) * 4;
						const relPos = this.getRelativePosition(distortedMesh, {x, y}, polygon);
						const originalPos = this.interpolate(this.originalMesh, relPos, polygon);
						const origIndex = ((Math.floor(originalPos.y)) * this.canvas.dimension.width + (Math.floor(originalPos.x))) * 4;
						pixels[index] = originalPixels[origIndex];
						pixels[index + 1] = originalPixels[origIndex + 1];
						pixels[index + 2] = originalPixels[origIndex + 2];
						pixels[index + 3] = originalPixels[origIndex + 3];
					}
				}
			}
		}
		this.canvas.drawImage(imageData, {x: 0, y: 0})
	}
	
	public setImage(image: HTMLImageElement): void {
		this.image = image
		this.resetWarpCanvas()
	}
	
	public getImageAsData(): ImageData | undefined {
		if (!this.canvas || !this.image || !this.imagePosition) return
		return this.canvas.getImageData(this.imagePosition, this.image.width, this.image.height)
	}
	
	private getBoundingBox(mesh: Vertex[][], polygon: Polygon, dimension: Dimension) {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		
		for (let i = 0; i < polygon.verticesIndices.length; i++) {
			const vertex = mesh[polygon.verticesIndices[i].row][polygon.verticesIndices[i].col];
			if (vertex.isActive) {
				minX = Math.min(minX, vertex.coordinate.x);
				minY = Math.min(minY, vertex.coordinate.y);
				maxX = Math.max(maxX, vertex.coordinate.x);
				maxY = Math.max(maxY, vertex.coordinate.y);
			}
		}
		
		return {
			minX: Math.max(0, Math.floor(minX)),
			minY: Math.max(0, Math.floor(minY)),
			maxX: Math.min(dimension.width - 1, Math.ceil(maxX)),
			maxY: Math.min(dimension.height - 1, Math.ceil(maxY)),
		};
	}
	
	private interpolate(originalMesh: Vertex[][], pixel: Point, polygon: Polygon): Point {
		const [ul, ur, lr, ll] = this.getPolygonBoundaries(originalMesh, polygon)
		
		const x = ul.x * (1 - pixel.x) * (1 - pixel.y) +
			ur.x * pixel.x * (1 - pixel.y) +
			lr.x * pixel.x * pixel.y +
			ll.x * (1 - pixel.x) * pixel.y;
		
		const y = ul.y * (1 - pixel.x) * (1 - pixel.y) +
			ur.y * pixel.x * (1 - pixel.y) +
			lr.y * pixel.x * pixel.y +
			ll.y * (1 - pixel.x) * pixel.y;
		
		return {x, y};
	}
	
	private getRelativePosition(distortedMesh: Vertex[][], pixel: Point, polygon: Polygon): Point {
		const [P1, P2, P3, P4] = this.getPolygonBoundaries(distortedMesh, polygon)
		const P5 = pixel;
		
		const a = P1.x * P3.y - P1.x * P4.y - P2.x * P3.y + P2.x * P4.y - P3.x * P1.y + P3.x * P2.y + P4.x * P1.y - P4.x * P2.y;
		const b = -P1.x * P3.y + 2 * P1.x * P4.y - P1.x * P5.y - P2.x * P4.y + P2.x * P5.y + P3.x * P1.y - P3.x * P5.y - 2 * P4.x * P1.y + P4.x * P2.y + P4.x * P5.y + P5.x * P1.y - P5.x * P2.y + P5.x * P3.y - P5.x * P4.y;
		const c = -P1.x * P4.y + P1.x * P5.y + P4.x * P1.y - P4.x * P5.y - P5.x * P1.y + P5.x * P4.y;
		
		const solutions = this.solveQuadratic(a, b, c);
		
		// Select the best solution and calculate the corresponding v value
		let u = 0, v = 0
		for (const sol of solutions) {
			const u_candidate = sol;
			const Pv0 = {x: P1.x + u_candidate * (P2.x - P1.x), y: P1.y + u_candidate * (P2.y - P1.y)};
			const Pv1 = {x: P4.x + u_candidate * (P3.x - P4.x), y: P4.y + u_candidate * (P3.y - P4.y)};
			
			const diff_x = Pv1.x - Pv0.x;
			const diff_y = Pv1.y - Pv0.y;
			
			if (Math.abs(diff_x) > Math.abs(diff_y)) {
				v = (P5.x - Pv0.x) / diff_x;
			} else {
				v = (P5.y - Pv0.y) / diff_y;
			}
			
			// Check if the solution is within the [0, 1] range for both u and v
			if (u_candidate >= 0 && u_candidate <= 1 && v >= 0 && v <= 1) {
				u = u_candidate;
				break;
			}
		}
		
		return {x: u, y: v};
	}
	
	private solveQuadratic(a: number, b: number, c: number): number[] {
		if (Math.abs(a) < Number.EPSILON) { // Linear equation
			if (Math.abs(b) < Number.EPSILON) {
				return []; // No solutions, as both a and b are close to zero
			}
			return [-c / b]; // One solution
		}
		
		const discriminant = b * b - 4 * a * c;
		
		if (discriminant < 0) {
			return []; // No real solutions
		} else if (Math.abs(discriminant) < Number.EPSILON) {
			return [-b / (2 * a)]; // One real solution (discriminant is close to zero)
		} else {
			const sqrtDiscriminant = Math.sqrt(discriminant);
			return [
				(-b + sqrtDiscriminant) / (2 * a), // First real solution
				(-b - sqrtDiscriminant) / (2 * a)  // Second real solution
			];
		}
	}
	
	private getPolygonBoundaries(mesh: Vertex[][], polygon: Polygon): Point[] {
		const result = []
		result.push(mesh[polygon.verticesIndices[0].row][polygon.verticesIndices[0].col].coordinate)
		result.push(mesh[polygon.verticesIndices[polygon.edgeLength].row][polygon.verticesIndices[polygon.edgeLength].col].coordinate)
		result.push(mesh[polygon.verticesIndices[2 * polygon.edgeLength].row][polygon.verticesIndices[2 * polygon.edgeLength].col].coordinate)
		result.push(mesh[polygon.verticesIndices[3 * polygon.edgeLength].row][polygon.verticesIndices[3 * polygon.edgeLength].col].coordinate)
		return result
	}
	
	private resetWarpCanvas(): void {
		if (!this.canvas || !this.image || !this.imagePosition) return
		this.canvas.clearCanvas()
		this.canvas.drawImage(this.image, this.imagePosition)
	}
}