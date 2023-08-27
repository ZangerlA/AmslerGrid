import React, {FC, useEffect, useRef, useState} from "react";
import Sidebar from "./Sidebar";
import {Layout, Spin} from "antd";
import {Mesh} from "../classes/Mesh";
import {MeshCanvas} from "../classes/MeshCanvas";
import {MouseButton} from "../types/MouseButton";
import {Point} from "../types/Coordinate";
import {Vector} from "../types/Vector";
import {Key} from "../types/Key";
import useWindowDimensions from "../customHooks/UseWindowDimensions";
import {FileSaver} from "../classes/FileSaver";
import {SaveFile} from "../types/SaveFile";

const {Content} = Layout

const AmslerGrid: FC = () => {
	const CURRENT_VERSION = "1.0"
	const windowDimension = useWindowDimensions()
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
	const [isDragging, setIsDragging] = useState<boolean>(false)
	const [leftEyeMesh, setLeftEyeMesh] = useState<Mesh>()
	const [rightEyeMesh, setRightEyeMesh] = useState<Mesh>()
	const [isLeftEyeMesh, setIsLeftEyeMesh ] = useState<boolean>(true)
	const [configurationFile, setConfigurationFile ] = useState<File>()
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
			}
			else if (event.altKey && event.button === MouseButton.Left) {
				activeMesh.handleMerge(toCanvasCoord(event.clientX, event.clientY))
			}
			activeMesh.draw()
		}
		
		const handleContextMenu = (event: MouseEvent): void => {
			event.preventDefault()
			
			if (event.button === MouseButton.Right) {
				console.log(activeMesh.polygons)
				console.log(activeMesh.vertices)
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

		const handleResize = (): void => {
			activeMesh.draw()
		}

		canvas.addEventListener("click", handleClick)
		canvas.addEventListener("mousedown", handleMouseDown)
		canvas.addEventListener("mousemove", handleMouseMove)
		canvas.addEventListener("mouseup", handleMouseUp)
		canvas.addEventListener("mouseout", handleMouseOut)
		canvas.addEventListener("wheel", handleWheel)
		canvas.addEventListener("contextmenu", handleContextMenu)
		window.addEventListener("keydown", handleKeyboardPress)
		window.addEventListener("resize", handleResize)
		
		return (() => {
			canvas.removeEventListener("click", handleClick)
			canvas.removeEventListener("mousedown", handleMouseDown)
			canvas.removeEventListener("mousemove", handleMouseMove)
			canvas.removeEventListener("mouseup", handleMouseUp)
			canvas.removeEventListener("mouseout", handleMouseOut)
			canvas.removeEventListener("wheel", handleWheel)
			canvas.removeEventListener("contextmenu", handleContextMenu)
			window.removeEventListener("keydown", handleKeyboardPress)
			window.removeEventListener("resize", handleResize)
		})
		
	},[activeMesh, canvas, isDragging, leftEyeMesh, rightEyeMesh])

	useEffect(() => {
		if (!configurationFile) return
		if (!canvas) return
		const meshCanvas = new MeshCanvas(canvas)
		const canvasDimension = {width: canvas.width, height: canvas.height}
		const leftMesh = new Mesh(meshCanvas, canvasDimension)
		const rightMesh = new Mesh(meshCanvas, canvasDimension)

		setLeftEyeMesh(leftMesh)
		setRightEyeMesh(rightMesh)

	}, [configurationFile]);

	useEffect(() => {
		if (!configurationFile) return
		const reader = new FileReader()
		let stale = false
		reader.onload = (e) => {
			if (stale) return
			const content = e.target?.result
			if (typeof content === 'string') {
				try {
					const data: SaveFile = JSON.parse(content)
					leftEyeMesh?.restoreFromFile(data.leftEyeMesh)
					rightEyeMesh?.restoreFromFile(data.rightEyeMesh)
					activeMesh?.draw()
					setConfigurationFile(undefined)
				} catch (error) {
					console.error("Failed to parse JSON:", error)
				}
			}
		}
		reader.readAsText(configurationFile)

		return () => {stale = true}

	}, [leftEyeMesh, rightEyeMesh]);

	const handleImageUpload = (file: File): boolean => {
		if(!leftEyeMesh || !rightEyeMesh || !canvas) throw new Error("meshes should be initialized")
		const url = URL.createObjectURL(file)
		leftEyeMesh.setScaledImage(url)
		rightEyeMesh.setScaledImage(url)
		return false
	}

	const handleSaveToFile = (): void => {

		const json = createSaveSnapshot()
		const blob = new Blob([json], { type: 'application/json' })
		const fs = new FileSaver()
		fs.save(blob)
	}

	const createSaveSnapshot = (): string => {
		const max = activeMesh!.vertices[activeMesh!.vertices.length-1][activeMesh!.vertices[0].length-1].coordinate
		const data = {
			version: CURRENT_VERSION,
			meshWidth: max.x,
			meshHeight: max.y,
			leftEyeMesh: leftEyeMesh,
			rightEyeMesh: rightEyeMesh
		}

		return  JSON.stringify(data, null)
	}

	const handleSave = (): void => {
		const json = createSaveSnapshot()
		const currentSaves = JSON.parse(localStorage.getItem('meshData') || '[]')

		// add the new save to the start of the array
		currentSaves.unshift(json)

		// remove the oldest save if there are more than 5 saves
		if (currentSaves.length > 5) {
			currentSaves.pop()
		}

		localStorage.setItem('meshData', JSON.stringify(currentSaves))
	}

	const handleLoad = (): void => {
		const currentSaves = JSON.parse(localStorage.getItem('meshData') || '[]')
		const mostRecentSave = currentSaves[0]

		if (mostRecentSave) {
			const file = new File([mostRecentSave], "config.json", { type: 'application/json' })
			setConfigurationFile(file)
		}
	}
	
	const printGrids = (): void => {
		leftEyeMesh?.canvas.download()
		rightEyeMesh?.canvas.download()
	}

	const handleLoadFromFile = (file: File): boolean => {
		setConfigurationFile(file)
		return false
	}

	return (
		<>
			{activeMesh && (
				<Sidebar
					changeActiveMesh={changeActiveMesh}
					handleSaveToFile={handleSaveToFile}
					handleSave={handleSave}
					handleLoad={handleLoad}
					printGrids={printGrids}
					handleLoadFromFile={handleLoadFromFile}
					handleImageUpload={handleImageUpload}
				/>)}

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
