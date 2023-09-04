import React, {FC, useRef, useState} from "react";
import {Button, Dropdown, Form, Input, MenuProps, Modal, Radio, RadioChangeEvent, Segmented, Upload} from "antd";
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
	handleSaveToFile: (username: string) => void,
	handleSave: () => void,
	handleLoad: () => void,
	printGrids: () => void,
	handleLoadFromFile: (file: File) => boolean,
	handleImageUpload: (file: File) => boolean,
}
const Navbar: FC<NavbarProps> = (props) => {

	const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
	const [isFileSaveModalOpen, setIsFileSaveModalOpen] = useState<boolean>(false)
	const [selectedEye, setSelectedEye] = useState<string>('leftEye')
	const [form] = Form.useForm();

	const eyeOptions = [
		{label: 'Left eye', value: 'leftEye'},
		{label: 'Right eye', value: 'rightEye'},
	]

	const onEyeChange = ({target: {value}}: RadioChangeEvent) => {
		props.changeActiveMesh()
		setSelectedEye(value)
	}

	const handleFileSaveOk = () => {
		setIsFileSaveModalOpen(false)
		localStorage.setItem("name", form.getFieldValue("name"))
		props.handleSaveToFile(form.getFieldValue("name"))
	}

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

	const dropdownButtonStyle: React.CSSProperties = {
		textAlign: 'left',
		padding: '8px 20px 8px 15px',
		height: '40px',
	}

	const helpStyle: React.CSSProperties = {
		margin: '10px 10px 10px auto',
	}

	return (
		<div style={navbarStyle}>
			<CustomDropdown trigger={<Button style={{margin: '10px 10px 0px 10px'}}><FileOutlined /> File</Button>}>
				<Button type="text" style={dropdownButtonStyle} icon={<SaveOutlined />} onClick={() => setIsFileSaveModalOpen(true)}>Save to file</Button>
				<Upload beforeUpload={props.handleLoadFromFile} showUploadList={false}>
					<Button type="text" style={dropdownButtonStyle} icon={<FolderOpenOutlined />}>
						Load from file
					</Button>
				</Upload>
				<Button type="text" style={dropdownButtonStyle} icon={<PrinterOutlined />} onClick={props.printGrids}>Print to PDF</Button>
				<Upload beforeUpload={props.handleImageUpload} showUploadList={false}>
					<Button type="text" style={dropdownButtonStyle} icon={<UploadOutlined />}>
						Upload image
					</Button>
				</Upload>
			</CustomDropdown>
			<Radio.Group
				style={buttonStyle}
				options={eyeOptions}
				onChange={onEyeChange}
				value={selectedEye}
				optionType="button"
				buttonStyle="solid"
			/>
			<Button style={helpStyle} icon={<QuestionOutlined />} shape={"circle"} onClick={() => setIsHelpModalOpen(true)}></Button>
			<Modal title="Save to file" okText="Save" open={isFileSaveModalOpen} onOk={handleFileSaveOk} onCancel={() => setIsFileSaveModalOpen(false)}>
				<Form form={form} style={{marginTop: "30px"}}>
					<span>Please enter your name:</span>
					<Form.Item initialValue={localStorage.getItem("name")} required={false} style={{marginTop: '15px'}} name="name" label="Name" rules={[{ required: true }]}>
						<Input />
					</Form.Item>
				</Form>
			</Modal>
			<PopupWindow title={''} open={isHelpModalOpen} setOpen={setIsHelpModalOpen}></PopupWindow>
		</div>
	)
}
export default Navbar












