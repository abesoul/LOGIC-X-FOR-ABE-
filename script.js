const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let trackCounter = 0;
let tracks = [];
let trackPatterns = [];

document.getElementById("add-track-btn").addEventListener("click", () => {
  const index = trackCounter++;
  const track = createTrack(index);
  tracks.push(track);
  updateUI();
  const trackStrip = document.createElement("div");
  trackStrip.className = "track-strip";
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
  document.getElementById("track-list").appendChild(trackStrip);

  const timelineRow = document.createElement("div");
  timelineRow.className = "timeline-row";
  timelineRow.innerHTML = `
    <p>Track ${index + 1}</p>
    <button class="load-file-btn" data-index="${index}">🎵 Load File</button>
    <input type="file" class="file-upload" data-index="${index}" accept="audio/*" style="display:none;" />
    <canvas class="waveform" data-index="${index}" height="60" width="240"></canvas>
  `;
  document.getElementById("timeline-tracks").appendChild(timelineRow);

  initTrackLogic(index);
});

function createTrack(index) {
  const track = {
    audioElement: new Audio(),
    gainNode: audioContext.createGain(),
    panNode: audioContext.createStereoPanner(),
    reverbNode: audioContext.createConvolver(),
    delayNode: audioContext.createDelay(),
    eqNode: audioContext.createBiquadFilter(),
    fileBuffer: null,
    sourceNode: null,
    muted: false,
    soloed: false
  };

  track.audioElement.crossOrigin = "anonymous";
  const sourceNode = audioContext.createMediaElementSource(track.audioElement);
  sourceNode.connect(track.gainNode);

  track.gainNode.connect(track.panNode);
  track.panNode.connect(track.reverbNode);
  track.reverbNode.connect(track.delayNode);
  track.delayNode.connect(track.eqNode);
  track.eqNode.connect(audioContext.destination);

  // Defaults
  track.reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100); // Placeholder for real IR
  track.delayNode.delayTime.value = 0.3;
  track.eqNode.type = 'lowshelf';
  track.eqNode.frequency.value = 1000;
  track.gainNode.gain.value = 1;

  return track;
}

function updateUI() {
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  trackList.innerHTML = '';
  timelineTracks.innerHTML = '';

  tracks.forEach((track, index) => {
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

    const timelineRow = document.createElement('div');
    timelineRow.classList.add('timeline-row');
    timelineRow.innerHTML = `
      <p>Track ${index + 1}</p>
      <button class="load-file-btn" data-index="${index}">🎵 Load File</button>
      <input type="file" class="file-upload" data-index="${index}" accept="audio/*" style="display:none;" />
      <canvas class="waveform" data-index="${index}" height="60" width="240"></canvas>
    `;
    timelineTracks.appendChild(timelineRow);
  });

  // Bind Events
  document.querySelectorAll('.volume').forEach(slider => {
    slider.addEventListener('input', e => {
      tracks[e.target.dataset.index].gainNode.gain.value = e.target.value;
    });
  });

  document.querySelectorAll('.pan').forEach(slider => {
    slider.addEventListener('input', e => {
      tracks[e.target.dataset.index].panNode.pan.value = e.target.value;
    });
  });

  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.addEventListener('click', e => toggleMute(e.target.dataset.index));
  });

  document.querySelectorAll('.solo-btn').forEach(btn => {
    btn.addEventListener('click', e => toggleSolo(e.target.dataset.index));
  });

  document.querySelectorAll('.fx-btn').forEach(btn => {
    btn.addEventListener('click', e => showFXPanel(e.target.dataset.index));
  });

  document.querySelectorAll('.load-file-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = e.target.dataset.index;
      document.querySelector(`.file-upload[data-index="${index}"]`).click();
    });
  });

  document.querySelectorAll('.file-upload').forEach(input => {
    input.addEventListener('change', async (e) => {
      const index = e.target.dataset.index;
      const file = e.target.files[0];
      if (!file) return;
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      tracks[index].fileBuffer = audioBuffer;
      drawWaveform(audioBuffer, document.querySelector(`canvas[data-index="${index}"]`).getContext("2d"));
    });
  });
}

// Playback
document.getElementById('play-btn').addEventListener('click', () => {
  tracks.forEach((track, index) => {
    if (!track.fileBuffer) return;
    const source = audioContext.createBufferSource();
    source.buffer = track.fileBuffer;
    source.connect(track.gainNode);
    source.start();
    track.sourceNode = source;
  });
});

document.getElementById('stop-btn').addEventListener('click', () => {
  tracks.forEach(track => {
    if (track.sourceNode) track.sourceNode.stop();
  });
});

// FX Panel
function showFXPanel(trackIndex) {
  const track = tracks[trackIndex];
  const fxPanel = document.getElementById('fx-panel');

  document.getElementById('reverb-slider').value = 0.5;
  document.getElementById('delay-slider').value = track.delayNode.delayTime.value;
  document.getElementById('eq-slider').value = track.eqNode.frequency.value;

  fxPanel.classList.remove('hidden');

  document.getElementById('reverb-slider').oninput = () => {
    track.reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100); // Placeholder for real IR
    track.reverbNode.gain.setValueAtTime(document.getElementById('reverb-slider').value, audioContext.currentTime);
  };

  document.getElementById('delay-slider').oninput = () => {
    track.delayNode.delayTime.setValueAtTime(document.getElementById('delay-slider').value, audioContext.currentTime);
  };

  document.getElementById('eq-slider').oninput = () => {
    track.eqNode.frequency.setValueAtTime(document.getElementById('eq-slider').value, audioContext.currentTime);
  };
}

function drawWaveform(audioBuffer, ctx) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const data = audioBuffer.getChannelData(0);
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  const step = Math.floor(data.length / width);
  for (let i = 0; i < width; i++) {
    const min = Math.min(...data.slice(i * step, (i + 1) * step));
    const max = Math.max(...data.slice(i * step, (i + 1) * step));
    ctx.moveTo(i, (1 + min) * height / 2);
    ctx.lineTo(i, (1 + max) * height / 2);
  }
  ctx.strokeStyle = "#0ff";
  ctx.stroke();
}

// Smart Beat Suggestion Logic
document.getElementById('suggest-beat-btn').addEventListener('click', () => {
  const pattern = generateBeatPattern();
  trackPatterns.push(pattern);
  console.log("Suggested Beat Pattern:", pattern);
  // Add logic to display the pattern on the UI
});

function generateBeatPattern() {
  // Example random beat pattern generation
  return Array.from({ length: 16 }, () => Math.random() > 0.7 ? 1 : 0);
}

// Mute/Solo Logic
function toggleMute(index) {
  const track = tracks[index];
  track.muted = !track.muted;
  track.gainNode.gain.value = track.muted ? 0 : 1;
}

function toggleSolo(index) {
  const track = tracks[index];
  track.soloed = !track.soloed;
  tracks.forEach((t, i) => {
    if (i !== index) {
      t.gainNode.gain.value = track.soloed ? 0 : 1;
    }
  });
}
