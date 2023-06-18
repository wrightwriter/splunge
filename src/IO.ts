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

	mouse_pos: Array<number> = [0, 0]
	delta_mouse_pos: Array<number> = [0, 0]
	mouse_pos_prev: Array<number> = [0, 0]
	mouse_down: boolean = false

	pointerType: string = 'mouse'

	mouse_down_prev = false
	mouse_just_unpressed = false
	mouse_just_pressed = false
	mouse_just_moved = false

	mmb_just_unpressed = false
	mmb_just_pressed = false
	mmb_down = false

	mouse_wheel: number = 0

	pressure: number = 0.0

	tilt: number[] = [0, 0]

	tick() {
		this.delta_mouse_pos[0] = this.mouse_pos[0] - this.mouse_pos_prev[0]
		this.delta_mouse_pos[1] = this.mouse_pos[1] - this.mouse_pos_prev[1]
		this.mouse_pos_prev = [...this.mouse_pos]
		if (this.mouse_down !== this.mouse_down_prev) {
			if (this.mouse_down) {
				// this.mouse_pressed = true
				this.mouse_just_pressed = true
			} else {
				// this.mouse_pressed = false
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
		this.mouse_wheel = 0
		Object.values(this.keys).forEach((key) => {
			key.just_unpressed = false
			key.just_pressed = false
		})
	}
	public getKey(code: BtnCode): keyState {
		let key = this.keys[code]
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

		// window.addEventListener('pointermove', (e) => {
		// @ts-ignore
		window.addEventListener('pointermove', (e) => {
			function getRelativeMousePosition(event, target) {
				target = target || event.target
				var rect = target.getBoundingClientRect()

				return {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				}
			}
			function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target) {
				target = target || event.target
				var pos = getRelativeMousePosition(event, target)

				pos.x = (pos.x * target.width) / target.clientWidth
				pos.y = (pos.y * target.height) / target.clientHeight

				return pos
			}
			// if (e.pointerType === 'pen') {
			// console.log(e)
			let gl = window.gl
			const pos = getNoPaddingNoBorderCanvasRelativeMousePosition(e, gl.canvas)

			const x = (pos.x / gl.canvas.width) * 2 - 1
			const y = (pos.y / gl.canvas.height) * -2 + 1

			this.mouse_pos = [x, y]
			this.pressure = e.pointerType === 'mouse' ? 1 : e.pressure ?? this.pressure
			this.mouse_just_moved = true

			this.tilt[0] = e.pointerType === 'mouse' ? 0 : e.altitudeAngle ?? this.tilt[0]
			this.tilt[1] = e.pointerType === 'mouse' ? 0 : e.azimuthAngle ?? this.tilt[1]
			// }
		})

		// @ts-ignore
		document.querySelector('canvas').addEventListener('pointerdown', (e) => {
			this.pointerType = e.pointerType
			if (e.pointerType === 'mouse' && e.button !== 0) return
			this.mouse_down = true
			console.log(e)
		})
		// @ts-ignore
		document.querySelector('canvas').addEventListener('pointerup', () => {
			this.mouse_down = false
		})
	}
}
