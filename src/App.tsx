import { Layout } from "antd"
import React from "react"
import "./App.css"
import AmslerGrid from "./components/AmslerGrid"

const { Content } = Layout

function App() {
	return (
		<Layout>
			<AmslerGrid/>
		</Layout>
	)
}

export default App
