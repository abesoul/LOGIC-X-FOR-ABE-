export function setupTransport() {
  // Play Button
  const playBtn = document.getElementById('play') || document.getElementById('play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      console.log('▶ Play');
      // Start playback logic here
    });
  }

  // Stop Button
  const stopBtn = document.getElementById('stop') || document.getElementById('stop-btn');
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      console.log('⏹ Stop');
      // Stop playback logic here
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
}
