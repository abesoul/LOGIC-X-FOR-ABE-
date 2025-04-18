export function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  panel.classList.toggle("hidden");
}
