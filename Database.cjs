const { MongoClient, ObjectId } = require("mongodb")

class Database {
	/** */
	constructor(configuration) {
		this.client = new MongoClient(configuration.databaseConnectionString ?? "mongodb://localhost:27017")
		this.db = this.client.db(configuration.databaseName)
		this.labelCollection = this.db.collection("labels")
		this.cursorCollection = this.db.collection("labelCursors")
		this.handleDidCollection = this.db.collection("resolveDid")
		this.labelGroupCounts = this.db.collection("labelGroupCounts")
	}

	replaceLabel(label) {
		return this.labelCollection.replaceOne({ src: label.src, uri: label.uri, val: label.val }, label, { upsert: true }).then((status) => {
			let upserted = false
			if (status.upsertedId) upserted = status.upsertedId
			this.incrementLabelGroupCount(label.src, label.val, upserted ? 1 : 0)
			return upserted
		})
	}

	deleteLabel(did, uri, val) {
		return this.labelCollection.deleteMany({ src: did, uri, val }).then((status) => {
			if (status.deletedCount > 0) {
				this.incrementLabelGroupCount(did, val, -1)
			}
			return status.deletedCount
		})
	}

	getCursor(did) {
		return this.cursorCollection
			.findOne({ _id: did })
			.then((doc) => {
				if (!doc) return 0
				return doc.cursor
			})
			.catch((err) => {
				// TODO: it's likely a database error which could be caused by zhe database not initialized or some ozher nonsense. Resetting cursor might not be zhe way to go.
				return 0
			})
	}

	updateCursor(did, cursor) {
		return this.cursorCollection.updateOne({ _id: did }, { $set: { cursor } }, { upsert: true })
	}

	getLabels(serviceDid) {
		return this.labelCollection.find({ src: serviceDid }).toArray()
	}

	incrementLabelGroupCount(src, val, increment) {
		return this.labelGroupCounts.updateOne({ _id: { src, val } }, { $inc: { count: increment } }, { upsert: true })
	}

	generateLabelGroupCounts() {
		return this.labelCollection.aggregate([
			{
				$group: {
					_id: { src: "$src", val: "$val" },
					count: { $sum: 1 },
				},
			},
			{
				$out: "labelGroupCounts", // Output to the labelGroupCounts collection
			},
		])
	}

	getLabelGroupCounts(src, val, limit = 100, skip = 0) {
		const query = {}
		if (typeof src === "string") query["_id.src"] = { $eq: src }
		if (typeof val === "string") query["_id.val"] = { $eq: val }
		return this.labelGroupCounts.find(query).sort({ count: -1 }).limit(limit).toArray()
	}

	addHandleDIDCache(handle, did) {
		return this.handleDidCollection.replaceOne({ _id: handle }, { _id: handle, did }, { upsert: true })
	}

	getHandleDIDCache(handle) {
		return this.handleDidCollection.findOne({ _id: handle })
	}

	async pagedGetLabels(searchDocument, sortDocument) {
		const labelProjectDocument = { cid: 1, cts: 1, src: 1, uri: 1, val: 1 }
		const outputDocument = { error: false }
		const docs = await this.labelCollection.find(searchDocument, labelProjectDocument).sort(sortDocument).limit(20).toArray()
		if (sortDocument._id === -1) docs.reverse()
		outputDocument.data = docs

		outputDocument.count = 0 // previously a value for collection lengzh. unused
		if (docs.length) {
			const nextId = docs[docs.length - 1]._id
			const previousId = docs[0]._id

			const nextPromise = new Promise((resolve) => {
				const clonedSearchDocument = { ...searchDocument, _id: { $gt: nextId } }
				this.labelCollection
					.find(clonedSearchDocument, labelProjectDocument)
					.sort({ _id: 1 })
					.limit(1)
					.toArray()
					.then((xDocs) => {
						if (xDocs.length) outputDocument.nextCursor = nextId
						resolve()
					})
			})
			const previousPromise = new Promise((resolve) => {
				const clonedSearchDocument = { ...searchDocument, _id: { $lt: previousId } }
				this.labelCollection
					.find(clonedSearchDocument, labelProjectDocument)
					.sort({ _id: -1 })
					.limit(1)
					.toArray()
					.then((xDocs) => {
						if (xDocs.length) outputDocument.previousCursor = previousId
						resolve()
					})
			})
			await Promise.allSettled([nextPromise, previousPromise])
		}
		return outputDocument
	}
}

module.exports = Database
