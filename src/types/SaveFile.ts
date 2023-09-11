import { Vertex } from "../classes/Vertex"
import { Dimension } from "../customHooks/UseWindowDimensions"
import { Edge } from "./Edge"
import { MeshIndex } from "./MeshIndex"

export type SaveFile = {
	version: string,
	date: number,
	meshWidth: number,
	meshHeight: number,
	canvasSize: Dimension,
	leftEyeMesh: MeshData,
	rightEyeMesh: MeshData,
}

export type MeshData = {
	vertices: Vertex[][];
	edges: Edge[]
	polygons: PolygonData[];
	shouldDrawImage: boolean;
}

export type PolygonData = {
	verticesIndices: MeshIndex[];
	edgeLength: number;
	color: string;
	children: PolygonData[];
}