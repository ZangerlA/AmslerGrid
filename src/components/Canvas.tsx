import {FC, useEffect, useRef, useState, MouseEvent} from "react";
import useWindowDimensions from "../customHooks/UseWindowDimensions";
import {Grid} from "../types/Grid";
import {Point} from "../types/Point";
import {Vector} from "../types/Shape";
import {Coordinate} from "../types/Grid";

const Canvas: FC = (props) => {

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const dimension = useWindowDimensions()

	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	const [ selected, setSelected ] = useState<Point[]>([])
	const [ mousePosition, setMousePosition ] = useState<Point>(new Point(0, 0))
	const [ grid ] = useState<Grid>(new Grid())

	const draw = (ctx: CanvasRenderingContext2D) => {
		ctx.clearRect(0, 0, dimension.currentDimension.width, dimension.currentDimension.height)
		grid.drawGridLines(ctx)
		grid.drawHelpPoints(ctx)
		grid.drawCenterPoint(ctx, dimension)
	}

	const handleClick = (event: MouseEvent)=>{
		event.preventDefault()
		grid.points.forEach((point) => {
			point.forEach((point) => {
				if (point.wasClicked(new Point(event.clientX,event.clientY))) {

				}
			})
		})
		console.log(grid.findContainingPoints({x: event.clientX, y: event.clientY}))
	}

	const handleMouseDown = (event: MouseEvent) => {
		event.preventDefault()
		grid.points.forEach((col) => {
			col.forEach((point) => {
				if (point.wasClicked(new Point(event.clientX,event.clientY))) {
					setSelected((prev) => [...prev, point])
				}
			})
		})
		setMousePosition(new Point(event.clientX, event.clientY))
	}

	const handleMouseMove = (event: MouseEvent) => {
		if (selected.length === 0) {
			return
		}
		const vector: Vector = {x: event.clientX - mousePosition.x, y: event.clientY - mousePosition.y}
		grid.movePoints(selected, vector, dimension, ctx as CanvasRenderingContext2D)
		setMousePosition(new Point(event.clientX, event.clientY))
	}

	const handleMouseUp = (event: MouseEvent) => {
		setSelected((prev) => [])
	}

	const handleMouseOut = (event: MouseEvent) => {
		handleMouseUp(event);
	}

	useEffect(() => {
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
	}, [])

	useEffect(() => {
		if(ctx) {
			draw(ctx)
		}
	}, [ctx, grid.points])

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
			ref={canvasRef}
			width={dimension.currentDimension.width}
			height={dimension.currentDimension.height}{...props}>

		</canvas>
	)
}

// style={{boxShadow: "inset 0px 0px 0px 3px green"}}

export default Canvas