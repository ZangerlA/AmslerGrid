import {Polygon} from "./Polygon";
import {Node} from "./Node";
import {Coordinate} from "../types/Coordinate";
import {MeshInstance} from "./Mesh";

export class ImageWarper {
	private originalMesh: Node[][]
	private originalPolygon: Set<Polygon>

	constructor(originalMesh: Node[][], originalPolygons: Set<Polygon>) {
		this.originalMesh = originalMesh
		this.originalPolygon = originalPolygons
	}

	warp(distortedMesh: Node[][], distortedPolygons: Set<Polygon>): void {
		// warp warp warp
		// brum brum
		// zauber zauber
		// return tadaaaaaaaa
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