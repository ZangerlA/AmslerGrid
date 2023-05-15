import {Vertex} from "./Vertex";
import {Polygon} from "./Polygon";
import {Coordinate} from "../types/Coordinate";
import {MeshInstance} from "./Mesh";

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

		for (let i = 0; i < movedPolygons.length; i++) {
			const bbox = this.getBoundingBox(distortedMesh, movedPolygons[i], canvas);
			const originalPoints = this.getPolygonBoundaries(this.originalMesh, movedPolygons[i])
			const distortedPoints = this.getPolygonBoundaries(distortedMesh, movedPolygons[i])

			const originalWidth = Math.max(originalPoints[0].x, originalPoints[1].x, originalPoints[2].x) - Math.min(originalPoints[0].x, originalPoints[1].x, originalPoints[2].x)
			const originalHeight = Math.max(originalPoints[0].y, originalPoints[1].y, originalPoints[2].y) - Math.min(originalPoints[0].y, originalPoints[1].y, originalPoints[2].y)

			const xm = this.getLinearSolution(0, 0, distortedPoints[0].x, originalWidth, 0, distortedPoints[1].x, 0, originalWidth, distortedPoints[2].x)
			const ym = this.getLinearSolution(0, 0, distortedPoints[0].y, originalHeight, 0, distortedPoints[1].y, 0, originalHeight, distortedPoints[2].y)

			ctx.restore()
			ctx.save()
			ctx.setTransform(xm[0], ym[0], xm[1], ym[1], xm[2], ym[2])

			ctx.drawImage(MeshInstance.image, originalPoints[0].x, originalPoints[0].y, originalWidth, originalHeight,0,0,originalWidth, originalHeight)
			ctx.restore();
			ctx.save();
			const xn = this.getLinearSolution(originalWidth, originalHeight, distortedPoints[3].x, originalWidth, 0, distortedPoints[1].x,0, originalHeight, distortedPoints[2].x)
			const yn = this.getLinearSolution(originalWidth, originalHeight, distortedPoints[3].y, originalWidth, 0, distortedPoints[1].y,0, originalHeight, distortedPoints[2].y)

			ctx.setTransform(xn[0], yn[0], xn[1], yn[1], xn[2], yn[2])
			ctx.drawImage(MeshInstance.image, originalPoints[0].x, originalPoints[0].y, originalWidth, originalHeight,0,0,originalWidth, originalHeight)
		}
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

		for (let i = 0; i < polygon.vertices.length; i++) {
			const vertex = distortedMesh[polygon.vertices[i].row][polygon.vertices[i].col];
			if(vertex.isActive) {
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

	private getPolygonBoundaries(distortedMesh: Vertex[][], polygon: Polygon): Coordinate[] {
		const result = []
		result.push(distortedMesh[polygon.vertices[0].row][polygon.vertices[0].col].coordinate)
		result.push(distortedMesh[polygon.vertices[polygon.edgeLength].row][polygon.vertices[polygon.edgeLength].col].coordinate)
		result.push(distortedMesh[polygon.vertices[2 * polygon.edgeLength].row][polygon.vertices[2 * polygon.edgeLength].col].coordinate)
		result.push(distortedMesh[polygon.vertices[3 * polygon.edgeLength].row][polygon.vertices[3 * polygon.edgeLength].col].coordinate)
		return result
	}

	download(canvas: HTMLCanvasElement, filename = 'distorted-image.png') {
		const link = document.createElement('a');
		link.href = canvas!.toDataURL('image/png');
		link.download = filename;
		link.click();
	}
}