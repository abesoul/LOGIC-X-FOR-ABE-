let zoomLevel = 1; 
let subdivisionLevel = 4;
let tempo = 120;
let trackPatterns = [];
let currentPattern = [];
let previousPatterns = [];
let nextPatterns = [];
let trackCounter = 0;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let tracks = [];
let copiedBeat = null;
let selectedBeats = [];

const timelineGrid = document.getElementById('timeline-grid');
let selectionBox = null;
let startX, startY;
let isSelecting = false;

// -------- TIMELINE SELECTION BOX --------
timelineGrid.addEventListener('mousedown', (e) => {
  isSelecting = true;
  startX = e.offsetX;
  startY = e.offsetY;

  selectionBox = document.createElement('div');
  selectionBox.className = 'selection-box';
  selectionBox.style.left = `${startX}px`;
  selectionBox.style.top = `${startY}px`;
  timelineGrid.appendChild(selectionBox);
});

timelineGrid.addEventListener('mousemove', (e) => {
  if (!isSelecting) return;

  const currX = e.offsetX;
  const currY = e.offsetY;

  const rect = {
    left: Math.min(startX, currX),
    top: Math.min(startY, currY),
    width: Math.abs(startX - currX),
    height: Math.abs(startY - currY)
  };

  Object.assign(selectionBox.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });

  document.querySelectorAll('.beat').forEach(beat => {
    const beatRect = beat.getBoundingClientRect();
    const gridRect = timelineGrid.getBoundingClientRect();

    const beatX = beatRect.left - gridRect.left;
    const beatWidth = beatRect.width;

    const isInside = beatX + beatWidth > rect.left &&
                     beatX < rect.left + rect.width;

    beat.classList.toggle('selected', isInside);
  });
});

document.addEventListener('mouseup', () => {
  if (selectionBox) {
    timelineGrid.removeChild(selectionBox);
    selectionBox = null;
  }
  isSelecting = false;
});

// -------- TRACK CREATION --------
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
  timelineRow.id = `timeline-row-${index}`;
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
    <div class="beat-pattern"></div>
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

  // Create 64 beat blocks in this track
  const beatPattern = timelineRow.querySelector('.beat-pattern');
  for (let i = 0; i < 64; i++) {
    const beat = document.createElement('div');
    beat.classList.add('beat');
    beat.dataset.time = i / 64;
    beat.style.left = `${(i / 64) * 100}%`;
    beatPattern.appendChild(beat);
  }

  initTrackLogic(index);
  initZoomControls(index);
  enableAdvancedBeatEditing(index);
  displaySubdivisions(index);
});

// -------- AUDIO TRACK SETUP --------
function createTrack(index) {
  return {
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
}

// -------- BEAT VISUAL FEEDBACK --------
function finalizeBeatVisuals(beat, type) {
  if (type === "split") {
    beat.style.backgroundColor = "lightblue";
    beat.style.border = "1px dashed #00f";
  } else if (type === "inserted") {
    beat.style.backgroundColor = "yellow";
    beat.style.boxShadow = "0 0 5px rgba(255, 255, 0, 0.7)";
  } else if (type === "deleted") {
    beat.style.backgroundColor = "red";
    beat.style.opacity = 0.5;
    setTimeout(() => beat.remove(), 500);
  }
}

// -------- INSERT, DELETE, SPLIT --------
function insertBeat(time, index) {
  const patternRow = document.querySelector(`#timeline-row-${index} .beat-pattern`);
  const beat = document.createElement("div");
  beat.classList.add("beat");
  beat.dataset.time = time;
  beat.style.left = `${time * 100}%`;
  beat.style.height = "100%";
  patternRow.appendChild(beat);
  finalizeBeatVisuals(beat, "inserted");
  initDragAndDrop(index);
}

function splitBeat(time, index) {
  insertBeat(time, index);
  finalizeBeatVisuals(document.querySelector(`#timeline-row-${index} .beat-pattern .beat:last-child`), "split");
}

function deleteBeat(beat, index) {
  finalizeBeatVisuals(beat, "deleted");
}

// -------- COPY/PASTE --------
function enableCopyPaste(index) {
  const patternRow = document.querySelector(`#timeline-row-${index} .beat-pattern`);
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
  const time = parseFloat(targetBeat.dataset.time);
  insertBeat(time, index);
}

// -------- SHIFT SECTION --------
function shiftBeatSection(startIndex, endIndex, direction, index) {
  const patternRow = document.querySelector(`#timeline-row-${index} .beat-pattern`);
  Array.from(patternRow.children).forEach(beat => {
    const time = parseFloat(beat.dataset.time);
    if (time >= startIndex && time <= endIndex) {
      const newTime = time + direction;
      beat.dataset.time = newTime;
      beat.style.left = `${newTime * 100}%`;
    }
  });
}

function enableAdvancedBeatEditing(index) {
  enableCopyPaste(index);
  enablePatternShifting(index);
}

function enablePatternShifting(index) {
  const patternRow = document.querySelector(`#timeline-row-${index} .beat-pattern`);
  patternRow.addEventListener("mousedown", e => {
    if (e.target.classList.contains("beat")) {
      selectedBeats = [e.target];
    }
  });
  patternRow.addEventListener("mousemove", e => {
    if (selectedBeats.length) {
      const percent = e.offsetX / patternRow.clientWidth;
      selectedBeats.forEach(beat => {
        beat.style.left = `${percent * 100}%`;
        beat.dataset.time = percent;
      });
    }
  });
  patternRow.addEventListener("mouseup", () => {
    selectedBeats = [];
  });
}

function initZoomControls(index) {
  // TODO: implement zoom logic
}

function updateUI() {
  // Optional: Update mixer, track count, etc.
}

function displaySubdivisions(index) {
  // Optional: Add visual grid lines based on subdivision
}

function initTrackLogic(index) {
  // TODO: Add logic for playback, effects, etc.
}

function initDragAndDrop(index) {
  // TODO: Allow drag/drop of beats
}
