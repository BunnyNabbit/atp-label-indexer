const BeeQueue = require("bee-queue")
const queue = new BeeQueue("posts", { activateDelayedJobs: true })

// XBlock format
class PostQueue {
	/** */
	constructor(agent) {
		this.agent = agent
		this.queue = []
		setInterval(() => {
			if (this.queue.length) this.runTasks()
		}, 2000)
	}

	async runTasks() {
		try {
			const res = await this.agent.api.app.bsky.feed.getPosts({
				uris: this.queue.splice(-25),
			})
			res.data.posts.forEach((post) => {
				post.forceScan = true
				console.log(post)
			})
			if (res.data.posts.length) {
				queue.createJob(res.data.posts).timeout(30000).backoff("exponential", 2000).retries(5).save()
			}
		} catch (error) {
			console.warn(error)
		}
	}

	async enqueue(postUri) {
		this.queue.push(postUri)
	}
}

module.exports = PostQueue
