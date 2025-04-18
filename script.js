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
      applyBeatPatternToTrack(idx, adjustedPattern);
      visualizeBeatPattern(idx, adjustedPattern);
    });
  }

  // Helper to adjust the beat pattern based on tempo
  function adjustPatternTempo(pattern, newTempo) {
    const adjustedPattern = pattern.map((beat) => {
      return { ...beat, time: beat.time * (tempo / newTempo) };
    });
    return adjustedPattern;
  }
}

// Function to generate beat patterns for selected rhythmic models
function generateBeatPattern(model) {
  switch (model) {
    case "syncopated":
      return generateSyncopatedPattern();
    case "polyrhythm3:2":
      return generatePolyrhythmPattern(3, 2);
    case "polyrhythm5:4":
      return generatePolyrhythmPattern(5, 4);
    case "swing":
      return generateSwingPattern();
    case "triplet":
      return generateTripletPattern();
    case "custom":
      return generateCustomPattern();
    default:
      return generateBasicPattern();
  }
}

function generateBasicPattern() {
  return [
    { time: 0, type: "hit" },
    { time: 1, type: "hit" },
    { time: 2, type: "hit" },
    { time: 3, type: "hit" }
  ];
}

function generateSyncopatedPattern() {
  return [
    { time: 0, type: "hit" },
    { time: 0.5, type: "rest" },
    { time: 1.5, type:
