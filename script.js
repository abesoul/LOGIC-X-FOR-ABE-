const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let tracks = [];
let currentFXTrack = null;

document.getElementById('add-track-btn').addEventListener('click', () => {
  const track = createTrack();
  tracks.push(track);
  updateUI();
});

function createTrack() {
  // Audio Nodes
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
  const sourceNode = audioContext.createMediaElementSource(track.audioElement);
  sourceNode.connect(track.gainNode);

  track.gainNode.connect(track.panNode);
  track.panNode.connect(track.reverbNode);
  track.reverbNode.connect(track.delayNode);
  track.delayNode.connect(track.eqNode);
  track.eqNode.connect(audioContext.destination);

  // Defaults
  track.reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100);
  track.delayNode.delayTime.value = 0.3;
  track.eqNode.type = 'lowshelf';
  track.eqNode.frequency.value = 1000;
  track.gainNode.gain.value = 1;

  return track;
}

function updateUI() {
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  trackList.innerHTML = '';
  timelineTracks.innerHTML = '';

  tracks.forEach((track, index) => {
    const trackStrip = document.createElement('div');
    trackStrip.classList.add('track-strip');
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
    trackList.appendChild(trackStrip);

    const timelineRow = document.createElement('div');
    timelineRow.classList.add('timeline-row');
    timelineRow.innerHTML = `
      <p>Track ${index + 1}</p>
      <button class="load-file-btn" data-index="${index}">🎵 Load File</button>
      <input type="file" class="file-upload" data-index="${index}" accept="audio/*" style="display:none;" />
      <canvas class="waveform" data-index="${index}" height="60" width="240"></canvas>
    `;
    timelineTracks.appendChild(timelineRow);
  });

  // Bind Events
  document.querySelectorAll('.volume').forEach(slider => {
    slider.addEventListener('input', e => {
      tracks[e.target.dataset.index].gainNode.gain.value = e.target.value;
    });
  });

  document.querySelectorAll('.pan').forEach(slider => {
    slider.addEventListener('input', e => {
      tracks[e.target.dataset.index].panNode.pan.value = e.target.value;
    });
  });

  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.addEventListener('click', e => toggleMute(e.target.dataset.index));
  });

  document.querySelectorAll('.solo-btn').forEach(btn => {
    btn.addEventListener('click', e => toggleSolo(e.target.dataset.index));
  });

  document.querySelectorAll('.fx-btn').forEach(btn => {
    btn.addEventListener('click', e => showFXPanel(e.target.dataset.index));
  });

  document.querySelectorAll('.load-file-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = e.target.dataset.index;
      document.querySelector(`.file-upload[data-index="${index}"]`).click();
    });
  });

  document.querySelectorAll('.file-upload').forEach(input => {
    input.addEventListener('change', async (e) => {
      const index = e.target.dataset.index;
      const file = e.target.files[0];
      if (!file) return;
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      tracks[index].fileBuffer = audioBuffer;
    });
  });
}

// Playback
document.getElementById('play-btn').addEventListener('click', () => {
  tracks.forEach((track, index) => {
    if (!track.fileBuffer) return;
    const source = audioContext.createBufferSource();
    source.buffer = track.fileBuffer;
    source.connect(track.gainNode);
    source.start();
    track.sourceNode = source;
  });
});

document.getElementById('stop-btn').addEventListener('click', () => {
  tracks.forEach(track => {
    if (track.sourceNode) track.sourceNode.stop();
  });
});

// FX Panel
function showFXPanel(trackIndex) {
  const track = tracks[trackIndex];
  const fxPanel = document.getElementById('fx-panel');

  document.getElementById('reverb-slider').value = 0.5;
  document.getElementById('delay-slider').value = track.delayNode.delayTime.value;
  document.getElementById('eq-slider').value = track.eqNode.frequency.value;

  fxPanel.classList.remove('hidden');

  document.getElementById('reverb-slider').oninput = () => {
    track.reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100); // Placeholder for real IR
  };

  document.getElementById('delay-slider').oninput = (e) => {
    track.delayNode.delayTime.value = parseFloat(e.target.value);
  };

  document.getElementById('eq-slider').oninput = (e) => {
    track.eqNode.frequency.value = parseFloat(e.target.value);
  };

  document.getElementById('close-fx-btn').onclick = () => {
    fxPanel.classList.add('hidden');
  };
}

// Mute / Solo
function toggleMute(index) {
  const track = tracks[index];
  track.muted = !track.muted;
  if (track.muted) {
    track.gainNode.disconnect();
  } else {
    track.gainNode.connect(track.panNode);
  }
  document.querySelector(`.mute-btn[data-index="${index}"]`).classList.toggle('active', track.muted);
}

function toggleSolo(index) {
  const soloedTrack = tracks[index];
  soloedTrack.soloed = !soloedTrack.soloed;

  const anySoloed = tracks.some(t => t.soloed);
  tracks.forEach((track, i) => {
    if (anySoloed && !track.soloed) {
      track.gainNode.disconnect();
    } else if (!track.muted) {
      track.gainNode.connect(track.panNode);
    }
  });

  document.querySelector(`.solo-btn[data-index="${index}"]`).classList.toggle('active', soloedTrack.soloed);
}

// AI Beat Placeholder
document.getElementById('generate-ai-beat').addEventListener('click', () => {
  alert("🧠 AI Beat Suggestion Coming Soon!\nWe'll add kick-snare-hat logic!");
});
