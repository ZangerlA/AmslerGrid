import {Vertex} from "./Vertex";
import {Polygon} from "./Polygon";
import {Point} from "../types/Coordinate";

export class ImageWarper2 {
	private readonly originalMesh: Vertex[][]
	
	constructor(originalMesh: Vertex[][]) {
		this.originalMesh = originalMesh
	}
	
	public warp(distortedMesh: Vertex[][], polygons: Set<Polygon>, canvas: HTMLCanvasElement): void {
		const ctx = canvas.getContext("2d")!
		let activePolygons: Polygon[] = []
		polygons.forEach((polygon) => {
			activePolygons.push(...polygon.gatherActiveChildren([]))
		})
		const movedPolygons = activePolygons.filter((polygon) => polygon.moved())
		const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
		const tempCanvas = document.createElement("canvas")
		tempCanvas.width = canvas.width
		tempCanvas.height = canvas.height
		const tempCtx = tempCanvas.getContext("2d")!
		tempCtx.putImageData(image, 0, 0)
		//this.download(tempCanvas)
		for (let i = 0; i < movedPolygons.length; i++) {
			
			const originalPoints = this.getPolygonBoundaries(this.originalMesh, movedPolygons[i])
			const distortedPoints = this.getPolygonBoundaries(distortedMesh, movedPolygons[i])
			
			const originalWidth = Math.max(originalPoints[0].x, originalPoints[1].x, originalPoints[2].x, originalPoints[3].x) - Math.min(originalPoints[0].x, originalPoints[1].x, originalPoints[2].x, originalPoints[3].x)
			const originalHeight = Math.max(originalPoints[0].y, originalPoints[1].y, originalPoints[2].y, originalPoints[3].y) - Math.min(originalPoints[0].y, originalPoints[1].y, originalPoints[2].y, originalPoints[3].y)
			
			const xm = this.getLinearSolution(0, 0, distortedPoints[0].x, originalWidth, 0, distortedPoints[1].x, 0, originalHeight, distortedPoints[3].x)
			const ym = this.getLinearSolution(0, 0, distortedPoints[0].y, originalWidth, 0, distortedPoints[1].y, 0, originalHeight, distortedPoints[3].y)
			
			ctx.save()
			ctx.setTransform(xm[0], ym[0], xm[1], ym[1], xm[2], ym[2])
			//ctx.setTransform(xm[0], ym[1], xm[1], ym[0], xm[2], ym[2])
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(originalWidth, 0);
			ctx.lineTo(0, originalHeight);
			ctx.lineTo(0, 0);
			ctx.closePath();
			ctx.fill();
			ctx.clip();
			//ctx.setTransform(1, 0, 0, 1, 500, 500);
			//ctx.drawImage(MeshInstance.image,0,0)
			ctx.drawImage(tempCanvas, originalPoints[0].x, originalPoints[0].y, originalWidth, originalHeight, 0, 0, originalWidth, originalHeight)
			ctx.restore();
			ctx.save();
			const xn = this.getLinearSolution(originalWidth, originalHeight, distortedPoints[2].x, originalWidth, 0, distortedPoints[1].x, 0, originalHeight, distortedPoints[3].x)
			const yn = this.getLinearSolution(originalWidth, originalHeight, distortedPoints[2].y, originalWidth, 0, distortedPoints[1].y, 0, originalHeight, distortedPoints[3].y)
			//ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.setTransform(xn[0], yn[0], xn[1], yn[1], xn[2], yn[2])
			ctx.beginPath();
			ctx.moveTo(originalWidth, originalHeight);
			ctx.lineTo(originalWidth, 0);
			ctx.lineTo(0, originalHeight);
			ctx.lineTo(originalWidth, originalHeight);
			ctx.closePath();
			ctx.fill();
			ctx.clip();
			//ctx.setTransform(xn[0], yn[1], xn[1], yn[0], xn[2], yn[2])
			//ctx.drawImage(MeshInstance.image,0,0)
			ctx.drawImage(tempCanvas, originalPoints[0].x, originalPoints[0].y, originalWidth, originalHeight, 0, 0, originalWidth, originalHeight)
			ctx.restore()
		}
	}
	
	download(canvas: HTMLCanvasElement, filename = 'distorted-image.png') {
		const link = document.createElement('a');
		link.href = canvas!.toDataURL('image/png');
		link.download = filename;
		link.click();
	}
	
	private getLinearSolution(rotation1: number,
							  scale1: number,
							  transform1: number,
							  rotation2: number,
							  scale2: number,
							  transform2: number,
							  rotation3: number,
							  scale3: number,
							  transform3: number): number[] {
		const a =
			((transform2 - transform3) * (scale1 - scale2) -
				(transform1 - transform2) * (scale2 - scale3)) /
			((rotation2 - rotation3) * (scale1 - scale2) -
				(rotation1 - rotation2) * (scale2 - scale3));
		const b =
			((transform2 - transform3) * (rotation1 - rotation2) -
				(transform1 - transform2) * (rotation2 - rotation3)) /
			((scale2 - scale3) * (rotation1 - rotation2) -
				(scale1 - scale2) * (rotation2 - rotation3));
		const c = transform1 - rotation1 * a - scale1 * b;
		
		return [a, b, c];
	}
	
	private getBoundingBox(distortedMesh: Vertex[][], polygon: Polygon, canvas: HTMLCanvasElement) {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		
		for (let i = 0; i < polygon.verticesIndices.length; i++) {
			const vertex = distortedMesh[polygon.verticesIndices[i].row][polygon.verticesIndices[i].col];
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
			maxX: Math.min(canvas!.width - 1, Math.ceil(maxX)),
			maxY: Math.min(canvas!.height - 1, Math.ceil(maxY)),
		};
	}
	
	private getPolygonBoundaries(distortedMesh: Vertex[][], polygon: Polygon): Point[] {
		const result = []
		result.push(distortedMesh[polygon.verticesIndices[0].row][polygon.verticesIndices[0].col].coordinate)
		result.push(distortedMesh[polygon.verticesIndices[polygon.edgeLength].row][polygon.verticesIndices[polygon.edgeLength].col].coordinate)
		result.push(distortedMesh[polygon.verticesIndices[2 * polygon.edgeLength].row][polygon.verticesIndices[2 * polygon.edgeLength].col].coordinate)
		result.push(distortedMesh[polygon.verticesIndices[3 * polygon.edgeLength].row][polygon.verticesIndices[3 * polygon.edgeLength].col].coordinate)
		return result
	}
}