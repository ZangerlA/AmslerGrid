import { Vertex } from "../classes/Vertex"
import { Point } from "../types/Coordinate"

export const inside = (point: Point, vertices: Vertex[]): boolean => {
	// ray-casting algorithm based on
	// https://en.wikipedia.org/wiki/Point_in_polygon
	// found on
	// https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
	let result = 0
	const x = point.x
	const y = point.y
	for ( let k = 0, l = vertices.length - 1; k < vertices.length; l = k++ ) {
		const xi = vertices[k].coordinate.x, yi = vertices[k].coordinate.y
		const xj = vertices[l].coordinate.x, yj = vertices[l].coordinate.y
		const intersect: any = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
		result = intersect ^ result
	}
	return result === 1
}