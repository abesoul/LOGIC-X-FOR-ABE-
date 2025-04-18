// FX Rack & Audio Context
let audioCtx;
let currentSource;
let reverbNode, delayNode, eqNode;
let fxPanel = document.getElementById('fx-panel');

let currentFXTrack = null;
const fxPanel = document.getElementById('fx-panel');
const closeFxBtn = document.getElementById('close-fx-btn');

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('add-effect-btn')) {
    currentFXTrack = e.target.closest('.track-strip') || e.target.closest('.track');
    fxPanel.classList.remove('hidden');
  }
});

closeFxBtn.addEventListener('click', () => {
  fxPanel.classList.add('hidden');
  currentFXTrack = null;
});

document.getElementById('save-project').addEventListener('click', () => {
  const data = [];

  document.querySelectorAll('.track-strip').forEach((track, i) => {
    const volume = track.querySelector('input[type="range"]').value;
    data.push({ name: `Track ${i + 1}`, volume });
  });

  localStorage.setItem('neondaw_project', JSON.stringify(data));
  alert('✅ Project Saved!');
});

document.getElementById('load-project').addEventListener('click', () => {
  const data = JSON.parse(localStorage.getItem('neondaw_project') || '[]');
  const trackList = document.getElementById('track-list');
  trackList.innerHTML = '';
  const timelineTracks = document.getElementById('timeline-tracks');
  timelineTracks.innerHTML = '';

  data.forEach((trackData, i) => {
    const track = document.createElement('div');
    track.className = 'track-strip';
    track.innerHTML = `
      <h4>${trackData.name}</h4>
      <input type="range" min="0" max="100" value="${trackData.volume}" />
      <button class="add-effect-btn">🎛 FX</button>
    `;
    trackList.appendChild(track);

    const timelineRow = document.createElement('div');
    timelineRow.className = 'timeline-row';
    timelineRow.innerHTML = `<p>${trackData.name}</p>`;
    timelineTracks.appendChild(timelineRow);
  });

  alert('📂 Project Loaded!');
});


document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  const dropzone = document.getElementById('timeline-dropzone');
  const closeFX = document.getElementById('close-fx-btn');

  // Handle Track Creation
  addTrackBtn.addEventListener('click', () => {
    const track = document.createElement('div');
    track.className = 'track-strip';
    track.innerHTML = `
      <h4>Track ${trackList.children.length + 1}</h4>
      <input type="range" min="0" max="100" value="50" />
      <button class="add-effect-btn">🎛 FX</button>
    `;
    trackList.appendChild(track);

    const timelineRow = document.createElement('div');
    timelineRow.className = 'timeline-row';
    timelineRow.innerHTML = `<p>Track ${trackList.children.length}</p>`;
    timelineTracks.appendChild(timelineRow);

const zoomSlider = document.getElementById('zoom-slider');
zoomSlider.addEventListener('input', () => {
  const scale = zoomSlider.value;
  document.querySelectorAll('.waveform').forEach(canvas => {
    canvas.style.transform = `scaleX(${scale})`;
  });
});

    
    // FX button logic
    track.querySelector('.add-effect-btn').addEventListener('click', () => {
      fxPanel.classList.remove('hidden');
    });
  });

  closeFX.addEventListener('click', () => {
    fxPanel.classList.add('hidden');
  });

  // Handle Drag & Drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#0ff';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#00f0ff';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    dropzone.style.borderColor = '#00f0ff';
    loadAndPlayAudio(file);
  });

  // Load + Process Audio
  function loadAndPlayAudio(file) {
    const reader = new FileReader();
    reader.onload = function () {
      const arrayBuffer = reader.result;

      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
        if (currentSource) currentSource.disconnect();

        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = audioBuffer;

        // FX Nodes
        reverbNode = audioCtx.createGain();
        delayNode = audioCtx.createDelay();
        eqNode = audioCtx.createBiquadFilter();
        eqNode.type = 'highshelf';

        // Initial settings
        reverbNode.gain.value = parseFloat(document.getElementById('reverb-slider').value);
        delayNode.delayTime.value = parseFloat(document.getElementById('delay-slider').value);
        eqNode.frequency.value = parseFloat(document.getElementById('eq-slider').value);

        // Connect FX chain
        currentSource
          .connect(reverbNode)
          .connect(delayNode)
          .connect(eqNode)
          .connect(audioCtx.destination);

        currentSource.start();
      });
    };
    reader.readAsArrayBuffer(file);
  }

  // FX Control Listeners
  document.getElementById('reverb-slider').addEventListener('input', e => {
    if (reverbNode) reverbNode.gain.value = parseFloat(e.target.value);
  });

  document.getElementById('delay-slider').addEventListener('input', e => {
    if (delayNode) delayNode.delayTime.value = parseFloat(e.target.value);
  });

  document.getElementById('eq-slider').addEventListener('input', e => {
    if (eqNode) eqNode.frequency.value = parseFloat(e.target.value);
  });
});
