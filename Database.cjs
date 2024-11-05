const mongojs = require("mongojs")
class Database {
	constructor(databaseName) {
		const db = mongojs(databaseName)
		this.labelCollection = db.collection('labels')
		this.cursorCollection = db.collection("labelCursors")
		this.handleDidCollection = db.collection("resolveDid")
	}

	replaceLabel(label) {
		return new Promise((resolve, reject) => {
			this.labelCollection.replaceOne({ src: label.src, uri: label.uri, val: label.val }, label, { upsert: true }, (err) => {
				resolve(true)
			})
		})
	}
	deleteLabel(did, uri, val) {
		return new Promise((resolve, reject) => {
			this.labelCollection.remove({ src: did, uri, val }, (err) => {
				resolve()
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