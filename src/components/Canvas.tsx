import React, {FC, useEffect, useRef, useState, MouseEvent} from "react";
import useWindowDimensions from "../customHooks/UseWindowDimensions";
import {Grid} from "../types/Grid";
import {Point} from "../types/Point";
import {Vector} from "../types/Shape";
import {Coordinate} from "../types/Grid";
import {PointIndex} from "../types/Grid";

export type SelectedPolygons = PointIndex[]

const Canvas: FC = (props) => {

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const dimension = useWindowDimensions()

	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	const [ selected, setSelected ] = useState<SelectedPolygons[]>([])
	const [ point, setPoint ] = useState<SelectedPolygons>([])
	const [ mousePosition, setMousePosition ] = useState<Coordinate>({x:0,y:0})
	const [ isDragging, setIsDragging ] = useState<boolean>(false)

	const [ grid ] = useState<Grid>(new Grid())

	const draw = (ctx: CanvasRenderingContext2D) => {
		grid.redraw(ctx, dimension)
	}

	const handleClick = (event: MouseEvent)=>{
		//console.log("click")
		event.preventDefault()
		if (event.ctrlKey) {
			let selectedPoints = grid.findContainingPoints({x: event.clientX, y: event.clientY})
			console.log(selectedPoints)
			grid.gridPoints[selectedPoints[0].i][(selectedPoints[0].j + selectedPoints[3].j)/2].shouldDraw = true
			grid.gridPoints[(selectedPoints[3].i + selectedPoints[2].i)/2][selectedPoints[3].j].shouldDraw = true
			grid.gridPoints[selectedPoints[2].i][(selectedPoints[2].j + selectedPoints[1].j)/2].shouldDraw = true
			grid.gridPoints[(selectedPoints[0].i + selectedPoints[1].i)/2][selectedPoints[0].j].shouldDraw = true
			grid.gridPoints[(selectedPoints[0].i + selectedPoints[2].i)/2][(selectedPoints[0].j + selectedPoints[2].j)/2].shouldDraw = true

			grid.gridPoints[selectedPoints[0].i][(selectedPoints[0].j + selectedPoints[3].j)/2].x = (grid.gridPoints[selectedPoints[0].i][selectedPoints[0].j].x + grid.gridPoints[selectedPoints[3].i][selectedPoints[3].j].x)/2

			grid.gridPoints[(selectedPoints[3].i + selectedPoints[2].i)/2][selectedPoints[3].j].x = (grid.gridPoints[selectedPoints[3].i][selectedPoints[3].j].x + grid.gridPoints[selectedPoints[2].i][selectedPoints[2].j].x)/2
			grid.gridPoints[selectedPoints[2].i][(selectedPoints[2].j + selectedPoints[1].j)/2].x = (grid.gridPoints[selectedPoints[2].i][selectedPoints[2].j].x + grid.gridPoints[selectedPoints[1].i][selectedPoints[1].j].x)/2
			grid.gridPoints[(selectedPoints[0].i + selectedPoints[1].i)/2][selectedPoints[0].j].x = (grid.gridPoints[selectedPoints[1].i][selectedPoints[1].j].x + grid.gridPoints[selectedPoints[0].i][selectedPoints[0].j].x)/2
			//grid.gridPoints[(selectedPoints[0].i + selectedPoints[2].i)/2][(selectedPoints[0].j + selectedPoints[2].j)/2].x = (grid.gridPoints[selectedPoints[0].i][selectedPoints[0].j].x + grid.gridPoints[selectedPoints[3].i][selectedPoints[3].j].x)/2

			grid.gridPoints[selectedPoints[0].i][(selectedPoints[0].j + selectedPoints[3].j)/2].y = (grid.gridPoints[selectedPoints[0].i][selectedPoints[0].j].y + grid.gridPoints[selectedPoints[3].i][selectedPoints[3].j].y)/2

			grid.gridPoints[(selectedPoints[3].i + selectedPoints[2].i)/2][selectedPoints[3].j].y = (grid.gridPoints[selectedPoints[3].i][selectedPoints[3].j].y + grid.gridPoints[selectedPoints[2].i][selectedPoints[2].j].y)/2
			grid.gridPoints[selectedPoints[2].i][(selectedPoints[2].j + selectedPoints[1].j)/2].y = (grid.gridPoints[selectedPoints[2].i][selectedPoints[2].j].y + grid.gridPoints[selectedPoints[1].i][selectedPoints[1].j].y)/2
			grid.gridPoints[(selectedPoints[0].i + selectedPoints[1].i)/2][selectedPoints[0].j].y = (grid.gridPoints[selectedPoints[1].i][selectedPoints[1].j].y + grid.gridPoints[selectedPoints[0].i][selectedPoints[0].j].y)/2
			//grid.gridPoints[(selectedPoints[0].i + selectedPoints[2].i)/2][(selectedPoints[0].j + selectedPoints[2].j)/2].y

			console.log(grid.gridPoints)
			grid.redraw(ctx as CanvasRenderingContext2D, dimension)
		}
	}
	const handleContextMenu = (event: MouseEvent) => {
		//console.log("contextmenu")
		event.preventDefault()
		// if right click
		if (event.button == 2 && event.clientX > 50 && event.clientY > 50 && event.clientX < dimension.currentDimension.width - 50 && event.clientY < dimension.currentDimension.height - 50) {
			let selectedPoints = grid.findContainingPoints({x: event.clientX, y: event.clientY})
			let found: SelectedPolygons = []
			selected.forEach((polygon) => {
				let match = true;
				for (let i = 0; i < polygon.length; i++) {
					if (!(polygon[i].i == selectedPoints[i].i) || !(polygon[i].j == selectedPoints[i].j)) {
						match = false;
					}
				}
				if (match){
					found = polygon;
				}
			})
			if (found.length == 0) {
				setSelected([...selected, selectedPoints])
			}
			else {
				const filter = selected.filter((polygon) => polygon !== found)
				setSelected(filter)
			}
		}
	}

	const handleMouseDown = (event: MouseEvent) => {
		//console.log("mousedown")
		event.preventDefault()
		// if left click
		if (event.button == 0) {
			setIsDragging(true);
			const container = grid.findContainingPoints({x: event.clientX, y: event.clientY})
			//console.log(container)
			if (container.length == 1) {
				setPoint(container)
			}
			setMousePosition(new Point(event.clientX, event.clientY))
		}
	}

	const handleMouseMove = (event: MouseEvent) => {
		//console.log("mousemove")
		event.preventDefault()
		if (isDragging) {
			console.log("move")
			const vector: Vector = {x: event.clientX - mousePosition.x, y: event.clientY - mousePosition.y}
			const uniqueArr = getUniqueArray();

			if (point.length != 0) {
				grid.movePoints(point, vector, dimension, ctx as CanvasRenderingContext2D)
			}
			else if (mouseInsideSelected({x: event.clientX, y: event.clientY})) {
				grid.movePoints(uniqueArr, vector, dimension, ctx as CanvasRenderingContext2D)
			}
			setMousePosition(new Point(event.clientX, event.clientY))
		}
		// grid.movePoints(selected, vector, dimension, ctx as CanvasRenderingContext2D)
	}

	const mouseInsideSelected = (mouse: Coordinate): boolean  => {
		return selected.some((polygon) => grid.inside(mouse, grid.getPolygon(polygon[0].i, polygon[0].j)))
	}

	const getUniqueArray = () : PointIndex[] => {
		//console.log(selected)
		const result: PointIndex[] = []
		selected.forEach((polygon) => {
			polygon.forEach((point)=> {
				result.push(point)
			})
		})
		//console.log(result)
		const uniqueArr = result.filter((obj, index, self) =>
				index === self.findIndex((t) => (
					t.i === obj.i && t.j === obj.j
				))
		);
		//console.log(uniqueArr)
		return uniqueArr;
	}

	const findBoundaryPoints = (uniqueArr: PointIndex[]) : PointIndex[] => {
		return uniqueArr.filter((pointIndex) => {
			for (let pointIndex2 of uniqueArr) {
				if (pointIndex.i <= pointIndex2.i || pointIndex.i >= pointIndex2.i) {
					return true
				}
				else if (pointIndex.j <= pointIndex2.j || pointIndex.j >= pointIndex2.j) {
					return true
				}
				else return false
			}
		})
	}

	const findCenterPoint = (cornerPoints: PointIndex[]): Point => {
		const centerPoint: Point = new Point(0,0)
		for (let point of cornerPoints) {
			centerPoint.x += grid.gridPoints[point.i][point.j].x
			centerPoint.y += grid.gridPoints[point.i][point.j].y
		}
		centerPoint.x = centerPoint.x / cornerPoints.length
		centerPoint.y = centerPoint.y / cornerPoints.length
		return centerPoint
	}


	const handleMouseUp = (event: MouseEvent) => {
		// if left click
		if (event.button == 0) {
			setIsDragging(false);
			setPoint([])

		}
		//console.log("mouseup")
	}

	const handleMouseOut = (event: MouseEvent) => {
		//console.log("mouseout")
		handleMouseUp(event);
	}

	const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
		event.preventDefault()
		if (mouseInsideSelected({x: event.clientX, y: event.clientY})) {
			console.log(selected)
			const uniquePoints = getUniqueArray()
			console.log("uniquepoints",uniquePoints)
			const points = findBoundaryPoints(uniquePoints)
			console.log("cornerPoints", points)
			const centerPoint = findCenterPoint(points)
			console.log("centerpoint", centerPoint)

			grid.rotatePoints(uniquePoints, centerPoint, event.deltaY*0.007, dimension, ctx as CanvasRenderingContext2D)
		}
	}

	useEffect(() => {
		// Get the canvas context for drawing
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
	}, [])

	useEffect(() => {
		console.log("selected", selected)
		grid.updateSelected(selected)
		if(ctx) {
			draw(ctx)
		}
	}, [ctx, grid.gridPoints, selected])

	useEffect(() => {
		grid.calculateGrid(dimension)
	}, [dimension.currentDimension.width, dimension.currentDimension.height])
	
	return (
		<canvas
			onClick={handleClick}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseOut={handleMouseOut}
			onContextMenu={handleContextMenu}
			onWheel={handleWheel}
			ref={canvasRef}
			width={dimension.currentDimension.width}
			height={dimension.currentDimension.height}{...props}>

		</canvas>
	)
}

// style={{boxShadow: "inset 0px 0px 0px 3px green"}}

export default Canvas