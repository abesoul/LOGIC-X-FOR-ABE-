document.addEventListener('DOMContentLoaded', () => {
  const addTrackBtn = document.getElementById('add-track-btn');
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  const dropzone = document.getElementById('timeline-dropzone');

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let tracks = [];

  // 🧠 Fix: Resume AudioContext on first click
  document.body.addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('🎧 AudioContext resumed!');
      });
    }
  }, { once: true });

  addTrackBtn.addEventListener('click', () => {
    const track = createTrack(tracks.length);
    tracks.push(track);
    updateUI();
  });

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
    if (file) {
      handleAudioFile(file);
      alert(`🎵 Imported file: ${file.name}`);
    }
    dropzone.style.borderColor = '#00f0ff';
  });

  function handleAudioFile(file, index = null) {
    const fileURL = URL.createObjectURL(file);

    if (index === null || !tracks[index]) {
      index = tracks.length;
      const newTrack = createTrack(index);
      tracks.push(newTrack);
      updateUI();
    }

    const track = tracks[index];
    track.audioElement.src = fileURL;
    track.audioElement.load();

    track.audioElement.onloadeddata = () => {
      console.log(`✅ File loaded for Track ${index + 1}: ${file.name}`);

      // 🔊 Debug: Test audio playback
      track.audioElement.play().then(() => {
        console.log(`▶️ Playing Track ${index + 1}`);
      }).catch(err => {
        console.warn(`⚠️ Audio playback error: ${err}`);
      });

      // 🧪 Debug gain
      console.log(`Gain for Track ${index + 1}:`, track.gainNode.gain.value);
    };
  }

  function createTrack(index) {
    const audioElement = new Audio();
    audioElement.crossOrigin = "anonymous";

    const sourceNode = audioContext.createMediaElementSource(audioElement);
    const gainNode = audioContext.createGain();
    const panNode = audioContext.createStereoPanner();
    const reverbNode = audioContext.createConvolver();
    const delayNode = audioContext.createDelay();
    const eqNode = audioContext.createBiquadFilter();
    const busNode = audioContext.createGain();

    // 🔗 Full routing with logging
    try {
      sourceNode.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(reverbNode);
      reverbNode.connect(delayNode);
      delayNode.connect(eqNode);
      eqNode.connect(busNode);
      busNode.connect(audioContext.destination);
    } catch (e) {
      console.error('❌ Error connecting audio nodes:', e);
    }

    reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100); // Placeholder
    delayNode.delayTime.value = 0.3;
    eqNode.type = 'lowshelf';
    eqNode.frequency.value = 1000;

    const miniPlayer = document.createElement('div');
    miniPlayer.className = 'mini-player';
    miniPlayer.innerHTML = `
      <button class="play-mini-btn" data-index="${index}">▶</button>
      <button class="pause-mini-btn" data-index="${index}" style="display:none;">❚❚</button>
      <span>Track ${index + 1}</span>
    `;

    return {
      index,
      audioElement,
      gainNode,
      panNode,
      reverbNode,
      delayNode,
      eqNode,
      busNode,
      muted: false,
      soloed: false,
      miniPlayer
    };
  }

  function updateUI() {
    trackList.innerHTML = '';
    timelineTracks.innerHTML = '';

    tracks.forEach((track, index) => {
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
        <div class="track-mini-player">
          ${track.miniPlayer.outerHTML}
        </div>
      `;
      trackList.appendChild(strip);

      const row = document.createElement('div');
      row.className = 'timeline-row';
      row.innerHTML = `
        <p>Track ${index + 1}</p>
        <input type="file" class="file-input" accept="audio/*" data-index="${index}">
      `;
      timelineTracks.appendChild(row);
    });

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
      btn.addEventListener('click', (e) => openFXPanel(e.target.dataset.index));
    });

    document.querySelectorAll('.file-input').forEach(input => {
      input.addEventListener('change', (e) => handleAudioFile(e.target.files[0], e.target.dataset.index));
    });
  }

  function toggleMute(index) {
    const track = tracks[index];
    track.muted = !track.muted;
    track.gainNode.gain.value = track.muted ? 0 : 1;
  }

  function toggleSolo(index) {
    const track = tracks[index];
    track.soloed = !track.soloed;
    if (track.soloed) {
      tracks.forEach(t => {
        if (t !== track) {
          t.gainNode.gain.value = 0;
        }
      });
    } else {
      tracks.forEach(t => t.gainNode.gain.value = 1);
    }
  }

  function openFXPanel(index) {
    const track = tracks[index];
    document.getElementById('fx-panel').classList.remove('hidden');
    document.getElementById('reverb-slider').value = 0.5;
    document.getElementById('delay-slider').value = track.delayNode.delayTime.value;
    document.getElementById('eq-slider').value = track.eqNode.frequency.value;
  }

  document.getElementById('close-fx-btn').addEventListener('click', () => {
    document.getElementById('fx-panel').classList.add('hidden');
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('play-mini-btn')) {
      const index = parseInt(e.target.dataset.index);
      const track = tracks[index];
      track.audioElement.play();
      e.target.style.display = 'none';
      e.target.nextElementSibling.style.display = 'inline';
    }
    if (e.target.classList.contains('pause-mini-btn')) {
      const index = parseInt(e.target.dataset.index);
      const track = tracks[index];
      track.audioElement.pause();
      e.target.style.display = 'none';
      e.target.previousElementSibling.style.display = 'inline';
    }
  });

  updateUI();
});
