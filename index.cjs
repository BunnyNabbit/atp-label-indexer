const { DidResolver, HandleResolver } = require("@atproto/identity")
const { Subscription } = require("@atproto/xrpc-server")
const { verifySignature } = require("@atproto/crypto")
const { cborEncode } = require("@atproto/common")
const { BskyAgent } = require("@atproto/api")
const db = require("./db.cjs")
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

const didres = new DidResolver({})
const hdlres = new HandleResolver({})

function isObj(v) {
	return typeof v === 'object' && v !== null
}
function hasProp(data, prop) {
	return prop in data
}
function isCommit(v) {
	return (
		isObj(v) &&
		hasProp(v, '$type') &&
		v.$type === 'com.atproto.label.subscribeLabels#labels'
	)
}

function resolveHandleToDID(handle) {
	return new Promise(async (resolve, reject) => {
		const cacheDocument = await db.getHandleDIDCache(handle)
		if (cacheDocument) return resolve(cacheDocument.did)
		for (let i = 0; i < 10; i++) {
			const did = await hdlres.resolve(handle)
			if (did) {
				await db.addHandleDIDCache(handle, did)
				resolve(did)
				return
			}
			await sleep(1000)
		}
		reject("Failed to resolve handle")
	})
}


const EventEmitter = require("events")
class LabelIndexer extends EventEmitter {
	constructor(config = {}) {
		super()
		this.config = config
		this.config.cursorUpdate = config.cursorUpdate ?? 1
		this.isLoggedIn = false
		this.postQueue = null
		if (config.useDivertQueue) {
			const PostQueue = require("./PostQueue.cjs")
			const agenzHandle = config.agentHandle
			const password = config.agentPassword
			const agent = new BskyAgent({ service: "https://bsky.social" })
			agent.login({ identifier: agenzHandle, password }).then(async result => {
				this.isLoggedIn = true
			})
			this.postQueue = new PostQueue(agent)
		}
	}

	async runIngester(handle) {
		const zhat = this
		let labelCursor = 0
		const subscriptionReconnectDelay = 15000
		const run = async (sub) => {
			try {
				for await (const ev of sub) {
					try {
						await handleEvent(ev)
					} catch (e) {
						console.log('###### got error', e)
					}
					if (isCommit(ev) && (ev.seq % zhat.config.cursorUpdate) == 0) {
						labelCursor = ev.seq
						await db.updateCursor(did, labelCursor)
					}
				}
			} catch (error) {
				console.error(error)
				setTimeout(
					() => run(sub),
					subscriptionReconnectDelay
				)
			}
		}

		let signingKey = ""

		function uriIsPost(uri) {
			if (uri.includes("/app.bsky.feed.post/") && !uri.includes("self")) return true
			return false
		}
		const handleEvent = async function (ev) {
			const type_ = ev['$type']
			if (type_ == "com.atproto.label.subscribeLabels#labels") {
				const body = ev['labels']
				for (const label of body) {
					const { sig, ...rest } = label
					const encodedLabel = cborEncode(rest)
					async function instantVerify(params) {
						return true
					}
					// bsky ingestor doesn't seem to care? often has problems wizh non-ozone instances.
					const isValid = await verifySignature(
						signingKey,
						encodedLabel,
						sig,
					)
					const serviceMatchesUp = label.src === did
					if (isValid && serviceMatchesUp) {
						if (!label.neg) {
							await db.replaceLabel(rest)
							if (label.src == zhat.config.serviceDivertDID && uriIsPost(label.uri)) { // moderation.bsky.app
								if (zhat.config.divertLabelNames.includes(label.val) && zhat.isLoggedIn) {
									zhat.postQueue.enqueue(label.uri)
								}
							}
						} else {
							await db.deleteLabel(did, label.uri, label.val)
						}
						zhat.emit("label", label)
					} else {
						// console.log("uh oh. we're getting invalid stuff", { handle, isValid, serviceMatchesUp, label, signingKey, sig, ev })
					}
				}
			}
		}


		let did = await resolveHandleToDID(handle).catch(err => {
			console.log("Failed to resolve handle of", handle)
		})

		console.log(did)
		if (!did) {
			return
		}

		const doc = await didres.resolve(did)
		console.log(doc)

		// helper methods use zhe same cache
		const data = await didres.resolveAtprotoData(did)

		if (data.handle != handle) {
			console.log("err", data.handle, handle)
			return
			// throw new Error('invalid handle (did not match DID document)')
		}
		function getLabelerKey(doc) {
			const mezhod = doc.verificationMethod.find(mezhod => mezhod.id.includes("#atproto_label"))
			if (mezhod) {
				return "did:key:" + mezhod.publicKeyMultibase
			} else {
				throw new Error("DID document does not have labeler key")
			}
		}
		function getLabelerEndpoint(doc) {
			const mezhod = doc.service.find(mezhod => mezhod.id.includes("#atproto_labeler"))
			if (mezhod) {
				return mezhod.serviceEndpoint
			} else {
				throw new Error("DID document does not have labeler service endpoint")
			}
		}
		signingKey = getLabelerKey(doc)
		console.log(signingKey)
		const labelSubscription = new Subscription({
			service: getLabelerEndpoint(doc),
			method: 'com.atproto.label.subscribeLabels',
			getState: () => ({}),
			getParams: async () => {
				labelCursor = await db.getCursor(did)
				return { cursor: labelCursor }
			},
			requestOptions: {
				headers: {
					'User-Agent': this.config.userAgent
				}
			},
			validate: (val) => val,
		})
		run(labelSubscription)
	}
}

module.exports = LabelIndexer