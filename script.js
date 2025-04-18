// Web Audio API setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let tracks = [];
let currentFXTrack = null;

// Track Creation and UI Update
document.getElementById('add-track-btn').addEventListener('click', () => {
  const track = createTrack();
  tracks.push(track);
  updateUI();
});

// Create a Track (with audio processing chain)
function createTrack() {
  const track = {
    audioElement: new Audio(),
    gainNode: audioContext.createGain(),
    panNode: audioContext.createStereoPanner(),
    reverbNode: audioContext.createConvolver(),
    delayNode: audioContext.createDelay(),
    eqNode: audioContext.createBiquadFilter(),
    muted: false,
    soloed: false
  };

  // Connect to the audio context and audio nodes
  track.audioElement.crossOrigin = "anonymous"; // Allow CORS for audio file imports
  const sourceNode = audioContext.createMediaElementSource(track.audioElement);
  sourceNode.connect(track.gainNode);

  // Connect gain node to pan node and then to destination
  track.gainNode.connect(track.panNode);
  track.panNode.connect(track.reverbNode);
  track.reverbNode.connect(track.delayNode);
  track.delayNode.connect(track.eqNode);
  track.eqNode.connect(audioContext.destination);

  // Setup FX Nodes
  track.reverbNode.buffer = audioContext.createBuffer(2, 44100, 44100);  // Placeholder reverb buffer (you can load actual IR)
  track.delayNode.delayTime.value = 0.3;  // 300ms delay by default
  track.eqNode.type = 'lowshelf';  // Simple low shelf EQ for example
  track.eqNode.frequency.value = 1000;  // Center frequency for the filter

  // Default volume (gain node)
  track.gainNode.gain.value = 1;

  return track;
}

// Update UI with newly created track
function updateUI() {
  const trackList = document.getElementById('track-list');
  const timelineTracks = document.getElementById('timeline-tracks');
  trackList.innerHTML = '';
  timelineTracks.innerHTML = '';

  tracks.forEach((track, index) => {
    // Create mixer controls for the track
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

    // Create timeline row for the track
    const timelineRow = document.createElement('div');
    timelineRow.classList.add('timeline-row');
    timelineRow.innerHTML = `<p>Track ${index + 1}</p><button class="load-file-btn" data-index="${index}">Load File</button>`;
    timelineTracks.appendChild(timelineRow);
  });

  // Event listeners for volume, pan, mute, solo, FX
  document.querySelectorAll('.volume').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const trackIndex = e.target.dataset.index;
      tracks[trackIndex].gainNode.gain.value = e.target.value;
    });
  });

  document.querySelectorAll('.pan').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const trackIndex = e.target.dataset.index;
      tracks[trackIndex].panNode.pan.value = e.target.value;
    });
  });

  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trackIndex = e.target.dataset.index;
      toggleMute(trackIndex);
    });
  });

  document.querySelectorAll('.solo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trackIndex = e.target.dataset.index;
      toggleSolo(trackIndex);
    });
  });

  document.querySelectorAll('.fx-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trackIndex = e.target.dataset.index;
      showFXPanel(trackIndex);
    });
  });
}

// Toggle Mute on Track
function toggleMute(trackIndex) {
  const track = tracks[trackIndex];
  track.muted = !track.muted;
  if (track.muted) {
    track.gainNode.disconnect();
  } else {
    track.audioElement.play();
    track.audioElement.connect(track.gainNode);
  }
  document.querySelector(`.mute-btn[data-index="${trackIndex}"]`).classList.toggle('active', track.muted);
}

// Toggle Solo on Track
function toggleSolo(trackIndex) {
  const track = tracks[trackIndex];
  track.soloed = !track.soloed;
  if (track.soloed) {
    // Mute all other tracks except the soloed one
    tracks.forEach((otherTrack, idx) => {
      if (idx !== trackIndex) {
        otherTrack.gainNode.disconnect();
      }
    });
  } else {
    // Reconnect all tracks
    tracks.forEach((otherTrack) => {
      otherTrack.audioElement.connect(otherTrack.gainNode);
    });
  }
  document.querySelector(`.solo-btn[data-index="${trackIndex}"]`).classList.toggle('active', track.soloed);
}

// Show FX Panel for a track
function showFXPanel(trackIndex) {
  const track = tracks[trackIndex];
  const fxPanel = document.getElementById('fx-panel');

  // Populate FX panel with sliders for track effects
  document.getElementById('reverb-slider').value = track.reverbNode.buffer ? 0.5 : 0;
  document.getElementById('delay-slider').value = track.delayNode.delayTime.value;
  document.getElementById('eq-slider').value = track.eqNode.frequency.value;

  fxPanel.classList.remove('hidden');

  // FX Panel Controls
  document.getElementById('reverb-slider').addEventListener('input', (e) => {
    track.reverbNode.buffer = e.target.value;
  });
  document.getElementById('delay-slider').addEventListener('input', (e) => {
    track.delayNode.delayTime.value = e.target.value;
  });
  document.getElementById('eq-slider').addEventListener('input', (e) => {
    track.eqNode.frequency.value = e.target.value;
  });

  document.getElementById('close-fx-btn').addEventListener('click', () => {
    fxPanel.classList.add('hidden');
  });
}

// Save Project
document.getElementById('save-project').addEventListener('click', () => {
  const data = tracks.map((track, i) => ({
    name: `Track ${i + 1}`,
    volume: track.gainNode.gain.value
  }));
  localStorage.setItem('neondaw_project', JSON.stringify(data));
  alert('✅ Project Saved!');
});

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  // ... other config
};
async function saveProject(projectName, tracks) {
  const user = auth.currentUser;
  const projectRef = db.collection('users').doc(user.uid).collection('projects').doc(projectName);

  const trackData = [];

  for (const track of tracks) {
    const file = track.file;
    const storageRef = storage.ref().child(`users/${user.uid}/projects/${projectName}/${file.name}`);
    await storageRef.put(file);
    const fileURL = await storageRef.getDownloadURL();

    trackData.push({
      name: track.name,
      volume: track.volume,
      pan: track.pan,
      mute: track.mute,
      solo: track.solo,
      fileURL: fileURL,
    });
  }

  async function loadProject(projectName) {
  const user = auth.currentUser;
  const projectRef = db.collection('users').doc(user.uid).collection('projects').doc(projectName);
  const doc = await projectRef.get();

  if (!doc.exists) {
    console.error("No such project!");
    return;
  }
function createAnalyser(audioBuffer) {
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;

  const analyser = audioCtx.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  source.start();

  return analyser;
}

    function drawWaveform(analyser, canvas) {
  const ctx = canvas.getContext('2d');
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  draw();
}

  const projectData = doc.data();
  for (const track of projectData.tracks) {
    const response = await fetch(track.fileURL);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Create track in UI with audioBuffer and track settings
    createTrackFromData(track, audioBuffer);
  }

  console.log("Project loaded successfully.");
}

  await projectRef.set({
    name: projectName,
    tracks: trackData,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Project saved successfully.");
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Load Project
document.getElementById('load-project').addEventListener('click', () => {
  const data = JSON.parse(localStorage.getItem('neondaw_project') || '[]');
  const trackList = document.getElementById('track-list');
  trackList.innerHTML = '';
  const timelineTracks = document.getElementById('timeline-tracks');
  timelineTracks.innerHTML = '';

  data.forEach((trackData, i) => {
    const track = createTrack();
    track.gainNode.gain.value = trackData.volume;
    tracks.push(track);

    // Create UI for loaded tracks
    const trackStrip = document.createElement('div');
    trackStrip.classList.add('track-strip');
    trackStrip.innerHTML = `
      <h4>${trackData.name}</h4>
      <input type="range" class="volume" data-index="${i}" min="0" max="1" step="0.01" value="${trackData.volume}">
    `;
    trackList.appendChild(trackStrip);

    const timelineRow = document.createElement('div');
    timelineRow.classList.add('timeline-row');
    timelineRow.innerHTML = `<p>${trackData.name}</p>`;
    timelineTracks.appendChild(timelineRow);
  });

  alert('📂 Project Loaded!');
});
