# ATProto Label Indexer
It uses MongoDB to store these labels. These labels could get queried from another service, such as a [label driven feed generator](https://github.com/BunnyNabbit/label-driven-feed-generator).
## Setup
Install dependencies with `npm i`.

Additionally, ensure that MongoDB is running on your local machine. You will need to have it set up and running before attempting to run the application.
## Configuration
`useDivertQueue` is for sending posts to a XBlock based image classifier, perhaps if it doesn't have the default setup of classifying every image sent by the firehose.