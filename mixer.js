export function setupMixer() {
  const mixer = document.getElementById('mixer');
  console.log('Mixer ready');

  // Find all track elements inside the mixer
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
