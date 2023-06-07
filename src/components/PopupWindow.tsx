import { Button, Modal } from 'antd';
import {FC, useState} from "react";

type PopupWindowProps = {
	title: string
}
const PopupWindow: FC<PopupWindowProps> = (props) => {
	const [modalOpen, setModalOpen] = useState(true);

	return (
		<Modal
			title = {props.title}
			centered
			open={modalOpen}
			onOk={() => setModalOpen(false)}
			onCancel={() => setModalOpen(false)}
		>
			<p>Controls:</p>
			<p style={{marginLeft: 20}}>Mouse Left Click ... Drag Point</p>
			<p style={{marginLeft: 20}}>Mouse Right Click ... Select Area</p>
			<p style={{marginLeft: 20}}>Selected + Mouse Wheel Up/Down ... Rotate selected</p>
			<p style={{marginLeft: 20}}>Selected + Strg/Ctrl + Mouse Wheel Up/Down ... Scale selected</p>
			<p style={{marginLeft: 20}}>Strg/Ctrl + Mouse Left Click ... Split Area</p>

			Areas are splitable up to 3 times
			You can upload your own photo in the Sidebar to display it.

		</Modal>
	)
}

export default PopupWindow;