let trackCounter = 0;

export function setupTracks() {
  const tracksContainer = document.getElementById('tracks');
  console.log('Tracks ready');

  // Create a new track and append it to the tracks container
  const addTrackButton = document.createElement('button');
  addTrackButton.textContent = 'Add Track';
  tracksContainer.appendChild(addTrackButton);

  addTrackButton.addEventListener('click', () => {
    const track = createNewTrack();
    console.log(`Track ${trackCounter} added`);
    // You can add further setup or actions after track creation if needed
  });
}

export function createNewTrack() {
  const track = document.createElement("div");
  track.classList.add("track");
  track.innerHTML = `
    <h3>Track ${++trackCounter}</h3>
    <input type="file" accept="audio/*" class="audio-upload" />
    <button class="mute-btn">Mute</button>
    <button class="solo-btn">Solo</button>
    <button class="fx-btn">FX</button>
  `;

  document.getElementById("timeline").appendChild(track);

  // You can add any other setup or event listeners here if needed
  return track;
}
