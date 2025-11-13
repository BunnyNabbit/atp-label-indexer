export class HandleResolver {
	/** */
	constructor() {
		this.cache = new Map()
	}

	resolve(handle) {
		const cached = this.cache.get(handle)
		if (cached) return cached
		return new Promise((resolve, reject) => {
			fetch(`${HandleResolver.apiBase}${encodeURIComponent(handle)}`)
				.then(async (response) => {
					const data = await response.json()
					if (data.did) {
						resolve(data.did)
					} else {
						this.cache.delete(handle)
						reject(new Error(data.message))
					}
				})
				.catch((err) => {
					this.cache.delete(handle)
					reject(err)
				})
		})
	}
	static apiBase = "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle="
}

export default HandleResolver
