import React, { FC, ReactNode, useRef, useState } from "react"

type DropdownProps = {
	trigger: ReactNode
	children: ReactNode
}

export const Dropdown: FC<DropdownProps> = ({ trigger, children }) => {
	const [isOpen, setIsOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	const handleMouseEnter = () => {
		setIsOpen(true)
	}

	const handleMouseLeave = (event: React.MouseEvent) => {
		if ( event.relatedTarget instanceof Node && ref.current && !ref.current.contains(event.relatedTarget) ) {
			setIsOpen(false)
		}
	}

	const handleMouseOut = (event: React.MouseEvent) => {
		if ( !event.relatedTarget || (event.relatedTarget instanceof Node && ref.current && !ref.current.contains(event.relatedTarget)) ) {
			setIsOpen(false)
		}
	}

	const dropdownStyle: React.CSSProperties = {
		display: isOpen ? "flex" : "none",
		flexDirection: "column",
		gap: "2px",
		justifyContent: "flex-start",
		background: "white",
		position: "absolute",
		marginLeft: "10px",
		paddingTop: "10px",
		borderRadius: "5px",
		border: "1px solid #ddd",
	}

	return (
		<div ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseOut={handleMouseOut}>
			<div>{trigger}</div>
			<div style={dropdownStyle}>
				{children}
			</div>
		</div>
	)
}

export default Dropdown
