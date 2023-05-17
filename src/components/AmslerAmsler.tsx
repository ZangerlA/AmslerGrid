import React, {FC, useState} from "react";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import {Layout} from "antd";
import {Mesh} from "../classes/Mesh";
import canvas from "./Canvas";

const { Content } = Layout

enum MeshType {
	Left,
	Right,
}

const AmslerAmsler: FC = () => {
	const [ leftEyeMesh, setLeftEyeMesh ] = useState<Mesh>(new Mesh())
	const [ rightEyeMesh, setRightEyeMesh ] = useState<Mesh>(new Mesh())
	const [ activeMesh, setActiveMesh ] = useState<Mesh>(leftEyeMesh)

	const changeActiveMesh = (): void =>{
		if(activeMesh === leftEyeMesh){
			setActiveMesh(rightEyeMesh)
		}else {
			setActiveMesh(leftEyeMesh)
		}
	}
	const setCanvas = (canvas: HTMLCanvasElement): void => {
		setLeftEyeMesh(new Mesh(canvas))
		setRightEyeMesh(new Mesh(canvas))
	}

	return (
		<>
			<Sidebar changeActiveMesh={changeActiveMesh} activeMesh={activeMesh}/>
			<Content>
				<Canvas activeMesh={activeMesh} setCanvas={setCanvas}/>
			</Content>
		</>
	)
}

export default  AmslerAmsler