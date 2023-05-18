import React, {FC, useState} from "react";
import type {MenuProps} from 'antd';
import {Layout, Menu, Radio, RadioChangeEvent, Upload} from "antd";
import {
	EyeOutlined,
	FileImageOutlined,
	FolderOutlined,
	PrinterOutlined,
	SaveOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import {MenuClickEventHandler} from 'rc-menu/lib/interface'
import {Mesh} from "../classes/Mesh";

type MenuItem = Required<MenuProps>['items'][number];
type SidebarProps = {
	changeActiveMesh: () => void,
	activeMesh: Mesh
}

const {Content, Sider} = Layout
const Sidebar: FC<SidebarProps> = (props) => {
	
	const [collapsed, setCollapsed] = useState(true)
	const [value, setValue] = useState('Left')
	
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
	
	const handleBeforeUpload = (file: File): boolean => {
		const url = URL.createObjectURL(file)
		props.activeMesh.setScaledImage(url)
		return false
	}
	
	const onChange = ({target: {value}}: RadioChangeEvent) => {
		props.changeActiveMesh()
		setValue(value)
	}
	
	const items: MenuItem[] = [
		getItem('Menu', 'sub1', <FolderOutlined/>, [
			getItem('Save', 'save', <SaveOutlined/>),
			getItem('Option 2', '2'),
			getItem('Option 3', '3'),
			getItem('Option 4', '4'),
		]),
		
		getItem('Image', 'sub2', <FileImageOutlined/>, [
			getItem(<Upload beforeUpload={handleBeforeUpload}><UploadOutlined/> Upload </Upload>, 'upload'),
			getItem('Lock', '6'),
			getItem('Submenu', 'sub3', null, [getItem('Option 7', '7'), getItem('Option 8', '8')]),
		]),
		
		getItem('Print', 'print', <PrinterOutlined/>),
		
		getItem('Eye Toggle', 'eye', <EyeOutlined/>, [
			getItem(<Radio.Group
					options={options}
					onChange={onChange}
					value={value}
					optionType="button"
					buttonStyle="solid"
				/>
				, 'leftRight')
		])
	];
	
	const handleClick: MenuClickEventHandler = (e) => {
		if (e.key === 'print') {
			props.activeMesh.warpImage()
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
		</Sider>
	)
}

export default Sidebar;