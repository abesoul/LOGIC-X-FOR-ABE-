document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn') || document.getElementById('addTrack');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks') || document.getElementById('timeline');
  const mixer = document.getElementById('mixer');
  const dropzone = document.getElementById('timeline-dropzone');

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
      <canvas class="waveform" width="240" height="60" data-id="${trackId}"></canvas>
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

    setupFileHandler();
  });

  function setupFileHandler() {
    const fileInputs = document.querySelectorAll('.file-upload');
    fileInputs.forEach(input => {
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const canvas = document.querySelector(`canvas[data-id="${e.target.dataset.id}"]`);
        drawWaveform(canvas, audioBuffer);
        canvas.onclick = () => playAudio(audioBuffer);
      };
    });
  }

  function drawWaveform(canvas, audioBuffer) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0ff';
    for (let i = 0; i < width; i++) {
      const min = Math.min(...data.slice(i * step, (i + 1) * step));
      const max = Math.max(...data.slice(i * step, (i + 1) * step));
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }

  function playAudio(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  }

// Global Audio Context
let audioCtx;
let currentSource;
let trackFX = {};  // Hold FX settings per track
let trackId = 0;

document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const timelineTracks = document.getElementById('timeline-tracks');
  const dropzone = document.getElementById('timeline-dropzone');
  const closePlugin = document.getElementById('close-plugin-btn');
  const pluginPanel = document.getElementById('plugin-panel');

  // Handle Track Creation + FX Panel
  addTrackBtn.addEventListener('click', () => {
    trackId++;
    const track = document.createElement('div');
    track.className = 'track-strip';
    track.id = `track-${trackId}`;
    track.innerHTML = `
      <h4>Track ${trackId}</h4>
      <button class="add-effect-btn">🎛 FX</button>
      <input type="range" class="track-volume" min="0" max="100" value="50" />
    `;
    timelineTracks.appendChild(track);

    // Track FX button logic
    track.querySelector('.add-effect-btn').addEventListener('click', () => {
      pluginPanel.classList.remove('hidden');
      setupTrackFX(trackId);
    });
  });

  // Close FX Panel
  closePlugin.addEventListener('click', () => {
    pluginPanel.classList.add('hidden');
  });

  // Handle Drag & Drop for Tracks
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

  // Load and Play Audio with Effects
  function loadAndPlayAudio(file) {
    const reader = new FileReader();
    reader.onload = function () {
      const arrayBuffer = reader.result;

      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
        if (currentSource) currentSource.disconnect();

        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = audioBuffer;

        // Connect Audio Source to Track FX Chain
        applyFX(trackId);

        currentSource.connect(audioCtx.destination);
        currentSource.start();
      });
    };
    reader.readAsArrayBuffer(file);
  }

  // Setup and Apply FX for Track
  function setupTrackFX(trackId) {
    trackFX[trackId] = {
      reverb: 0.2,
      delay: 0.1,
      eq: 5000,
      compression: 0.5,
      distortion: 0
    };

    // Attach Event Listeners for FX Controls
    document.getElementById('reverb-slider').addEventListener('input', (e) => {
      trackFX[trackId].reverb = parseFloat(e.target.value);
      applyFX(trackId);
    });

    document.getElementById('delay-slider').addEventListener('input', (e) => {
      trackFX[trackId].delay = parseFloat(e.target.value);
      applyFX(trackId);
    });

    document.getElementById('eq-slider').addEventListener('input', (e) => {
      trackFX[trackId].eq = parseFloat(e.target.value);
      applyFX(trackId);
    });

    document.getElementById('compressor-slider').addEventListener('input', (e) => {
      trackFX[trackId].compression = parseFloat(e.target.value);
      applyFX(trackId);
    });

    document.getElementById('distortion-slider').addEventListener('input', (e) => {
      trackFX[trackId].distortion = parseFloat(e.target.value);
      applyFX(trackId);
    });
  }

  // Apply Effects Based on Track FX Settings
  function applyFX(trackId) {
    const reverbNode = audioCtx.createGain();
    const delayNode = audioCtx.createDelay();
    const eqNode = audioCtx.createBiquadFilter();
    const compressorNode = audioCtx.createDynamicsCompressor();
    const distortionNode = audioCtx.createWaveShaper();

    // FX Settings
    reverbNode.gain.value = trackFX[trackId].reverb;
    delayNode.delayTime.value = trackFX[trackId].delay;
    eqNode.frequency.value = trackFX[trackId].eq;
    compressorNode.threshold.value = -50;
    compressorNode.knee.value = 40;
    compressorNode.ratio.value = 12;
    compressorNode.attack.value = 0;
    compressorNode.release.value = 0.25;

    distortionNode.curve = makeDistortionCurve(trackFX[trackId].distortion);
    distortionNode.oversample = '4x';

    // Connect FX Chain
    currentSource.disconnect();
    currentSource.connect(reverbNode)
      .connect(delayNode)
      .connect(eqNode)
      .connect(compressorNode)
      .connect(distortionNode)
      .connect(audioCtx.destination);
  }

  // Distortion curve generation (from audio context)
  function makeDistortionCurve(amount) {
    const curve = new Float32Array(44100);
    const deg = Math.PI / 180

  
  // Drag & Drop Support
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#0ff';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '#00f0ff';
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      alert(`🎵 Imported file: ${file.name}`);

      // Auto add a new track and load it
      addTrackBtn.click();

      // Wait for track DOM to render then trigger file input
      setTimeout(async () => {
        const newInput = document.querySelectorAll('.file-upload')[trackCount - 1];
        const dt = new DataTransfer();
        dt.items.add(file);
        newInput.files = dt.files;
        newInput.dispatchEvent(new Event('change'));
      }, 100);

      dropzone.style.borderColor = '#00f0ff';
    });
  }
});
