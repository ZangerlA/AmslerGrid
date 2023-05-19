import React, {FC, MouseEvent, useEffect, useRef, useState} from "react";
import useWindowDimensions from "../customHooks/UseWindowDimensions";
import {Vector} from "../types/Vector";
import {Point} from "../types/Coordinate";
import {leftEyeMesh, Mesh, rightEyeMesh} from "../classes/Mesh";
import {MouseButton} from "../types/MouseButton";
import {MeshCanvas} from "../classes/MeshCanvas";

type CanvasProps = {
	activeMesh: Mesh
}
const Canvas: FC<CanvasProps> = (props) => {
	const { activeMesh} = props
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const windowDimension = useWindowDimensions()
	const [canvasBounds, setCanvasBounds] = useState<DOMRect>()
	const [isDragging, setIsDragging] = useState<boolean>(false)
	
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) throw new Error("Could not get canvas reference.")
		const meshPainter = new MeshCanvas(canvas)
		const canvasDimension = {width: canvas.width, height: canvas.height}
		setCanvasBounds(canvas.getBoundingClientRect())
		leftEyeMesh.initializeMesh(canvasDimension)
		rightEyeMesh.initializeMesh(canvasDimension)
		leftEyeMesh.initCanvas(meshPainter)
		rightEyeMesh.initCanvas(meshPainter)
	}, []);
	
	const handleClick = (event: MouseEvent): void => {
		event.preventDefault()
		if (event.ctrlKey && event.button === MouseButton.Left) {
			activeMesh.handleSplit(toCanvasCoord(event.clientX, event.clientY))
			activeMesh.draw()
		}
	}
	
	const handleContextMenu = (event: MouseEvent): void => {
		event.preventDefault()
		
		if (event.button === MouseButton.Right) {
			const coordinate: Point = toCanvasCoord(event.clientX, event.clientY)
			activeMesh.handleSelect(coordinate)
			activeMesh.draw()
		}
	}
	
	const handleMouseDown = (event: MouseEvent): void => {
		event.preventDefault()
		
		if (event.button === MouseButton.Left) {
			setIsDragging(true)
			activeMesh.handleSingleVertex(toCanvasCoord(event.clientX, event.clientY))
		}
	}
	
	const handleMouseMove = (event: MouseEvent): void => {
		event.preventDefault()
		
		if (event.button === MouseButton.Left && isDragging) {
			const vector: Vector = {x: event.movementX, y: event.movementY}
			activeMesh.handleDrag(vector)
			activeMesh.draw()
		}
	}
	
	const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>): void => {
		const degree = event.deltaY * 0.007
		let scaleFactor = getScaleFactor(event.deltaY)
		if (event.shiftKey) {
			activeMesh.handleScale(scaleFactor)
		} else {
			activeMesh.handleRotate(degree)
		}
		activeMesh.draw()
	}
	
	const getScaleFactor = (deltaY: number): number => {
		if (deltaY < 0) {
			return 0.995
		} else return 1.0051
	}
	
	const handleMouseUp = (event: MouseEvent): void => {
		if (event.button === MouseButton.Left) {
			activeMesh.handleRelease()
			setIsDragging(false);
			activeMesh.warpImage()
			activeMesh.draw()
		}
	}
	
	const handleMouseOut = (event: MouseEvent): void => {
		if (event.button === MouseButton.Left) {
			activeMesh.handleRelease()
			setIsDragging(false);
		}
	}
	
	const toCanvasCoord = (clientX: number, clientY: number): Point => {
		return {x: clientX - canvasBounds!.left, y: clientY - canvasBounds!.top}
	}
	
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
			width={windowDimension[0].width - 60}
			height={windowDimension[0].height}
			style={{marginLeft: 60}}
		>
		</canvas>
	)
}

export default Canvas