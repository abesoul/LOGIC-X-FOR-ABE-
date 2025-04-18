const grid = document.getElementById('timeline-grid');
const zoomSlider = document.getElementById('zoom-slider');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let zoomLevel = 1;
let subdivisionLevel = 4;
let tempo = 120;
let trackCounter = 0;
let trackPatterns = [];
let currentPattern = [];
let previousPatterns = [];
let nextPatterns = [];
let tracks = [];
let selectedBeats = [];
let clipboard = [];

let isDragging = false;
let isSelecting = false;
let selectionBox = null;
let startX = 0, startY = 0;

// -------- ZOOM CONTROL --------
zoomSlider.addEventListener('input', () => {
  const scale = parseFloat(zoomSlider.value);
  document.querySelectorAll('.beat').forEach(beat => {
    beat.style.transform = `scaleX(${scale})`;
    beat.style.transformOrigin = 'left';
  });
});

// -------- SELECTION BOX --------
grid.addEventListener('mousedown', (e) => {
  isDragging = true;
  isSelecting = true;
  startX = e.offsetX;
  startY = e.offsetY;

  selectionBox = document.createElement('div');
  selectionBox.className = 'selection-box';
  Object.assign(selectionBox.style, {
    left: `${startX}px`,
    top: `${startY}px`,
    width: '0px',
    height: '100%'
  });
  grid.appendChild(selectionBox);
});

grid.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const currX = e.offsetX;
  const rect = {
    left: Math.min(startX, currX),
    width: Math.abs(currX - startX)
  };
  Object.assign(selectionBox.style, {
    left: `${rect.left}px`,
    width: `${rect.width}px`
  });

  const selBoxRect = selectionBox.getBoundingClientRect();
  selectedBeats = [];

  document.querySelectorAll('.beat').forEach(beat => {
    const beatRect = beat.getBoundingClientRect();
    const isIntersecting = !(selBoxRect.right < beatRect.left || selBoxRect.left > beatRect.right);
    if (isIntersecting) {
      beat.classList.add('selected');
      selectedBeats.push(beat);
    } else {
      beat.classList.remove('selected');
    }
  });
});

document.addEventListener('mouseup', () => {
  if (selectionBox && grid.contains(selectionBox)) {
    grid.removeChild(selectionBox);
  }
  selectionBox = null;
  isDragging = false;
  isSelecting = false;
});

// -------- COPY / PASTE / SHIFT --------
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'c') {
    clipboard = [...selectedBeats];
  }

  if (e.ctrlKey && e.key === 'v' && clipboard.length) {
    clipboard.forEach(beat => {
      const copy = beat.cloneNode(true);
      copy.classList.remove('selected');
      grid.appendChild(copy);
    });
  }

  if (e.key === 'ArrowRight') {
    selectedBeats.forEach(beat => {
      beat.style.marginLeft = '10px';
    });
  }

  if (e.key === 'Escape') {
    document.querySelectorAll('.beat.selected').forEach(b => b.classList.remove('selected'));
    selectedBeats = [];
  }
});

// -------- TRACK CREATION --------
document.getElementById("add-track-btn").addEventListener("click", () => {
  const index = trackCounter++;
  const track = createTrack(index);
  tracks.push(track);

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

// Undo functionality
function undoAction() {
  if (undoStack.length) {
    const lastAction = undoStack.pop();
    redoStack.push(lastAction);
    restoreState(lastAction);
  }
}

// Redo functionality
function redoAction() {
  if (redoStack.length) {
    const lastAction = redoStack.pop();
    undoStack.push(lastAction);
    restoreState(lastAction);
  }
}

// State restoration for undo/redo
function restoreState(action) {
  console.log(action); // Implement state restoration logic based on your needs
}

// Initialize Track Logic
function initTrackLogic(index) {
  // Add track-specific event listeners and actions (e.g., play, stop)
}

// Initialize Zoom Controls
function initZoomControls(index) {
  // Implement zoom control logic for track index
}

// Enable Advanced Beat Editing
function enableAdvancedBeatEditing(index) {
  // Add functionality for advanced beat editing for this track
}

// Display subdivisions (beat grid)
function displaySubdivisions(index) {
  // Display subdivisions for each track
}
