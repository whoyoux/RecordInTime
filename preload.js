// window.addEventListener('DOMContentLoaded', () => {
//   const replaceText = (selector, text) => {
//     const element = document.getElementById(selector)
//     if (element) element.innerText = text
//   }

//   for (const type of ['chrome', 'node', 'electron']) {
//     replaceText(`${type}-version`, process.versions[type])
//   }
// })

const fs = require('fs');
const os = require('os');

const {
  ipcRenderer,
  desktopCapturer,
  shell
} = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  const openGHLink = document.querySelector("#linkToGH");
  openGHLink.addEventListener("click", () => shell.openExternal("https://github.com/whoyoux"));
});

let mediaRecorder;
let recordedChunks = [];

//Handle start and stop
ipcRenderer.on('start', () => {
  const not = new Notification('Start recording!',
  {
    icon: './icon.png',
    body: 'Will save on desktop.'
});
  initRecord();
})

ipcRenderer.on('stop', () => {
  mediaRecorder.stop();
})

async function initRecord() {
  mediaRecorder = null;
  recordedChunks = [];

  const inputSources = await desktopCapturer.getSources({
    types: ['screen', 'audio']
  });

  const constraintsVideo = {
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: inputSources[0].id,
      }
    }
  };

  const constraintsMicrophone = {
    audio: true
  }

  const videoStream = await navigator.mediaDevices.getUserMedia(constraintsVideo);
  const microphoneStream = await navigator.mediaDevices.getUserMedia(constraintsMicrophone);

  const options = { mimeType: 'video/webm; codecs=vp9'};
  const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...microphoneStream.getAudioTracks()])

  mediaRecorder = new MediaRecorder(combinedStream, options)
  mediaRecorder.start();
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  console.log('STOP');
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const path = `${os.homedir()}/Desktop/clip-${Date.now()}.webm`

  fs.writeFile(path, buffer, () => console.log('Video saved successfully!'));

  const not = new Notification('Recorded!',
    {
      body: 'Click to open!',
      icon: './icon.png'
  });

  not.onclick = () => shell.openPath(path);
}

