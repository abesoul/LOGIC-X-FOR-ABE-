let zoomLevel = 1; // Zoom level for timeline (1 = normal, > 1 = zoomed in)
let subdivisionLevel = 4; // Default subdivision (e.g., 4 subdivisions per beat)
let tempo = 120; // Default tempo (beats per minute)
let trackPatterns = [];
let currentPattern = [];
let previousPatterns = []; // For Undo functionality
let nextPatterns = []; // For Redo functionality
let trackCounter = 0;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let tracks = [];

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

  // Initialize zoom controls
  initZoomControls(index);

  // Initialize advanced beat editing
  enableAdvancedBeatEditing(index);

  // Display subdivisions
  displaySubdivisions(index);
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

  const rhythmicModelSelect = document.querySelector(`#rhythmic-model-${index}`);
  const customTimeSignatureInput = document.querySelector(`#custom-time-signature-${index}`);
  const subdivisionInput = document.querySelector(`#subdivision-${index}`);

  let audioBuffer = null;
  let sourceNode = null;

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
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;

    // Apply effects
    createEffects(index);

    // Connect the effects chain
    sourceNode.connect(track.reverbNode);
    track.reverbNode.connect(track.delayNode);
    track.delayNode.connect(track.eqNode);
    track.eqNode.connect(track.gainNode);
    track.gainNode.connect(audioContext.destination);
    sourceNode.start();
  });

  stopBtn.addEventListener("click", () => {
    if (sourceNode) {
      sourceNode.stop();
      sourceNode.disconnect();
    }
  });

  suggestBeatBtn.addEventListener("click", () => {
    const selectedModel = rhythmicModelSelect.value;
    const customTimeSignature = customTimeSignatureInput.value || "4/4";
    const subdivision = subdivisionInput.value || "quarter";
    const pattern = generateBeatPattern(selectedModel, customTimeSignature, subdivision);
    trackPatterns.push(pattern);
    currentPattern = pattern;
    applyBeatPatternToTrack(index, pattern);
    visualizeBeatPattern(index, pattern);
  });

  undoBtn.addEventListener("click", () => {
    if (trackPatterns.length > 1) {
      trackPatterns.pop(); // Remove current pattern
      currentPattern = trackPatterns[trackPatterns.length - 1]; // Get last pattern
      applyBeatPatternToTrack(index, currentPattern);
      visualizeBeatPattern(index, currentPattern);
    }
  });

  redoBtn.addEventListener("click", () => {
    if (nextPatterns.length > 0) {
      currentPattern = nextPatterns.pop(); // Get next pattern
      applyBeatPatternToTrack(index, currentPattern);
      visualizeBeatPattern(index, currentPattern);
    }
  });

  const tempoSlider = document.getElementById("tempo-slider");
  tempoSlider.addEventListener("input", () => {
    tempo = parseInt(tempoSlider.value);
    adjustTempoOnTrackPatterns();
  });

  function adjustTempoOnTrackPatterns() {
    trackPatterns.forEach((pattern) => {
      const adjustedPattern = adjustPatternTempo(pattern, tempo);
      applyBeatPatternToTrack(index, adjustedPattern);
      visualizeBeatPattern(index, adjustedPattern);
    });
  }

  function adjustPatternTempo(pattern, newTempo) {
    return pattern.map((beat) => {
      return { ...beat, time: beat.time * (tempo / newTempo) };
    });
  }

  function generateBeatPattern(model, timeSignature, subdivision) {
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
        return generateCustomPattern(timeSignature, subdivision);
      default:
        return generateBasicPattern();
    }
  }

  function generateCustomPattern(timeSignature, subdivision) {
    const [beatsPerMeasure, beatUnit] = timeSignature.split("/").map(Number);
    const subdivisionsPerBeat = subdivision === "triplet" ? 3 : 1;
    const pattern = [];

    for (let i = 0; i < beatsPerMeasure * subdivisionsPerBeat; i++) {
      pattern.push({ time: (i / subdivisionsPerBeat), type: i % 2 === 0 ? "hit" : "rest" });
    }

    return pattern;
  }

  function generateBasicPattern() {
    return [
      { time: 0, type: "hit" },
      { time: 1, type: "hit" },
      { time: 2, type: "hit" },
      { time: 3, type: "hit" },
    ];
  }

  function generateSyncopatedPattern() {
    return [
      { time: 0, type: "hit" },
      { time: 1.5, type: "hit" },
      { time: 2.5, type: "hit" },
    ];
  }

  function generatePolyrhythmPattern(a, b) {
    const pattern = [];
    let time = 0;

    while (time < 4) {
      pattern.push({ time: time, type: "hit" });
      time += 4 / a;
    }

    return pattern;
  }

  function generateSwingPattern() {
    return [
      { time: 0, type: "hit" },
      { time: 0.75, type: "hit" },
      { time: 1.5, type: "hit" },
      { time: 2.25, type: "hit" },
    ];
  }

  function generateTripletPattern() {
    return [
      { time: 0, type: "hit" },
      { time: 0.6667, type: "hit" },
      { time: 1.3333, type: "hit" },
    ];
  }

  function applyBeatPatternToTrack(index, pattern) {
    // Apply pattern to track
    tracks[index].pattern = pattern;
  }

  function visualizeBeatPattern(index, pattern) {
    // Visualize pattern on track strip
    const trackStrip = document.querySelector(`.track-strip[data-index="${index}"]`);
    const patternDiv = document.createElement("div");
    patternDiv.classList.add("pattern");
    patternDiv.innerHTML = pattern.map((beat) => `<div class="beat ${beat.type}" style="width:${(100 / pattern.length)}%"></div>`).join("");
    trackStrip.appendChild(patternDiv);
  }

  function drawWaveform(audioBuffer, ctx, canvas) {
    const channelData = audioBuffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(channelData.length / width);
    const amplitude = 1;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
      const max = Math.max(...channelData.slice(i * step, (i + 1) * step));
      const yMin = (min + 1) * 0.5 * height;
      const yMax = (max + 1) * 0.5 * height;
      ctx.moveTo(i, yMin);
      ctx.lineTo(i, yMax);
    }
    ctx.stroke();
  }
}

function initZoomControls(index) {
  const zoomInBtn = document.querySelector(`#zoom-in-btn-${index}`);
  const zoomOutBtn = document.querySelector(`#zoom-out-btn-${index}`);
  
  zoomInBtn.addEventListener("click", () => {
    if (zoomLevel < 2) zoomLevel += 0.1;
    updateTimelineZoom(index);
  });

  zoomOutBtn.addEventListener("click", () => {
    if (zoomLevel > 0.5) zoomLevel -= 0.1;
    updateTimelineZoom(index);
  });

  function updateTimelineZoom(index) {
    const trackTimeline = document.querySelector(`.timeline-row[data-index="${index}"]`);
    trackTimeline.style.transform = `scaleX(${zoomLevel})`;
  }
}

function enableAdvancedBeatEditing(index) {
  const track = tracks[index];
  const fxBtn = document.querySelector(`.fx-btn[data-index="${index}"]`);
  const fxControls = document.querySelector(`.fx-controls[data-index="${index}"]`);
  fxBtn.addEventListener("click", () => {
    fxControls.classList.toggle("show");
  });
}

function displaySubdivisions(index) {
  const subdivisions = document.createElement("div");
  subdivisions.className = "subdivisions";
  subdivisions.innerHTML = `
    <label for="subdivision-${index}">Subdivision</label>
    <select id="subdivision-${index}">
      <option value="quarter">Quarter</option>
      <option value="eighth">Eighth</option>
      <option value="sixteenth">Sixteenth</option>
      <option value="triplet">Triplet</option>
    </select>
  `;
  document.querySelector(`#track-${index}`).appendChild(subdivisions);
}

