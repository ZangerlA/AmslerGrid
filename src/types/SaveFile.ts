import {MeshIndex} from "./MeshIndex";
import {Vertex} from "../classes/Vertex";
import {Edge} from "./Edge";

export type SaveFile = {
    version: string,
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