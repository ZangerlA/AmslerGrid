import {FC, useEffect, useRef, useState, MouseEvent} from "react";
import useWindowDimensions from "./UseWindowDimensions";

type Coordinates = {
	x: number,
	y: number,
}

const Canvas: FC = (props) => {
	
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const { width, height } = useWindowDimensions()
	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	const [ mouseClick, setMouseClick ] = useState<Coordinates>({x:0, y:0})
	const [ grid, setGrid] = useState<Coordinates[][]>([])

	const calculateCoordinates = () => {
		let grid: Coordinates[][] = []
		const cellSizeHorizontal = (width-100) / 5
		const cellSizeVertical = (height-100) / 5
		for (let i = 0; i < 6; i++) {
			grid[i] = []
			for (let j = 0; j < 6; j++) {
				grid[i][j] = {x: (cellSizeHorizontal*i)+50, y: (cellSizeVertical*j)+50}
			}
		}
		setGrid(grid)
	}

	const draw = (ctx: CanvasRenderingContext2D) => {
		ctx.clearRect(0, 0, width, height)
		drawGridLines(ctx)
		drawHelpPoints(ctx)
		drawCenterPoint(ctx)
	}

	const drawCenterPoint = (ctx: CanvasRenderingContext2D) => {
		const center: Coordinates = {x: width/2, y: height/2}

		ctx.beginPath()
		ctx.fillStyle = "red";
		//ctx.fillRect(center.x,center.y, 10,10)
		ctx.arc(center.x, center.y, 10, 0, Math.PI*4, false)
		ctx.fill()

	}

	const drawGridLines = (ctx: CanvasRenderingContext2D) => {
		ctx.beginPath()
		for (let i = 0; i < grid.length; i++) {
			ctx.moveTo(grid[i][0].x, grid[i][0].y)
			for (let j = 0; j < grid[i].length; j++) {
				const point = grid[i][j]
				ctx.lineTo(point.x, point.y)
				if (i+1 < grid.length){
					ctx.lineTo(grid[i+1][j].x, grid[i+1][j].y)
				}
				ctx.moveTo(point.x, point.y)
			}
		}
		ctx.stroke()
	}

	const drawHelpPoints = (ctx: CanvasRenderingContext2D) => {
		ctx.beginPath()
		for (let i = 0; i < grid.length; i++) {
			for (let j = 0; j < grid[i].length; j++) {
				const coordinate = grid[i][j]
				ctx.moveTo(grid[i][j].x, grid[i][j].y)
				ctx.fillStyle = "black";
				ctx.arc(coordinate.x, coordinate.y, 7, 0, Math.PI*2, false)
				ctx.fill()
			}
		}
	}

	const handleClick = (event: MouseEvent)=>{
		event.preventDefault()
		setMouseClick({x: event.clientX, y: event.clientY})
	}

	useEffect(() => {
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
	}, [])

	useEffect(() => {
		if(ctx) {
			draw(ctx)
		}
	}, [ctx, grid])

	useEffect(() => {
		calculateCoordinates()
	}, [width, height])
	
	return (
		<canvas onClick={handleClick} ref={canvasRef} width={width} height={height} {...props}></canvas>
	)
}

// style={{boxShadow: "inset 0px 0px 0px 3px green"}}

export default Canvas