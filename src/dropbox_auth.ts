import {Dropbox, DropboxAuth} from 'dropbox'
import {Utils} from 'stuff'

export class DropboxAuther {
	CLIENT_ID: string = 'jxpyhv2cqozub0c'
	REDIRECT_URI: string = 'http://localhost:8080/'
	// @ts-ignore
	dbx: Dropbox
	dbxAuth: DropboxAuth
	authed: boolean = false

	constructor() {
		if (process.env.NODE_ENV !== 'development') {
			this.REDIRECT_URI = 'https://wrightwriter.github.io/splunge/'
		}
		this.dbxAuth = new DropboxAuth({
			clientId: this.CLIENT_ID,
		})
	}

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
			const authUrl = await this.dbxAuth.getAuthenticationUrl(
				this.REDIRECT_URI,
				undefined,
				'code',
				'offline',
				undefined,
				undefined,
				true,
			)

			// window.sessionStorage.clear()
			// @ts-ignore
			window.localStorage.setItem('codeVerifier', this.dbxAuth.codeVerifier)
			// @ts-ignore
			window.location.href = authUrl
		} catch (error) {
			console.error(error)
		}
	}

	async try_init_dropbox() {
		const getCodeFromUrl = () => {
			return this.parseQueryString(window.location.search).code
		}
		const hasRedirectedFromAuth = () => {
			return !!getCodeFromUrl()
		}
		let codeVerifier = window.localStorage.getItem('codeVerifier')
		let accessToken = window.localStorage.getItem('accessToken')
		let redirectedFromAuth = hasRedirectedFromAuth()
		if (redirectedFromAuth || accessToken) {
			// showPageSection('authed-section')
			// alert("AUTH START")
			const try_access_token = async (accessToken: string): Promise<boolean> => {
				try {
					this.dbxAuth.setAccessToken(accessToken)
					this.dbx = new Dropbox({
						auth: this.dbxAuth,
					})
					await this.dbx.filesListFolder({
						path: '',
					})
					return true
				} catch (e) {
					alert('ERROR')
					// throw e
					return Promise.reject(e)
				}
			}
			const try_url_code = async (codeVerifier: string) => {
				try {
					this.dbxAuth.setCodeVerifier(codeVerifier)
					const response = await this.dbxAuth.getAccessTokenFromCode(this.REDIRECT_URI, getCodeFromUrl())
					// @ts-ignore
					window.localStorage.setItem('accessToken', response.result.access_token)
					// @ts-ignore
					this.dbxAuth.setAccessToken(response.result.access_token)
					this.dbx = new Dropbox({
						auth: this.dbxAuth,
					})
					// alert("AMOGUS")
					return Promise.resolve()
				} catch (e) {
					return Promise.reject(e)
				}
			}
			if (accessToken) {
				try {
					await try_access_token(accessToken)
					// window.localStorage.getItem('accessToken', response.result.access_token)
					// @ts-ignore
					this.authed = true
				} catch (e) {
					if (redirectedFromAuth) {
						try {
							await try_url_code(codeVerifier as string)
							this.authed = true
							// alert("auth success")
						} catch (e) {
							// alert("AUTH ERROR")
							console.error(e)
						}
					}
				}
			} else {
				try {
					await try_url_code(codeVerifier as string)
					this.authed = true
					// alert("auth success")
					console.log(
						await this.dbx.filesListFolder({
							path: '',
						}),
					)
				} catch (e) {
					// alert("AUTH ERROR")
					console.error(e)
				}
			}

			// .catch((error) => {
			// 	alert("error in db auth")
			// 	console.error(error.error || error)
			// })
		} else {
			// show log in button
		}
	}
}
