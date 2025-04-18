let trackCounter = 0;

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
  return track;
}
