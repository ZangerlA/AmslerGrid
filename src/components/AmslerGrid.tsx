import React, {FC, useEffect, useState} from "react";
import Sidebar from "./Sidebar";
import {Layout} from "antd";
import {Mesh} from "../classes/Mesh";
import {MeshCanvas} from "../classes/MeshCanvas";
import {MouseButton} from "../types/MouseButton";
import {Point} from "../types/Coordinate";
import {Vector} from "../types/Vector";
import {Key} from "../types/Key";
import useWindowDimensions from "../customHooks/UseWindowDimensions";

const {Content} = Layout

const AmslerGrid: FC = () => {
	const windowDimension = useWindowDimensions()
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
	const [isDragging, setIsDragging] = useState<boolean>(false)
	const [leftEyeMesh, setLeftEyeMesh] = useState<Mesh>()
	const [rightEyeMesh, setRightEyeMesh] = useState<Mesh>()
	const [isLeftEyeMesh, setIsLeftEyeMesh ] = useState<boolean>(true)
	const changeActiveMesh = () => setIsLeftEyeMesh(b => !b)
	const [activeMesh] = isLeftEyeMesh ? [leftEyeMesh, setLeftEyeMesh] : [rightEyeMesh, setRightEyeMesh]
	
	useEffect(() => {
		if (!canvas) return
		
		const meshCanvas = new MeshCanvas(canvas)
		const canvasDimension = {width: canvas.width, height: canvas.height}
		
		const leftMesh = new Mesh(meshCanvas, canvasDimension)
		const rightMesh = new Mesh(meshCanvas, canvasDimension)
		
		setLeftEyeMesh(leftMesh)
		setRightEyeMesh(rightMesh)
		
		const leftEyeUnsub = leftMesh.subscribe()
		const rightEyeUnsub = rightMesh.subscribe()
		
		return (() => {
			leftEyeUnsub()
			rightEyeUnsub()
		})
	}, [canvas])
	
	useEffect(() => {
		if (!canvas || !activeMesh) return
		activeMesh.draw()
	}, [canvas, activeMesh])
	
	useEffect(() => {
		if (!canvas || !activeMesh || !leftEyeMesh || !rightEyeMesh) return
		
		const canvasBounds = canvas.getBoundingClientRect()
		
		const toCanvasCoord = (clientX: number, clientY: number): Point => {
			return {x: clientX - canvasBounds!.left, y: clientY - canvasBounds!.top}
		}
		
		const getScaleFactor = (deltaY: number): number => {
			if (deltaY < 0) {
				return 0.995
			} else return 1.0051
		}
		
		const handleClick = (event: MouseEvent) => {
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
		
		const handleWheel = (event: WheelEvent): void => {
			const degree = event.deltaY * 0.007
			let scaleFactor = getScaleFactor(event.deltaY)
			if (event.shiftKey) {
				activeMesh.handleScale(scaleFactor)
			} else {
				activeMesh.handleRotate(degree)
			}
			activeMesh.draw()
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
		
		const handleKeyboardPress = (event: KeyboardEvent) => {
			if (event.key === Key.Escape) {
				activeMesh.clearSelected()
				activeMesh.draw()
			}
			if (event.key === Key.SpaceBar) {
				activeMesh.toggleImage()
			}
		}
		canvas.addEventListener("click", handleClick)
		canvas.addEventListener("mousedown", handleMouseDown)
		canvas.addEventListener("mousemove", handleMouseMove)
		canvas.addEventListener("mouseup", handleMouseUp)
		canvas.addEventListener("mouseout", handleMouseOut)
		canvas.addEventListener("wheel", handleWheel)
		canvas.addEventListener("contextmenu", handleContextMenu)
		window.addEventListener("keydown", handleKeyboardPress)
		
		return (() => {
			canvas.removeEventListener("click", handleClick)
			canvas.removeEventListener("mousedown", handleMouseDown)
			canvas.removeEventListener("mousemove", handleMouseMove)
			canvas.removeEventListener("mouseup", handleMouseUp)
			canvas.removeEventListener("mouseout", handleMouseOut)
			canvas.removeEventListener("wheel", handleWheel)
			canvas.removeEventListener("contextmenu", handleContextMenu)
			window.removeEventListener("keydown", handleKeyboardPress)
		})
		
	},[activeMesh, canvas, isDragging, leftEyeMesh, rightEyeMesh])
	
	const handleImageUpload = (file: File): boolean => {
		if(!leftEyeMesh || !rightEyeMesh || !canvas) throw new Error("meshes should be initialized")
		const url = URL.createObjectURL(file)
		leftEyeMesh.setScaledImage(url)
		rightEyeMesh.setScaledImage(url)
		return false
	}
	
	return (
		<>
			{activeMesh && (<Sidebar changeActiveMesh={changeActiveMesh} handleImageUpload={handleImageUpload}/>)}
			<Content>
				<canvas
					tabIndex={0}
					ref={setCanvas}
					width={windowDimension[0].width - 60}
					height={windowDimension[0].height}
					style={{marginLeft: 60}}
				>
				</canvas>
			</Content>
		</>
	)
}

export default AmslerGrid
