import {Edge} from "../types/Edge";

export class ValueSet<T> {
	private _map: Map<string, T>
	private readonly hashFunction: (obj: T) => string
	
	constructor(hashFunction?: (obj: T) => string) {
		this._map = new Map()
		this.hashFunction = hashFunction ? hashFunction : (obj: T) => JSON.stringify(obj)
	}
	
	add(obj: T): void {
		const key = this.hashFunction(obj)
		this._map.set(key, obj)
	}
	
	union(set: ValueSet<T>): ValueSet<T> {
		set.forEach((value) => {
			this.add(value)
		})
		return this
	}
	
	delete(obj: T): boolean {
		const key = this.hashFunction(obj)
		return this._map.delete(key)
	}
	
	has(obj: T): boolean {
		const key = this.hashFunction(obj)
		return this._map.has(key)
	}
	
	size(): number {
		return this._map.size
	}
	
	values(): Array<T> {
		return Array.from(this._map.values())
	}
	
	forEach(callback: (value: T, index: number, array: T[]) => void): void {
		const values = this.values()
		values.forEach(callback)
	}
}

export const undirectedGraphHash = (obj: Edge): string => {
	if (obj.a.row === obj.b.row && obj.a.col > obj.b.col || obj.a.row > obj.b.row && obj.a.col === obj.b.col) {
		return JSON.stringify({a: {row: obj.b.row, col: obj.b.col}, b: {row: obj.a.row, col: obj.a.col}})
	} else return JSON.stringify(obj)
}