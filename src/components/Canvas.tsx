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
	const [ mousePosition, setMousePosition ] = useState<Coordinate>({x:0,y:0})
	const [ grid ] = useState<Grid>(new Grid())

	const getSelected = (): SelectedPolygons[] => {
		return selected
	}
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

			if (selected.length == 0) {
				setSelected([...selected, selectedPoints])
				return
			}
			selected.forEach((polygon) => {
				let isAlreadySelected = true
				for (let i = 0; i < polygon.length; i++) {
					if (!(polygon[i].i == selectedPoints[i].i) || !(polygon[i].j == selectedPoints[i].j)) {
						isAlreadySelected = false
						break;
					}
				}
				if (isAlreadySelected) {
					const filter = selected.filter((container) => container !== polygon)
					setSelected(filter)
				}
				else {
					setSelected([...selected, selectedPoints])
				}
			})
		}
	}

	const handleMouseDown = (event: MouseEvent) => {
		event.preventDefault()
	}

	const handleMouseMove = (event: MouseEvent) => {
		if (selected.length === 0) {
			return
		}
		const vector: Vector = {x: event.clientX - mousePosition.x, y: event.clientY - mousePosition.y}
		// grid.movePoints(selected, vector, dimension, ctx as CanvasRenderingContext2D)
		setMousePosition(new Point(event.clientX, event.clientY))
	}

	const handleMouseUp = (event: MouseEvent) => {
		//setSelected((prev) => [])
	}

	const handleMouseOut = (event: MouseEvent) => {
		//handleMouseUp(event);
	}

	useEffect(() => {
		// Get the canvas context for drawing
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
			onContextMenu={handleContextMenu}
			ref={canvasRef}
			width={dimension.currentDimension.width}
			height={dimension.currentDimension.height}{...props}>

		</canvas>
	)
}

// style={{boxShadow: "inset 0px 0px 0px 3px green"}}

export default Canvas