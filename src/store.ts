import {type Writable, writable} from 'svelte/store'

export let gallery_open: Writable<boolean> = writable(false)
export let floating_modal_message: Writable<string | undefined> = writable(undefined)
export let trigger_brush_preset_redraw: Writable<boolean> = writable(false)
