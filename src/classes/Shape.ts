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

    draw(ctx: CanvasRenderingContext2D, color: string = this.color) {
        if (this.hasChildren()) {
            if (this.childrenAreActive) {
                this.shapes.forEach((childShape) => {
                    childShape.draw(ctx)
                })
            }
            else {
                this.shapes.forEach((childShape) => {
                    childShape.draw(ctx, this.color)
                })
            }
        }
        const shapeNodes = this.getOwnNodes()
        ctx.beginPath()
        ctx.moveTo(shapeNodes[0].coordinate.x,shapeNodes[0].coordinate.y)
        shapeNodes.forEach((node) => {
            ctx.lineTo(node.coordinate.x, node.coordinate.y)
        })
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
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
        if (!this.hasChildren()) {
            return
        }
        this.childrenAreActive = true
        // Calculate row and col differences
        const rowDiff = this.meshIndices.ll.row - this.meshIndices.ul.row;
        const colDiff = this.meshIndices.ur.col - this.meshIndices.ul.col;

        // Calculate midpoints indices
        const midTop = { row: this.meshIndices.ul.row, col: this.meshIndices.ul.col + colDiff / 2 };
        const midRight = { row: this.meshIndices.ur.row + rowDiff / 2, col: this.meshIndices.ur.col };
        const midBottom = { row: this.meshIndices.ll.row, col: this.meshIndices.ll.col + colDiff / 2 };
        const midLeft = { row: this.meshIndices.ul.row + rowDiff / 2, col: this.meshIndices.ul.col };
        const center = { row: midLeft.row, col: midTop.col };

        // Get all the midpoint nodes and set isActive to true
        const midTopNode = Mesh.nodes[midTop.row][midTop.col];
        const midRightNode = Mesh.nodes[midRight.row][midRight.col];
        const midBottomNode = Mesh.nodes[midBottom.row][midBottom.col];
        const midLeftNode = Mesh.nodes[midLeft.row][midLeft.col];
        const centerNode = Mesh.nodes[center.row][center.col];

        midTopNode.isActive = true;
        midRightNode.isActive = true;
        midBottomNode.isActive = true;
        midLeftNode.isActive = true;
        centerNode.isActive = true;

        // Update coordinates of the midpoint nodes
        midTopNode.coordinate = this.calculateMidpointCoordinate(
            Mesh.nodes[this.meshIndices.ul.row][this.meshIndices.ul.col].coordinate,
            Mesh.nodes[this.meshIndices.ur.row][this.meshIndices.ur.col].coordinate
        );
        midRightNode.coordinate = this.calculateMidpointCoordinate(
            Mesh.nodes[this.meshIndices.ur.row][this.meshIndices.ur.col].coordinate,
            Mesh.nodes[this.meshIndices.lr.row][this.meshIndices.lr.col].coordinate
        );
        midBottomNode.coordinate = this.calculateMidpointCoordinate(
            Mesh.nodes[this.meshIndices.ll.row][this.meshIndices.ll.col].coordinate,
            Mesh.nodes[this.meshIndices.lr.row][this.meshIndices.lr.col].coordinate
        );
        midLeftNode.coordinate = this.calculateMidpointCoordinate(
            Mesh.nodes[this.meshIndices.ul.row][this.meshIndices.ul.col].coordinate,
            Mesh.nodes[this.meshIndices.ll.row][this.meshIndices.ll.col].coordinate
        );
        centerNode.coordinate = this.calculateMidpointCoordinate(
            midTopNode.coordinate,
            midBottomNode.coordinate
        );

        const shape1Indices: ShapeMeshIndex = {
            ul: this.meshIndices.ul,
            ur: midTop,
            ll: midLeft,
            lr: center,
        };

        const shape2Indices: ShapeMeshIndex = {
            ul: midTop,
            ur: this.meshIndices.ur,
            ll: center,
            lr: midRight,
        };

        const shape3Indices: ShapeMeshIndex = {
            ul: midLeft,
            ur: center,
            ll: this.meshIndices.ll,
            lr: midBottom,
        };

        const shape4Indices: ShapeMeshIndex = {
            ul: center,
            ur: midRight,
            ll: midBottom,
            lr: this.meshIndices.lr,
        };

        this.shapes.push(
            new Shape(shape1Indices, true, "rgba(75,139,59,0.5)"),
            new Shape(shape2Indices, true),
            new Shape(shape3Indices, true),
            new Shape(shape4Indices, true, "rgba(75,139,59,0.5)")
        );
        //update neighbor shapes
        /*this.shapes.forEach((shape) => {
            shape.gatherNodes().forEach((node) => {
                Mesh.shapes.forEach((compareShape) => {
                    compareShape.gatherNodes().forEach((compareNode) => {
                        if ((node.col == compareNode.col - 4 && node.row == compareNode.row)||(node.col == compareNode.col && node.row == compareNode.row - 4)){
                        }
                    })
                })
            })
        })*/

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

    private calculateMidpointCoordinate(coord1: Coordinate, coord2: Coordinate): Coordinate {
        return {
            x: (coord1.x + coord2.x) / 2,
            y: (coord1.y + coord2.y) / 2,
        };
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