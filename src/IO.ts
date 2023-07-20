import {min, sqrt} from 'wmath'

interface keyState {
	down: boolean
	just_pressed: boolean
	just_unpressed: boolean
}

type BtnCode =
	| 'KeyA'
	| 'KeyB'
	| 'KeyC'
	| 'KeyD'
	| 'KeyE'
	| 'KeyF'
	| 'KeyG'
	| 'KeyH'
	| 'KeyI'
	| 'KeyJ'
	| 'KeyK'
	| 'KeyL'
	| 'KeyM'
	| 'KeyN'
	| 'KeyO'
	| 'KeyP'
	| 'KeyQ'
	| 'KeyR'
	| 'KeyS'
	| 'KeyT'
	| 'KeyU'
	| 'KeyI'
	| 'KeyV'
	| 'KeyW'
	| 'KeyX'
	| 'KeyY'
	| 'KeyZ'
	| 'Digit1'
	| 'Digit2'
	| 'Digit3'
	| 'Digit4'
	| 'Digit5'
	| 'Digit6'
	| 'Digit7'
	| 'Digit8'
	| 'Digit9'
	| 'Digit0'
	| 'ControlLeft'
	| 'AltLeft'
	| 'ShiftLeft'
	| 'Space'

export class IO {
	private keys = new Map<BtnCode, keyState>()

	// touch_positions = new Float32Array(8)
	// touch_positions_cnt = 0
	touches: {[key: number]: number[]} = {}
	two_finger_pinch_prev = false
	two_finger_pinch = false
	just_finished_pinch = false
	just_started_pinch = false
	touches_starting_positions = new Float32Array(4)
	touches_starting_mid_point = new Float32Array(2)
	touches_starting_length = 0
	touches_mid_point_prev = new Float32Array(2)
	pinch_pos = new Float32Array(2)
	pinch_zoom = 0

	// mouse_pos: Array<number> = [0, 0]
	mouse_pos: Float32Array = Float32Array.from([0, 0])
	delta_mouse_pos: Float32Array = Float32Array.from([0, 0])
	mouse_pos_prev: Float32Array = Float32Array.from([0, 0])
	mouse_down: boolean = false

	private _mouse_positions_during_last_frame = new Float32Array(50)
	private _mouse_positions_during_last_frame_b = new Float32Array(50)
	_mouse_positions_during_last_frame_cnt = 0
	_mouse_positions_during_last_frame_cnt_b = 0
	mouse_positions_arr_idx = 0

	get mouse_positions_during_last_frame(): Float32Array {
		return this.mouse_positions_arr_idx === 0
			? this._mouse_positions_during_last_frame
			: this._mouse_positions_during_last_frame_b
	}
	get mouse_positions_during_last_frame_cnt(): number {
		return this.mouse_positions_arr_idx === 0
			? this._mouse_positions_during_last_frame_cnt
			: this._mouse_positions_during_last_frame_cnt_b
	}

	pointerType: string = 'mouse'

	mouse_down_prev = false
	mouse_just_unpressed = false
	mouse_just_pressed = false
	mouse_just_moved = false

	mmb_just_unpressed = false
	mmb_just_pressed = false
	mmb_down = false

	pen_button_just_unpressed = false
	pen_button_just_pressed = false
	pen_button_down = false

	mouse_wheel: number = 0

	pressure: number = 0.0

	tilt: number[] = [0, 0]

	tick() {
		this.delta_mouse_pos[0] = this.mouse_pos[0] - this.mouse_pos_prev[0]
		this.delta_mouse_pos[1] = this.mouse_pos[1] - this.mouse_pos_prev[1]
		this.mouse_pos_prev[0] = this.mouse_pos[0]
		this.mouse_pos_prev[1] = this.mouse_pos[1]

		if (this.mouse_positions_arr_idx === 0) {
			this._mouse_positions_during_last_frame_cnt = 0
		} else {
			this._mouse_positions_during_last_frame_cnt_b = 0
		}
		this.mouse_positions_arr_idx = 1 - this.mouse_positions_arr_idx

		if (this.two_finger_pinch === false && this.two_finger_pinch_prev === true) {
			this.just_finished_pinch = true
		} else if (this.two_finger_pinch === true && this.two_finger_pinch_prev === false) {
			this.just_started_pinch = true
		}

		if (this.mouse_down !== this.mouse_down_prev) {
			if (this.mouse_down) {
				this.mouse_just_pressed = true
			} else {
				this.mouse_just_unpressed = true
			}
		}
	}
	tick_end() {
		this.mouse_just_pressed = false
		this.mouse_just_unpressed = false
		this.mouse_just_moved = false
		this.mouse_down_prev = this.mouse_down
		this.mmb_just_unpressed = false
		this.mmb_just_pressed = false
		this.pen_button_just_pressed = false
		this.pen_button_just_unpressed = false
		this.mouse_wheel = 0
		this.two_finger_pinch_prev = this.two_finger_pinch
		this.just_finished_pinch = false
		this.just_started_pinch = false
		Object.values(this.keys).forEach((key) => {
			key.just_unpressed = false
			key.just_pressed = false
		})
	}
	public getKey(code: BtnCode): keyState {
		const key = this.keys[code]
		if (key) {
			return key
		} else {
			return {down: false, just_pressed: false, just_unpressed: false}
		}
	}

	constructor() {
		window.addEventListener('keydown', (event) => {
			this.keys[event.code] = {down: true, just_pressed: true, just_unpressed: false}
			if (event.code === 'AltLeft') event.preventDefault()
		})
		window.addEventListener('keyup', (event) => {
			let just_unpressed = false
			if (this.getKey(event.code as BtnCode).down) just_unpressed = true
			this.keys[event.code] = {down: false, just_pressed: false, just_unpressed: just_unpressed}
		})
		window.addEventListener('wheel', (e) => {
			this.mouse_wheel = e.deltaY < 0 ? 1 : e.deltaY > 0 ? -1 : 0
		})
		window.addEventListener('mouseup', (e) => {
			if (e.button === 1) {
				this.mmb_down = false
				this.mmb_just_unpressed = true
			}
		})
		window.addEventListener('mousedown', (e) => {
			if (e.button === 1) {
				this.mmb_down = true
				this.mmb_just_pressed = true
				e.preventDefault()
			}
		})
		window.addEventListener('focus', () => {
			const l_alt = this.getKey('AltLeft')
			if (l_alt.down) {
				l_alt.just_unpressed = true
				l_alt.down = false
			}
		})
		// window.addEventListener('pointerrawupdate', (e) => {
		// 	console.log(e)
		// })

		// @ts-ignore
		window.addEventListener('pointerrawupdate', (e: PointerEvent) => {
			// if (e.buttons > 0) {
			// 	console.log(e)
			// }
			// console.log(e)
			if (e.height > 0 && e.buttons > 0) {
				if (!this.pen_button_down) {
					this.pen_button_just_pressed = true
					this.pen_button_down = true
				}
			} else if (e.buttons <= 0) {
				if (this.pen_button_down) {
					this.pen_button_just_unpressed = true
					this.pen_button_down = false
				}
			}
			const getRelativeMousePosition = (event: PointerEvent, target) => {
				target = target || event.target
				const rect = target.getBoundingClientRect()

				return {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				}
			}
			const getNoPaddingNoBorderCanvasRelativeMousePosition = (event: PointerEvent, target) => {
				target = target || event.target
				const pos = getRelativeMousePosition(event, target)

				pos.x = (pos.x * target.width) / target.clientWidth
				pos.y = (pos.y * target.height) / target.clientHeight

				return pos
			}
			// if (e.pointerType === 'pen') {
			// console.log(e)
			const gl = window.gl
			const pos = getNoPaddingNoBorderCanvasRelativeMousePosition(e, gl.canvas)

			const x = (pos.x / gl.canvas.width) * 2 - 1
			const y = (pos.y / gl.canvas.height) * -2 + 1

			// this.mouse_pos = [x, y]
			this.mouse_pos[0] = x
			this.mouse_pos[1] = y

			const is_back = this.mouse_positions_arr_idx === 0
			const positions = is_back ? this._mouse_positions_during_last_frame_b : this._mouse_positions_during_last_frame
			const idx = is_back ? this._mouse_positions_during_last_frame_cnt_b : this._mouse_positions_during_last_frame_cnt
			positions[idx * 2] = x
			positions[idx * 2 + 1] = y
			if (is_back) this._mouse_positions_during_last_frame_cnt_b++
			else this._mouse_positions_during_last_frame_cnt++

			this.pressure = e.pointerType === 'mouse' ? 1 : e.pressure ?? this.pressure
			this.mouse_just_moved = true

			this.tilt[0] = e.pointerType === 'mouse' ? 0 : e.altitudeAngle ?? this.tilt[0]
			this.tilt[1] = e.pointerType === 'mouse' ? 0 : e.azimuthAngle ?? this.tilt[1]
		})

		const canvas_element = document.querySelector('canvas') as HTMLCanvasElement
		canvas_element.addEventListener('touchstart', (e) => {
			for (let i = 0; i < e.targetTouches.length; i++) {
				const touch = e.targetTouches[i]
				const touch_id = touch.identifier
				this.touches[touch_id] = [touch.clientX, touch.clientY]
			}
		})

		const length = (ax: number, ay: number, bx: number, by: number): number => {
			return sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by))
		}

		canvas_element.addEventListener('touchmove', (e) => {
			if (e.targetTouches.length === 2) {
				if (this.two_finger_pinch === false) {
					// begin pinch
					this.touches_starting_positions[0] = e.targetTouches[0].clientX
					this.touches_starting_positions[1] = e.targetTouches[0].clientY
					this.touches_starting_positions[2] = e.targetTouches[1].clientX
					this.touches_starting_positions[3] = e.targetTouches[1].clientY
					this.touches_starting_mid_point[0] = e.targetTouches[0].clientX * 0.5 + e.targetTouches[1].clientX * 0.5
					this.touches_starting_mid_point[1] = e.targetTouches[0].clientY * 0.5 + e.targetTouches[1].clientY * 0.5
					this.pinch_zoom = 0
					this.touches_starting_length = length(
						e.targetTouches[0].clientX,
						e.targetTouches[0].clientY,
						e.targetTouches[1].clientX,
						e.targetTouches[1].clientY,
					)
					this.touches_mid_point_prev[0] = this.touches_starting_mid_point[0]
					this.touches_mid_point_prev[1] = this.touches_starting_mid_point[1]
					this.pinch_pos[0] = 0
					this.pinch_pos[1] = 0
				}
				this.two_finger_pinch = true
				const mid_point_x = e.targetTouches[0].clientX * 0.5 + e.targetTouches[1].clientX * 0.5
				const mid_point_y = e.targetTouches[0].clientY * 0.5 + e.targetTouches[1].clientY * 0.5

				const len = length(
					e.targetTouches[0].clientX,
					e.targetTouches[0].clientY,
					e.targetTouches[1].clientX,
					e.targetTouches[1].clientY,
				)
				const res = min(window.innerWidth, window.innerHeight)
				this.pinch_zoom = ((len - this.touches_starting_length) / res) * 4

				this.pinch_pos[0] += (((mid_point_x - this.touches_mid_point_prev[0]) / res) * 2) / window.zoom[0]
				this.pinch_pos[1] += (((mid_point_y - this.touches_mid_point_prev[1]) / res) * 2) / window.zoom[0]
				this.touches_mid_point_prev[0] = mid_point_x
				this.touches_mid_point_prev[1] = mid_point_y
			} else {
				if (this.two_finger_pinch === true) {
					this.two_finger_pinch = false
				}
			}
		})

		const touch_end = (e: TouchEvent) => {
			for (const id in Object.keys(this.touches)) {
				delete this.touches[id]
			}
			this.two_finger_pinch = false
		}

		canvas_element.addEventListener('touchcancel', (e) => {
			touch_end(e)
		})
		canvas_element.addEventListener('touchend', (e) => {
			touch_end(e)
		})

		// canvas_element.addEventListener('pointerleave', (e) => {
		// 	if (this.pen_button_down) {
		// 		this.pen_button_just_unpressed = true
		// 		this.pen_button_down = true
		// 	}
		// })

		canvas_element.addEventListener('pointerdown', (e) => {
			// console.log(e)
			// if (e.buttons > 0) {
			// if (!this.pen_button_down) {
			// 	this.pen_button_just_pressed = true
			// 	this.pen_button_down = true
			// 	console.log('pen button press')
			// }
			// }
			// console.log(e)
			this.pointerType = e.pointerType
			if (e.pointerType === 'mouse' && e.button !== 0) return
			this.mouse_down = true
		})
		window.addEventListener('pointerup', (e) => {
			// console.log(e)
			// {
			// 	if (this.pen_button_down) {
			// 		this.pen_button_just_unpressed = true
			// 		this.pen_button_down = false
			// 		console.log('pen button unpress')
			// 	}
			// }
			// console.log(e)
			this.mouse_down = false
		})
	}
}
