const fs = require("node:fs");
const path = require("node:path");

function loadConfig() {
	const data = fs.readFileSync(path.resolve('.','config.json'), 'utf8');
	console.log('configuration loaded');
	return JSON.parse(data);
}

module.exports = {
	loadConfig
}
