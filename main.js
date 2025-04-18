import { setupTransportControls } from "./transport.js";
import { renderTimelineGrid, enableBeatSelection } from "./timeline.js";
import { createNewTrack } from "./track.js";
import { setupFXControls } from "./fx.js";
import { addMixerControls } from "./mixer.js";
import { togglePanel } from "./ui.js";
import { saveProject, loadProject } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  setupTransportControls();
  renderTimelineGrid();
  enableBeatSelection();
  setupFXControls();

  document.getElementById("add-track-btn").addEventListener("click", () => {
    const track = createNewTrack();
    addMixerControls(track);
  });

  document.getElementById("save-project").addEventListener("click", () => {
    const data = {}; // build project data
    saveProject(data);
  });

  document.getElementById("load-project").addEventListener("click", () => {
    const data = loadProject();
    console.log(data);
  });

  document.getElementById("fx-toggle-btn")?.addEventListener("click", () =>
    togglePanel("fx-panel")
  );
});
