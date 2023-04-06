import {Node} from "./Node";
import {MeshIndex, ShapeMeshIndex} from "../types/MeshIndex";
import {Vector} from "../types/Vector";
import {Mesh} from "./Mesh";
import {Coordinate} from "../types/Coordinate";

export class Shape {
    meshIndices: ShapeMeshIndex
    shapes: Shape[] = []
    color: string
    shouldDraw: boolean = false
    childrenAreActive: boolean = false

    constructor(meshIndices: ShapeMeshIndex, shouldDraw: boolean, color: string = "white", shapes?: Shape[], childrenAreActive?: boolean) {
        this.meshIndices = meshIndices
        this.shouldDraw = shouldDraw
        this.color = color
    }

    gatherNodes(nodeIndices: MeshIndex[] = []): MeshIndex[] {
        if (this.hasChildren()) {
            this.shapes.forEach((childShape) => {
                childShape.gatherNodes(nodeIndices);
            });
        } else {
            nodeIndices.push(
                this.meshIndices.ul,
                this.meshIndices.ur,
                this.meshIndices.ll,
                this.meshIndices.lr
            );
        }
        return nodeIndices;
    }

    contains(mouseClick: Coordinate): boolean {
        return this.inside(mouseClick.x, mouseClick.y, this.getOwnNodes());
    }

    getContainer(mouseClick: Coordinate): Shape | undefined {
        console.log(this);
        if (this.childrenAreActive && this.contains(mouseClick)) {
            for (const childShape of this.shapes) {
                let container = childShape.getContainer(mouseClick);
                if (container !== undefined) {
                    return container;
                }
            }
        } else if (this.contains(mouseClick)) {
            return this;
        }
        return undefined;
    }

    split(): void {
        console.log(this.meshIndices)
        if (!this.hasChildren()) {
            return
        }
        else {
            Mesh.selectedShapes = Mesh.selectedShapes.filter((s) => s != this)
            this.shapes.forEach((childShape) => {
                childShape.shouldDraw = true
                Mesh.nodes[childShape.meshIndices.ul.row][childShape.meshIndices.ul.col].isActive = true
                Mesh.nodes[childShape.meshIndices.ur.row][childShape.meshIndices.ur.col].isActive = true
                Mesh.nodes[childShape.meshIndices.ll.row][childShape.meshIndices.ll.col].isActive = true
                Mesh.nodes[childShape.meshIndices.lr.row][childShape.meshIndices.lr.col].isActive = true
            })
        }
        this.childrenAreActive = true
        console.log(this.shapes)
        /*
        console.log(this.meshIndices)
        const distance: number = (this.meshIndices.ul.col - this.meshIndices.ll.col) / 2
        console.log(distance)
        const newMeshIndices: MeshIndex[][] = []
        Array.of(null)
        for (let i = 0; i < 3; i++) {
            newMeshIndices[i] = []
        }
        newMeshIndices[1][0] = this.meshIndices.ur
        newMeshIndices[1][1] = this.meshIndices.ur
        newMeshIndices[1][2] = this.meshIndices.ur
        newMeshIndices[2][1] = this.meshIndices.ll
        newMeshIndices[0][1] = this.meshIndices.ul

        newMeshIndices[0][0] = this.meshIndices.ul
        newMeshIndices[0][1].row = this.meshIndices.ul.row
        newMeshIndices[0][1].col = this.meshIndices.ul.col
        newMeshIndices[0][2] = this.meshIndices.ur

        newMeshIndices[1][0].row = this.meshIndices.ur.row + distance
        newMeshIndices[1][0].col = this.meshIndices.ur.col
        newMeshIndices[1][1].row = newMeshIndices[0][1].row + distance
        newMeshIndices[1][1].col = newMeshIndices[0][1].col
        newMeshIndices[1][2].row = this.meshIndices.ul.row + distance
        newMeshIndices[1][2].col = this.meshIndices.ul.col

        newMeshIndices[2][0] = this.meshIndices.ll
        newMeshIndices[2][1].row = newMeshIndices[1][1].row + distance
        newMeshIndices[2][1].col = newMeshIndices[1][1].col
        newMeshIndices[2][2] = this.meshIndices.lr
        console.log(newMeshIndices)

        for (let i = 0; i < 4; i++) {

            // getIndices -> 9 indices -> call  -> create 4shapes
            const shapeMeshIndices = Mesh.createShapeMeshIndices(1,1,1)

            const shape = new Shape(shapeMeshIndices, true)
            this.shapes.push(shape)
        }

         */
    }



    getOwnNodes(): Node[] {
        let nodes: Node[] = []
        nodes.push(Mesh.nodes[this.meshIndices.ur.row][this.meshIndices.ur.col])
        nodes.push(Mesh.nodes[this.meshIndices.ul.row][this.meshIndices.ul.col])
        nodes.push(Mesh.nodes[this.meshIndices.ll.row][this.meshIndices.ll.col])
        nodes.push(Mesh.nodes[this.meshIndices.lr.row][this.meshIndices.lr.col])
        return nodes
    }

    private inside(x: number, y: number, nodes: Node[]) {
        // ray-casting algorithm based on
        // https://en.wikipedia.org/wiki/Point_in_polygon
        // found on
        // https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
        let result = false
        for (let k = 0, l = nodes.length - 1; k < nodes.length; l = k++) {
            const xi = nodes[k].coordinate.x, yi = nodes[k].coordinate.y
            const xj = nodes[l].coordinate.x, yj = nodes[l].coordinate.y
            const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            if (intersect) result = !result
        }
        return result
    }

    private hasChildren(): boolean {
        return !(this.shapes.length == 0)
    }
}