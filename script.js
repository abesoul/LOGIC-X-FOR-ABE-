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
      { time: 3, type: "hit" }
    ];
  }

  function generateSyncopatedPattern() {
    return [
      { time: 0, type: "hit" },
      { time: 0.5, type: "rest" },
      { time: 1.5, type: "hit" },
      { time: 2, type: "rest" },
      { time: 2.5, type: "hit" },
      { time: 3, type: "rest" }
    ];
  }

  function generatePolyrhythmPattern(top, bottom) {
    const pattern = [];
    const patternLength = top * bottom;
    for (let i = 0; i < patternLength; i++) {
      const time = i / bottom;
      pattern.push({ time, type: i % top === 0 ? "hit" : "rest" });
    }
    return pattern;
  }

  function generateSwingPattern() {
    return [
      { time: 0, type: "hit" },
      { time: 1.5, type: "hit" },
      { time: 2, type: "rest" },
      { time: 3.5, type: "hit" }
    ];
  }

  function generateTripletPattern() {
    return [
      { time: 0, type: "hit" },
      { time: 0.333, type: "rest" },
      { time: 0.667, type: "hit" },
      { time: 1, type: "rest" },
      { time: 1.333, type: "hit" },
      { time: 1.667, type: "rest" }
    ];
  }

  function visualizeBeatPattern(index, pattern) {
    const canvas = document.querySelector(`canvas[data-index="${index}"]`);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pattern.forEach((beat) => {
      if (beat.type === "hit") {
        ctx.fillStyle = "green";
        ctx.fillRect(beat.time * canvas.width, 0, 10, canvas.height);
      }
    });
  }

  function applyBeatPatternToTrack(index, pattern) {
    tracks[index].pattern = pattern;
  }

  function createEffects(index) {
    // Reverb effect setup
    const reverb = document.getElementById(`reverb-slider-${index}`).value;
    tracks[index].reverbNode.gain.value = reverb;

    // Delay effect setup
    const delay = document.getElementById(`delay-slider-${index}`).value;
    tracks[index].delayNode.delayTime.value = delay;

    // EQ effect setup
    const eqValue = document.getElementById(`eq-slider-${index}`).value;
    tracks[index].eqNode.frequency.value = eqValue;
  }

  function drawWaveform(buffer, ctx, canvas) {
    const data = buffer.getChannelData(0); // Mono waveform (left channel)
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < width; i++) {
      const sample = data[Math.floor(i * data.length / width)] * (height / 2);
      ctx.lineTo(i, (height / 2) - sample);
    }

    ctx.stroke();
  }
}
