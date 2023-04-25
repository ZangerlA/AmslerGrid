import React, {FC, MouseEvent, useEffect, useRef, useState} from "react";
import useWindowDimensions from "../customHooks/UseWindowDimensions";
import {Vector} from "../types/Vector";
import {Coordinate} from "../types/Coordinate";
import {MeshInstance} from "../classes/Mesh";
import {MouseButton} from "../types/MouseButton";
import {Key} from "../types/Key";

const Canvas: FC = (props) => {

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const dimension = useWindowDimensions()

	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	const [ mousePosition, setMousePosition ] = useState<Coordinate>({x:0,y:0})
	const [ isDragging, setIsDragging ] = useState<boolean>(false)

	const handleClick = (event: MouseEvent)=> {
		event.preventDefault()

		if (event.ctrlKey && event.button === MouseButton.Left) {
			MeshInstance.handleSplit({x: event.clientX, y: event.clientY})
			MeshInstance.draw(ctx as CanvasRenderingContext2D, dimension)
		}
	}

	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()

		if(event.button === MouseButton.Right) {
			const coordinate: Coordinate = {x: event.clientX, y: event.clientY}
			MeshInstance.handleSelect(coordinate)
			MeshInstance.draw(ctx as CanvasRenderingContext2D, dimension)
		}
	}

	const handleMouseDown = (event: MouseEvent) => {
		event.preventDefault()
		if (event.button === MouseButton.Left) {
			setIsDragging(true)
			MeshInstance.handleSingleNode({x:event.clientX, y:event.clientY})
		}
		setMousePosition({x:event.clientX, y:event.clientY})
	}

	const handleMouseMove = (event: MouseEvent) => {
		event.preventDefault()
		if (event.button === MouseButton.Left && isDragging) {
			const vector: Vector = {x: event.clientX - mousePosition.x, y: event.clientY - mousePosition.y}
			MeshInstance.handleDrag(vector)
			MeshInstance.draw(ctx as CanvasRenderingContext2D, dimension)
			setMousePosition({x:event.clientX, y:event.clientY})
		}
	}

	const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
		const degree = event.deltaY * 0.007
		let scaleFactor = getScaleFactor(event.deltaY)
		if (event.shiftKey){
			MeshInstance.handleScale(scaleFactor)
		} else {
			MeshInstance.handleRotate(degree)
		}
		MeshInstance.draw(ctx as CanvasRenderingContext2D, dimension)
	}

	function getScaleFactor(deltaY: number): number {
		if (deltaY < 0){
			return 0.995
		}else return 1.0051
	}
	const handleMouseUp = (event: MouseEvent) => {
		if (event.button === MouseButton.Left) {
			MeshInstance.handleRelease()
			setIsDragging(false);
		}
	}

	const handleKeyboardPress = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
		if (event.key === Key.Escape){
			MeshInstance.clearSelected()
			MeshInstance.draw(ctx as CanvasRenderingContext2D, dimension)
		}
	}

	const handleMouseOut = (event: MouseEvent) => {
		handleMouseUp(event);
	}

	useEffect(() => {
		const canvas = canvasRef.current
		if (canvas){
			canvas.focus()
			setCtx((canvas!.getContext('2d'))!)
			MeshInstance.initializeMesh(dimension)
		}
	}, [])

	useEffect(() => {
		if(ctx) {
			MeshInstance.draw(ctx, dimension)
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
	onKeyDown={handleKeyboardPress}
	tabIndex={0}
	ref={canvasRef}
	width={dimension.currentDimension.width}
	height={dimension.currentDimension.height}{...props}/>
	)
}

export default Canvas