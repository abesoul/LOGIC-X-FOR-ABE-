document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  const dropzone = document.getElementById('timeline-dropzone');

  let trackCount = 0;

  addTrackBtn.addEventListener('click', () => {
    trackCount++;
    const trackId = `track-${trackCount}`;

    // === Mixer Track Strip ===
    const trackStrip = document.createElement('div');
    trackStrip.className = 'track-strip';
    trackStrip.innerHTML = `
      <h4>Track ${trackCount}</h4>
      <label>Volume</label>
      <input type="range" min="0" max="1" step="0.01" value="1" data-id="${trackId}" class="volume"/>
      <label>Pan</label>
      <input type="range" min="-1" max="1" step="0.1" value="0" data-id="${trackId}" class="pan"/>
      <button class="add-effect-btn">🎛 FX</button>
    `;
    trackList.appendChild(trackStrip);

    // === Timeline Row ===
    const timelineRow = document.createElement('div');
    timelineRow.className = 'timeline-row';
    timelineRow.innerHTML = `
      <h4>Track ${trackCount}</h4>
      <input type="file" accept="audio/*" data-id="${trackId}" class="file-upload"/>
      <canvas class="waveform" width="240" height="60" data-id="${trackId}"></canvas>
      <button class="play-btn">▶</button>
      <button class="stop-btn">■</button>
    `;
    timelineTracks.appendChild(timelineRow);
  });

  // === Drag and Drop Audio Files ===
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#0ff';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#00f0ff';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    alert(`🎵 Imported file: ${file.name}`);
    dropzone.style.borderColor = '#00f0ff';
    // Handle waveform rendering here later
  });
});
