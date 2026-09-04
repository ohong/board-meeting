import {mkdir, writeFile} from 'node:fs/promises';

const OUTPUT_DIR = '/Users/ohong/dev/board-meeting/exports/boardroom-walkthrough/assets/deployed';
const DEBUG_PORT = 9224;

await mkdir(OUTPUT_DIR, {recursive: true});

const targets = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`).then((response) => response.json());
const target = targets.find((candidate) => candidate.type === 'page' && candidate.url.includes('/m/'));
if (!target) throw new Error('No active deployed meeting tab found.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, {once: true});
  socket.addEventListener('error', reject, {once: true});
});

let commandId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(message.error.message));
  else handler.resolve(message.result);
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({id, method, params}));
  return new Promise((resolve, reject) => pending.set(id, {resolve, reject}));
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Page evaluation failed');
  return result.result.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await wait(25000);

const {data} = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
await writeFile(`${OUTPUT_DIR}/07-executive-memo.png`, Buffer.from(data, 'base64'));

console.log(JSON.stringify(await evaluate(`({
  url: location.href,
  buttons: [...document.querySelectorAll('button')].map((button) => button.innerText.trim()),
  text: document.body.innerText.slice(0, 5000),
})`), null, 2));

socket.close();
