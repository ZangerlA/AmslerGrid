import React, {FC, useEffect, useRef, useState} from "react";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import {Layout} from "antd";
import {Mesh} from "../classes/Mesh";
import {MeshCanvas} from "../classes/MeshCanvas";

const {Content} = Layout

const AmslerGrid: FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
	const [leftEyeMesh, setLeftEyeMesh] = useState<Mesh | null>(null)
	const [rightEyeMesh, setRightEyeMesh] = useState<Mesh | null>(null)
	const [activeMesh, setActiveMesh] = useState<Mesh | null>(null)
	/*
	useEffect(() => {
		if (!canvasRef.current) {
			throw new Error("Could not get canvas reference.")
		}

		const canvas = canvasRef.current
		setCanvas(canvas)

		const meshCanvas = new MeshCanvas(canvas)
		const canvasDimension = {width: canvas.width, height: canvas.height}

		const leftMesh = new Mesh(meshCanvas, canvasDimension)
		const rightMesh = new Mesh(meshCanvas, canvasDimension)

		setLeftEyeMesh(leftMesh)
		setRightEyeMesh(rightMesh)
		setActiveMesh(leftMesh)

		const leftEyeUnsub = leftMesh.subscribe()
		const rightEyeUnsub = rightMesh.subscribe()

		return (() => {
			leftEyeUnsub()
			rightEyeUnsub()
		})
	}, [])


	 */
	const changeActiveMesh = (): void => {
		if (activeMesh === leftEyeMesh) {
			setActiveMesh(rightEyeMesh)
		} else {
			setActiveMesh(leftEyeMesh)
		}
	}

	// handle the null states in your render
	if (!canvas || !leftEyeMesh || !rightEyeMesh || !activeMesh) {
		// Render some loading state
		return <Sidebar changeActiveMesh={changeActiveMesh} activeMesh={activeMesh}/>
	}

	return (
		<>
			<Sidebar changeActiveMesh={changeActiveMesh} activeMesh={activeMesh}/>
			<Content>
				<Canvas canvasRef={canvasRef} canvas={canvas} activeMesh={activeMesh}/>
			</Content>
		</>
	)
}

export default AmslerGrid
