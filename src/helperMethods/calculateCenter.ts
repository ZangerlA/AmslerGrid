import {MeshIndex} from "../types/MeshIndex";
import {Coordinate} from "../types/Coordinate";
import {MeshInstance} from "../classes/Mesh";

export const calculateCenter = (points: MeshIndex[]): Coordinate => {
	const totalX = points.reduce((acc, point) => acc + MeshInstance.nodes[point.row][point.col].coordinate.x, 0)
	const totalY = points.reduce((acc, point) => acc + MeshInstance.nodes[point.row][point.col].coordinate.y, 0)
	const centerX = totalX / points.length
	const centerY = totalY / points.length
	return {x: centerX, y: centerY}
}