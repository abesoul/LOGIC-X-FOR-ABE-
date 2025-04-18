let trackCounter = 0;

export function setupTracks() {
  const tracksContainer = document.getElementById('tracks');
  console.log('Tracks ready');

  // Create an Add Track button
  const addTrackButton = document.createElement('button');
  addTrackButton.textContent = 'Add Track';
  tracksContainer.appendChild(addTrackButton);

  // Add event listener for adding a new track
  addTrackButton.addEventListener('click', () => {
    const track = createNewTrack();
    console.log(`Track ${trackCounter} added`);
    tracksContainer.appendChild(track);
  });
  
  // Function to create a new track element
  function createNewTrack() {
    const track = document.createElement("div");
    track.classList.add("track");

    // Track header with track number
    const trackHeader = document.createElement("h3");
    trackHeader.textContent = `Track ${++trackCounter}`;
    track.appendChild(trackHeader);

    // File input for uploading an audio file
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/*";
    track.appendChild(fileInput);

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const audioUrl = URL.createObjectURL(file);
        console.log(`Track file: ${audioUrl}`);
        // You can connect it to Web Audio API for playback
      }
    });

    // Mute, Solo, and FX buttons
    const muteButton = document.createElement("button");
    muteButton.textContent = "Mute";
    track.appendChild(muteButton);

    const soloButton = document.createElement("button");
    soloButton.textContent = "Solo";
    track.appendChild(soloButton);

    const fxButton = document.createElement("button");
    fxButton.textContent = "FX";
    track.appendChild(fxButton);

    // Remove track button
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove Track";
    removeButton.addEventListener("click", () => {
      tracksContainer.removeChild(track);
    });
    track.appendChild(removeButton);

    return track;
  }
}
