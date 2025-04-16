document.addEventListener('DOMContentLoaded', () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let track1Audio = null;
    let track1Gain = audioContext.createGain();

    // Handle audio file upload for track 1
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
