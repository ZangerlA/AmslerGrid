import {MeshIndex} from "../types/MeshIndex";

export const getUniqueArray = <T>(array: T[]): T[] => {
    return array.filter((obj, index, self) =>
        index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(obj))
    );
};
