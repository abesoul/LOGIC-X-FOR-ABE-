export function setupTransport() {
  // Play Button
  const playBtn = document.getElementById('play') || document.getElementById('play-btn');
  let audioContext;
  let audioBuffer;
  let audioSource;

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      console.log('▶ Play');
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (!audioBuffer) {
        fetch('path_to_your_audio_file.mp3')
          .then(response => response.arrayBuffer())
          .then(data => audioContext.decodeAudioData(data))
          .then(buffer => {
            audioBuffer = buffer;
            playAudio();
          });
      } else {
        playAudio();
      }
    });
  }

  // Stop Button
  const stopBtn = document.getElementById('stop') || document.getElementById('stop-btn');
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      console.log('⏹ Stop');
      if (audioSource) {
        audioSource.stop();
        audioContext.close();
        audioContext = null;
      }
    });
  }

  // Tempo Slider
  const tempoSlider = document.getElementById('tempo-slider');
  const tempoDisplay = document.getElementById('tempo-display');
  if (tempoSlider && tempoDisplay) {
    tempoSlider.addEventListener('input', (e) => {
      tempoDisplay.textContent = `${e.target.value} BPM`;
    });
  }

  // Play Audio Function
  function playAudio() {
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioContext.destination);
    audioSource.start(0);
  }
}
