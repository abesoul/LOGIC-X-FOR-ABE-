document.addEventListener('DOMContentLoaded', () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const trackContainer = document.getElementById('track-container');
  const pluginPanel = document.getElementById('plugin-panel');
  const pluginList = document.getElementById('plugin-list');

  let selectedTrack = null;

  const plugins = {
    reverb: () => {
      const convolver = audioContext.createConvolver();
      return { node: convolver, name: "Reverb" };
    },
    delay: () => {
      const delay = audioContext.createDelay();
      delay.delayTime.value = 0.5;
      return { node: delay, name: "Delay" };
    },
    distortion: () => {
      const distortion = audioContext.createWaveShaper();
      const curve = new Float32Array(44100);
      for (let i = 0; i < curve.length; i++) {
        curve[i] = ((3 + 10) * i) / (44100 - 1);
      }
      distortion.curve = curve;
      return { node: distortion, name: "Distortion" };
    },
    gain: () => {
      const gain = audioContext.createGain();
      gain.gain.value = 1;
      return { node: gain, name: "Gain" };
    }
  };

  function createTrack() {
    const trackEl = document.createElement('div');
    trackEl.className = 'track';

    const trackLabel = document.createElement('h3');
    trackLabel.textContent = `Track ${trackContainer.children.length + 1}`;
    trackEl.appendChild(trackLabel);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    trackEl.appendChild(fileInput);

    const playButton = document.createElement('button');
    playButton.textContent = '▶️ Play';

    const fxButton = document.createElement('button');
    fxButton.textContent = '🧩 Plugins';

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = 0;
    volumeSlider.max = 100;
    volumeSlider.value = 100;

    const panSlider = document.createElement('input');
    panSlider.type = 'range';
    panSlider.min = -100;
    panSlider.max = 100;
    panSlider.value = 0;

    const controls = document.createElement('div');
    controls.className = 'track-controls';
    controls.appendChild(playButton);
    controls.appendChild(fxButton);
    controls.appendChild(volumeSlider);
    controls.appendChild(panSlider);

    trackEl.appendChild(controls);

    const trackGain = audioContext.createGain();
    const trackPanner = audioContext.createStereoPanner();
    trackGain.connect(trackPanner).connect(audioContext.destination);
    const pluginChain = [];

    let audioBuffer, source;

    fileInput.addEventListener('change', (e) => {
      const reader = new FileReader();
      reader.onload = () => {
        audioContext.decodeAudioData(reader.result, (buffer) => {
          audioBuffer = buffer;
        });
      };
      reader.readAsArrayBuffer(fileInput.files[0]);
    });

    playButton.addEventListener('click', () => {
      if (audioBuffer) {
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        // Connect plugin chain
        let chainStart = source;
        pluginChain.forEach((plugin) => {
          chainStart.connect(plugin.node);
          chainStart = plugin.node;
        });

        chainStart.connect(trackGain);
        source.start();
      }
    });

    fxButton.addEventListener('click', () => {
      selectedTrack = pluginChain;
      renderFXPanel();
      pluginPanel.classList.remove('hidden');
    });

    volumeSlider.addEventListener('input', (e) => {
      trackGain.gain.value = e.target.value / 100;
    });

    panSlider.addEventListener('input', (e) => {
      trackPanner.pan.value = e.target.value / 100;
    });

    trackContainer.appendChild(trackEl);
  }

  function renderFXPanel() {
    pluginList.innerHTML = '';
    Object.entries(plugins).forEach(([id, factory]) => {
      const btn = document.createElement('button');
      btn.textContent = factory().name;
      btn.onclick = () => {
        const plugin = factory();
        selectedTrack.push(plugin);
        pluginPanel.classList.add('hidden');
      };
      pluginList.appendChild(btn);
    });
  }

  document.getElementById('add-track-btn').addEventListener('click', createTrack);
});
