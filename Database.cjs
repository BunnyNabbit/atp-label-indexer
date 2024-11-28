const mongojs = require("mongojs")
class Database {
	constructor(databaseName) {
		const db = mongojs(databaseName)
		this.labelCollection = db.collection('labels')
		this.cursorCollection = db.collection("labelCursors")
		this.handleDidCollection = db.collection("resolveDid")
		this.labelGroupCounts = db.collection("labelGroupCounts")
	}

	replaceLabel(label) {
		return new Promise((resolve, reject) => {
			this.labelCollection.replaceOne({ src: label.src, uri: label.uri, val: label.val }, label, { upsert: true }, (err, status) => {
				let upserted = false
				if (status.upserted) upserted = status.upserted
				this.incrementLabelGroupCount(label.src, label.val, upserted ? 1 : 0)
				resolve(upserted)
			})
		})
	}
	deleteLabel(did, uri, val) {
		return new Promise((resolve, reject) => {
			this.labelCollection.remove({ src: did, uri, val }, (err, status) => {
				resolve(status.deletedCount)
				if (status.deletedCount > 0) {
					this.incrementLabelGroupCount(did, val, -1)
				}
			})
		})
	}

	getCursor(did) {
		return new Promise((resolve, reject) => {
			this.cursorCollection.findOne({ _id: did }, (err, doc) => {
				if (err) return resolve(0)
				if (!doc) return resolve(0)
				resolve(doc.cursor)
			})
		})
	}
	updateCursor(did, cursor) {
		return new Promise((resolve, reject) => {
			this.cursorCollection.update({ _id: did }, { $set: { cursor } }, { upsert: true }, function (err) {
				resolve()
			})
		})
	}

	getLabels(serviceDid) {
		return new Promise((resolve, reject) => {
			this.labelCollection.find({ src: serviceDid }, (err, docs) => {
				resolve(docs)
			})
		})
	}

	incrementLabelGroupCount(src, val, increment) {
		return new Promise((resolve, reject) => {
			this.labelGroupCounts.updateOne(
				{ _id: { src, val } },
				{ $inc: { count: increment } },
				{ upsert: true },
				(err, result) => {
					if (err) reject(err)
					resolve(result)
				}
			)
		})
	}

	generateLabelGroupCounts() {
		return new Promise((resolve, reject) => {
			this.labelCollection.aggregate([
				{
					$group: {
						_id: { src: "$src", val: "$val" },
						count: { $sum: 1 }
					}
				},
				{
					$out: "labelGroupCounts" // Output to the labelGroupCounts collection
				}
			], (err, result) => {
				if (err) reject(err)
				resolve(result)
			})
		})
	}

	getLabelGroupCounts(src, val) {
		const query = {}
		if (src) query["_id.src"] = src
		if (val) query["_id.val"] = val

		return new Promise((resolve, reject) => {
			this.labelGroupCounts.find(query, (err, docs) => {
				if (err) reject(err)
				resolve(docs)
			})
		})
	}

	addHandleDIDCache(handle, did) {
		return new Promise((resolve, reject) => {
			this.handleDidCollection.replaceOne({ _id: handle }, { _id: handle, did }, { upsert: true }, (err) => {
				resolve(handle)
			})
		})
	}

	getHandleDIDCache(handle) {
		return new Promise((resolve, reject) => {
			this.handleDidCollection.findOne({ _id: handle }, (err, document) => {
				resolve(document)
			})
		})
	}
}

module.exports = Database