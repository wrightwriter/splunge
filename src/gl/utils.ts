// ts-nocheck

import {smoothstep} from 'wmath'

// import { smoothstep } from "./old/wmath"
// import chroma from "chroma-js"

// export function assert(value: unknown): asserts value;
const M = [1]
const D = [1]
for (let i = 0, m = 1, d = 1; i < 24; i++) {
	M.push((m <<= 1))
	D.push((d *= 0.5))
}
const power2 = (e: number) => (e < 0 ? D[-e] : M[e])

function uncached_fromBits(n: number) {
	// n &= 0xFFFF;
	const f = calc((n >> 10) & 0x1f, n & 0x3ff)
	return n >> 15 ? -f : f
}

function calc(exponent: number, fraction: number) {
	function binary(bias: number, payload: number) {
		for (; fraction; fraction >>= 1) {
			if (fraction & 1) payload += power2(bias)
			++bias
		}
		return payload
	}

	if (exponent === 0x1f) return fraction ? NaN : Infinity
	if (!exponent) return binary(-24, 0)
	exponent -= 0xf
	return binary(exponent - 10, power2(exponent))
}

const _cache: number[] = []
export const Float16 = {
	fromBits: (n: number) => _cache[n] ?? (_cache[n] = uncached_fromBits(n)),
	uncached_fromBits,
}

export function loop(n: number, cb: (n: number, iters: number) => any) {
	for (let i = 0; i < n; i++) {
		cb(i, n)
	}
}
export function ifExistsAElseB(A: any, B: any) {
	return A ? A : B
}

export class Col {
	color: number[]
	idx: number
	constructor(color: number[], idx: number) {
		this.color = color
		this.idx = idx
	}
}

// export class Palette {
// 	private cols: Col[] = []
// 	public blendMode: chroma.InterpolationMode = 'lrgb'
// 	public smoothInterpolation: boolean = true
// 	// private _tex?: THREE.DataTexture

// 	public addCols(cols: Col[]) {
// 		for (let col of cols) {
// 			this.addCol(col.color, col.idx)
// 		}
// 	}

// 	public addCol(
// 		col: number[],
// 		idx: number = this.cols.length === 0
// 			? 0
// 			: this.cols[this.cols.length - 1].idx + (1 - this.cols[this.cols.length - 1].idx) * 0.5,
// 	) {
// 		this.cols.push({
// 			color: col,
// 			idx: idx,
// 		})
// 	}
// 	public pickCol(idx: number): number[] {
// 		for (let i = 0; i < this.cols.length; i++) {
// 			const colCurr: Col = this.cols[i]
// 			const colNext: Col = this.cols[(i + 1) % this.cols.length]
// 			// if (colCurr.idx <= idx) {
// 			if (colCurr.idx <= idx) {
// 				let dist: number
// 				let fr: number
// 				if (i === this.cols.length - 1) {
// 					// last iter
// 					dist = 1 - colCurr.idx + colNext.idx
// 					fr = (idx - colCurr.idx) / dist
// 				} else {
// 					if (idx < colNext.idx) {
// 						dist = colNext.idx - colCurr.idx
// 						fr = (idx - colCurr.idx) / dist
// 					} else {
// 						continue
// 					}
// 				}
// 				if (this.smoothInterpolation) fr = smoothstep(0, 1, fr) // TODO: make cheaper
// 				let col: number[] = [
// 					colCurr.color[0] * fr + colNext.color[0] * (1 - fr),
// 					colCurr.color[1] * fr + colNext.color[1] * (1 - fr),
// 					colCurr.color[2] * fr + colNext.color[2] * (1 - fr),
// 					1,
// 				]
// 				return col
// 				// let colChroma: number[] = chroma
// 				//   .mix(
// 				//     chroma.gl(colCurr.color[0], colCurr.color[1], colCurr.color[2],1),
// 				//     chroma.gl(colNext.color[0], colNext.color[1], colNext.color[2],1),
// 				//     fr,
// 				//     this.blendMode
// 				//   )
// 				//   .gl()
// 				// colChroma[3] = 1

// 				// return colChroma
// 			}
// 		}
// 		return [...this.cols[this.cols.length - 1].color]
// 	}
// 	private getTexArr(res: number): Float32Array {
// 		const palArr = new Float32Array(res * 4)

// 		loop(res, (i) => {
// 			const mul = 1
// 			const c = this.pickCol(i / res)
// 			const idx = i * 4
// 			palArr[idx + 0] = c[0] * mul
// 			palArr[idx + 1] = c[1] * mul
// 			palArr[idx + 2] = c[2] * mul
// 			palArr[idx + 3] = mul
// 		})
// 		return palArr
// 	}

// public get tex(){
//   if(this._tex)
//     return this._tex
//   else{
//     this._tex = this.generateTexture()
//     return this._tex
//   }
// }
// public updateTexture(tex: THREE.DataTexture): THREE.DataTexture{
//   const palArr = this.getTexArr(tex.image.width)
//   tex.image.data.set(palArr)
//   tex.needsUpdate = true
//   return tex
// }
// public generateTexture(res: number = 2000): THREE.DataTexture{
//   const palArr = this.getTexArr(res*1) // ?

//   const dataTex = new THREE.DataTexture(palArr, res, 1, RGBAFormat, FloatType)
//   dataTex.needsUpdate = true
//   return dataTex
// }
// }
