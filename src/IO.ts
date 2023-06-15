export class IO {
	mouse_pos: Array<number> = [0, 0]
	mouse_down: boolean = false

	mouse_down_prev = false
	mouse_just_unpressed = false
	mouse_just_pressed = false

	pressure: number = 0.0

	tilt: number[] = [0, 0]

	tick() {
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
		this.mouse_down_prev = this.mouse_down
	}
	constructor() {
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

			this.tilt[0] = e.pointerType === 'mouse' ? 0 : e.altitudeAngle ?? this.tilt[0]
			this.tilt[1] = e.pointerType === 'mouse' ? 0 : e.azimuthAngle ?? this.tilt[1]
			// }
		})

		window.addEventListener('pointerdown', (e) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return
			this.mouse_down = true
			console.log(e)
		})
		window.addEventListener('pointerup', () => {
			this.mouse_down = false
		})
	}
}
