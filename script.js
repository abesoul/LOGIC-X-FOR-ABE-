document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  const dropzone = document.getElementById('timeline-dropzone');
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let tracks = [];

  addTrackBtn.addEventListener('click', () => {
    const track = createTrack(tracks.length);
    tracks.push(track);
    updateUI();
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
    // TODO: Render waveform
  });

  // === Create Track with Audio Chain ===
  function createTrack(index) {
    const audioElement = new Audio();
    audioElement.crossOrigin = "anonymous";

    const sourceNode = audioContext.createMediaElementSource(audioElement);
    const gainNode = audioContext.createGain();
    const panNode = audioContext.createStereoPanner();
    const reverbNode = audioContext.createConvolver();
    const delayNode = audioContext.createDelay();
    const eqNode = audioContext.createBiquadFilter();

    sourceNode.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(reverbNode);
    reverbNode.connect(delayNode);
    delayNode.connect(eqNode);
    eqNode.connect(audioContext.destination);

    // Defaults
    reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100);
    delayNode.delayTime.value = 0.3;
    eqNode.type = 'lowshelf';
    eqNode.frequency.value = 1000;

    return {
      index,
      audioElement,
      gainNode,
      panNode,
      reverbNode,
      delayNode,
      eqNode,
      muted: false,
      soloed: false
    };
  }

  // === UI Update ===
  function updateUI() {
    trackList.innerHTML = '';
    timelineTracks.innerHTML = '';

    tracks.forEach((track, index) => {
      // Mixer Strip
      const strip = document.createElement('div');
      strip.className = 'track-strip';
      strip.innerHTML = `
        <h4>Track ${index + 1}</h4>
        <div class="mute-solo">
          <button class="mute-btn" data-index="${index}">Mute</button>
          <button class="solo-btn" data-index="${index}">Solo</button>
        </div>
        <input type="range" class="volume" data-index="${index}" min="0" max="1" step="0.01" value="1">
        <input type="range" class="pan" data-index="${index}" min="-1" max="1" step="0.1" value="0">
        <button class="fx-btn" data-index="${index}">🎛 FX</button>
      `;
      trackList.appendChild(strip);

      // Timeline Row
      const row = document.createElement('div');
      row.className = 'timeline-row';
      row.innerHTML = `
        <p>Track ${index + 1}</p>
        <input type="file" class="file-input" data-index="${index}" accept="audio/*">
        <button class="play-btn" data-index="${index}">▶ Play</button>
        <button class="stop-btn" data-index="${index}">⏹ Stop</button>
      `;
      timelineTracks.appendChild(row);
    });

    // Attach Events
    document.querySelectorAll('.volume').forEach(slider => {
      slider.addEventListener('input', (e) => {
        tracks[e.target.dataset.index].gainNode.gain.value = e.target.value;
      });
    });

    document.querySelectorAll('.pan').forEach(slider => {
      slider.addEventListener('input', (e) => {
        tracks[e.target.dataset.index].panNode.pan.value = e.target.value;
      });
    });

    document.querySelectorAll('.mute-btn').forEach(btn => {
      btn.addEventListener('click', (e) => toggleMute(e.target.dataset.index));
    });

    document.querySelectorAll('.solo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => toggleSolo(e.target.dataset.index));
    });

    document.querySelectorAll('.fx-btn').forEach(btn => {
      btn.addEventListener('click', (e) => showFXPanel(e.target.dataset.index));
    });

    document.querySelectorAll('.file-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = e.target.dataset.index;
        const file = e.target.files[0];
        if (file) {
          const fileURL = URL.createObjectURL(file);
          const track = tracks[idx];
          track.audioElement.src = fileURL;
          track.audioElement.load();
          track.audioElement.onloadeddata = () => {
            console.log(`✅ File loaded for Track ${+idx + 1}: ${file.name}`);
          };
        }
      });
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        const audio = tracks[idx].audioElement;

        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        audio.play().then(() => {
          console.log(`▶ Playing Track ${+idx + 1}`);
        }).catch(err => {
          console.error(`⚠️ Error playing Track ${+idx + 1}:`, err);
        });
      });
    });

    document.querySelectorAll('.stop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        const audio = tracks[idx].audioElement;
        audio.pause();
        audio.currentTime = 0;
        console.log(`⏹ Stopped Track ${+idx + 1}`);
      });
    });
  }

  // === Mute/Solo ===
  function toggleMute(index) {
    const track = tracks[index];
    track.muted = !track.muted;
    track.gainNode.gain.value = track.muted ? 0 : 1;
    document.querySelector(`.mute-btn[data-index="${index}"]`).classList.toggle('active', track.muted);
  }

  function toggleSolo(index) {
    const track = tracks[index];
    track.soloed = !track.soloed;
    tracks.forEach((t, i) => {
      t.gainNode.gain.value = (track.soloed && i !== +index) ? 0 : 1;
    });
    document.querySelector(`.solo-btn[data-index="${index}"]`).classList.toggle('active', track.soloed);
  }

  // === FX Panel ===
  function showFXPanel(index) {
    const fxPanel = document.getElementById('fx-panel');
    const track = tracks[index];

    document.getElementById('reverb-slider').value = 0.5;
    document.getElementById('delay-slider').value = track.delayNode.delayTime.value;
    document.getElementById('eq-slider').value = track.eqNode.frequency.value;

    fxPanel.classList.remove('hidden');

    document.getElementById('reverb-slider').oninput = (e) => {
      // Placeholder for reverb IR loader
    };
    document.getElementById('delay-slider').oninput = (e) => {
      track.delayNode.delayTime.value = e.target.value;
    };
    document.getElementById('eq-slider').oninput = (e) => {
      track.eqNode.frequency.value = e.target.value;
    };

    document.getElementById('close-fx-btn').onclick = () => {
      fxPanel.classList.add('hidden');
    };
  }
});
