import React, {FC, MouseEvent, RefObject, useEffect, useRef, useState} from "react";
import useWindowDimensions from "../customHooks/UseWindowDimensions";
import {Vector} from "../types/Vector";
import {Point} from "../types/Coordinate";
import {Mesh} from "../classes/Mesh";
import {MouseButton} from "../types/MouseButton";
import {MeshCanvas} from "../classes/MeshCanvas";
import {Key} from "../types/Key";

type CanvasProps = {
	canvasRef: RefObject<HTMLCanvasElement>
	canvas: HTMLCanvasElement
	activeMesh: Mesh
}

const Canvas: FC<CanvasProps> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const { activeMesh } = props
	const windowDimension = useWindowDimensions()
	const [canvasBounds, setCanvasBounds] = useState<DOMRect>()
	const [isDragging, setIsDragging] = useState<boolean>(false)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) throw new Error("Could not get canvas reference.")
		//props.canvasRef(canvas)
		props.canvas.focus()
		setCanvasBounds(props.canvas.getBoundingClientRect())
	}, [])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) throw new Error("Could not get canvas reference.")
		canvas.focus()
		activeMesh.draw()
	}, [activeMesh])

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
			setIsDragging(false)
			activeMesh.draw()
		}
	}

	const handleMouseOut = (event: MouseEvent): void => {
		if (event.button === MouseButton.Left) {
			activeMesh.handleRelease()
			setIsDragging(false);
		}
	}

	const handleKeyboardPress = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
		if (event.key === Key.Escape) {
			activeMesh.clearSelected()
			activeMesh.draw()
		}
		if (event.key === Key.SpaceBar) {
			activeMesh.toggleImage()
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
			onKeyDown={handleKeyboardPress}
			tabIndex={0}
			ref={canvasRef}
			width={windowDimension[0].width - 60}
			height={windowDimension[0].height}
			style={{marginLeft: 60}}
		>
		</canvas>
	)
}

export default Canvas