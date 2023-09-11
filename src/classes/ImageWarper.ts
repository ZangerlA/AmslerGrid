import { Dimension } from "../customHooks/UseWindowDimensions"
import { calculateCenter } from "../helperMethods/calculateCenter"
import { Point } from "../types/Coordinate"
import { MeshCanvas } from "./MeshCanvas"
import { Polygon } from "./Polygon"
import { Vertex } from "./Vertex"

export type Unsubscribe = () => void;
type Subscriber = (distortedImage: ImageData | undefined) => void

export class ImageWarper {
	public canvas?: MeshCanvas
	public image?: HTMLImageElement
	public imagePosition?: Point
	public tasks: Set<Vertex[][]> = new Set<Vertex[][]>()
	private readonly originalMesh: Vertex[][]
	private readonly polygons: Set<Polygon>
	private currentMesh?: Vertex[][]
	private nextMesh?: Vertex[][]
	private subscribers: Subscriber[] = []
	private temporaryPolygons: Polygon[] = []

	constructor(originalMesh: Vertex[][], polygons: Set<Polygon>) {
		this.originalMesh = originalMesh
		this.polygons = polygons
	}

	public subscribeDistortion(subscriber: (distortedImage: ImageData | undefined) => void): Unsubscribe {
		this.subscribers.push(subscriber)
		return () => this.subscribers = this.subscribers.filter(s => s !== subscriber)
	}

	public pushWarp(mesh: Vertex[][]): void {

		this.tasks?.add(mesh)

		//setTimeout(() => this.warp(), 10)
		this.nextMesh = mesh
		this.warp()
	}

	warp(): void {
		if ( !this.canvas || !this.nextMesh ) return

		this.currentMesh = this.nextMesh
		this.nextMesh = undefined

		this.resetWarpCanvas()
		const originalImageData = this.canvas.getImageData()
		const originalPixels = originalImageData.data

		let activePolygons: Polygon[] = []
		this.polygons.forEach((polygon) => {
			activePolygons.push(...polygon.gatherChildren([]))
		})

		const movedPolygons = activePolygons.filter((polygon) => polygon.moved())
		for ( let i = 0; i < movedPolygons.length; i++ ) {
			const polygon = movedPolygons[i]
			const bbox = this.getBoundingBox(this.originalMesh, polygon, this.canvas.dimension)
			//bbox.minX  += 1
			//bbox.minY  += 1
			this.canvas.clearCanvas({ x: bbox.minX, y: bbox.minY }, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY)
		}
		const imageData = this.canvas.getImageData()
		const pixels = imageData.data
		const test = []

		for ( let i = 0; i < movedPolygons.length; i++ ) {
			const chunkyBoy = movedPolygons[i]

			const polygons = this.splitPolygon([chunkyBoy])
			for ( let polygon of polygons ) {
				const bbox = this.getBoundingBox(this.currentMesh, polygon, this.canvas.dimension)
				test.push(bbox)
				for ( let y = bbox.minY; y <= bbox.maxY; y++ ) {
					for ( let x = bbox.minX; x <= bbox.maxX; x++ ) {
						if ( polygon.hasInside({ x, y }) ) {
							const index = ((y) * this.canvas.dimension.width + (x)) * 4
							const relPos = this.getRelativePosition(this.currentMesh, { x, y }, polygon)
							const originalPos = this.interpolate(this.originalMesh, relPos, polygon)
							const origIndex = ((Math.floor(originalPos.y)) * this.canvas.dimension.width + (Math.floor(originalPos.x))) * 4
							pixels[index] = originalPixels[origIndex]
							pixels[index + 1] = originalPixels[origIndex + 1]
							pixels[index + 2] = originalPixels[origIndex + 2]
							pixels[index + 3] = originalPixels[origIndex + 3]
						}
					}
				}
			}

		}
		this.canvas.drawImage(imageData, { x: 0, y: 0 })
		this.reverseSplit()
		const ctx = this.canvas.ctx

		/* Leave for debugging, shows rectangles for warping
		for (let i = 0; i < test.length; i++) {
			ctx.beginPath()
			ctx.strokeStyle = '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6)
			ctx.lineWidth = 5
			ctx.rect(test[i].minX,test[i].minY,test[i].maxX - test[i].minX, test[i].maxY - test[i].minY)
			ctx.stroke()
		}
		 */

		this.currentMesh = undefined
		this.notifyAll(this.getImageAsData())
		setTimeout(() => this.warp(), 0)
		//this.warp()
	}

	public setImage(image: HTMLImageElement): void {
		this.image = image
		this.resetWarpCanvas()
	}

	public getImageAsData(): ImageData | undefined {
		if ( !this.canvas || !this.image || !this.imagePosition ) return
		return this.canvas.getImageData(this.imagePosition, this.image.width, this.image.height)
	}

	private notifyAll(distortedImage: ImageData | undefined) {
		this.subscribers.forEach(s => s(distortedImage))
	}

	private splitPolygon(result: Polygon[]): Polygon[] {
		for ( let polygon of result ) {
			let counter = 0
			for ( let j = 0; j < polygon.verticesIndices.length; j++ ) {
				const meshIndex = polygon.verticesIndices.at(j)
				if ( polygon.toVertex(meshIndex!).referenceCounterIsPositive() ) {
					counter++
				}
			}
			if ( counter > 4 ) {
				// if (this.splitPolygons.includes(polygon)) this.splitPolygon(result)

				//polygon.split()
				//result = result.filter((p ) => p !== polygon)
				//result.push(...polygon.children)

				const childEdgeLength = polygon.edgeLength / 2

				const centerVertexRow = polygon.verticesIndices[0].row + childEdgeLength
				const centerVertexCol = polygon.verticesIndices[0].col + childEdgeLength
				const centerVertex = polygon.mesh.vertices[centerVertexRow][centerVertexCol]

				const ul = polygon.toVertex(polygon.verticesIndices[0])
				const ur = polygon.toVertex(polygon.verticesIndices[polygon.edgeLength])
				const lr = polygon.toVertex(polygon.verticesIndices[polygon.edgeLength * 2])
				const ll = polygon.toVertex(polygon.verticesIndices[polygon.edgeLength * 3])
				const cornervertices = [ul, ur, lr, ll]

				const activeVertices = polygon.getOwnActiveVertices()
				const filteredVertices = activeVertices.filter((vertex) => vertex.wasMoved || cornervertices.includes(vertex))

				//Need moved active vertices for correct calculation
				centerVertex.coordinate = calculateCenter(filteredVertices)
				centerVertex.wasMoved = true

				polygon.recalculateVertexPosition([ul, ur, lr, ll], childEdgeLength)

				const polygon1 = new Polygon(polygon.mesh, {
					row: polygon.verticesIndices[0].row,
					col: polygon.verticesIndices[0].col,
				}, childEdgeLength, "rgba(75,139,59,0.5)")
				const polygon2 = new Polygon(polygon.mesh, {
					row: polygon.verticesIndices[childEdgeLength].row,
					col: polygon.verticesIndices[childEdgeLength].col,
				}, childEdgeLength, "white")
				const polygon3 = new Polygon(polygon.mesh, {
					row: centerVertexRow,
					col: centerVertexCol,
				}, childEdgeLength, "rgba(75,139,59,0.5)")
				const polygon4 = new Polygon(polygon.mesh, {
					row: polygon.verticesIndices[polygon.verticesIndices.length - childEdgeLength].row,
					col: polygon.verticesIndices[polygon.verticesIndices.length - childEdgeLength].col,
				}, childEdgeLength, "white")
				polygon1.initializeReferences()
				polygon2.initializeReferences()
				polygon3.initializeReferences()
				polygon4.initializeReferences()

				result.push(
					polygon1,
					polygon2,
					polygon3,
					polygon4,
				)

				this.temporaryPolygons.push(
					polygon1,
					polygon2,
					polygon3,
					polygon4,
				)

				result = result.filter((p) => p !== polygon)

				this.splitPolygon(result)
			} else return result
		}

		return result
	}

	private reverseSplit(): void {
		for ( let polygon of this.temporaryPolygons ) {
			polygon.removeReferences()
		}
		this.temporaryPolygons = []
	}

	private getBoundingBox(mesh: Vertex[][], polygon: Polygon, dimension: Dimension) {
		let minX = Infinity
		let minY = Infinity
		let maxX = -Infinity
		let maxY = -Infinity

		for ( let i = 0; i < polygon.verticesIndices.length; i++ ) {
			const vertex = mesh[polygon.verticesIndices[i].row][polygon.verticesIndices[i].col]
			//if (vertex.referenceCounterIsPositive()) {
			minX = Math.min(minX, vertex.coordinate.x)
			minY = Math.min(minY, vertex.coordinate.y)
			maxX = Math.max(maxX, vertex.coordinate.x)
			maxY = Math.max(maxY, vertex.coordinate.y)
			//}
		}

		return {
			minX: Math.max(0, Math.floor(minX) + 1),
			minY: Math.max(0, Math.floor(minY) + 1),
			maxX: Math.min(dimension.width - 1, Math.ceil(maxX)),
			maxY: Math.min(dimension.height - 1, Math.ceil(maxY)),
		}
	}

	private interpolate(originalMesh: Vertex[][], pixel: Point, polygon: Polygon): Point {
		const [ul, ur, lr, ll] = this.getPolygonBoundaries(originalMesh, polygon)

		const x = ul.x * (1 - pixel.x) * (1 - pixel.y) +
			ur.x * pixel.x * (1 - pixel.y) +
			lr.x * pixel.x * pixel.y +
			ll.x * (1 - pixel.x) * pixel.y

		const y = ul.y * (1 - pixel.x) * (1 - pixel.y) +
			ur.y * pixel.x * (1 - pixel.y) +
			lr.y * pixel.x * pixel.y +
			ll.y * (1 - pixel.x) * pixel.y

		return { x, y }
	}

	private getRelativePosition(distortedMesh: Vertex[][], pixel: Point, polygon: Polygon): Point {
		const [P1, P2, P3, P4] = this.getPolygonBoundaries(distortedMesh, polygon)
		const P5 = pixel

		const a = P1.x * P3.y - P1.x * P4.y - P2.x * P3.y + P2.x * P4.y - P3.x * P1.y + P3.x * P2.y + P4.x * P1.y - P4.x * P2.y
		const b = -P1.x * P3.y + 2 * P1.x * P4.y - P1.x * P5.y - P2.x * P4.y + P2.x * P5.y + P3.x * P1.y - P3.x * P5.y - 2 * P4.x * P1.y + P4.x * P2.y + P4.x * P5.y + P5.x * P1.y - P5.x * P2.y + P5.x * P3.y - P5.x * P4.y
		const c = -P1.x * P4.y + P1.x * P5.y + P4.x * P1.y - P4.x * P5.y - P5.x * P1.y + P5.x * P4.y

		const solutions = this.solveQuadratic(a, b, c)

		// Select the best solution and calculate the corresponding v value
		let u = 0, v = 0
		for ( const sol of solutions ) {
			const u_candidate = sol
			const Pv0 = { x: P1.x + u_candidate * (P2.x - P1.x), y: P1.y + u_candidate * (P2.y - P1.y) }
			const Pv1 = { x: P4.x + u_candidate * (P3.x - P4.x), y: P4.y + u_candidate * (P3.y - P4.y) }

			const diff_x = Pv1.x - Pv0.x
			const diff_y = Pv1.y - Pv0.y

			if ( Math.abs(diff_x) > Math.abs(diff_y) ) {
				v = (P5.x - Pv0.x) / diff_x
			} else {
				v = (P5.y - Pv0.y) / diff_y
			}

			// Check if the solution is within the [0, 1] range for both u and v
			if ( u_candidate >= 0 && u_candidate <= 1 && v >= 0 && v <= 1 ) {
				u = u_candidate
				break
			}
		}

		return { x: u, y: v }
	}

	private solveQuadratic(a: number, b: number, c: number): number[] {
		if ( Math.abs(a) < Number.EPSILON ) { // Linear equation
			if ( Math.abs(b) < Number.EPSILON ) {
				return [] // No solutions, as both a and b are close to zero
			}
			return [-c / b] // One solution
		}

		const discriminant = b * b - 4 * a * c

		if ( discriminant < 0 ) {
			return [] // No real solutions
		} else if ( Math.abs(discriminant) < Number.EPSILON ) {
			return [-b / (2 * a)] // One real solution (discriminant is close to zero)
		} else {
			const sqrtDiscriminant = Math.sqrt(discriminant)
			return [
				(-b + sqrtDiscriminant) / (2 * a), // First real solution
				(-b - sqrtDiscriminant) / (2 * a),  // Second real solution
			]
		}
	}

	private getPolygonBoundaries(mesh: Vertex[][], polygon: Polygon): Point[] {
		const result = []
		result.push(mesh[polygon.verticesIndices[0].row][polygon.verticesIndices[0].col].coordinate)
		result.push(mesh[polygon.verticesIndices[polygon.edgeLength].row][polygon.verticesIndices[polygon.edgeLength].col].coordinate)
		result.push(mesh[polygon.verticesIndices[2 * polygon.edgeLength].row][polygon.verticesIndices[2 * polygon.edgeLength].col].coordinate)
		result.push(mesh[polygon.verticesIndices[3 * polygon.edgeLength].row][polygon.verticesIndices[3 * polygon.edgeLength].col].coordinate)
		return result
	}

	private resetWarpCanvas(): void {
		if ( !this.canvas || !this.image || !this.imagePosition ) return
		this.canvas.clearCanvas()
		this.canvas.drawImage(this.image, this.imagePosition)
	}
}