document.addEventListener('DOMContentLoaded', () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Track container element
    const trackContainer = document.getElementById('track-container');

    // Add Track Button Logic
    document.getElementById('add-track-btn').addEventListener('click', () => {
        const trackElement = document.createElement('div');
        trackElement.classList.add('track');

        // Track Name
        const trackName = document.createElement('h2');
        trackName.textContent = `Track ${trackContainer.children.length + 1}`;
        trackElement.appendChild(trackName);

        // Audio Upload
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = 'audio/*';
        trackElement.appendChild(uploadInput);

        // Playback Controls
        const playButton = document.createElement('button');
        playButton.textContent = 'Play';
        trackElement.appendChild(playButton);

        const pauseButton = document.createElement('button');
        pauseButton.textContent = 'Pause';
        trackElement.appendChild(pauseButton);

        // Trimming Controls
        const trimStartInput = document.createElement('input');
        trimStartInput.type = 'number';
        trimStartInput.placeholder = 'Trim Start (s)';
        trackElement.appendChild(trimStartInput);

        const trimEndInput = document.createElement('input');
        trimEndInput.type = 'number';
        trimEndInput.placeholder = 'Trim End (s)';
        trackElement.appendChild(trimEndInput);

        // Remove Track Button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove Track';
        trackElement.appendChild(removeButton);

        // Append track to container
        trackContainer.appendChild(trackElement);

        // Track Handling Variables
        let trackAudio = null;
        let audioBuffer = null;
        let trackSource = null;
        let trackGain = audioContext.createGain();
        let startTrimTime = 0;
        let endTrimTime = null;

        // Handle file upload for track
        uploadInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function() {
                    audioContext.decodeAudioData(reader.result, (buffer) => {
                        audioBuffer = buffer;
                        trackSource = audioContext.createBufferSource();
                        trackSource.buffer = audioBuffer;
                        trackSource.connect(trackGain);
                        trackGain.connect(audioContext.destination);
                    });
                };
                reader.readAsArrayBuffer(file);
            }
        });

        // Playback functionality
        playButton.addEventListener('click', () => {
            if (trackSource) {
                trackSource.start(0, startTrimTime, endTrimTime ? endTrimTime - startTrimTime : audioBuffer.duration - startTrimTime);
            }
        });

        pauseButton.addEventListener('click', () => {
            if (trackSource) {
                trackSource.stop();
            }
        });

        // Trimming functionality
        trimStartInput.addEventListener('input', () => {
            startTrimTime = parseFloat(trimStartInput.value);
        });

        trimEndInput.addEventListener('input', () => {
            endTrimTime = parseFloat(trimEndInput.value);
        });

        // Remove Track functionality
        removeButton.addEventListener('click', () => {
            trackElement.remove();
        });
    });

    // Handle audio file upload for track 1
    let track1Audio = null;
    let track1Gain = audioContext.createGain();

    document.getElementById('track1-upload').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function() {
                audioContext.decodeAudioData(reader.result, (buffer) => {
                    track1Audio = audioContext.createBufferSource();
                    track1Audio.buffer = buffer;
                    track1Audio.connect(track1Gain);
                    track1Gain.connect(audioContext.destination);
                    track1Audio.start();
                });
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // Volume and Pan controls for Track 1
    document.getElementById('track1-volume').addEventListener('input', (event) => {
        track1Gain.gain.value = event.target.value / 100;
    });

    document.getElementById('track1-pan').addEventListener('input', (event) => {
        const panNode = audioContext.createStereoPanner();
        panNode.pan.value = event.target.value / 50; // Normalize pan value to [-1, 1]
        track1Audio.connect(panNode);
        panNode.connect(audioContext.destination);
    });

    // Basic Effects
    document.getElementById('reverb-btn').addEventListener('click', () => {
        alert('Reverb effect applied!');
    });

    document.getElementById('delay-btn').addEventListener('click', () => {
        alert('Delay effect applied!');
    });
});
