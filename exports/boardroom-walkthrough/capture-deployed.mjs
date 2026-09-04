import {mkdir, writeFile} from 'node:fs/promises';

const OUTPUT_DIR = '/Users/ohong/dev/board-meeting/exports/boardroom-walkthrough/assets/deployed';
const DEBUG_PORT = 9224;
const DEPLOYED_URL = 'https://board-meeting.shjavokhir1.workers.dev/';

await mkdir(OUTPUT_DIR, {recursive: true});

const target = await fetch(
  `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(DEPLOYED_URL)}`,
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

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Page evaluation failed');
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
  if (!clicked) {
    const buttons = await evaluate(`([...document.querySelectorAll('button')]).map((button) => button.innerText.trim())`);
    throw new Error(`Button not found: ${label}. Available: ${buttons.join(' | ')}`);
  }
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
await send('Page.navigate', {url: DEPLOYED_URL});
await wait(4500);

await capture('01-home.png');

await clickButton('Sam Altman');
await clickButton('Lulu Cheng Meservey');
await clickButton('David Heinemeier Hansson');
await wait(500);
await capture('02-board-selected.png');

await clickButton('Continue');
await wait(900);
await capture('03-next-step.png');

await clickButton('Use example decision');
await wait(500);
await capture('03-decision-brief.png');

await clickButton('Start Board Meeting');
await wait(12000);
await capture('04-live-boardroom.png');

await clickButton('Invite your agent');
await wait(500);
await capture('05-agent-invite.png');

await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape'});
await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape'});
await wait(18000);
await capture('06-boardroom-discussion.png');

await clickButton('End meeting');
await wait(12000);
await capture('07-executive-memo.png');
console.log(JSON.stringify(await evaluate(`({
  title: document.title,
  url: location.href,
  heading: document.querySelector('h1')?.innerText,
  buttons: [...document.querySelectorAll('button')].map((button) => button.innerText.trim()),
  text: document.body.innerText.slice(0, 3600),
})`), null, 2));

socket.close();
