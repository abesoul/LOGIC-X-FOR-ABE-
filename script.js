// script.js
document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');

  addTrackBtn.addEventListener('click', () => {
    const track = document.createElement('div');
    track.className = 'track-strip';
    track.innerHTML = `
      <h4>Track ${trackList.children.length + 1}</h4>
      <input type="range" min="0" max="100" value="50" />
      <button class="add-effect-btn">🎛 FX</button>
    `;
    trackList.appendChild(track);

    const timelineRow = document.createElement('div');
    timelineRow.className = 'timeline-row';
    timelineRow.innerHTML = `<p>Track ${trackList.children.length}</p>`;
    timelineTracks.appendChild(timelineRow);
  });

  // Drag-drop to timeline
  const dropzone = document.getElementById('timeline-dropzone');
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
    // You'll handle waveform generation next
  });
});
