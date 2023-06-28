import {Dropbox, DropboxAuth} from 'dropbox'
import {Utils} from 'stuff'
import {type Auth, type User, getAuth, signInWithCustomToken} from 'firebase/auth'
import {type FirebaseApp, initializeApp} from 'firebase/app'

// const db = require('dropbox')
const firebaseConfig = {
	apiKey: 'AIzaSyDwtcPjQMj3JAy9d7wwjib19eywvGfdV3A',
	authDomain: 'splunge-390110.firebaseapp.com',
	projectId: 'splunge-390110',
	storageBucket: 'splunge-390110.appspot.com',
	messagingSenderId: '1041542736895',
	appId: '1:1041542736895:web:663b9c5ab38f8295eb95ca',
}

let firebase_app: FirebaseApp
let firebase_auth: Auth
function getCurrentUser(auth: Auth): Promise<User | null> {
	return new Promise((resolve, reject) => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			unsubscribe()
			resolve(user)
		}, reject)
	})
}

export class DropboxAuther {
	CLIENT_ID: string = 'jxpyhv2cqozub0c'
	REDIRECT_URI: string = 'http://localhost:8080/'
	// @ts-ignore
	dbx: Dropbox
	// @ts-ignore
	dbxAuth: DropboxAuth
	authed: boolean = false
	// @ts-ignore
	firebase_user: User | null

	async init() {
		if (process.env.NODE_ENV !== 'development') {
			this.REDIRECT_URI = 'https://wrightwriter.github.io/splunge/'
		}
		// console.log(db)
		firebase_app = initializeApp(firebaseConfig)
		firebase_auth = getAuth(firebase_app)
		this.firebase_user = await getCurrentUser(firebase_auth)
		// firebase_auth.onAuthStateChanged(user =>{

		// })
		this.dbxAuth = new DropboxAuth({
			clientId: this.CLIENT_ID,
		})

		if (this.firebase_user) {
			const id_token = await firebase_auth.currentUser?.getIdToken(true)

			let res = await (
				await fetch('https://us-central1-splunge-390110.cloudfunctions.net/getDropboxCode' + `?id_token=${id_token}`)
			).json()

			const access_token = res.token
			this.dbxAuth.setAccessToken(access_token)

			// this.dbxAuth.setRefreshToken(res.token)
			this.dbx = new Dropbox({
				auth: this.dbxAuth,
			})
			let files = await this.dbx.filesListFolder({
				path: '',
			})
			this.authed = true

			// console.log(files)
		}
	}

	constructor() {}

	parseQueryString(str) {
		const ret = Object.create(null)

		if (typeof str !== 'string') {
			return ret
		}

		str = str.trim().replace(/^(\?|#|&)/, '')

		if (!str) {
			return ret
		}

		str.split('&').forEach((param) => {
			const parts = param.replace(/\+/g, ' ').split('=')
			// Firefox (pre 40) decodes `%3D` to `=`
			// https://github.com/sindresorhus/query-string/pull/37
			let key = parts.shift()
			let val = parts.length > 0 ? parts.join('=') : undefined

			key = decodeURIComponent(key)

			// missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			val = val === undefined ? null : decodeURIComponent(val)

			if (ret[key] === undefined) {
				ret[key] = val
			} else if (Array.isArray(ret[key])) {
				ret[key].push(val)
			} else {
				ret[key] = [ret[key], val]
			}
		})

		return ret
	}
	async doAuth() {
		try {
			const url_response = await fetch(
				'https://us-central1-splunge-390110.cloudfunctions.net/getAuthenticationUrl' + `?url=${window.location.href}`,
			)
			let url = await url_response.json()
			url = url['auth_url']
			window.location.href = url
		} catch (error) {
			console.error(error)
		}
	}

	async try_init_dropbox() {
		let code: string | undefined = undefined
		const getCodeFromUrl = () => {
			code = this.parseQueryString(window.location.search).code
			return code
		}
		const hasRedirectedFromAuth = () => {
			return !!getCodeFromUrl()
		}
		// let codeVerifier = window.localStorage.getItem('codeVerifier')
		// let accessToken = window.localStorage.getItem('accessToken')
		let redirectedFromAuth = hasRedirectedFromAuth()
		if (redirectedFromAuth) {
			const url = new URL(window.location.href)

			const body = {}

			// capture all url search params (after the '?')
			for (let key of url.searchParams.keys()) {
				if (url.searchParams.getAll(key).length > 1) {
					body[key] = url.searchParams.getAll(key)
				} else {
					body[key] = url.searchParams.get(key)
				}
			}
			window.history.replaceState &&
				window.history.replaceState(
					null,
					'',
					window.location.pathname +
						window.location.search.replace(/[?&]code=[^&]+/, '').replace(/^&/, '?') +
						window.location.hash,
				)
			body['redirect_url'] = window.location.href

			const res = await fetch(
				'https://us-central1-splunge-390110.cloudfunctions.net/exchangeDropboxCode' +
					`?redirect_url=${window.location.href}` +
					`&code=${body['code']}`,
			)
			const data = await res.json()
			signInWithCustomToken(firebase_auth, data.token)
		}

		return
	}
}
