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

// Logic to handle track's playback, mute, solo, and FX
function initTrackLogic(index) {
  const fileInput = document.querySelector(`.file-upload[data-index="${index}"]`);
  const loadBtn = document.querySelector(`.load-file-btn[data-index="${index}"]`);
  const playBtn = document.querySelector(`.play-btn[data-index="${index}"]`);
  const stopBtn = document.querySelector(`.stop-btn[data-index="${index}"]`);
  const suggestBeatBtn = document.querySelector(`.suggest-beat-btn[data-index="${index}"]`);
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

  playBtn.addEventListener("click", () => {
    if (!audioBuffer) return;

    // Create the source node
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;

    // Create and connect effects
    createEffects(index);

    // Connect the effects chain
    sourceNode.connect(reverbNode);
    reverbNode.connect(delayNode);
    delayNode.connect(eqNode);
    eqNode.connect(audioContext.destination);

    sourceNode.start();
  });

  stopBtn.addEventListener("click", () => {
    if (sourceNode) {
      sourceNode.stop();
      sourceNode.disconnect();
    }
  });

  // Smart Beat Suggestion Logic
  suggestBeatBtn.addEventListener("click", () => {
    const pattern = generateBeatPattern();
    trackPatterns.push(pattern);
    console.log("Suggested Beat Pattern:", pattern);
    applyBeatPatternToTrack(index, pattern);
    visualizeBeatPattern(index, pattern);
  });

  function createEffects(index) {
    // Reverb Effect
    reverbNode = audioContext.createConvolver();
    // Load reverb impulse (use a short default or external file)

    // Delay Effect
    delayNode = audioContext.createDelay();
    delayNode.delayTime.setValueAtTime(delaySlider.value, audioContext.currentTime);

    // EQ (Treble) Effect
    eqNode = audioContext.createBiquadFilter();
    eqNode.type = "highshelf"; // Adjust for treble frequency
    eqNode.frequency.setValueAtTime(eqSlider.value, audioContext.currentTime);
    eqNode.gain.setValueAtTime(10, audioContext.currentTime); // Sample value
  }
}

function drawWaveform(audioBuffer, ctx, canvas) {
  const channelData = audioBuffer.getChannelData(0); // Left channel for simplicity
  const length = channelData.length;
  const step = Math.ceil(length / canvas.width);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width; i++) {
    const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
    const max = Math.max(...channelData.slice(i * step, (i + 1) * step));
    ctx.fillRect(i, (1 + min) * canvas.height / 2, 1, (max - min) * canvas.height / 2);
  }
}

function toggleMute(index) {
  const track = tracks[index];
  track.muted = !track.muted;
  track.gainNode.gain.value = track.muted ? 0 : 1;
}

function toggleSolo(index) {
  const track = tracks[index];
  track.soloed = !track.soloed;
  tracks.forEach((otherTrack, i) => {
    if (i !== index) otherTrack.gainNode.gain.value = track.soloed ? 0 : 1;
  });
}

function showFXPanel(index) {
  alert(`FX panel for Track ${index + 1}`);
}

function generateBeatPattern() {
  // Placeholder for smart AI-generated beat pattern
  return [1, 0, 1, 0, 0, 1, 0, 1];
}

function applyBeatPatternToTrack(index, pattern) {
  // Logic to apply generated pattern to track's sequence
}

function visualizeBeatPattern(index, pattern) {
  // Update UI or waveform visualization based on the pattern
}
