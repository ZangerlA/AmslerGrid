import { Layout } from "antd"
import React, { FC, useEffect, useState } from "react"
import { FileSaver } from "../classes/FileSaver"
import { Mesh } from "../classes/Mesh"
import { MeshCanvas } from "../classes/MeshCanvas"
import useWindowDimensions, { Dimension } from "../customHooks/UseWindowDimensions"
import { toReadableDate } from "../helperMethods/toReadableDate"
import { Point } from "../types/Coordinate"
import { Key } from "../types/Key"
import { MouseButton } from "../types/MouseButton"
import { SaveFile } from "../types/SaveFile"
import { Vector } from "../types/Vector"
import Navbar from "./Navbar"

const { Content } = Layout

const AmslerGrid: FC = () => {
	const CURRENT_VERSION = "1.0"
	const windowDimension = useWindowDimensions()
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
	const [isDragging, setIsDragging] = useState<boolean>(false)
	const [leftEyeMesh, setLeftEyeMesh] = useState<Mesh>()
	const [rightEyeMesh, setRightEyeMesh] = useState<Mesh>()
	const [isLeftEyeMesh, setIsLeftEyeMesh] = useState<boolean>(true)
	const [configurationFile, setConfigurationFile] = useState<File>()
	const changeActiveMesh = () => setIsLeftEyeMesh(b => !b)
	const [activeMesh] = isLeftEyeMesh ? [leftEyeMesh, setLeftEyeMesh] : [rightEyeMesh, setRightEyeMesh]
	const [canvasSize, setCanvasSize] = useState<Dimension>({
		width: windowDimension[0].width,
		height: windowDimension[0].height,
	})

	useEffect(() => {
		if ( !canvas ) return

		const meshCanvas = new MeshCanvas(canvas)
		const canvasDimension = { width: canvas.width, height: canvas.height - 30 }

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
		if ( !canvas || !activeMesh ) return
		activeMesh.draw()
	}, [canvas, activeMesh])

	useEffect(() => {
		if ( !canvas || !activeMesh || !leftEyeMesh || !rightEyeMesh ) return

		const canvasBounds = canvas.getBoundingClientRect()

		const toCanvasCoord = (clientX: number, clientY: number): Point => {
			return { x: clientX - canvasBounds!.left, y: clientY - canvasBounds!.top }
		}

		const getScaleFactor = (deltaY: number): number => {
			if ( deltaY < 0 ) {
				return 0.995
			} else return 1.0051
		}

		const handleClick = (event: MouseEvent) => {
			event.preventDefault()
			if ( event.ctrlKey && event.button === MouseButton.Left ) {
				activeMesh.handleSplit(toCanvasCoord(event.clientX, event.clientY))
			} else if ( event.altKey && event.button === MouseButton.Left ) {
				activeMesh.handleMerge(toCanvasCoord(event.clientX, event.clientY))
			}
			activeMesh.draw()
		}

		const handleContextMenu = (event: MouseEvent): void => {
			event.preventDefault()

			if ( event.button === MouseButton.Right ) {
				const coordinate: Point = toCanvasCoord(event.clientX, event.clientY)
				activeMesh.handleSelect(coordinate)
				activeMesh.draw()
			}
		}

		const handleMouseDown = (event: MouseEvent): void => {
			event.preventDefault()

			if ( event.button === MouseButton.Left ) {
				setIsDragging(true)
				activeMesh.handleSingleVertex(toCanvasCoord(event.clientX, event.clientY))
			}
		}

		const handleMouseMove = (event: MouseEvent): void => {
			event.preventDefault()
			if ( event.button === MouseButton.Left && isDragging ) {
				const vector: Vector = { x: event.movementX, y: event.movementY }
				activeMesh.handleDrag(vector)
				activeMesh.draw()
			}
		}

		const handleWheel = (event: WheelEvent): void => {
			const degree = event.deltaY * 0.007
			let scaleFactor = getScaleFactor(event.deltaY)
			if ( event.shiftKey ) {
				activeMesh.handleScale(scaleFactor)
			} else {
				activeMesh.handleRotate(degree)
			}
			activeMesh.draw()
		}

		const handleMouseUp = (event: MouseEvent): void => {
			if ( event.button === MouseButton.Left ) {
				activeMesh.handleRelease()
				setIsDragging(false)
				activeMesh.draw()
			}
		}

		const handleMouseOut = (event: MouseEvent): void => {
			if ( event.button === MouseButton.Left ) {
				activeMesh.handleRelease()
				setIsDragging(false)
			}
		}

		const handleKeyboardPress = (event: KeyboardEvent) => {
			if ( event.key === Key.Escape ) {
				activeMesh.clearSelected()
				activeMesh.draw()
			}
			if ( event.key === Key.SpaceBar ) {
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

	}, [activeMesh, canvas, isDragging, leftEyeMesh, rightEyeMesh])

	useEffect(() => {
		activeMesh?.draw()
	}, [rightEyeMesh, leftEyeMesh])

	useEffect(() => {
		if ( !configurationFile ) return
		if ( !canvas ) return
		const reader = new FileReader()
		let stale = false
		reader.onload = (e) => {
			if ( stale ) return
			const content = e.target?.result
			if ( typeof content === "string" ) {
				try {
					let width = canvas.width
					let height = canvas.height
					const data: SaveFile = JSON.parse(content)
					if ( data.canvasSize ) {
						width = canvas.width < data.canvasSize.width ? data.canvasSize.width : canvas.width
						height = canvas.height < data.canvasSize.height ? data.canvasSize.height : canvas.height
					}
					canvas.width = width
					canvas.height = height
					const meshCanvas = new MeshCanvas(canvas)
					
					setCanvasSize({ width: width, height: height })
					const leftMesh = new Mesh(meshCanvas, { width: width, height: height })
					const rightMesh = new Mesh(meshCanvas, { width: width, height: height })
					leftMesh.restoreFromFile(data.leftEyeMesh)
					rightMesh.restoreFromFile(data.rightEyeMesh)
					setLeftEyeMesh(leftMesh)
					setRightEyeMesh(rightMesh)

					setConfigurationFile(undefined)
				} catch ( error ) {
					console.error("Failed to parse JSON:", error)
				}
			}
		}
		reader.readAsText(configurationFile)

		return () => {
			stale = true
		}

	}, [configurationFile])

	useEffect(() => {
		setCanvasSize(windowDimension[0])
	}, [])

	const handleImageUpload = (file: File): boolean => {
		if ( !leftEyeMesh || !rightEyeMesh || !canvas ) throw new Error("meshes should be initialized")
		const url = URL.createObjectURL(file)
		leftEyeMesh.setScaledImage(url)
		rightEyeMesh.setScaledImage(url)
		return false
	}

	const handleSaveToFile = (username: string): void => {
		const now = Date.now()
		username = username === null ? "" : "_" + username
		const filename = "Amsler_" + toReadableDate(now)
		const json = createSaveSnapshot()
		const blob = new Blob([json], { type: "application/json" })
		const fs = new FileSaver()
		fs.save(blob, filename)
	}

	const createSaveSnapshot = (): string => {
		const max = activeMesh!.vertices[activeMesh!.vertices.length - 1][activeMesh!.vertices[0].length - 1].coordinate
		const data = {
			version: CURRENT_VERSION,
			date: Date.now(),
			meshWidth: max.x,
			meshHeight: max.y,
			canvasSize: canvasSize,
			leftEyeMesh: leftEyeMesh,
			rightEyeMesh: rightEyeMesh,
		}

		return JSON.stringify(data, null)
	}

	const handleSave = (): [] => {
		const jsonData = createSaveSnapshot()
		const dataObject = JSON.parse(jsonData)
		const currentSaves = JSON.parse(localStorage.getItem("meshData") || "[]")

		currentSaves.unshift(dataObject)

		// remove the oldest save if there are more than 5 saves
		if ( currentSaves.length > 5 ) {
			currentSaves.pop()
		}

		localStorage.setItem("meshData", JSON.stringify(currentSaves))
		return currentSaves
	}

	const handleLoad = (data: SaveFile): void => {
		const jsonData = JSON.stringify(data)
		const blob = new Blob([jsonData], { type: "application/json" })
		const file = new File([blob], "config.json")

		setConfigurationFile(file)
	}

	const printGrids = (): {} => {
		const offscreenLeftEyeCanvas = document.createElement("canvas")
		const offscreenRightEyeCanvas = document.createElement("canvas")
		offscreenLeftEyeCanvas.width = canvasSize.width
		offscreenRightEyeCanvas.width = canvasSize.width
		offscreenLeftEyeCanvas.height = canvasSize.height
		offscreenRightEyeCanvas.height = canvasSize.height
		const offscreenLeftEyeMeshCanvas = new MeshCanvas(offscreenLeftEyeCanvas)
		const offscreenRightEyeMeshCanvas = new MeshCanvas(offscreenRightEyeCanvas)
		leftEyeMesh?.draw(offscreenLeftEyeMeshCanvas)
		rightEyeMesh?.draw(offscreenRightEyeMeshCanvas)
		const maxLeft = leftEyeMesh!.vertices[leftEyeMesh!.vertices.length - 1][leftEyeMesh!.vertices[0].length - 1].coordinate
		const maxRight = rightEyeMesh!.vertices[rightEyeMesh!.vertices.length - 1][rightEyeMesh!.vertices[0].length - 1].coordinate
		return {
			leftEye: offscreenLeftEyeMeshCanvas.getMeshDataURL(leftEyeMesh!.vertices),
			dimensionLeft: { width: maxLeft.x, height: maxLeft.y },
			rightEye: offscreenRightEyeMeshCanvas.getMeshDataURL(rightEyeMesh!.vertices),
			dimensionRight: { width: maxRight.x, height: maxRight.y },
		}
	}

	const handleLoadFromFile = (file: File): boolean => {
		setConfigurationFile(file)
		return false
	}

	return (
		<>
			{activeMesh &&
				(<Navbar
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
					width={canvasSize.width}
					height={canvasSize.height}
					style={{ marginTop: -10 }}
				>
				</canvas>
			</Content>
		</>
	)
}

export default AmslerGrid
