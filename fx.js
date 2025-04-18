export function setupFXControls() {
  const fxSliders = document.querySelectorAll("#fx-panel input[type='range']");
  fxSliders.forEach((slider) => {
    slider.addEventListener("input", (e) => {
      console.log(`FX Changed: ${e.target.name} → ${e.target.value}`);
    });
  });

  document.getElementById("apply-fx-btn").addEventListener("click", () => {
    console.log("🔊 FX Applied");
  });
}
