const Indexer = require("./index.cjs")
const indexer = new Indexer({
	cursorUpdate: 1,
	useDivertQueue: false, // Used for sending posts to a XBlock based image classifier, perhaps if it doesn't have the default setup of classifying every image sent by the firehose.
	divertLabelNames: [
		// Names of labels to trigger the divert queue.
		"silly-looking-animal",
		"josh",
	],
	serviceDivertDID: "did:plc:ar7c4by46qjdydhdevvrndac",
	agentPassword: "aaaa-bbbb-cccc-dddd", // Password and handle for hydrating posts for the divert queue.
	agentHandle: "josh.bsky.social",
	indexHandles: [
		// Handles of labeling services to index labels from.
		"moderation.bsky.app",
	],
	userAgent: "ATProto Label Indexer https://github.com/BunnyNabbit/atp-label-indexer",
	databaseName: "bsnetworkcache",
	databaseConnectionString: "mongodb://localhost:27017"
})
const labelerHandles = ["moderation.bsky.app"]
labelerHandles.forEach((labeler, index) => {
	setTimeout(() => {
		indexer.runIngester(labeler).catch((err) => {
			console.error("failed to run on", labeler, err)
		})
	}, 100 * index)
})
indexer.on("label", (label) => {
	console.log("Label", label)
})
