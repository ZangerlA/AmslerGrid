import {Node} from "./Node";
import {MeshIndex} from "../types/MeshIndex";
import {Vector} from "../types/Vector";
import {Mesh, MeshInstance} from "./Mesh";
import {Coordinate} from "../types/Coordinate";
import {getUniqueArray} from "../helperMethods/Array";

type ShapeMeshIndex = {
    ul: MeshIndex,
    ur: MeshIndex,
    ll: MeshIndex,
    lr: MeshIndex,
}
export class Polygon {
    boundaryIndices: ShapeMeshIndex
    nodes: MeshIndex[] = []
    children: Polygon[] = []
    color: string
    shouldDraw: boolean = false
    
    constructor(meshIndex: MeshIndex, size: number, shouldDraw: boolean, color: string) {
        this.boundaryIndices = this.setPolygonBoundaries(meshIndex.row, meshIndex.col, size)
        console.log(this.boundaryIndices)
        this.shouldDraw = shouldDraw
        this.color = color
        this.setPolygonNodes()
    }
    
    private setPolygonBoundaries(i: number, j: number, offset: number): ShapeMeshIndex {
        return  {
            ul: {row: i, col: j},
            ur: {row: i, col: j + offset},
            ll: {row: i + offset, col:j},
            lr: {row: i + offset, col: j + offset}
        }
    }

    private setPolygonNodes() {
        for (let i = this.boundaryIndices.ul.col; i <= this.boundaryIndices.ur.col; i++) {
            this.nodes.push({row: this.boundaryIndices.ul.row, col: i})
        }
        for (let i = this.boundaryIndices.ur.row + 1; i <= this.boundaryIndices.lr.row; i++) {
            this.nodes.push({row: i, col: this.boundaryIndices.ur.col})
        }
        for (let i = this.boundaryIndices.lr.col - 1; i >= this.boundaryIndices.ll.col; i--) {
            this.nodes.push({row: this.boundaryIndices.lr.row, col: i})
        }
        for (let i = this.boundaryIndices.ll.row - 1; i >= this.boundaryIndices.ul.row; i--) {
            this.nodes.push({row: i, col: this.boundaryIndices.ll.col})
        }
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.hasChildren()){
            this.children.forEach((childShape)=>{
                childShape.draw(ctx)
            })
        }else{
            const shapeNodes : Node[] = this.getOwnNodes()
            ctx.beginPath()
            ctx.moveTo(shapeNodes[0].coordinate.x, shapeNodes[0].coordinate.y)
            shapeNodes.forEach((node) => {
                if (node.isActive) {
                    ctx.lineTo(node.coordinate.x, node.coordinate.y)
                }
                
            })
            ctx.lineTo(shapeNodes[0].coordinate.x,shapeNodes[0].coordinate.y)
            //ctx.closePath()
            ctx.fillStyle = this.color
            ctx.fill()
        }
    }

    gatherNodes(nodeIndices: MeshIndex[] = []): MeshIndex[] {
        if (this.hasChildren()) {
            this.children.forEach((childShape) => {
                childShape.gatherNodes(nodeIndices);
            });
        } else {
            nodeIndices.push(...this.nodes);
        }
        return nodeIndices;
    }

    hasInside(mouseClick: Coordinate): boolean {
        let result: boolean = false
        this.children.forEach((child) => {
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
        if (this.hasChildren() && this.hasInside(mouseClick)) {
            for (const childShape of this.children) {
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
        const rowDiff = this.boundaryIndices.ll.row - this.boundaryIndices.ul.row;
        const colDiff = this.boundaryIndices.ur.col - this.boundaryIndices.ul.col;

        // Calculate midpoints indices
        const midTop = { row: this.boundaryIndices.ul.row, col: this.boundaryIndices.ul.col + colDiff / 2 };
        const midRight = { row: this.boundaryIndices.ur.row + rowDiff / 2, col: this.boundaryIndices.ur.col };
        const midBottom = { row: this.boundaryIndices.ll.row, col: this.boundaryIndices.ll.col + colDiff / 2 };
        const midLeft = { row: this.boundaryIndices.ul.row + rowDiff / 2, col: this.boundaryIndices.ul.col };
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
                MeshInstance.nodes[this.boundaryIndices.ul.row][this.boundaryIndices.ul.col].coordinate,
                MeshInstance.nodes[this.boundaryIndices.ur.row][this.boundaryIndices.ur.col].coordinate
            );
        }
        // Update coordinates of the midpoint nodes
        if (!midRightNode.isActive) {
            midRightNode.isActive = true;
            midRightNode.coordinate = this.calculateMidpointCoordinate(
                MeshInstance.nodes[this.boundaryIndices.ur.row][this.boundaryIndices.ur.col].coordinate,
                MeshInstance.nodes[this.boundaryIndices.lr.row][this.boundaryIndices.lr.col].coordinate
            );
        }
        if (!midBottomNode.isActive) {
            midBottomNode.isActive = true;
            midBottomNode.coordinate = this.calculateMidpointCoordinate(
                MeshInstance.nodes[this.boundaryIndices.ll.row][this.boundaryIndices.ll.col].coordinate,
                MeshInstance.nodes[this.boundaryIndices.lr.row][this.boundaryIndices.lr.col].coordinate
            );
        }
        if (!midLeftNode.isActive) {
            midLeftNode.isActive = true;
            midLeftNode.coordinate = this.calculateMidpointCoordinate(
                MeshInstance.nodes[this.boundaryIndices.ul.row][this.boundaryIndices.ul.col].coordinate,
                MeshInstance.nodes[this.boundaryIndices.ll.row][this.boundaryIndices.ll.col].coordinate
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
            ul: this.boundaryIndices.ul,
            ur: midTop,
            ll: midLeft,
            lr: center,
        };

        const shape2Indices: ShapeMeshIndex = {
            ul: midTop,
            ur: this.boundaryIndices.ur,
            ll: center,
            lr: midRight,
        };

        const shape3Indices: ShapeMeshIndex = {
            ul: midLeft,
            ur: center,
            ll: this.boundaryIndices.ll,
            lr: midBottom,
        };

        const shape4Indices: ShapeMeshIndex = {
            ul: center,
            ur: midRight,
            ll: midBottom,
            lr: this.boundaryIndices.lr,
        };
        
        this.children.push(
            new Polygon(shape1Indices.ul, rowDiff / 2, true, "rgba(75,139,59,0.5)"),
            new Polygon(shape2Indices.ul, rowDiff / 2, true, this.color),
            new Polygon(shape3Indices.ul, rowDiff / 2, true, this.color),
            new Polygon(shape4Indices.ul, rowDiff / 2, true, "rgba(75,139,59,0.5)")
        );
    }

    private calculateMidpointCoordinate(coord1: Coordinate, coord2: Coordinate): Coordinate {
        return {
            x: (coord1.x + coord2.x) / 2,
            y: (coord1.y + coord2.y) / 2,
        };
    }

    getOwnNodes(): Node[] {
        let nodes: Node[] = []
        this.nodes.forEach((index) => {
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
        return !(this.children.length === 0)
    }
}