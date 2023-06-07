import {Button, Modal} from 'antd';
import React, {FC} from "react";
import {Table, Tag} from "antd";
import type {ColumnsType} from "antd/es/table";
import {PlusOutlined} from "@ant-design/icons";

type PopupWindowProps = {
	title: string
	open: boolean
	setOpen: (open: boolean) => void
}

interface DataType {
	key: string;
	action: string;
	condition: string;
	tags: String[];
}

const PopupWindow: FC<PopupWindowProps> = (props) => {
	const dataSource: DataType[] = [
		{
			key: 'movepoint',
			action: 'Drag Point',
			condition: '',
			tags: ['Left Click'],
		},
		{
			key: 'movefield',
			action: 'Drag Field',
			condition: 'Field selected',
			tags: ['Left Click'],
		},
		{
			key: 'select',
			action: 'Select Field',
			condition: '',
			tags: ['Right Click'],
		},
		{
			key: 'split',
			action: 'Split Field',
			condition: '',
			tags: ['CTRL', '+', 'Left Click'],
		},
		{
			key: 'rotate',
			action: 'Rotate selected Fieldspan',
			condition: 'Field selected',
			tags: ['Wheel Up/Down'],
		},
		{
			key: 'scale',
			action: 'Scale selected Field',
			condition: 'Field selected',
			tags: ['SHIFT', '+', 'Wheel Up/Down'],
		},
		{
			key: 'deselect',
			action: 'Deselect all fields',
			condition: 'Field selected',
			tags: ['ESC'],
		},
		{
			key: 'showImage',
			action: 'Toggle warped image',
			condition: '',
			tags: ['SPACEBAR'],
		},
	];

	const columns : ColumnsType<DataType> = [
		{
			title: 'Action',
			dataIndex: 'action',
			key: 'action',
		},
		{
			title: 'Condition',
			dataIndex: 'condition',
			key: 'condition',
		},
		{
			title: 'Inputs',
			dataIndex: 'tags',
			key: 'tags',
			render: (tags: string[]) => (
				<span>
					{tags && tags.map((tag) => {
						let color = 'red'
						if (tag === '+'){
							return <span style={{marginRight: 2.5}}>+  </span>
						}
						if (tag === 'Left Click' || tag === 'Right Click'){
							color = 'blue'
						}
						if (tag === 'Wheel Up/Down'){
							color = 'purple'
						}
						if (tag === 'CTRL' || tag === 'SHIFT'){
							color = 'green'
						}
						return (
							<Tag color={color} key={tag}>
								{tag.toUpperCase()}
							</Tag>
						);
					})}
     			 </span>
			),
		},
	];

	let content = (
		<Table dataSource={dataSource} columns={columns} pagination={false}/>
	)

	console.log(dataSource)
	console.log(columns)

	return (
		<Modal
			title = {props.title}
			width={'30vw'}
			centered
			open={props.open}
			closable={false}
			footer={false}
			maskClosable={true}
			onCancel={() => props.setOpen(false)}
		>
			{content}
			<div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
				<Button type='primary' style={{marginTop: 20}} onClick={() => props.setOpen(false)}>Close</Button>
			</div>
		</Modal>
	)
}

export default PopupWindow;