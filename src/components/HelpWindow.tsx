import {Button, Modal, Table, Tag} from 'antd';
import React, {FC} from "react";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";

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

const HelpWindow: FC<PopupWindowProps> = (props) => {
	const { t } = useTranslation();

	const dataSource: DataType[] = [
		{
			key: 'movepoint',
			action: t("help.action.movePoint"),
			condition: '',
			tags: [t("input.leftClick")],
		},
		{
			key: 'movefield',
			action: t("help.action.moveField"),
			condition: t("help.condition.fieldSelected"),
			tags: [t("input.leftClick")],
		},
		{
			key: 'select',
			action: t("help.action.selectField"),
			condition: '',
			tags: [t("input.rightClick")],
		},
		{
			key: 'split',
			action: t("help.action.splitField"),
			condition: '',
			tags: [t("input.ctrl"), '+', t("input.leftClick")],
		},
		{
			key: 'merge',
			action: t("help.action.mergeFields"),
			condition: '',
			tags: [t("input.alt"), '+', t("input.leftClick")],
		},
		{
			key: 'rotate',
			action: t("help.action.rotateField"),
			condition: t("help.condition.fieldSelected"),
			tags: [t("input.wheel")],
		},
		{
			key: 'scale',
			action: t("help.action.scaleField"),
			condition: t("help.condition.fieldSelected"),
			tags: [t("input.shift"), '+', t("input.wheel")],
		},
		{
			key: 'deselect',
			action: t("help.action.deselectFields"),
			condition: t("help.condition.fieldSelected"),
			tags: [t("input.esc")],
		},
		{
			key: 'showImage',
			action: t("help.action.toggleImage"),
			condition: '',
			tags: [t("input.spacebar")],
		},
	];

	const columns : ColumnsType<DataType> = [
		{
			title: t("help.header.action"),
			dataIndex: 'action',
			key: 'action',
		},
		{
			title: t("help.header.condition"),
			dataIndex: 'condition',
			key: 'condition',
		},
		{
			title: t("help.header.input"),
			dataIndex: 'tags',
			key: 'tags',
			render: (tags: string[]) => (
				<span>
					{tags && tags.map((tag) => {
						let color = 'red'
						if (tag === '+'){
							return <span style={{marginRight: 2.5}}>+  </span>
						}
						if (tag === t("input.leftClick") || tag === t("input.rightClick")){
							color = 'blue'
						}
						if (tag === t("input.wheel")){
							color = 'purple'
						}
						if (tag === t("input.ctrl") || tag === t("input.shift") || tag === t("input.alt") || tag === t("input.esc") || tag === t("input.spacebar")){
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

	return (
		<Modal
			title = {props.title}
			centered
			open={props.open}
			closable={false}
			footer={false}
			maskClosable={true}
			width="700px"
			onCancel={() => props.setOpen(false)}
		>
			{content}
			<div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
				<Button type='primary' style={{marginTop: 20}} onClick={() => props.setOpen(false)}>{t("help.footer.close")}</Button>
			</div>
		</Modal>
	)
}

export default HelpWindow;