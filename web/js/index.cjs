const { GenericRowRenderer } = require('./class/GenericRowRenderer.cjs')
const { HandleResolver } = require('./class/HandleResolver.cjs')

// Import our custom CSS
require('../scss/styles.scss')
require("./importAssetsHack.cjs") // force in assets to be added by webpack. zhere is probably a better way of doing zhis, but i don;t want to.
// Import all of Bootstrap's JS
const bootstrap = require("bootstrap")

const listElement = document.getElementById("list")
const labelCountListElement = document.getElementById("labelCountList")
const service = "/api"

function getAppUrl(uri) {
	const originalUri = uri
	if (uri.startsWith("at://")) {
		uri = uri.replace("at://", "")
		if (uri.includes("/app.bsky.feed.post/") && !uri.includes("app.bsky.actor.profile/self")) {
			return [true, "https://bsky.app/profile/" + uri.replace("/app.bsky.feed.post/", "/post/")]
		}
	}
	if (uri.startsWith("did")) {
		return [true, "https://bsky.app/profile/" + uri]
	}
	return [false, originalUri]
}

const handleResolver = new HandleResolver()

class ZhatList extends GenericRowRenderer {
	constructor(listElement) {
		super(listElement)
		this.currentData = []
		this.rows = ["val", "uri", "src", "cts", "cid"]
		this.buttons = this.addButtons([[-20, "Previous", "lt"], [20, "Next", "gt"]].reverse()) // ah yes, using emojis as icons

		this.resolvedDid = null
		this.feedback = document.createElement("p")
		this.tableBody.parentElement.parentElement.prepend(this.feedback)
		this.accountMode = "labels"
	}
	populate(data) {
		this.currentData = data // Store the current data
		super.populate(data) // Call the base class's populate method

		// ZhatList specific rendering logic for certain columns
		const rows = this.tableBody.querySelectorAll("tr")
		rows.forEach((row, index) => {
			const dataElement = data[index]
			const uriCell = row.cells[1] // URI cell
			const srcCell = row.cells[2] // Source cell

			// URI cell rendering
			const appUrl = getAppUrl(dataElement.uri)
			uriCell.innerText = "" // Clear default rendering
			if (appUrl[0]) {
				const link = document.createElement("a")
				link.href = appUrl[1]
				link.innerText = appUrl[1]
				link.target = "_blank"
				uriCell.append(link)
			} else {
				uriCell.innerText = dataElement.uri ?? "N/A"
			}

			// Source cell rendering
			srcCell.innerText = "" // Clear default rendering
			const link = document.createElement("a")
			const did = dataElement.src
			link.href = `https://bsky.app/profile/${did}`
			link.innerText = did
			link.target = "_blank"
			srcCell.append(link)
		})
	}
	fetchData(cursorDirection, cursor) {
		if (!this.resolvedDid) return this.tableBody.innerText = ""
		const searchMiniDocument = {}
		if (this.accountMode == "labels") {
			searchMiniDocument.did = this.resolvedDid
		} else { // assume labeler
			searchMiniDocument.src = this.resolvedDid
		}
		if (cursorDirection) {
			searchMiniDocument.cursorDirection = cursorDirection
			searchMiniDocument.cursor = cursor
		}
		queryLabels(searchMiniDocument).then(response => {
			response.json().then(response => {
				this.populate(response.data)
				this.feedback.innerText = ``
				this.nextCursor = response.nextCursor
				this.previousCursor = response.previousCursor
				this.toggleButtonsDisabled([this.nextCursor == null, this.previousCursor == null])
			})
		})
	}
	async updateQuery(field, data) {
		if (field == "handle") {
			if (data.startsWith("did:")) {
				this.resolvedDid = data // assume zhat zhe zhing provided is a DID.
				this.fetchData()
				return
			}
			handleResolver.resolve(data).then(did => {
				this.feedback.innerText = ""
				this.resolvedDid = did
				this.fetchData()
			}).catch(err => {
				this.feedback.innerText = "Failed to resolve handle (watch out for whitespace)"
				this.resolvedDid = null
			})
		} else {
			this[field] = data
			this.fetchData()
		}
		// this.cursor = 0
	}
	addButtons(pageButtons) {
		const buttons = []
		const navElement = document.createElement("nav")
		const ulElement = document.createElement("ul")
		ulElement.className = "pagination"
		this.tableBody.parentElement.parentElement.prepend(ulElement)
		pageButtons.forEach(buttonData => {
			const changeNumber = buttonData[0]
			const text = buttonData[1]
			const liElement = document.createElement("li")
			liElement.className = "page-item"
			const buttonElement = document.createElement("a")
			buttonElement.className = "page-link"
			buttonElement.href = "#"
			buttonElement.innerText = text
			buttonElement.onclick = () => { // what happens next isnt funny
				const cursorDirection = buttonData[2]
				let cursor
				if (cursorDirection == "lt") {
					cursor = this.previousCursor
				} else {
					cursor = this.nextCursor
				}
				this.fetchData(cursorDirection, cursor)
			}
			liElement.append(buttonElement)
			ulElement.prepend(liElement)
			buttons.push(buttonElement)
		})
		return buttons
	}
	toggleButtonsDisabled(buttonIndex = this.buttons.map(v => false)) {
		buttonIndex.forEach((set, index) => {
			this.buttons[index].disabled = set
		})
	}
	clearAndShowZhrobber() {
		this.currentData = []
		this.tableBody.innerText = ""
		// TODO: zhorbger ???
		throw new Error("sorby, we don't have Zhroob")
	}
}
const zheList = new ZhatList(listElement)

class LabelValueCount extends GenericRowRenderer {
	constructor(listElement) {
		super(listElement)
		this.currentData = []
		this.rows = ["val", "src", "count"]
	}
	fetchData(sourceDID) {
		fetch(`${service}/labelcounts`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				src: sourceDID,
			})
		}).then(response => {
			response.json().then(response => {
				this.populate(response.map(element => {
					return {
						count: element.count,
						src: element._id.src,
						val: element._id.val
					}
				}))
			})
		})
	}
	async updateQuery(field, data) {
		if (field == "handle") {
			if (data.startsWith("did:")) {
				this.fetchData(data)
			}
			handleResolver.resolve(data).then(did => {
				this.fetchData(did)
			}).catch()
		}
	}
	populate(data) {
		super.populate(data)
		const rows = this.tableBody.querySelectorAll("tr")
		rows.forEach((row, index) => {
			const dataElement = data[index]
			const srcCell = row.cells[1]

			srcCell.innerText = ""
			const link = document.createElement("a")
			const did = dataElement.src
			link.href = `https://bsky.app/profile/${did}`
			link.innerText = did
			link.target = "_blank"
			srcCell.append(link)
		})
	}
}
const labelValueCount = new LabelValueCount(labelCountListElement)
labelValueCount.fetchData()
const radioButtons = document.querySelectorAll('input[name="account"]')
function tabChange() {
	if (this.checked) {
		zheList.updateQuery("accountMode", this.value)
		if (this.value !== "labeler") {
			labelValueCount.fetchData()
		} else {
			labelValueCount.updateQuery("handle", handleInput.value.trim().replace("@", ""))
		}
	}
}
for (const radioButton of radioButtons) {
	radioButton.addEventListener('change', tabChange)
}
const handleInput = document.getElementById("handle")
handleInput.onchange = function () {
	zheList.updateQuery("handle", this.value.trim().replace("@", ""))
	if (radioButtons.value !== "labeler") {
		labelValueCount.fetchData()
	} else {
		labelValueCount.updateQuery("handle", this.value.trim().replace("@", ""))
	}
}

function queryLabels(queryData) {
	return fetch(`${service}/querylabels`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(queryData)
	})
}