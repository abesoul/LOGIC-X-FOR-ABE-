document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn') || document.getElementById('addTrack');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks') || document.getElementById('timeline');
  const mixer = document.getElementById('mixer');
  const dropzone = document.getElementById('timeline-dropzone');

  let trackCount = 0;

  addTrackBtn.addEventListener('click', () => {
    trackCount++;
    const trackId = `track-${trackCount}`;

    // Timeline Track (Waveform & Upload)
    const timelineBlock = document.createElement('div');
    timelineBlock.className = 'track';
    timelineBlock.innerHTML = `
      <h3>Track ${trackCount}</h3>
      <input type="file" accept="audio/*" data-id="${trackId}" class="file-upload"/>
      <canvas class="waveform" width="240" height="60"></canvas>
    `;
    timelineTracks.appendChild(timelineBlock);

    // Mixer Channel
    if (mixer) {
      const channel = document.createElement('div');
      channel.className = 'track';
      channel.innerHTML = `
        <h3>Track ${trackCount}</h3>
        <label>Volume</label>
        <input type="range" min="0" max="1" step="0.01" value="1" data-id="${trackId}" class="volume"/>
        <label>Pan</label>
        <input type="range" min="-1" max="1" step="0.1" value="0" data-id="${trackId}" class="pan"/>
      `;
      mixer.appendChild(channel);
    }

    // Additional Mixer List (if present)
    if (trackList) {
      const strip = document.createElement('div');
      strip.className = 'track-strip';
      strip.innerHTML = `
        <h4>Track ${trackCount}</h4>
        <input type="range" min="0" max="100" value="50" />
        <button class="add-effect-btn">🎛 FX</button>
      `;
      trackList.appendChild(strip);
    }

    // Timeline Label Row (if present)
    if (timelineTracks && document.getElementById('timeline-tracks')) {
      const timelineRow = document.createElement('div');
      timelineRow.className = 'timeline-row';
      timelineRow.innerHTML = `<p>Track ${trackCount}</p>`;
      document.getElementById('timeline-tracks').appendChild(timelineRow);
    }
  });

  // Drag & Drop to timeline
  if (dropzone) {
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
      // TODO: Handle waveform generation and playback
    });
  }
});
