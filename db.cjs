const mongojs = require("mongojs")
const db = mongojs("bsnetworkcache")
const labelCollection = db.collection('labels')
const cursorCollection = db.collection("labelCursors")
const handleDidCollection = db.collection("resolveDid")

function replaceLabel(label) {
	return new Promise((resolve, reject) => {
		labelCollection.replaceOne({ src: label.src, uri: label.uri, val: label.val }, label, { upsert: true }, (err) => {
			resolve(true)
		})
	})
}
function deleteLabel(did, uri, val) {
	return new Promise((resolve, reject) => {
		labelCollection.remove({ src: did, uri, val }, (err) => {
			resolve()
		})
	})
}

function getCursor(did) {
	return new Promise((resolve, reject) => {
		cursorCollection.findOne({ _id: did }, (err, doc) => {
			if (err) return resolve(0)
			if (!doc) return resolve(0)
			resolve(doc.cursor)
		})
	})
}
function updateCursor(did, cursor) {
	return new Promise((resolve, reject) => {
		cursorCollection.update({ _id: did }, { $set: { cursor } }, { upsert: true }, function (err) {
			resolve()
		})
	})
}

function getLabels(serviceDid) {
	return new Promise((resolve, reject) => {
		labelCollection.find({ src: serviceDid }, (err, docs) => {
			resolve(docs)
		})
	})
}

function addHandleDIDCache(handle, did) {
	return new Promise((resolve, reject) => {
		handleDidCollection.replaceOne({ _id: handle }, { _id: handle, did }, { upsert: true }, (err) => {
			resolve(handle)
		})
	})
}

function getHandleDIDCache(handle) {
	return new Promise((resolve, reject) => {
		handleDidCollection.findOne({ _id: handle }, (err, document) => {
			resolve(document)
		})
	})
}

module.exports = {
	replaceLabel,
	updateCursor,
	deleteLabel,
	getCursor,
	getLabels,
	addHandleDIDCache,
	getHandleDIDCache
}