import {Node} from "./Node";
import {MeshIndex, ShapeMeshIndex} from "../types/MeshIndex";
import {Vector} from "../types/Vector";
import {Mesh, MeshInstance} from "./Mesh";
import {Coordinate} from "../types/Coordinate";
import {getUniqueArray} from "../helperMethods/Array";

export class Polygon {
    cornerIndices: ShapeMeshIndex
    meshIndices: MeshIndex[] = []
    shapes: Polygon[] = []
    color: string
    shouldDraw: boolean = false

    constructor(cornerIndices: ShapeMeshIndex, shouldDraw: boolean, color: string = "white", shapes?: Polygon[]) {
        this.cornerIndices = cornerIndices
        this.shouldDraw = shouldDraw
        this.color = color
        this.test()
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.hasChildren()){
            this.shapes.forEach((childShape)=>{
                childShape.draw(ctx)
            })
        }else{
            const shapeNodes : Node[] = this.getOwnNodes()
            ctx.beginPath()
            ctx.moveTo(shapeNodes[0].coordinate.x, shapeNodes[0].coordinate.y)
            shapeNodes.forEach((node) => {
                if (node.isActive) {
                    ctx.lineTo(node.coordinate.x, node.coordinate.y)
                    console.log("line to", node.coordinate.x, node.coordinate.y)
                }

            })
            ctx.lineTo(shapeNodes[0].coordinate.x,shapeNodes[0].coordinate.y)
            console.log("line to", shapeNodes[0].coordinate.x, shapeNodes[0].coordinate.y)
            //ctx.closePath()
            ctx.fillStyle = this.color
            ctx.fill()
        }
    }

    private test() {
        for (let i = this.cornerIndices.ul.col; i <= this.cornerIndices.ur.col; i++) {
            this.meshIndices.push({row: this.cornerIndices.ul.row, col: i})
        }
        for (let i = this.cornerIndices.ur.row + 1; i <= this.cornerIndices.lr.row; i++) {
            this.meshIndices.push({row: i, col: this.cornerIndices.ur.col})
        }
        for (let i = this.cornerIndices.lr.col - 1; i >= this.cornerIndices.ll.col; i--) {
            this.meshIndices.push({row: this.cornerIndices.lr.row, col: i})
        }
        for (let i = this.cornerIndices.ll.row - 1; i >= this.cornerIndices.ul.row; i--) {
            this.meshIndices.push({row: i, col: this.cornerIndices.ll.col})
        }
        console.log()
    }

    gatherNodes(nodeIndices: MeshIndex[] = []): MeshIndex[] {
        if (this.hasChildren()) {
            this.shapes.forEach((childShape) => {
                childShape.gatherNodes(nodeIndices);
            });
        } else {
            nodeIndices.push(...this.meshIndices);
        }
        return nodeIndices;
    }

    hasInside(mouseClick: Coordinate): boolean {
        let result: boolean = false
        this.shapes.forEach((child) => {
            if (child.shouldDraw) {
                result = child.hasInside(mouseClick)
            }
        })
        if (!result) {
            result = this.inside(mouseClick.x, mouseClick.y, this.getOwnNodes())
        }
        return result
    }

    getContainer(mouseClick: Coordinate): Polygon | undefined {
        console.log(this);
        if (this.hasChildren() && this.hasInside(mouseClick)) {
            for (const childShape of this.shapes) {
                let container = childShape.getContainer(mouseClick);
                if (container !== undefined) {
                    return container;
                }
            }
        } else if (this.hasInside(mouseClick)) {
            return this;
        }
        return undefined;
    }

    split(): void {

        // Calculate row and col differences
        const rowDiff = this.cornerIndices.ll.row - this.cornerIndices.ul.row;
        const colDiff = this.cornerIndices.ur.col - this.cornerIndices.ul.col;

        // Calculate midpoints indices
        const midTop = { row: this.cornerIndices.ul.row, col: this.cornerIndices.ul.col + colDiff / 2 };
        const midRight = { row: this.cornerIndices.ur.row + rowDiff / 2, col: this.cornerIndices.ur.col };
        const midBottom = { row: this.cornerIndices.ll.row, col: this.cornerIndices.ll.col + colDiff / 2 };
        const midLeft = { row: this.cornerIndices.ul.row + rowDiff / 2, col: this.cornerIndices.ul.col };
        const center = { row: midLeft.row, col: midTop.col };

        // Get all the midpoint nodes and set isActive to true
        const midTopNode = MeshInstance.nodes[midTop.row][midTop.col];
        const midRightNode = MeshInstance.nodes[midRight.row][midRight.col];
        const midBottomNode = MeshInstance.nodes[midBottom.row][midBottom.col];
        const midLeftNode = MeshInstance.nodes[midLeft.row][midLeft.col];
        const centerNode = MeshInstance.nodes[center.row][center.col];

        if (!midTopNode.isActive) {
            midTopNode.isActive = true;
            midTopNode.coordinate = this.calculateMidpointCoordinate(
                MeshInstance.nodes[this.cornerIndices.ul.row][this.cornerIndices.ul.col].coordinate,
                MeshInstance.nodes[this.cornerIndices.ur.row][this.cornerIndices.ur.col].coordinate
            );
        }
        // Update coordinates of the midpoint nodes
        if (!midRightNode.isActive) {
            midRightNode.isActive = true;
            midRightNode.coordinate = this.calculateMidpointCoordinate(
                MeshInstance.nodes[this.cornerIndices.ur.row][this.cornerIndices.ur.col].coordinate,
                MeshInstance.nodes[this.cornerIndices.lr.row][this.cornerIndices.lr.col].coordinate
            );
        }
        if (!midBottomNode.isActive) {
            midBottomNode.isActive = true;
            midBottomNode.coordinate = this.calculateMidpointCoordinate(
                MeshInstance.nodes[this.cornerIndices.ll.row][this.cornerIndices.ll.col].coordinate,
                MeshInstance.nodes[this.cornerIndices.lr.row][this.cornerIndices.lr.col].coordinate
            );
        }
        if (!midLeftNode.isActive) {
            midLeftNode.isActive = true;
            midLeftNode.coordinate = this.calculateMidpointCoordinate(
                MeshInstance.nodes[this.cornerIndices.ul.row][this.cornerIndices.ul.col].coordinate,
                MeshInstance.nodes[this.cornerIndices.ll.row][this.cornerIndices.ll.col].coordinate
            );
        }
        if (!centerNode.isActive){
            centerNode.isActive = true;
            centerNode.coordinate = this.calculateMidpointCoordinate(
                midTopNode.coordinate,
                midBottomNode.coordinate
            );
        }

        const shape1Indices: ShapeMeshIndex = {
            ul: this.cornerIndices.ul,
            ur: midTop,
            ll: midLeft,
            lr: center,
        };

        const shape2Indices: ShapeMeshIndex = {
            ul: midTop,
            ur: this.cornerIndices.ur,
            ll: center,
            lr: midRight,
        };

        const shape3Indices: ShapeMeshIndex = {
            ul: midLeft,
            ur: center,
            ll: this.cornerIndices.ll,
            lr: midBottom,
        };

        const shape4Indices: ShapeMeshIndex = {
            ul: center,
            ur: midRight,
            ll: midBottom,
            lr: this.cornerIndices.lr,
        };

        this.shapes.push(
            new Polygon(shape1Indices, true, "rgba(75,139,59,0.5)"),
            new Polygon(shape2Indices, true),
            new Polygon(shape3Indices, true),
            new Polygon(shape4Indices, true, "rgba(75,139,59,0.5)")
        );

        console.log(this.getOwnNodes())
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
        this.meshIndices.forEach((index) => {
            nodes.push(MeshInstance.nodes[index.row][index.col])
        })
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

    public hasChildren(): boolean {
        return !(this.shapes.length === 0)
    }
}