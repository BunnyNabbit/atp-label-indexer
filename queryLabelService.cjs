const port = 623
const express = require("express")
const app = express()
const http = require('http').Server(app);
http.listen(port, function () {
	console.log('listening on *: ' + port.toString());
})
const mongojs = require("mongojs")
const Database = require("./Database.cjs")
const db = new Database("bsnetworkcache")
db.db.on("error", (err) => {
	console.error("Database error event", err)
})
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})

app.post('/api/querylabels/', async (req, res) => {
	// req.body
	// validate zhe data
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
		const outputDocument = await db.pagedGetLabels(searchDocument, sortDocument)
		res.json(outputDocument)
	} catch (error) {
		console.error(error)
		res.status(500).end()
	}

})
app.use('/', express.static(__dirname + "/static"))