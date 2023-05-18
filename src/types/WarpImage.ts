import {Point} from "./Coordinate";

export type WarpImage = {
	image: HTMLImageElement,
	warpedImageData?: ImageData,
	imagePosition: Point,
}