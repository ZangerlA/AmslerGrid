import {FC, useEffect, useRef, useState, MouseEvent} from "react";
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
		event.preventDefault()
	}
	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		let selectedPoints = grid.findContainingPoints({x: event.clientX, y: event.clientY})
		if (event.button == 2) {
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
		event.preventDefault()
		setIsDragging(true);
		const container = grid.findContainingPoints({x: event.clientX, y: event.clientY})
		console.log(container)
		if (container.length == 1) {
			setPoint(container)
		}
		setMousePosition(new Point(event.clientX, event.clientY))
	}

	const handleMouseMove = (event: MouseEvent) => {
		event.preventDefault()
		if (isDragging) {
			console.log("move")
			const vector: Vector = {x: event.clientX - mousePosition.x, y: event.clientY - mousePosition.y}
			const result: PointIndex[] = []
			selected.forEach((polygon) => {
				polygon.forEach((point)=> {
					result.push(point)
				})
			})
			const uniqueArr = result.filter((obj, index, self) =>
					index === self.findIndex((t) => (
						t.i === obj.i && t.j === obj.j
					))
			);

			if (point.length != 0) {
				grid.movePoints(point, vector, dimension, ctx as CanvasRenderingContext2D)
			}
			else if (selected.some((polygon) => grid.inside({x: event.clientX, y: event.clientY}, grid.getPolygon(polygon[0].i, polygon[0].j)))) {
				grid.movePoints(uniqueArr, vector, dimension, ctx as CanvasRenderingContext2D)
			}
			setMousePosition(new Point(event.clientX, event.clientY))
		}
		// grid.movePoints(selected, vector, dimension, ctx as CanvasRenderingContext2D)
	}

	const handleMouseUp = (event: MouseEvent) => {
		setIsDragging(false);
		setPoint([])
	}

	const handleMouseOut = (event: MouseEvent) => {
		handleMouseUp(event);
	}

	useEffect(() => {
		// Get the canvas context for drawing
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
	}, [])

	useEffect(() => {
		console.log(selected)
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
			ref={canvasRef}
			width={dimension.currentDimension.width}
			height={dimension.currentDimension.height}{...props}>

		</canvas>
	)
}

// style={{boxShadow: "inset 0px 0px 0px 3px green"}}

export default Canvas