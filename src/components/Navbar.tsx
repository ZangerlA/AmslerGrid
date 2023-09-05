import React, {FC, useEffect, useRef, useState} from "react";
import {
	Button,
	Dropdown, Empty,
	Form,
	Input,
	MenuProps,
	Modal, Popconfirm,
	Radio,
	RadioChangeEvent,
	Segmented,
	Select,
	Upload
} from "antd";
import Icon from "antd/es/icon";
import {
	FileOutlined,
	FolderOpenOutlined, PrinterOutlined,
	QuestionCircleOutlined,
	QuestionOutlined, ReloadOutlined,
	SaveOutlined, UploadOutlined
} from "@ant-design/icons"
import CustomDropdown from "./CustomDropdown"
import HelpWindow from "./HelpWindow"
import { useTranslation, Trans } from 'react-i18next'
import {SaveFile} from "../types/SaveFile"
import {toReadableDate} from "../helperMethods/toReadableDate"
import Title from "antd/lib/typography/Title"
import PDF from "./PDF"
import ReactPDF from "@react-pdf/renderer"
import PDFViewer = ReactPDF.PDFViewer
import ReactDOM from "react-dom"

type LanguageMap = {
	[key: string]: {
		nativeName: string
	}
}

type NavbarProps = {
	changeActiveMesh: () => void,
	handleSaveToFile: (username: string) => void,
	handleSave: () => [],
	handleLoad: (data: SaveFile) => void,
	printGrids: () => {},
	handleLoadFromFile: (file: File) => boolean,
	handleImageUpload: (file: File) => boolean,
}
const Navbar: FC<NavbarProps> = (props) => {

	const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false)
	const [isFileSaveModalOpen, setIsFileSaveModalOpen] = useState<boolean>(false)
	const [savedMeshData, setSavedMeshData] = useState(() => {
		const storedMeshData = localStorage.getItem('meshData')
		return storedMeshData ? JSON.parse(storedMeshData) : []
	})
	const [selectedEye, setSelectedEye] = useState<string>('leftEye')
	const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false)
	const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false)
	const [selectedSaveData, setSelectedSaveData] = useState<SaveFile | null>(null)
	const [form] = Form.useForm()
	const { t, i18n } = useTranslation()

	const languages: LanguageMap = {
		en: { nativeName: 'English' },
		de: { nativeName: 'Deutsch' }
	};

	const eyeOptions = [
		{label: t("navbar.leftEye"), value: 'leftEye'},
		{label: t("navbar.rightEye"), value: 'rightEye'},
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

	const openPDFNewWindow = () => {
		const newWindow = window.open("", "_blank")
		const images: any = props.printGrids()
		if (newWindow) {
			newWindow.document.write('<div id="pdf-root"></div>')
			const rootElement = newWindow.document.getElementById("pdf-root")
			ReactDOM.render(<PDF canvas1ImageSrc={images["leftEye"]} canvas2ImageSrc={images["rightEye"]}/>, rootElement)
		}
	}

	const navbarStyle = {
		display: 'flex',
		justifyContent: 'flex-start',
		height: '52px',
		backgroundColor: 'white',
		color: 'white',
		borderBottom: '1px solid #ddd',
	}

	const navbarLeftStyle = {
		display: 'flex',
	}

	const navbarRightStyle = {
		display: 'flex',
		margin: '10px 10px 10px auto',
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
		marginLeft: '20px'
	}

	const currentLanguageName = languages[i18n.resolvedLanguage!].nativeName

	return (
		<div style={navbarStyle}>
			<div style={navbarLeftStyle}>
				<CustomDropdown trigger={<Button style={{margin: '10px 10px 0px 10px'}}><FileOutlined />{t("navbar.fileButton")}</Button>}>
					<Button type="text" style={dropdownButtonStyle} icon={<SaveOutlined />} onClick={() => setIsFileSaveModalOpen(true)}>{t("fileSave.dropdown.saveToFile")}</Button>
					<Upload beforeUpload={props.handleLoadFromFile} showUploadList={false}>
						<Button type="text" style={dropdownButtonStyle} icon={<FolderOpenOutlined />}>
							{t("fileSave.dropdown.loadFromFile")}
						</Button>
					</Upload>
					<Button type="text" style={dropdownButtonStyle} icon={<PrinterOutlined />} onClick={openPDFNewWindow}>{t("fileSave.dropdown.printPDF")}</Button>
					<Upload beforeUpload={props.handleImageUpload} showUploadList={false}>
						<Button type="text" style={dropdownButtonStyle} icon={<UploadOutlined />}>
							{t("fileSave.dropdown.uploadImage")}
						</Button>
					</Upload>
				</CustomDropdown>
				<Button style={buttonStyle} icon={<SaveOutlined />} onClick={() => setSavedMeshData(props.handleSave())}>{t("navbar.quicksaveButton")}</Button>
				<CustomDropdown trigger={<Button style={{margin: '10px 10px 0px 10px'}} icon={<ReloadOutlined />}>{t("navbar.restoreButton")}</Button>}>
					{savedMeshData.sort((a: SaveFile, b: SaveFile) => b.date - a.date).map((data: SaveFile, index: number) => {
						return (
							<Button
								type="text"
								style={dropdownButtonStyle}
								onClick={() => {
									setSelectedSaveData(data)
									setIsRestoreModalOpen(true)
								}}
								key={index}
							>
								{`${t("restore.save")} #${index + 1} - ${toReadableDate(data.date)}`}
							</Button>
						)
					})}
					{savedMeshData.length > 0 && (<Button danger type="text" onClick={() => setIsDeleteAllModalOpen(true)}>{t("restore.deleteAll")}</Button>)}
					{savedMeshData.length === 0 && (<Empty style={{padding: "10px"}} description={<span>{t("restore.noData")} <br/>{t("restore.useQuickSave")}</span>}/>)}
				</CustomDropdown>
				<Radio.Group
					style={buttonStyle}
					options={eyeOptions}
					onChange={onEyeChange}
					value={selectedEye}
					optionType="button"
					buttonStyle="solid"
				/>
			</div>
			<div style={navbarRightStyle}>
				<span style={{display: "flex",  color: "black", alignItems: 'center', paddingRight: "5px"}}>{t("navbar.language")}</span>
				<Select
					defaultValue={currentLanguageName || 'English'}
					onChange={(lng) => i18n.changeLanguage(lng)}
				>
					{Object.keys(languages).map((lng) => (
						<Select.Option key={lng} value={lng}>
							{languages[lng].nativeName}
						</Select.Option>
					))}
				</Select>
				<Button style={helpStyle} icon={<QuestionOutlined />} shape={"circle"} onClick={() => setIsHelpModalOpen(true)}></Button>
			</div>
			<Modal
				title={t("restore.deleteAllTitle")}
				open={isDeleteAllModalOpen}
				onCancel={() => setIsDeleteAllModalOpen(false)}
				onOk={() => {
					setIsDeleteAllModalOpen(false)
					localStorage.removeItem("meshData")
					setSavedMeshData([])
				}}
				okType={"danger"}
				cancelText={t("restore.cancelText")}
				okText={t("restore.deleteAllOkText")}
			>
				<div style={{marginTop: "30px", marginBottom: "30px"}}>
					{t("restore.deleteAllMessage")}
				</div>
			</Modal>
			<Modal
				title={t("restore.confirmationTitle")}
				cancelText={t("restore.cancelText")}
				okText={t("restore.okText")}
				open={isRestoreModalOpen}
				onOk={() => {
					if (selectedSaveData) props.handleLoad(selectedSaveData)
					setIsRestoreModalOpen(false)
					setSelectedSaveData(null)
				}}
				onCancel={() => {
					setIsRestoreModalOpen(false)
					setSelectedSaveData(null)
				}}
			>
				<div style={{marginTop: "30px", marginBottom: "30px"}}>
					{t("restore.confirmationMessage")} <br/> {selectedSaveData ? toReadableDate(selectedSaveData.date) : ""} ?
				</div>
			</Modal>
			<Modal title={t("fileSave.saveToFile")} cancelText={t("fileSave.cancelButton")} okText={t("fileSave.saveButton")} open={isFileSaveModalOpen} onOk={handleFileSaveOk} onCancel={() => setIsFileSaveModalOpen(false)}>
				<Form form={form} style={{marginTop: "30px"}}>
					<span>{t("fileSave.enterName")}</span>
					<Form.Item initialValue={localStorage.getItem("name")} required={false} style={{marginTop: '15px'}} name="name" label="Name" rules={[{ required: true }]}>
						<Input />
					</Form.Item>
				</Form>
			</Modal>
			<HelpWindow title={''} open={isHelpModalOpen} setOpen={setIsHelpModalOpen}></HelpWindow>
		</div>
	)
}
export default Navbar












