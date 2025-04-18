// script.js

const addTrackBtn = document.getElementById('addTrack');
const timeline = document.getElementById('timeline');
const mixer = document.getElementById('mixer');

let trackCount = 0;

addTrackBtn.addEventListener('click', () => {
  trackCount++;
  const trackId = `track-${trackCount}`;

  // Timeline Track
  const trackBlock = document.createElement('div');
  trackBlock.className = 'track';
  trackBlock.innerHTML = `
    <h3>Track ${trackCount}</h3>
    <input type="file" accept="audio/*" data-id="${trackId}" class="file-upload"/>
    <canvas class="waveform" width="240" height="60"></canvas>
  `;
  timeline.appendChild(trackBlock);

  // Mixer Channel
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
});
