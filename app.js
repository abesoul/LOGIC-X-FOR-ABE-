// app.js
import { setupTransport } from './transport.js';
import { setupTimeline } from './timeline.js';
import { setupMixer } from './mixer.js';
import { setupTracks } from './tracks.js';

document.addEventListener('DOMContentLoaded', () => {
  setupTransport();  // Initializes transport controls (playback)
  setupTimeline();   // Sets up the timeline (dragging, zooming)
  setupMixer();      // Initializes mixer controls (volume, etc.)
  setupTracks();     // Initializes dynamic track creation and management
});

