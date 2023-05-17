import React from 'react';
import './App.css';
import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import {Layout, Menu} from "antd";
import AmslerAmsler from "./components/AmslerAmsler";

const { Content } = Layout

function App() {
	return (
		<Layout>
			<AmslerAmsler />
		</Layout>
	);
}

export default App;
