import {Dimension} from "../customHooks/UseWindowDimensions";

export const scaleImage = (image: HTMLImageElement, dimension: Dimension): Promise<HTMLImageElement> => {
	let scaleFactorWidth = 1
	let scaleFactorHeight = 1
	if (dimension.width - 100 < image.width) {
		scaleFactorWidth = (dimension.width - 100) / image.width
	}
	if (dimension.height - 100 < image.height) {
		scaleFactorHeight = (dimension.height - 100) / image.height
	}
	const scaleFactor = scaleFactorWidth >= scaleFactorHeight ? scaleFactorHeight : scaleFactorWidth
	const scaledWidth = image.width * scaleFactor
	const scaledHeight = image.height * scaleFactor
	
	const canvas = document.createElement("canvas")
	const ctx = canvas?.getContext("2d") as CanvasRenderingContext2D
	
	canvas.width = scaledWidth
	canvas.height = scaledHeight
	ctx.drawImage(image,0,0, scaledWidth, scaledHeight)
	return loadImage(canvas!.toDataURL("image/png"))
}

export const loadImage = (src: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}