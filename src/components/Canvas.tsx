import React, {FC, MouseEvent, useEffect, useRef, useState} from "react";
import useWindowDimensions, {Dimension} from "../customHooks/UseWindowDimensions";
import {Vector} from "../types/Vector";
import {Point} from "../types/Coordinate";
import {Mesh, MeshInstanceRight, MeshInstanceLeft} from "../classes/Mesh";
import {MouseButton} from "../types/MouseButton";


type CanvasProps = {
	activeMesh: Mesh
	setCanvas: (canvas: HTMLCanvasElement) => void
}
const Canvas: FC<CanvasProps> = (props) => {
	const { activeMesh, setCanvas } = props
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const windowDimension = useWindowDimensions()
	const [ canvasDimension, setCanvasDimension ] = useState<Dimension>({width: 0, height: 0})
	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	const [ mousePosition, setMousePosition ] = useState<Point>({x:0,y:0})
	const [ canvasBounds, setCanvasBounds ] = useState<DOMRect>()
	const [ isDragging, setIsDragging ] = useState<boolean>(false)

	const handleClick = (event: MouseEvent): void => {
		event.preventDefault()
		if (event.ctrlKey && event.button === MouseButton.Left) {
			activeMesh.handleSplit(toCanvasCoord(event.clientX, event.clientY))
			activeMesh.draw(ctx as CanvasRenderingContext2D, canvasDimension)
		}
	}

	const handleContextMenu = (event: MouseEvent): void => {
		event.preventDefault()

		if(event.button === MouseButton.Right) {
			const coordinate: Point = toCanvasCoord(event.clientX, event.clientY)
			activeMesh.handleSelect(coordinate)
			activeMesh.draw(ctx as CanvasRenderingContext2D, canvasDimension)
		}
	}

	const handleMouseDown = (event: MouseEvent): void => {
		event.preventDefault()

		if (event.button === MouseButton.Left) {
			setIsDragging(true)
			activeMesh.handleSingleVertex(toCanvasCoord(event.clientX, event.clientY))
		}
		setMousePosition(toCanvasCoord(event.clientX, event.clientY))
	}

	const handleMouseMove = (event: MouseEvent): void => {
		event.preventDefault()

		if (event.button === MouseButton.Left && isDragging) {
			const coord = toCanvasCoord(event.clientX, event.clientY)
			const vector: Vector = {x: coord.x - mousePosition.x, y: coord.y - mousePosition.y}
			activeMesh.handleDrag(vector)
			activeMesh.draw(ctx as CanvasRenderingContext2D, canvasDimension)
			setMousePosition(toCanvasCoord(event.clientX, event.clientY))
		}
	}

	const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>): void => {
		const degree = event.deltaY * 0.007
		let scaleFactor = getScaleFactor(event.deltaY)
		if (event.shiftKey){
			activeMesh.handleScale(scaleFactor)
		} else {
			activeMesh.handleRotate(degree)
		}
		activeMesh.warpImage()
	}

	const getScaleFactor = (deltaY: number): number => {
		if (deltaY < 0){
			return 0.995
		}else return 1.0051
	}

	const handleMouseUp = (event: MouseEvent): void => {
		if (event.button === MouseButton.Left) {
			activeMesh.handleRelease()
			setIsDragging(false);
			activeMesh.warpImage()
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

	useEffect(() => {
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
		setCanvasBounds(canvas!.getBoundingClientRect())
		setCanvasDimension({width: canvas!.width, height: canvas!.height})
		setCanvas(canvas!)
	}, [])

	useEffect(() => {
		if(ctx) {
			activeMesh.draw(ctx, canvasDimension)
		}
	}, [ctx])

	useEffect(() => {
		console.log("hello")
		if (ctx) {
			activeMesh.draw(ctx as CanvasRenderingContext2D, canvasDimension)
		}
	}, [activeMesh])
	
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