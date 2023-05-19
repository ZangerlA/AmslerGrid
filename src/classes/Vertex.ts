import {Vector} from "../types/Vector";
import {Point} from "../types/Coordinate";


export class Vertex {
	coordinate: Point = {x: 0, y: 0}
	drawRadius: number = 6
	color: string = "black"
	isActive: boolean = false
	wasMoved: boolean = false
	
	constructor(coordinate: Point) {
		this.coordinate.x = coordinate.x
		this.coordinate.y = coordinate.y
	}
	
	move(vector: Vector): void {
		this.wasMoved = true
		this.coordinate.x += vector.x
		this.coordinate.y += vector.y
		console.log(this.coordinate)
	}
	
	rotateAround(point: Point, degree: number): void {
		this.wasMoved = true
		const angle = degree * Math.PI / 180.0
		const dx = this.coordinate.x - point.x;
		const dy = this.coordinate.y - point.y;
		const newX = Math.cos(angle) * dx - Math.sin(angle) * dy + point.x;
		const newY = Math.sin(angle) * dx + Math.cos(angle) * dy + point.y;
		this.coordinate.x = newX;
		this.coordinate.y = newY;
	}
	
	wasClicked(mouseClick: Point): boolean {
		const distance = Math.sqrt((this.coordinate.x - mouseClick.x) ** 2 + (this.coordinate.y - mouseClick.y) ** 2)
		return distance <= this.drawRadius;
	}
	
	scale(scalingFactor: number, centerPoint: Point) {
		this.wasMoved = true
		const displacementVector = {
			x: this.coordinate.x - centerPoint.x,
			y: this.coordinate.y - centerPoint.y,
		}
		
		const scaledDisplacementVector = {
			x: displacementVector.x * scalingFactor,
			y: displacementVector.y * scalingFactor,
		}
		
		const newCoordinate: Point = {
			x: centerPoint.x + scaledDisplacementVector.x,
			y: centerPoint.y + scaledDisplacementVector.y,
		}
		
		this.coordinate = newCoordinate;
	}
}