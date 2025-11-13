export class GenericRowRenderer {
	/**
	 * @param {HTMLTableElement} listElement
	 */
	constructor(listElement) {
		this.tableBody = listElement.querySelector("tbody")
		this.rows = [] // Define the row data keys here
	}

	populate(data) {
		this.tableBody.innerText = ""
		data.forEach((element) => {
			const rowElement = document.createElement("tr")
			this.tableBody.append(rowElement)
			this.rows.forEach((rowName) => {
				const rowDataElement = document.createElement("td")
				rowDataElement.innerText = element[rowName] ?? "N/A" // Default rendering
				rowElement.append(rowDataElement)
			})
		})
	}

	clear() {
		this.tableBody.innerText = ""
	}
}

export default GenericRowRenderer
