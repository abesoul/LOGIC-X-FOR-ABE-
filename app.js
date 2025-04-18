import { setupTransport } from './transport.js';
import { setupTimeline } from './timeline.js';
import { setupMixer } from './mixer.js';
import { setupTracks } from './tracks.js';

document.addEventListener('DOMContentLoaded', () => {
  setupTransport();
  setupTimeline();
  setupMixer();
  setupTracks();
});
