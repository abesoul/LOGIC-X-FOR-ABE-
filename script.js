const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let trackCounter = 0;
let tracks = [];
let trackPatterns = [];
let previousPatterns = []; // For Undo functionality
let nextPatterns = []; // For Redo functionality
let tempo = 120; // Default tempo (beats per minute)

document.getElementById("add-track-btn").addEventListener("click", () => {
  const index = trackCounter++;
  const track = createTrack(index);
  tracks.push(track);
  updateUI();

  // Create track strip
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

  // Create track timeline row
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

  // Initialize track functionality
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
  return track;
}

function initTrackLogic(index) {
  const track = tracks[index];
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
  const rhythmicModelSelect = document.querySelector(`#rhythmic-model-${index}`);

  let audioBuffer = null;
  let sourceNode = null;
  let reverbNode = track.reverbNode;
  let delayNode = track.delayNode;
  let eqNode = track.eqNode;
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
    const selectedModel = rhythmicModelSelect.value;
    const pattern = generateBeatPattern(selectedModel);
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
      currentPattern = nextPatterns.pop(); // Get last pattern state from redo stack
      applyBeatPatternToTrack(index, currentPattern);
      visualizeBeatPattern(index, currentPattern);
    }
  });

  // Tempo Slider (Sync with Playback)
  const tempoSlider = document.getElementById("tempo-slider");
  tempoSlider.addEventListener("input", () => {
    tempo = parseInt(tempoSlider.value);
    updateTempoOnTracks(tempo);
  });

  // Tempo Adjustment on Play/Pause
  function updateTempoOnTracks(newTempo) {
    trackPatterns.forEach((pattern, idx) => {
      // Adjust the speed of the beat pattern based on the new tempo
      const adjustedPattern = adjustPatternTempo(pattern, newTempo);
      visualizeBeatPattern(idx, adjustedPattern);
    });

    // Sync tempo with audio playback
    if (sourceNode) {
      sourceNode.playbackRate.value = newTempo / 120; // Adjust playback rate to tempo
    }
  }

  // Function to generate a more sophisticated beat pattern based on selected rhythmic model
  function generateBeatPattern(model) {
    const complexity = 16; // Beats per pattern (16th notes)
    const pattern = [];
    const baseRhythms = {
      basic: [1, 0, 0, 1], // Basic 4/4
      syncopated: [1, 0, 1, 0], // Syncopated rhythm
      polyrhythm: [1, 0, 1, 0, 1, 0], // Polyrhythm (3 against 4)
      swing: [1, 0.5, 0.5, 1], // Swing rhythm
      triplet: [1, 0, 0.5, 0.5], // Triplet rhythm
    };

    const rhythmTemplate = baseRhythms[model];
    
    for (let i = 0; i < complexity; i++) {
      pattern.push(rhythmTemplate[i % rhythmTemplate.length]);
    }
    return pattern;
  }

  // Apply generated beat to the track
  function applyBeatPatternToTrack(index, pattern) {
    console.log(`Applying beat pattern to track ${index + 1}:`, pattern);
    // Further implementation can sync pattern with track playback
  }

  // Visualize beat pattern on canvas
  function visualizeBeatPattern(index, pattern) {
    const canvas = document.querySelector(`canvas[data-index="${index}"]`);
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    const stepWidth = width / pattern.length;
    pattern.forEach((step, i) => {
      ctx.fillStyle = step > 0 ? "green" : "gray";
      ctx.fillRect(i * stepWidth, 0, stepWidth, height);
    });
  }

  // Draw waveform on the canvas
  function drawWaveform(buffer, ctx, canvas) {
    const rawData = buffer.getChannelData(0);
    const samples = 3000;
    const blockSize = Math.floor(rawData.length / samples);
    const data = new Array(samples);

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += rawData[i * blockSize + j];
      }
      data[i] = sum / blockSize;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sliceWidth = canvas.width / samples;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00f";
    ctx.beginPath();
    ctx.moveTo(0, (data[0] + 1) * canvas.height / 2);

    for (let i = 1; i < samples; i++) {
      ctx.lineTo(i * sliceWidth, (data[i] + 1) * canvas.height / 2);
    }

    ctx.stroke();
  }
}

// Dynamically adjust the tempo slider's display
document.addEventListener("DOMContentLoaded", function () {
  const tempoSlider = document.getElementById("tempo-slider");
  const tempoDisplay = document.getElementById("tempo-display");
  tempoDisplay.textContent = `Tempo: ${tempoSlider.value} BPM`;

  tempoSlider.addEventListener("input", function () {
    tempoDisplay.textContent = `Tempo: ${tempoSlider.value} BPM`;
  });
});
