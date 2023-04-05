import {MeshIndex, ShapeMeshIndex} from "../types/MeshIndex";

export const getUniqueArray = (nodeArray: MeshIndex[]) : MeshIndex[] => {
    return nodeArray.filter((obj, index, self) =>
        index === self.findIndex((t) => (t.row === obj.row && t.col === obj.col))
    );
}