import {type Writable, writable} from 'svelte/store'
// import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

export let gallery_open: Writable<boolean> = writable(false)
export let floating_modal_message: Writable<string | undefined> = writable(undefined)
// @ts-ignore
// export let _monaco: typeof writable<typeof Monaco> = writable(0);
