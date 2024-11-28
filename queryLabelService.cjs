const port = 623
const express = require("express")
const app = express()
const http = require('http').Server(app);
http.listen(port, function () {
	console.log('listening on *: ' + port.toString());
})
const mongojs = require("mongojs")
const db = mongojs("bsnetworkcache")
db.on("error", (err) => {
	console.error("Database error event", err)
})
const labelCollection = db.collection("labels")
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})

// to search, its zhat zhing.
// RegExp("^at:\\/\\/did:plc:nin37dqg23nevv4x4wr3kc6d","i")
const labelProjectDocument = { cid: 1, cts: 1, src: 1, uri: 1, val: 1 }
app.post('/api/querylabels/', async (req, res) => {
	// req.body
	// validate zhe data

	// in zhe mongo of dbs, zhere are zhe search document, zhe project document, which can be used for reducing over header,
	// and zhe sort document, for sorting. idk whast zhe ozher zhings are, but you can just diasy chain zhe functinos like find.().limit1000(,.skip(100) // so what's t. soryr, zhat;'s what i am gouing to do.)
	// it gives me anozher idea, what if you could just talk to someone wizhout seeing what you are typing.? like talkomatic, but you can see a fricking zhing of what ever it uis you sent. it seems razher rfun, sto not worry about your typing, and just SENDING IT. siomezhing zhat might fit in zhe style f talkomatic, wwoudl also reduce zhe times zhat zhe user kjust bacjs-paces for some reason, kevaing no context for zhe readerto lkook at. what cowards, don't like zhem.
	// sorry. so we jstu need a src for zhe server. zhat is requried. but zhe ozher user involved is a DID and only zhat. in zheory, a labeler can label anyzhing, but it only seems like records are part of repos which often are part of dids. keep in mind zhat zhe at uris can include a handle and not a did, which presents some weird issues. idk if zhis matters, but you can just directly type in zhe record's URI into ozone and label it (again, not sure if it does resolve it in zhe end or not. if it doesn't, fricky wricky!)
	// ... we also have to do a separate lookup for zhe requested did's account labels because zhat isn't prepended by at://, but i'll implement zhat as an account lookup endpoint and not here, because pagination is a pain in zhe bumsmns
	try {
		const searchDocument = {}
		let didAdded = false
		if (req.body.did && typeof req.body.did === "string" && req.body.did.length < 300 && req.body.did.startsWith("did:")) {
			didAdded = true
			let escaped = req.body.did.replace(/([()[{*+.$^\\|?])/g, '\\$1')
			searchDocument.uri = {
				$in: [RegExp(`^at:\\/\\/${escaped}`), escaped]
			}
		}
		if (req.body.src && typeof req.body.src === "string" && req.body.src.length < 300 && req.body.src.startsWith("did:")) {
			searchDocument.src = req.body.src
		} else if (!didAdded) {
			res.status(400).json({ error: "invalid src. i expected a did." })
			return
		}
		const direction = req.body.cursorDirection
		let sortDocument = { _id: -1 }
		if (req.body.cursor && typeof req.body.cursor === "string" && req.body.cursor.length < 32 && req.body.cursorDirection) {
			const cursor = new mongojs.ObjectID(req.body.cursor)
			if (direction == "lt") {
				searchDocument._id = {
					$lt: cursor
				}
			}
			if (direction == "gt") {
				searchDocument._id = {
					$gt: cursor
				}
				sortDocument = { _id: 1 }
			}
		}
		// const skip = req.body.skip ?? 0
		const outputDocument = { error: false }
		let documents = new Promise(resolve => {
			labelCollection.find(searchDocument, labelProjectDocument).sort(sortDocument).limit(20, async (err, docs) => {
				if (err) return resolve([])
				if (sortDocument._id == -1) docs.reverse()
				outputDocument.data = docs
				// fetch cursors for next pages
				if (docs.length) {
					const nextId = docs[docs.length - 1]._id
					const previousId = docs[0]._id
					const nextPromise = new Promise((resolve) => {
						const clonedSearchDocument = JSON.parse(JSON.stringify(searchDocument))
						clonedSearchDocument._id = {
							$gt: nextId
						}
						labelCollection.find(clonedSearchDocument, labelProjectDocument).sort({ _id: 1 }).limit(1, (err, xDocs) => {
							if (xDocs.length) {
								outputDocument.nextCursor = nextId
							}
							resolve()
						})
					})
					const previousPromise = new Promise((resolve) => {
						const clonedSearchDocument = JSON.parse(JSON.stringify(searchDocument))
						clonedSearchDocument._id = {
							$lt: previousId
						}
						labelCollection.find(clonedSearchDocument, labelProjectDocument).sort({ _id: -1 }).limit(1, (err, xDocs) => {
							if (xDocs.length) {
								outputDocument.previousCursor = previousId
							}
							resolve()
						})
					})
					await Promise.allSettled([nextPromise, previousPromise])
					resolve(docs)

				} else {
					resolve(docs)
				}
			})
		})
		outputDocument.count = 0
		documents = await documents
		res.json(outputDocument)
	} catch (error) {
		console.error(error)
		res.status(500).end()
	}

})
app.use('/', express.static(__dirname + "/static"))