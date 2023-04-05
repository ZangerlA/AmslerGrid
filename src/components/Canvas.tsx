import React, {FC, useEffect, useRef, useState, MouseEvent} from "react";
import useWindowDimensions from "../customHooks/UseWindowDimensions";
import {Node} from "../classes/Node";
import {Vector} from "../types/Vector";
import {Coordinate} from "../types/Coordinate";
import {MeshIndex} from "../types/MeshIndex";
import {Mesh} from "../classes/Mesh";
import {MouseButton} from "../types/MouseButton";

const Canvas: FC = (props) => {

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const dimension = useWindowDimensions()

	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	const [ mousePosition, setMousePosition ] = useState<Coordinate>({x:0,y:0})
	const [ isDragging, setIsDragging ] = useState<boolean>(false)

	const handleClick = (event: MouseEvent)=> {
		event.preventDefault()

		if (event.ctrlKey && event.button == MouseButton.Left) {
			Mesh.handleSplit({x: event.clientX, y: event.clientY})
			Mesh.draw(ctx as CanvasRenderingContext2D, dimension)
		}
	}

	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()

		if(event.button == MouseButton.Right) {
			const coordinate: Coordinate = {x: event.clientX, y: event.clientY}
			Mesh.handleSelect(coordinate)
			Mesh.draw(ctx as CanvasRenderingContext2D, dimension)
		}
	}

	const handleMouseDown = (event: MouseEvent) => {
		event.preventDefault()
		if (event.button == MouseButton.Left) {
			setIsDragging(true)
			Mesh.handleSingleNode({x:event.clientX, y:event.clientY})
		}
		setMousePosition({x:event.clientX, y:event.clientY})
	}

	const handleMouseMove = (event: MouseEvent) => {
		event.preventDefault()
		if (event.button == MouseButton.Left && isDragging) {
			const vector: Vector = {x: event.clientX - mousePosition.x, y: event.clientY - mousePosition.y}
			Mesh.handleDrag(vector, {x:event.clientX, y:event.clientY})
			Mesh.draw(ctx as CanvasRenderingContext2D, dimension)
			setMousePosition({x:event.clientX, y:event.clientY})
		}
	}

	const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
		const degree = event.deltaY * 0.007
		Mesh.handleRotate(degree, {x:event.clientX, y:event.clientY})
		Mesh.draw(ctx as CanvasRenderingContext2D, dimension)
	}

	const handleMouseUp = (event: MouseEvent) => {
		if (event.button == MouseButton.Left) {
			Mesh.selectedNodes = []
			setIsDragging(false);
		}
	}

	const handleMouseOut = (event: MouseEvent) => {
		handleMouseUp(event);
	}

	useEffect(() => {
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
		Mesh.initializeMesh(dimension)
	}, [])

	useEffect(() => {
		if(ctx) {
			Mesh.draw(ctx, dimension)
		}
	}, [ctx])
	
	return (
		<canvas
			onClick={handleClick}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseOut={handleMouseOut}
			onWheel={handleWheel}
			onContextMenu={handleContextMenu}
			ref={canvasRef}
			width={dimension.currentDimension.width}
			height={dimension.currentDimension.height}{...props}>
		</canvas>
	)
}

export default Canvas