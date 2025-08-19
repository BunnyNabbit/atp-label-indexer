const { QueryLabelService } = require("../QueryLabelService.cjs")

new QueryLabelService({
	databaseName: "bsnetworkcache",
	port: 6225,
})
