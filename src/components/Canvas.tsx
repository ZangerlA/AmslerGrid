import React, {FC, MouseEvent, useEffect, useRef, useState} from "react";
import useWindowDimensions, {Dimension} from "../customHooks/UseWindowDimensions";
import {Vector} from "../types/Vector";
import {Coordinate} from "../types/Coordinate";
import {Mesh, MeshInstance} from "../classes/Mesh";
import {MouseButton} from "../types/MouseButton";

const Canvas: FC = (props) => {

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const windowDimension = useWindowDimensions()
	const [ canvasDimension, setCanvasDimension ] = useState<Dimension>({width: 0, height: 0})
	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	const [ mousePosition, setMousePosition ] = useState<Coordinate>({x:0,y:0})
	const [ canvasBounds, setCanvasBounds ] = useState<DOMRect>()
	const [ isDragging, setIsDragging ] = useState<boolean>(false)

	const handleClick = (event: MouseEvent): void => {
		event.preventDefault()

		if (event.ctrlKey && event.button === MouseButton.Left) {
			MeshInstance.handleSplit(toCanvasCoord(event.clientX, event.clientY))
			MeshInstance.draw(ctx as CanvasRenderingContext2D, canvasDimension)
		}
	}

	const handleContextMenu = (event: MouseEvent): void => {
		event.preventDefault()

		if(event.button === MouseButton.Right) {
			const coordinate: Coordinate = toCanvasCoord(event.clientX, event.clientY)
			MeshInstance.handleSelect(coordinate)
			MeshInstance.draw(ctx as CanvasRenderingContext2D, canvasDimension)
		}
	}

	const handleMouseDown = (event: MouseEvent): void => {
		event.preventDefault()

		if (event.button === MouseButton.Left) {
			setIsDragging(true)
			MeshInstance.handleSingleVertex(toCanvasCoord(event.clientX, event.clientY))
		}
		setMousePosition(toCanvasCoord(event.clientX, event.clientY))
	}

	const handleMouseMove = (event: MouseEvent): void => {
		event.preventDefault()

		if (event.button === MouseButton.Left && isDragging) {
			const coord = toCanvasCoord(event.clientX, event.clientY)
			const vector: Vector = {x: coord.x - mousePosition.x, y: coord.y - mousePosition.y}
			MeshInstance.handleDrag(vector)
			MeshInstance.draw(ctx as CanvasRenderingContext2D, canvasDimension)
			//MeshInstance.warpImage()
			setMousePosition(toCanvasCoord(event.clientX, event.clientY))
		}
	}

	const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>): void => {
		const degree = event.deltaY * 0.007
		let scaleFactor = getScaleFactor(event.deltaY)
		if (event.shiftKey){
			MeshInstance.handleScale(scaleFactor)
		} else {
			MeshInstance.handleRotate(degree)
		}
		MeshInstance.draw(ctx as CanvasRenderingContext2D, canvasDimension)
	}

	const getScaleFactor = (deltaY: number): number => {
		if (deltaY < 0){
			return 0.995
		}else return 1.0051
	}

	const handleMouseUp = (event: MouseEvent): void => {
		if (event.button === MouseButton.Left) {
			MeshInstance.handleRelease()
			console.log("mouseup")
			setIsDragging(false);
			//MeshInstance.draw(ctx, canvasDimension)
			MeshInstance.warpImage()
		}
	}

	const handleMouseOut = (event: MouseEvent): void => {
		handleMouseUp(event);
	}

	const toCanvasCoord = (clientX: number, clientY: number): Coordinate => {
		return {x: clientX - canvasBounds!.left, y: clientY - canvasBounds!.top}
	}

	useEffect(() => {
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
		setCanvasBounds(canvas!.getBoundingClientRect())
		setCanvasDimension({width: canvas!.width, height: canvas!.height})
		MeshInstance.setCanvas(canvas!)
		MeshInstance.initializeMesh({width: canvas!.width, height: canvas!.height})
	}, [])

	useEffect(() => {
		if(ctx) {
			MeshInstance.draw(ctx, canvasDimension)
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
			width={windowDimension[0].width - 60}
			height={windowDimension[0].height}
			style={{marginLeft: 60}}
			{...props}
		>
		</canvas>
	)
}

export default Canvas