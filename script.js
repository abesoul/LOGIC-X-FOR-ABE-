document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  const dropzone = document.getElementById('timeline-dropzone');

  let trackCount = 0;

  addTrackBtn.addEventListener('click', () => {
    trackCount++;
    const trackId = `track-${trackCount}`;

    // === Mixer Track Strip ===
    const trackStrip = document.createElement('div');
    trackStrip.className = 'track-strip';
    trackStrip.innerHTML = `
      <h4>Track ${trackCount}</h4>
      <label>Volume</label>
      <input type="range" min="0" max="1" step="0.01" value="1" data-id="${trackId}" class="volume"/>
      <label>Pan</label>
      <input type="range" min="-1" max="1" step="0.1" value="0" data-id="${trackId}" class="pan"/>
      <button class="add-effect-btn">🎛 FX</button>
    `;
    trackList.appendChild(trackStrip);

    // === Timeline Row ===
    const timelineRow = document.createElement('div');
    timelineRow.className = 'timeline-row';
    timelineRow.innerHTML = `
      <h4>Track ${trackCount}</h4>
      <input type="file" accept="audio/*" data-id="${trackId}" class="file-upload"/>
      <canvas class="waveform" width="240" height="60" data-id="${trackId}"></canvas>
      <button class="play-btn">▶</button>
      <button class="stop-btn">■</button>
    `;
    timelineTracks.appendChild(timelineRow);
  });

  // === Drag and Drop Audio Files ===
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
    // Handle waveform rendering here later
  });
});
// Web Audio API setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let tracks = [];

// Track Creation
document.getElementById('add-track-btn').addEventListener('click', () => {
  const track = createTrack();
  tracks.push(track);
  updateUI();
});

// Create a Track (with audio processing chain)
function createTrack() {
  const track = {
    audioElement: new Audio(),
    gainNode: audioContext.createGain(),
    panNode: audioContext.createStereoPanner(),
    reverbNode: audioContext.createConvolver(),
    delayNode: audioContext.createDelay(),
    eqNode: audioContext.createBiquadFilter(),
    muted: false,
    soloed: false
  };

  // Connect to the audio context and audio nodes
  track.audioElement.crossOrigin = "anonymous"; // Allow CORS for audio file imports
  const sourceNode = audioContext.createMediaElementSource(track.audioElement);
  sourceNode.connect(track.gainNode);

  // Connect gain node to pan node and then to destination
  track.gainNode.connect(track.panNode);
  track.panNode.connect(track.reverbNode);
  track.reverbNode.connect(track.delayNode);
  track.delayNode.connect(track.eqNode);
  track.eqNode.connect(audioContext.destination);

  // Setup FX Nodes
  track.reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100);  // Placeholder reverb buffer (you can load actual IR)
  track.delayNode.delayTime.value = 0.3;  // 300ms delay by default
  track.eqNode.type = 'lowshelf';  // Simple low shelf EQ for example
  track.eqNode.frequency.value = 1000;  // Center frequency for the filter

  // Default volume (gain node)
  track.gainNode.gain.value = 1;

  return track;
}

// Update UI with newly created track
function updateUI() {
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  trackList.innerHTML = '';
  timelineTracks.innerHTML = '';

  tracks.forEach((track, index) => {
    // Create mixer controls for the track
    const trackStrip = document.createElement('div');
    trackStrip.classList.add('track-strip');
    trackStrip.innerHTML = `
      <h4>Track ${index + 1}</h4>
      <div class="mute-solo">
        <button class="mute-btn" data-index="${index}">Mute</button>
        <button class="solo-btn" data-index="${index}">Solo</button>
      </div>
      <input type="range" class="volume" data-index="${index}" min="0" max="1" step="0.01" value="1">
      <input type="range" class="pan" data-index="${index}" min="-1" max="1" step="0.1" value="0">
      <button class="fx-btn" data-index="${index}">🎛 FX</button>
    `;
    trackList.appendChild(trackStrip);

    // Create timeline row for the track
    const timelineRow = document.createElement('div');
    timelineRow.classList.add('timeline-row');
    timelineRow.innerHTML = `<p>Track ${index + 1}</p><button class="load-file-btn" data-index="${index}">Load File</button>`;
    timelineTracks.appendChild(timelineRow);
  });

  // Event listeners for volume, pan, mute, solo, FX
  document.querySelectorAll('.volume').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const trackIndex = e.target.dataset.index;
      tracks[trackIndex].gainNode.gain.value = e.target.value;
    });
  });

  document.querySelectorAll('.pan').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const trackIndex = e.target.dataset.index;
      tracks[trackIndex].panNode.pan.value = e.target.value;
    });
  });

  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trackIndex = e.target.dataset.index;
      toggleMute(trackIndex);
    });
  });

  document.querySelectorAll('.solo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trackIndex = e.target.dataset.index;
      toggleSolo(trackIndex);
    });
  });

  document.querySelectorAll('.fx-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trackIndex = e.target.dataset.index;
      showFXPanel(trackIndex);
    });
  });
}

// Toggle Mute on Track
function toggleMute(trackIndex) {
  const track = tracks[trackIndex];
  track.muted = !track.muted;
  if (track.muted) {
    track.gainNode.disconnect();
  } else {
    track.audioElement.play();
    track.audioElement.connect(track.gainNode);
  }
  document.querySelector(`.mute-btn[data-index="${trackIndex}"]`).classList.toggle('active', track.muted);
}

// Toggle Solo on Track
function toggleSolo(trackIndex) {
  const track = tracks[trackIndex];
  track.soloed = !track.soloed;
  if (track.soloed) {
    // Mute all other tracks except the soloed one
    tracks.forEach((otherTrack, idx) => {
      if (idx !== trackIndex) {
        otherTrack.gainNode.disconnect();
      }
    });
  } else {
    // Reconnect all tracks
    tracks.forEach((otherTrack) => {
      otherTrack.audioElement.connect(otherTrack.gainNode);
    });
  }
  document.querySelector(`.solo-btn[data-index="${trackIndex}"]`).classList.toggle('active', track.soloed);
}

// Show FX Panel for a track
function showFXPanel(trackIndex) {
  const track = tracks[trackIndex];
  const fxPanel = document.getElementById('fx-panel');

  // Populate FX panel with sliders for track effects
  document.getElementById('reverb-slider').value = track.reverbNode.buffer ? 0.5 : 0;
  document.getElementById('delay-slider').value = track.delayNode.delayTime.value;
  document.getElementById('eq-slider').value = track.eqNode.frequency.value;

  fxPanel.classList.remove('hidden');

  // FX Panel Controls
  document.getElementById('reverb-slider').addEventListener('input', (e) => {
    track.reverbNode.buffer = e.target.value;
  });
  document.getElementById('delay-slider').addEventListener('input', (e) => {
    track.delayNode.delayTime.value = e.target.value;
  });
  document.getElementById('eq-slider').addEventListener('input', (e) => {
    track.eqNode.frequency.value = e.target.value;
  });

  document.getElementById('close-fx-btn').addEventListener('click', () => {
    fxPanel.classList.add('hidden');
  });
}
// Track creation now includes file input
function createTrack() {
  const track = {
    audioElement: new Audio(),
    gainNode: audioContext.createGain(),
    panNode: audioContext.createStereoPanner(),
    reverbNode: audioContext.createConvolver(),
    delayNode: audioContext.createDelay(),
    eqNode: audioContext.createBiquadFilter(),
    muted: false,
    soloed: false,
    waveformCanvas: null, // Canvas to draw waveform
    fileInput: null, // File input element
  };

  // Connect audio chain as before
  const sourceNode = audioContext.createMediaElementSource(track.audioElement);
  sourceNode.connect(track.gainNode);

  track.gainNode.connect(track.panNode);
  track.panNode.connect(track.reverbNode);
  track.reverbNode.connect(track.delayNode);
  track.delayNode.connect(track.eqNode);
  track.eqNode.connect(audioContext.destination);

  track.reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100);
  track.delayNode.delayTime.value = 0.3;
  track.eqNode.type = 'lowshelf';
  track.eqNode.frequency.value = 1000;
  track.gainNode.gain.value = 1;

  return track;
}

// File input event listener
document.querySelectorAll('.file-upload').forEach(input => {
  input.addEventListener('change', (e) => {
    const trackIndex = e.target.dataset.index;
    const file = e.target.files[0];

    if (file) {
      const track = tracks[trackIndex];
      const reader = new FileReader();
      
      reader.onload = () => {
        const arrayBuffer = reader.result;
        audioContext.decodeAudioData(arrayBuffer, (buffer) => {
          track.audioElement.src = URL.createObjectURL(file);
          track.audioElement.load();

          // Create waveform canvas
          createWaveform(track, buffer);
        });
      };

      reader.readAsArrayBuffer(file);
    }
  });
});

// Create waveform visualization
function createWaveform(track, audioBuffer) {
  // Create canvas for waveform visualization
  track.waveformCanvas = document.createElement('canvas');
  track.waveformCanvas.width = 240;
  track.waveformCanvas.height = 60;
  const ctx = track.waveformCanvas.getContext('2d');
  
  const data = audioBuffer.getChannelData(0); // Use left channel for simplicity
  const width = track.waveformCanvas.width;
  const height = track.waveformCanvas.height;
  
  const step = Math.floor(data.length / width);
  const amp = height / 2;
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
  
  for (let i = 0; i < width; i++) {
    const min = Math.min(...data.slice(i * step, (i + 1) * step));
    const max = Math.max(...data.slice(i * step, (i + 1) * step));
    ctx.fillRect(i, (1 + min) * amp, 1, (max - min) * amp);
  }

  document.querySelector(`#timeline-tracks`).appendChild(track.waveformCanvas);
}
