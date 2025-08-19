# ATProto Label Indexer
It uses MongoDB to store these labels. These labels could get queried from another service, such as a [label driven feed generator](https://github.com/BunnyNabbit/label-driven-feed-generator). A web interface to browse these labels is also included in this project.

Query interface live at https://labels.bunnynabbit.com/.
## Dependencies
- [MongoDB](https://www.mongodb.com/).
- [Node.js](https://nodejs.org/).
## Setup
Install dependencies with `npm i`.

Additionally, ensure that MongoDB is running on your local machine. You will need to have it set up and running before attempting to run the application.

To build the web interface from the command line: `npm run build`.

Start the web interface + API with the following command: `npm run web`. This will start a web server with a generic configuration. See `./scripts/web.cjs`.

An example of an indexer and its configuration object is provided in `sample.cjs`.
