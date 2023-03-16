import {FC, useEffect, useRef, useState} from "react";

const Canvas: FC = (props) => {
	
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
	
	const draw = (ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = "green";
		ctx.fillRect(10, 10, 1500, 1000);
	}
	
	useEffect(() => {
		const canvas = canvasRef.current
		setCtx((canvas!.getContext('2d'))!)
		
		if (ctx) {
			draw(ctx)
		}
		
	},[ctx])
	
	return (
		<canvas ref={canvasRef} {...props}></canvas>
	)
}

export default Canvas