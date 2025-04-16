document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn') || document.getElementById('addTrack');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks') || document.getElementById('timeline');
  const mixer = document.getElementById('mixer');
  const dropzone = document.getElementById('timeline-dropzone');

  let trackCount = 0;

  addTrackBtn.addEventListener('click', () => {
    trackCount++;
    const trackId = `track-${trackCount}`;

    // Timeline Track (Waveform & Upload)
    const timelineBlock = document.createElement('div');
    timelineBlock.className = 'track';
    timelineBlock.innerHTML = `
      <h3>Track ${trackCount}</h3>
      <input type="file" accept="audio/*" data-id="${trackId}" class="file-upload"/>
      <canvas class="waveform" width="240" height="60"></canvas>
    `;
    timelineTracks.appendChild(timelineBlock);

    // Mixer Channel
    if (mixer) {
      const channel = document.createElement('div');
      channel.className = 'track';
      channel.innerHTML = `
        <h3>Track ${trackCount}</h3>
        <label>Volume</label>
        <input type="range" min="0" max="1" step="0.01" value="1" data-id="${trackId}" class="volume"/>
        <label>Pan</label>
        <input type="range" min="-1" max="1" step="0.1" value="0" data-id="${trackId}" class="pan"/>
      `;
      mixer.appendChild(channel);
    }

    // Additional Mixer List (if present)
    if (trackList) {
      const strip = document.createElement('div');
      strip.className = 'track-strip';
      strip.innerHTML = `
        <h4>Track ${trackCount}</h4>
        <input type="range" min="0" max="100" value="50" />
        <button class="add-effect-btn">🎛 FX</button>
      `;
      trackList.appendChild(strip);
    }

    // Timeline Label Row (if present)
    if (timelineTracks && document.getElementById('timeline-tracks')) {
      const timelineRow = document.createElement('div');
      timelineRow.className = 'timeline-row';
      timelineRow.innerHTML = `<p>Track ${trackCount}</p>`;
      document.getElementById('timeline-tracks').appendChild(timelineRow);
    }
  });

  // Drag & Drop to timeline
  if (dropzone) {
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
      alert(`🎵 Imported file: ${file.name}`);
      dropzone.style.borderColor = '#00f0ff';
      // TODO: Handle waveform generation and playback
    });
  }
});

// FX Rack & Audio Context
let audioCtx;
let currentSource;
let reverbNode, delayNode, eqNode;
let fxPanel = document.getElementById('fx-panel');

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
