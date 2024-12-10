const { OBSWebSocket, EventSubscription} = require('obs-websocket-js');
const { loadConfig } = require('./src/config');

const { background, micSettings, server } = loadConfig();

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
		sourceName: background.sourceName,
		filterName: background.filterName,
		filterEnabled: currentState === State.TALK,
	})
}

const url = 'ws://localhost:' +server.port;
const obs = new OBSWebSocket();

async function connect() {
	try {
		await obs.connect(url, server.password, {
			rpcVersion: 1,
			eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters
		});
			console.log('Connected to WebSocket!');

			obs.on('InputVolumeMeters', async volumeMeters => {
				const mic = volumeMeters.inputs.filter(input => input.inputName === micSettings.name)[0];

				if (!mic) {
					return;
				}

				if (!mic.inputLevelsMul.length) {
					return;
				}

				if (mic.inputLevelsMul[0][1] >= micSettings.sensibility) {
					await onStateChange(State.TALK);
				} else {
					await onStateChange(State.QUIET);
				}
			});

	} catch (e) {
		setTimeout(connect, 1000);
	}
}

connect();

console.log('Press any key to exit');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
console.log('Waiting for server connection');
