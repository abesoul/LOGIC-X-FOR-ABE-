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
let copiedBeat = null; // Store copied beat for paste functionality
let selectedBeats = []; // Store selected beats for shifting

// Add track
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

// Track creation function
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

// Finalize beat visuals based on type (split, inserted, deleted)
function finalizeBeatVisuals(beatElement, type) {
  if (type === "split") {
    beatElement.style.backgroundColor = "lightblue"; // Light color for split beats
    beatElement.style.border = "1px dashed #00f"; // Dashed border
  } else if (type === "inserted") {
    beatElement.style.backgroundColor = "yellow"; // Highlight inserted beats
    beatElement.style.boxShadow = "0 0 5px rgba(255, 255, 0, 0.7)"; // Glowing effect
  } else if (type === "deleted") {
    beatElement.style.backgroundColor = "red"; // Red for deleted beats
    beatElement.style.opacity = 0.5; // Faded look
    setTimeout(() => beatElement.style.display = 'none', 500); // Smooth removal
  }
}

// Split a beat
function splitBeat(time, index) {
  const timelineRow = document.querySelector(`#timeline-row-${index}`);
  const patternRow = timelineRow.querySelector(".beat-pattern");

  const newBeat = document.createElement("div");
  newBeat.classList.add("beat");
  newBeat.style.left = `${time * 100}%`;
  newBeat.style.height = "100%";
  newBeat.dataset.time = time;

  patternRow.appendChild(newBeat);
  finalizeBeatVisuals(newBeat, "split");

  initDragAndDrop(index);
}

// Insert a new beat
function insertBeat(time, index) {
  const timelineRow = document.querySelector(`#timeline-row-${index}`);
  const patternRow = timelineRow.querySelector(".beat-pattern");

  const newBeat = document.createElement("div");
  newBeat.classList.add("beat");
  newBeat.style.left = `${time * 100}%`;
  newBeat.style.height = "100%";
  newBeat.dataset.time = time;

  patternRow.appendChild(newBeat);
  finalizeBeatVisuals(newBeat, "inserted");

  initDragAndDrop(index);
}

// Delete a beat
function deleteBeat(beatElement, index) {
  finalizeBeatVisuals(beatElement, "deleted");
  const timelineRow = document.querySelector(`#timeline-row-${index}`);
  const patternRow = timelineRow.querySelector(".beat-pattern");

  setTimeout(() => {
    patternRow.removeChild(beatElement);
  }, 500);
}

// Enable copying and pasting of beats
function enableCopyPaste(index) {
  const timelineRow = document.querySelector(`#timeline-row-${index}`);
  const patternRow = timelineRow.querySelector(".beat-pattern");

  patternRow.addEventListener("contextmenu", (e) => {
    if (e.target.classList.contains("beat")) {
      copiedBeat = e.target;
      e.preventDefault();
    }
  });

  patternRow.addEventListener("click", (e) => {
    if (copiedBeat && e.target.classList.contains("beat")) {
      pasteBeat(e.target, index);
    }
  });
}

function pasteBeat(targetBeat, index) {
  const targetTime = parseFloat(targetBeat.dataset.time);
  const newBeat = document.createElement("div");
  newBeat.classList.add("beat");
  newBeat.style.left = `${targetTime * 100}%`;
  newBeat.style.height = "100%";
  newBeat.dataset.time = targetTime;
  
  const timelineRow = document.querySelector(`#timeline-row-${index}`);
  const patternRow = timelineRow.querySelector(".beat-pattern");
  patternRow.appendChild(newBeat);

  finalizeBeatVisuals(newBeat, "inserted");

  initDragAndDrop(index);
}

// Shifting beats in a pattern
function enablePatternShifting(index) {
  const timelineRow = document.querySelector(`#timeline-row-${index}`);
  const patternRow = timelineRow.querySelector(".beat-pattern");

  patternRow.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("beat")) {
      selectedBeats = [e.target];
    }
  });

  patternRow.addEventListener("mousemove", (e) => {
    if (selectedBeats.length) {
      const newBeatPosition = e.clientX / patternRow.clientWidth;
      selectedBeats.forEach(beat => {
        beat.style.left = `${newBeatPosition * 100}%`;
      });
    }
  });

  patternRow.addEventListener("mouseup", () => {
    selectedBeats = [];
  });
}

// Shift a section of beats
function shiftBeatSection(startIndex, endIndex, direction, index) {
  const timelineRow = document.querySelector(`#timeline-row-${index}`);
  const patternRow = timelineRow.querySelector(".beat-pattern");

  const beatsInRange = Array.from(patternRow.children).filter(beat => {
    const time = parseFloat(beat.dataset.time);
    return time >= startIndex && time <= endIndex;
  });

  beatsInRange.forEach(beat => {
    const newTime = parseFloat(beat.dataset.time) + direction;
    beat.dataset.time = newTime;
    beat.style.left = `${newTime * 100}%`;
  });
}

function initDragAndDrop(index) {
  // Logic to enable dragging and dropping of beat blocks
}

// Zoom functionality
function initZoomControls(index) {
  // Handle zoom-in and zoom-out functionality for track view
}
