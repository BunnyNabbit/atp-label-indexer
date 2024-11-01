const Indexer = require("./index.cjs")
const indexer = new Indexer({
   "cursorUpdate": 1,
   "useDivertQueue": false,
   "divertLabelNames": [
      "silly-looking-animal",
      "josh"
   ],
   "serviceDivertDID": "did:plc:ar7c4by46qjdydhdevvrndac",
   "agentPassword": "aaaa-bbbb-cccc-dddd",
   "agentHandle": "josh.bsky.social",
   "indexHandles": [
      "moderation.bsky.app"
   ],
   "userAgent": "Label Indexer",
   "databaseName": "bsnetworkcache"
});
const labelerHandles = ["nunnybabbit.bsky.social"]
// const labelerHandles = ["moderation.bsky.app"]
labelerHandles.forEach((labeler, index) => {
   setTimeout(() => {
      try {
         indexer.runIngester(labeler)
      } catch (error) {
         console.log("failed to run on", labeler, error)
      }
   }, 100 * index)
})
indexer.on("label", (label) => {
   console.log("Label", label)
})