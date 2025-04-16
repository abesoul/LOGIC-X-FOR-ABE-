document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn') || document.getElementById('addTrack');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks') || document.getElementById('timeline');
  const mixer = document.getElementById('mixer');
  const dropzone = document.getElementById('timeline-dropzone');

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
      <canvas class="waveform" width="240" height="60" data-id="${trackId}"></canvas>
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

    setupFileHandler();
  });

  function setupFileHandler() {
    const fileInputs = document.querySelectorAll('.file-upload');
    fileInputs.forEach(input => {
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const canvas = document.querySelector(`canvas[data-id="${e.target.dataset.id}"]`);
        drawWaveform(canvas, audioBuffer);
        canvas.onclick = () => playAudio(audioBuffer);
      };
    });
  }

  function drawWaveform(canvas, audioBuffer) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0ff';
    for (let i = 0; i < width; i++) {
      const min = Math.min(...data.slice(i * step, (i + 1) * step));
      const max = Math.max(...data.slice(i * step, (i + 1) * step));
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }

  function playAudio(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  }

  // Drag & Drop Support
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#0ff';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '#00f0ff';
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      alert(`🎵 Imported file: ${file.name}`);

      // Auto add a new track and load it
      addTrackBtn.click();

      // Wait for track DOM to render then trigger file input
      setTimeout(async () => {
        const newInput = document.querySelectorAll('.file-upload')[trackCount - 1];
        const dt = new DataTransfer();
        dt.items.add(file);
        newInput.files = dt.files;
        newInput.dispatchEvent(new Event('change'));
      }, 100);

      dropzone.style.borderColor = '#00f0ff';
    });
  }
});
