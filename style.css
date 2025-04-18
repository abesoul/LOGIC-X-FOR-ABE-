// ====== NeonDAW Final script.js ======

let tempo = 120;
const tempoSlider = document.getElementById('tempo-slider');
const tempoDisplay = document.getElementById('tempo-display');
const timecode = document.getElementById('timecode');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const addTrackBtn = document.getElementById('add-track-btn');
const timelineTracks = document.getElementById('timeline-tracks');

// Update tempo
tempoSlider.addEventListener('input', () => {
  tempo = tempoSlider.value;
  tempoDisplay.textContent = tempo + ' BPM';
});

// Play/Stop simulation
let isPlaying = false;
let playbackInterval;
playBtn.addEventListener('click', () => {
  if (!isPlaying) {
    isPlaying = true;
    let seconds = 0;
    playbackInterval = setInterval(() => {
      seconds++;
      timecode.textContent = new Date(seconds * 1000).toISOString().substr(11, 8);
    }, 1000);
  }
});
stopBtn.addEventListener('click', () => {
  isPlaying = false;
  clearInterval(playbackInterval);
  timecode.textContent = '00:00:00';
});

// Add track
let trackCount = 0;
addTrackBtn.addEventListener('click', () => {
  trackCount++;
  const trackRow = document.createElement('div');
  trackRow.className = 'track-row glass';
  trackRow.style.marginBottom = '10px';
  trackRow.innerHTML = `<strong>Track ${trackCount}</strong>`;
  timelineTracks.appendChild(trackRow);
});

// Zoom slider
document.getElementById('zoom-slider').addEventListener('input', (e) => {
  timelineTracks.style.transform = `scale(${e.target.value})`;
});

// FX Toggle (Placeholder)
document.getElementById('fx-toggle-btn').addEventListener('click', () => {
  alert('FX panel toggle not implemented yet.');
});

// Save Project (Placeholder)
document.getElementById('save-project').addEventListener('click', () => {
  alert('Project saved to localStorage (simulated).');
});

// Drag & Drop
const dropzone = document.getElementById('timeline-dropzone');
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.style.background = '#444';
});
dropzone.addEventListener('dragleave', () => {
  dropzone.style.background = '';
});
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.style.background = '';
  alert('Audio file dropped (handling to be implemented).');
});
