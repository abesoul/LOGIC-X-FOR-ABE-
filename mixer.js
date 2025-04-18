export function setupMixer() {
  const mixer = document.getElementById('mixer');
  console.log('Mixer ready');

  // Track Volume Control
  const trackVolumeSlider = document.createElement('input');
  trackVolumeSlider.type = 'range';
  trackVolumeSlider.min = '0';
  trackVolumeSlider.max = '100';
  trackVolumeSlider.value = '50';  // Default volume at 50%
  
  const trackVolumeLabel = document.createElement('label');
  trackVolumeLabel.textContent = 'Track Volume: ';
  mixer.appendChild(trackVolumeLabel);
  mixer.appendChild(trackVolumeSlider);
  
  trackVolumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    console.log(`Volume set to: ${volume}`);
    // Apply the volume change to Web Audio (for now just log it)
    // You can connect it to an audio context gain node for real-time control.
  });

  // Track Controls (Mute/Solo) for each track
  const tracks = mixer.querySelectorAll('.track');

  tracks.forEach(trackEl => {
    const muteBtn = trackEl.querySelector('.mute-btn');
    const soloBtn = trackEl.querySelector('.solo-btn');

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        muteBtn.classList.toggle('active');
        console.log(`Mute toggled for ${trackEl.dataset.trackName || 'track'}`);
      });
    }

    if (soloBtn) {
      soloBtn.addEventListener('click', () => {
        soloBtn.classList.toggle('active');
        console.log(`Solo toggled for ${trackEl.dataset.trackName || 'track'}`);
      });
    }
  });
}
