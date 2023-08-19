import React, {FC, useState} from "react";
import type {MenuProps} from 'antd';
import {Button, Layout, Menu, Popover, Radio, RadioChangeEvent, Switch, Upload} from "antd";
import {
	EyeOutlined,
	FileImageOutlined,
	FolderOpenOutlined,
	FolderOutlined,
	QuestionCircleOutlined,
	SaveOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import {MenuClickEventHandler} from 'rc-menu/lib/interface'
import PopupWindow from "./PopupWindow";

type MenuItem = Required<MenuProps>['items'][number];
type SidebarProps = {
	changeActiveMesh: () => void,
	handleSave: () => void,
	handleLoad: (file: File) => boolean,
	handleImageUpload: (file: File) => boolean,
}

const {Sider} = Layout
const Sidebar: FC<SidebarProps> = (props) => {
	
	const [collapsed, setCollapsed] = useState(true)
	const [value, setValue] = useState('Left')
	const [modalOpen, setModalOpen] = useState(false);
	
	const options = [
		{label: 'Left', value: 'Left'},
		{label: 'Right', value: 'Right'},
	];
	
	const getItem = (label: React.ReactNode, key?: React.Key | null, icon?: React.ReactNode, children?: MenuItem[], type?: 'group',): MenuItem => {
		return {
			key,
			icon,
			children,
			label,
			type,
		} as MenuItem;
	}
	
	const onChange = ({target: {value}}: RadioChangeEvent) => {
		props.changeActiveMesh()
		setValue(value)
	}
	
	const items: MenuItem[] = [
		getItem('Menu', 'sub1', <FolderOutlined/>, [
			getItem('Save', 'save', <SaveOutlined/>),
			getItem(<Upload beforeUpload={props.handleLoad}><FolderOpenOutlined /> Load </Upload>, 'load'),
		]),
		
		getItem('Image', 'sub2', <FileImageOutlined/>, [
			getItem(<Upload beforeUpload={props.handleImageUpload}><UploadOutlined/> Upload </Upload>, 'upload'),
			/*getItem(<><span>Show image: </span><Switch /></>, '6'),*/
		]),
		
		/*getItem('Print', 'print', <PrinterOutlined/>),*/
		
		getItem('Eye Toggle', 'eye', <EyeOutlined/>, [
			getItem(<Radio.Group
					options={options}
					onChange={onChange}
					value={value}
					optionType="button"
					buttonStyle="solid"
				/>
				, 'leftRight')
		]),
		getItem('Help', 'help',<QuestionCircleOutlined/>),
	];
	
	const handleClick: MenuClickEventHandler = (e) => {
		if (e.key === 'print') {
		
		}
		else if (e.key === 'help'){
			setModalOpen(true)
		}
		else if (e.key === 'save'){
			props.handleSave()
		}
		//console.log(e.key)
	}
	
	return (
		<Sider style={{position: "fixed", height: "100vh"}} collapsible collapsed={collapsed} width={175}
			   collapsedWidth={60} onCollapse={(value) => setCollapsed(value)}>
			<Menu
				mode="vertical"
				style={{height: '100%', borderRight: 0}}
				items={items}
				onClick={handleClick}
			/>
			<PopupWindow title={''} open={modalOpen} setOpen={setModalOpen}></PopupWindow>
		</Sider>
	)
}

export default Sidebar;