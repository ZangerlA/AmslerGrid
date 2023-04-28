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
		MeshInstance.image.addEventListener('load', (e) => {
			this.ctx.drawImage(image, 0, 0, image.width, image.height);
		});
	}
	
	applyDistortion(distortedMesh: Node[][], distortedPolygons: Set<Polygon>) {
		const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const pixels = imageData.data;
		const originalPixels = originalImageData.data;
		this.ctx.putImageData(originalImageData, 0, 0)
		
		const distortedPolygonsArray = Array.from(distortedPolygons);
		
		//TODO this for loop should only go over the moved polygons
		for (let y = 0; y < this.canvas.height; y++) {
			for (let x = 0; x < this.canvas.width; x++) {
				for (let i = 0; i < distortedPolygonsArray.length; i++) {
					const polygon = distortedPolygonsArray[i];
					const container = polygon.getContainer({x, y});
					if (container !== undefined && container.moved()) {
						const index = (y * this.canvas.width + x) * 4;
						const relPos = this.getRelativePosition(distortedMesh, {x, y}, container);
						const originalPos = this.interpolate(this.originalMesh, relPos, container);
						const origIndex = (Math.floor(originalPos.y) * this.canvas.width + Math.floor(originalPos.x)) * 4;
						
						pixels[index] = originalPixels[origIndex];
						pixels[index + 1] = originalPixels[origIndex + 1];
						pixels[index + 2] = originalPixels[origIndex + 2];
						pixels[index + 3] = originalPixels[origIndex + 3];
						
						break;
					}
				}
			}
		}
		
		this.ctx.putImageData(imageData, 0, 0);
		
		
	}

	private interpolate(originalMesh: Node[][],pixel: Coordinate, polygon: Polygon): Coordinate {
		const [ul, ur, lr, ll] = this.getOriginalBoundaries(originalMesh, polygon)

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

	private getRelativePosition(distortedMesh: Node[][], pixel: Coordinate, polygon: Polygon): Coordinate {
		const [P1, P2, P3, P4] = this.getDistortedBoundaries(distortedMesh, polygon)
		const P5 = pixel;
		
		const a = P1.x * P3.y - P1.x * P4.y - P2.x * P3.y + P2.x * P4.y - P3.x * P1.y + P3.x * P2.y + P4.x * P1.y - P4.x * P2.y;
		const b = -P1.x * P3.y + 2 * P1.x * P4.y - P1.x * P5.y - P2.x * P4.y + P2.x * P5.y + P3.x * P1.y - P3.x * P5.y - 2 * P4.x * P1.y + P4.x * P2.y + P4.x * P5.y + P5.x * P1.y - P5.x * P2.y + P5.x * P3.y - P5.x * P4.y;
		const c = -P1.x * P4.y + P1.x * P5.y + P4.x * P1.y - P4.x * P5.y - P5.x * P1.y + P5.x * P4.y;
		
		const solutions = this.solveQuadratic(a, b, c);
		
		// Select the best solution and calculate the corresponding v value
		let u = 0, v = 0
		for (const sol of solutions) {
			const u_candidate = sol;
			const Pv0 = { x: P1.x + u_candidate * (P2.x - P1.x), y: P1.y + u_candidate * (P2.y - P1.y) };
			const Pv1 = { x: P4.x + u_candidate * (P3.x - P4.x), y: P4.y + u_candidate * (P3.y - P4.y) };
			
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
		
		return { x: u, y: v };
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

	private getDistortedBoundaries(distortedMesh: Node[][],polygon: Polygon): Coordinate[] {
		const result = []
		result.push(distortedMesh[polygon.nodes[0].row][polygon.nodes[0].col].coordinate)
		result.push(distortedMesh[polygon.nodes[polygon.edgeLength].row][polygon.nodes[polygon.edgeLength].col].coordinate)
		result.push(distortedMesh[polygon.nodes[2 * polygon.edgeLength].row][polygon.nodes[2 * polygon.edgeLength].col].coordinate)
		result.push(distortedMesh[polygon.nodes[3 * polygon.edgeLength].row][polygon.nodes[3 * polygon.edgeLength].col].coordinate)
		return result
	}
	
	private getOriginalBoundaries(originalMesh: Node[][], polygon: Polygon): Coordinate[] {
		const result = []
		result.push(originalMesh[polygon.nodes[0].row][polygon.nodes[0].col].coordinate)
		result.push(originalMesh[polygon.nodes[polygon.edgeLength].row][polygon.nodes[polygon.edgeLength].col].coordinate)
		result.push(originalMesh[polygon.nodes[2 * polygon.edgeLength].row][polygon.nodes[2 * polygon.edgeLength].col].coordinate)
		result.push(originalMesh[polygon.nodes[3 * polygon.edgeLength].row][polygon.nodes[3 * polygon.edgeLength].col].coordinate)
		return result
	}
	
	download(filename = 'distorted-image.png') {
		console.log("download")
		const link = document.createElement('a');
		link.href = this.canvas.toDataURL('image/png');
		link.download = filename;
		link.click();
	}
}