import React from 'react';
import './App.css';
import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import {Layout, Menu} from "antd";

const { Content } = Layout

function App() {
	return (
		<Layout>
			<Sidebar/>
			<Content>
				<Canvas/>
			</Content>
		</Layout>
	);
}

export default App;
