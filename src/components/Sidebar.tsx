import React, {FC, useState} from "react";
import {Button, Drawer, Layout, Menu, Upload} from "antd";
import Icon from "antd/lib/icon";
import {
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	FileImageOutlined,
	FolderOutlined,
	UploadOutlined,
	PrinterOutlined,
	SaveOutlined,
	WeiboOutlined
} from "@ant-design/icons";
import type { MenuProps, MenuTheme } from 'antd';
import { MenuClickEventHandler } from 'rc-menu/lib/interface'
import {MeshInstance} from "../classes/Mesh";

type MenuItem = Required<MenuProps>['items'][number];

const {Content, Sider } = Layout

const Sidebar: FC = (props) => {

	const [collapsed, setCollapsed] = useState(true);
	function getItem(
		label: React.ReactNode,
		key?: React.Key | null,
		icon?: React.ReactNode,
		children?: MenuItem[],
		type?: 'group',
	): MenuItem {
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
		MeshInstance.setScaledImage(url)
		return false
	}

	const items: MenuItem[] = [
		getItem('Menu', 'sub1', <FolderOutlined />, [
			getItem('Save', 'save', <SaveOutlined/>),
			getItem('Option 2', '2'),
			getItem('Option 3', '3'),
			getItem('Option 4', '4'),
		]),

		getItem('Image', 'sub2', <FileImageOutlined />, [
			getItem(<Upload beforeUpload={handleBeforeUpload}><UploadOutlined /> Upload </Upload>, 'upload'),
			getItem('SuperUltraLock', '6'),
			getItem('Submenu', 'sub3', null, [getItem('Option 7', '7'), getItem('Option 8', '8')]),
		]),

		getItem('Print', 'print', <PrinterOutlined/>),

		getItem('Eye Toggle', 'key', <WeiboOutlined/>)
	];

	const handleClick: MenuClickEventHandler = ({key}) => {
		console.log(key)
	}

	return (
			<Sider style={{position: "fixed", height: "100vh"}} collapsible collapsed={collapsed} width={175} collapsedWidth={60} onCollapse={(value) => setCollapsed(value)}>
				<Menu
					mode="vertical"
					style={{ height: '100%', borderRight: 0 }}
					items={items}
					onClick={handleClick}
				/>
			</Sider>
	)
}

export default Sidebar;