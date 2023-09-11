import { Vertex } from "../classes/Vertex"
import { Point } from "../types/Coordinate"

export const calculateCenter = (vertices: Vertex[]): Point => {
	const totalX = vertices.reduce((acc, point) => acc + point.coordinate.x, 0)
	const totalY = vertices.reduce((acc, point) => acc + point.coordinate.y, 0)
	const centerX = totalX / vertices.length
	const centerY = totalY / vertices.length
	return { x: centerX, y: centerY }
}