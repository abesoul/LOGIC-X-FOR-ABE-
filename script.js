const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let trackCounter = 0;
let tracks = [];
let trackPatterns = [];
let tempo = 120; // Default tempo (beats per minute)

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

  // Bind Events for Volume and Pan sliders
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
    btn.addEventListener('click', (e) => {
      const track = tracks[e.target.dataset.index];
      track.muted = !track.muted;
      track.gainNode.gain.value = track.muted ? 0 : 1;
    });
  });

  document.querySelectorAll('.solo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const track = tracks[e.target.dataset.index];
      track.soloed = !track.soloed;
      if (track.soloed) {
        tracks.forEach(t => {
          if (t !== track) t.gainNode.gain.value = 0; // Mute all other tracks
        });
      } else {
        tracks.forEach(t => t.gainNode.gain.value = 1); // Unmute all tracks
      }
    });
  });
}

function initTrackLogic(index) {
  const fileInput = document.querySelector(`.file-upload[data-index="${index}"]`);
  const loadBtn = document.querySelector(`.load-file-btn[data-index="${index}"]`);
  const canvas = document.querySelector(`canvas[data-index="${index}"]`);
  const ctx = canvas.getContext("2d");

  const reverbSlider = document.querySelector(`#reverb-slider-${index}`);
  const delaySlider = document.querySelector(`#delay-slider-${index}`);
  const eqSlider = document.querySelector(`#eq-slider-${index}`);

  let audioBuffer = null;
  let sourceNode = null;
  let reverbNode = null;
  let delayNode = null;
  let eqNode = null;

  loadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    drawWaveform(audioBuffer, ctx, canvas);
  });

  function createEffects() {
    // Reverb Effect
    reverbNode = audioContext.createConvolver();

    // Delay Effect
    delayNode = audioContext.createDelay();
    delayNode.delayTime.setValueAtTime(delaySlider.value, audioContext.currentTime);

    // EQ (Treble) Effect
    eqNode = audioContext.createBiquadFilter();
    eqNode.type = "highshelf"; // Adjust for treble frequency
    eqNode.frequency.setValueAtTime(eqSlider.value, audioContext.currentTime);
    eqNode.gain.setValueAtTime(10, audioContext.currentTime); // Boost treble

    // Update effects in real-time as sliders are changed
    reverbSlider.addEventListener("input", () => {
      reverbNode.gain.setValueAtTime(reverbSlider.value, audioContext.currentTime);
    });

    delaySlider.addEventListener("input", () => {
      delayNode.delayTime.setValueAtTime(delaySlider.value, audioContext.currentTime);
    });

    eqSlider.addEventListener("input", () => {
      eqNode.frequency.setValueAtTime(eqSlider.value, audioContext.currentTime);
    });
  }

  function drawWaveform(audioBuffer, ctx, canvas) {
    const width = canvas.width;
    const height = canvas.height;
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
}
