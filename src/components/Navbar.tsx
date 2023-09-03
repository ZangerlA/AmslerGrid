import React, {FC, useRef, useState} from "react";
import {Button, Dropdown, MenuProps, Segmented, Upload} from "antd";
import Icon from "antd/es/icon";
import {
	FileOutlined,
	FolderOpenOutlined, PrinterOutlined,
	QuestionCircleOutlined,
	QuestionOutlined,
	SaveOutlined, UploadOutlined
} from "@ant-design/icons";
import CustomDropdown from "./CustomDropdown";
import PopupWindow from "./PopupWindow";

type NavbarProps = {
	changeActiveMesh: () => void,
	handleSaveToFile: () => void,
	handleSave: () => void,
	handleLoad: () => void,
	printGrids: () => void,
	handleLoadFromFile: (file: File) => boolean,
	handleImageUpload: (file: File) => boolean,
}
const Navbar: FC<NavbarProps> = (props) => {

	const [modalOpen, setModalOpen] = useState(false);

	const navbarStyle = {
		display: 'flex',
		justifyContent: 'flex-start',
		height: '52px',
		backgroundColor: 'white',
		color: 'white',
		borderBottom: '1px solid #ddd',
	}

	const buttonStyle: React.CSSProperties = {
		margin: '10px',
	}

	const dropdownbuttonStyle: React.CSSProperties = {
		textAlign: 'left',
		padding: '8px 20px 8px 15px',
		height: '40px',
	}

	const helpStyle: React.CSSProperties = {
		margin: '10px 10px 10px auto',
	}
	//margin top right bottom left
	return (
		<div style={navbarStyle}>
			<CustomDropdown trigger={<Button style={{margin: '10px 10px 0px 10px'}}><FileOutlined /> File</Button>}>
				<Button type="text" style={dropdownbuttonStyle} icon={<SaveOutlined />} onClick={props.handleSaveToFile}>Save to file</Button>
				<Upload beforeUpload={props.handleLoadFromFile} showUploadList={false}>
					<Button type="text" style={dropdownbuttonStyle} icon={<FolderOpenOutlined />}>
						Load from file
					</Button>
				</Upload>
				<Button type="text" style={dropdownbuttonStyle} icon={<PrinterOutlined />} onClick={props.printGrids}>Print to PDF</Button>
				<Upload beforeUpload={props.handleImageUpload} showUploadList={false}>
					<Button type="text" style={dropdownbuttonStyle} icon={<UploadOutlined />}>
						Upload image
					</Button>
				</Upload>
			</CustomDropdown>
			<Segmented style={buttonStyle}
				options={[
					{
						value: 'List',
						label: 'left eye',
					},
					{
						value: 'Kanban',
						label: 'right eye',
					},
				]}
			/>
			<Button style={helpStyle} icon={<QuestionOutlined />} shape={"circle"} onClick={() => setModalOpen(true)}></Button>
			<PopupWindow title={''} open={modalOpen} setOpen={setModalOpen}></PopupWindow>
		</div>
	)
}
export default Navbar












