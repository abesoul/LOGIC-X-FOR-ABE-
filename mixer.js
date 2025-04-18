export function addMixerControls(trackEl) {
  const muteBtn = trackEl.querySelector(".mute-btn");
  const soloBtn = trackEl.querySelector(".solo-btn");

  muteBtn.addEventListener("click", () => {
    muteBtn.classList.toggle("active");
  });

  soloBtn.addEventListener("click", () => {
    soloBtn.classList.toggle("active");
  });
}
