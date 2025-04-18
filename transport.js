export function setupTransportControls() {
  document.getElementById("play-btn").addEventListener("click", () => {
    console.log("▶ Play");
  });

  document.getElementById("stop-btn").addEventListener("click", () => {
    console.log("⏹ Stop");
  });

  document.getElementById("tempo-slider").addEventListener("input", (e) => {
    document.getElementById("tempo-display").textContent = `${e.target.value} BPM`;
  });
}
