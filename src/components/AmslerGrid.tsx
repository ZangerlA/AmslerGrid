import React, {FC, useState} from "react";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import {Layout} from "antd";
import {leftEyeMesh, Mesh, rightEyeMesh} from "../classes/Mesh";

const {Content} = Layout

const AmslerGrid: FC = () => {
	const [activeMesh, setActiveMesh] = useState<Mesh>(leftEyeMesh)
	
	const changeActiveMesh = (): void => {
		if (activeMesh === leftEyeMesh) {
			setActiveMesh(rightEyeMesh)
		} else {
			setActiveMesh(leftEyeMesh)
		}
	}
	
	return (
		<>
			<Sidebar changeActiveMesh={changeActiveMesh} activeMesh={activeMesh}/>
			<Content>
				<Canvas activeMesh={activeMesh}/>
			</Content>
		</>
	)
}

export default AmslerGrid