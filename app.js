// app.js
import { setupTransportControls } from './transport.js'; // transport control setup
import { renderTimelineGrid, enableBeatSelection } from './timeline.js'; // timeline grid and beat selection setup
import { createNewTrack } from './tracks.js'; // creating new tracks
import { setupFXControls } from './fx.js'; // setting up FX controls
import { addMixerControls } from './mixer.js'; // adding mixer controls
import { togglePanel } from './ui.js'; // toggling UI panels
import { saveProject, loadProject } from './storage.js'; // saving and loading projects

document.addEventListener('DOMContentLoaded', () => {
  // Setup transport and timeline controls
  setupTransportControls();
  renderTimelineGrid();
  enableBeatSelection();
  
  // Setup FX panel and mixer
  setupFXControls();

  // Adding new track and mixer controls
  document.getElementById('add-track-btn').addEventListener('click', () => {
    const track = createNewTrack(); // Create a new track
    addMixerControls(track); // Add mixer controls for that track
  });

  // Save and load project functionality
  document.getElementById('save-project').addEventListener('click', () => {
    const data = {}; // Build project data
    saveProject(data); // Save project data to localStorage
  });

  document.getElementById('load-project').addEventListener('click', () => {
    const data = loadProject(); // Load project data from localStorage
    console.log(data); // For debugging purposes
  });

  // Toggle FX panel visibility
  document.getElementById('fx-toggle-btn')?.addEventListener('click', () => {
    togglePanel('fx-panel'); // Toggle the FX panel
  });
});
