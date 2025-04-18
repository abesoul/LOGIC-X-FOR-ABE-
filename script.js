const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let trackCounter = 0;
let tracks = [];
let trackPatterns = [];
let tempo = 120; // Default tempo (beats per minute)
let previousPatterns = []; // For Undo functionality
let nextPatterns = []; // For Redo functionality

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
    <button class="play-btn" data-index="${index}">▶️ Play</button>
    <button class="stop-btn" data-index="${index}">⏹ Stop</button>
    <button class="suggest-beat-btn" data-index="${index}">🔮 Suggest Beat</button>
    <button class="undo-btn" data-index="${index}">↩️ Undo</button>
    <button class="redo-btn" data-index="${index}">↪️ Redo</button>
    <div class="fx-controls">
      <label for="reverb-slider-${index}">Reverb</label>
      <input id="reverb-slider-${index}" type="range" min="0" max="1" step="0.01" value="0.2" />
      
      <label for="delay-slider-${index}">Delay</label>
      <input id="delay-slider-${index}" type="range" min="0" max="1" step="0.01" value="0.1" />
      
      <label for="eq-slider-${index}">EQ (Treble)</label>
      <input id="eq-slider-${index}" type="range" min="1000" max="10000" value="5000" />
    </div>
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
}

function initTrackLogic(index) {
  const fileInput = document.querySelector(`.file-upload[data-index="${index}"]`);
  const loadBtn = document.querySelector(`.load-file-btn[data-index="${index}"]`);
  const playBtn = document.querySelector(`.play-btn[data-index="${index}"]`);
  const stopBtn = document.querySelector(`.stop-btn[data-index="${index}"]`);
  const suggestBeatBtn = document.querySelector(`.suggest-beat-btn[data-index="${index}"]`);
  const undoBtn = document.querySelector(`.undo-btn[data-index="${index}"]`);
  const redoBtn = document.querySelector(`.redo-btn[data-index="${index}"]`);
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
  let currentPattern = [];

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
    previousPatterns.push(currentPattern); // Save current state for undo
    nextPatterns = []; // Clear redo stack
    currentPattern = pattern;
    console.log("Suggested Beat Pattern:", pattern);
    applyBeatPatternToTrack(index, pattern);
    visualizeBeatPattern(index, pattern);
  });

  // Undo Button
  undoBtn.addEventListener("click", () => {
    if (previousPatterns.length > 0) {
      nextPatterns.push(currentPattern); // Save current state for redo
      currentPattern = previousPatterns.pop(); // Get last pattern state
      applyBeatPatternToTrack(index, currentPattern);
      visualizeBeatPattern(index, currentPattern);
    }
  });

  // Redo Button
  redoBtn.addEventListener("click", () => {
    if (nextPatterns.length > 0) {
      previousPatterns.push(currentPattern); // Save current state for undo
      currentPattern = nextPatterns.pop(); // Get last pattern state
      applyBeatPatternToTrack(index, currentPattern);
      visualizeBeatPattern(index, currentPattern);
    }
  });
}

function generateBeatPattern() {
  // Basic example: generate a random pattern
  return Array.from({ length: 16 }, () => Math.random() > 0.5);
}

function applyBeatPatternToTrack(index, pattern) {
  console.log(`Applying pattern to track ${index + 1}`, pattern);
}

function visualizeBeatPattern(index, pattern) {
  console.log(`Visualizing pattern for track ${index + 1}`);
}

function createEffects(index) {
  const reverbSlider = document.querySelector(`#reverb-slider-${index}`);
  const delaySlider = document.querySelector(`#delay-slider-${index}`);
  const eqSlider = document.querySelector(`#eq-slider-${index}`);

  reverbNode = audioContext.createConvolver();
  delayNode = audioContext.createDelay();
  eqNode = audioContext.createBiquadFilter();

  delayNode.delayTime.value = delaySlider.value;
  eqNode.frequency.value = eqSlider.value;
  eqNode.type = "lowshelf";
  reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100); // Placeholder for actual reverb buffer
}

function drawWaveform(buffer, ctx, canvas) {
  const data = buffer.getChannelData(0);
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  for (let i = 0; i < data.length; i++) {
    const x = (i / data.length) * width;
    const y = (data[i] * height) / 2 + height / 2;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}
