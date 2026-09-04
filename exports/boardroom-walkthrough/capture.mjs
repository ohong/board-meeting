import {mkdir, writeFile} from 'node:fs/promises';

const OUTPUT_DIR = '/Users/ohong/dev/board-meeting/exports/boardroom-walkthrough/assets';
const DEBUG_PORT = 9223;

await mkdir(OUTPUT_DIR, {recursive: true});

const target = await fetch(
  `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent('http://localhost:3000/')}`,
  {method: 'PUT'},
).then((response) => response.json());

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

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Page evaluation failed');
  }
  return result.result.value;
}

async function clickButton(label) {
  const clicked = await evaluate(`(() => {
    const label = ${JSON.stringify(label)};
    const button = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.innerText.trim().includes(label));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Button not found: ${label}`);
}

async function capture(filename) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const {data} = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(`${OUTPUT_DIR}/${filename}`, Buffer.from(data, 'base64'));
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', {url: 'http://localhost:3000/'});
await wait(3500);

await capture('01-choose-board.png');

await clickButton('Use demo board');
await wait(350);
await capture('02-board-selected.png');

await clickButton('Brief the board');
await wait(350);
await clickButton('Load sample decision');
await wait(350);
await capture('03-decision-brief.png');

await clickButton('Start the meeting');
await wait(2800);
await capture('04-live-discussion.png');

await clickButton('Invite your agent');
await wait(300);
await capture('05-webmcp-invite.png');

await clickButton('Preview the handoff');
await wait(1900);
await capture('06-agent-joined.png');

await clickButton('End meeting');
await wait(400);
await capture('07-executive-readout.png');

socket.close();
console.log('Captured Boardroom walkthrough frames.');
