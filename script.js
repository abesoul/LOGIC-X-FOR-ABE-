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

document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  const fxPanel = document.getElementById('fx-panel');
  const closeFxBtn = document.getElementById('close-fx-btn');

  let currentFxTrack = null;
  let trackCounter = 0;
  const tracks = [];

  const updatePlaybackState = () => {
    const soloed = tracks.filter(t => t.solo);
    tracks.forEach(t => {
      const isMuted = soloed.length > 0 ? !t.solo : t.mute;
      if (t.audio) t.audio.muted = isMuted;
    });
  };

  const createTrack = () => {
    const trackId = `track-${++trackCounter}`;
    const track = {
      id: trackId,
      volume: 1,
      pan: 0,
      mute: false,
      solo: false,
      fx: { reverb: 0.2, delay: 0.1, eq: 5000 },
      audio: new Audio(),
    };

    // === MIXER STRIP ===
    const mixerStrip = document.createElement('div');
    mixerStrip.className = 'track-strip';
    mixerStrip.innerHTML = `
      <h4>Track ${trackCounter}</h4>
      <label>Volume</label>
      <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="1" />
      <label>Pan</label>
      <input type="range" class="pan-slider" min="-1" max="1" step="0.1" value="0" />
      <div class="mute-solo">
        <button class="mute-btn">Mute</button>
        <button class="solo-btn">Solo</button>
        <button class="fx-btn">🎛 FX</button>
      </div>
    `;
    trackList.appendChild(mixerStrip);

    // === TIMELINE TRACK ===
    const timelineRow = document.createElement('div');
    timelineRow.className = 'timeline-row';
    timelineRow.innerHTML = `
      <p>Track ${trackCounter}</p>
      <input type="file" class="audio-upload" accept="audio/*" />
      <canvas class="waveform" width="300" height="60"></canvas>
      <button class="play-btn">▶</button>
      <button class="stop-btn">⏹</button>
    `;
    timelineTracks.appendChild(timelineRow);

    // === MIXER CONTROLS ===
    const volumeSlider = mixerStrip.querySelector('.volume-slider');
    const panSlider = mixerStrip.querySelector('.pan-slider');
    const muteBtn = mixerStrip.querySelector('.mute-btn');
    const soloBtn = mixerStrip.querySelector('.solo-btn');
    const fxBtn = mixerStrip.querySelector('.fx-btn');

    volumeSlider.addEventListener('input', e => {
      track.volume = parseFloat(e.target.value);
      if (track.audio) track.audio.volume = track.volume;
    });

    panSlider.addEventListener('input', e => {
      track.pan = parseFloat(e.target.value);
      // Real pan effect requires Web Audio API, not default Audio()
    });

    muteBtn.addEventListener('click', () => {
      track.mute = !track.mute;
      muteBtn.classList.toggle('active', track.mute);
      updatePlaybackState();
    });

    soloBtn.addEventListener('click', () => {
      track.solo = !track.solo;
      soloBtn.classList.toggle('active', track.solo);
      updatePlaybackState();
    });

    fxBtn.addEventListener('click', () => {
      currentFxTrack = track;
      fxPanel.classList.remove('hidden');
      document.getElementById('reverb-slider').value = track.fx.reverb;
      document.getElementById('delay-slider').value = track.fx.delay;
      document.getElementById('eq-slider').value = track.fx.eq;
    });

    // === AUDIO FILE UPLOAD ===
    const fileInput = timelineRow.querySelector('.audio-upload');
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      track.audio.src = URL.createObjectURL(file);
      track.audio.load();
      track.audio.volume = track.volume;
      updatePlaybackState();
    });

    timelineRow.querySelector('.play-btn').addEventListener('click', () => {
      if (track.audio) track.audio.play();
    });

    timelineRow.querySelector('.stop-btn').addEventListener('click', () => {
      if (track.audio) {
        track.audio.pause();
        track.audio.currentTime = 0;
      }
    });

    tracks.push(track);
  };

  // Add track on button click
  addTrackBtn.addEventListener('click', createTrack);

  // Close FX panel
  closeFxBtn.addEventListener('click', () => {
    fxPanel.classList.add('hidden');
    currentFxTrack = null;
  });

  // FX sliders
  document.getElementById('reverb-slider').addEventListener('input', e => {
    if (currentFxTrack) currentFxTrack.fx.reverb = parseFloat(e.target.value);
  });

  document.getElementById('delay-slider').addEventListener('input', e => {
    if (currentFxTrack) currentFxTrack.fx.delay = parseFloat(e.target.value);
  });

  document.getElementById('eq-slider').addEventListener('input', e => {
    if (currentFxTrack) currentFxTrack.fx.eq = parseFloat(e.target.value);
  });
});
