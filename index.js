const { OBSWebSocket, EventSubscription} = require('obs-websocket-js');
const { loadConfig } = require('./src/config');

const config = loadConfig();

const State = {
	QUIET: 0,
	TALK: 1,
};

let currentState = State.QUIET;

async function onStateChange(newState) {
	if (newState === currentState) {
		return;
	}

	currentState = newState;
	await obs.call('SetSourceFilterEnabled', {
		sourceName: config.background.sourceName,
		filterName: config.background.filterName,
		filterEnabled: currentState === State.TALK,
	})
}

const url = 'ws://localhost:' + config.server.port;
const obs = new OBSWebSocket();
obs.connect(url, config.server.password, {
	rpcVersion: 1,
	eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters
}).then( () => {
	console.log('Connected to WebSocket!');

	obs.on('InputVolumeMeters', async volumeMeters => {
		const mic = volumeMeters.inputs.filter(input => input.inputName === config.micName)[0];

		if (!mic.inputLevelsMul.length) {
			return;
		}

		if (mic.inputLevelsMul[0][1] >= 0.05) {
			await onStateChange(State.TALK);
		} else {
			await onStateChange(State.QUIET);
		}
	});
});

console.log('Press any key to exit');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
