export function setupTimeline(trackCount = 4, beatsPerTrack = 16) {
  const timeline = document.getElementById('timeline');
  const grid = document.getElementById('timeline-grid');
  console.log('Timeline ready');

  // Handle dragging to scroll
  let isDragging = false;
  let startX, scrollLeft;

  timeline.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - timeline.offsetLeft;
    scrollLeft = timeline.scrollLeft;
  });

  timeline.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  timeline.addEventListener('mouseup', () => {
    isDragging = false;
  });

  timeline.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.pageX - timeline.offsetLeft;
    const scroll = (x - startX) + scrollLeft;
    timeline.scrollLeft = scroll;
  });

  // Handle zooming with mouse wheel
  timeline.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
      timeline.style.transform = `scaleX(${scaleFactor})`;
    }
  });

  // Render the timeline grid with beats and tracks
  if (grid) {
    grid.innerHTML = "";
    for (let t = 0; t < trackCount; t++) {
      for (let b = 0; b < beatsPerTrack; b++) {
        const beat = document.createElement("div");
        beat.classList.add("beat");
        beat.dataset.track = t;
        beat.dataset.beat = b;
        grid.appendChild(beat);
      }
    }

    // Enable beat selection via dragging
    let isSelecting = false;
    let selectionBox = null;

    grid.addEventListener("mousedown", (e) => {
      isSelecting = true;
      selectionBox = document.createElement("div");
      selectionBox.className = "selection-box";
      selectionBox.style.left = `${e.offsetX}px`;
      selectionBox.style.top = `${e.offsetY}px`;
      selectionBox.dataset.startX = e.offsetX;
      selectionBox.dataset.startY = e.offsetY;
      grid.appendChild(selectionBox);
    });

    grid.addEventListener("mousemove", (e) => {
      if (!isSelecting || !selectionBox) return;
      const startX = parseFloat(selectionBox.dataset.startX);
      const startY = parseFloat(selectionBox.dataset.startY);
      selectionBox.style.width = `${Math.abs(e.offsetX - startX)}px`;
      selectionBox.style.height = `${Math.abs(e.offsetY - startY)}px`;
      selectionBox.style.left = `${Math.min(e.offsetX, startX)}px`;
      selectionBox.style.top = `${Math.min(e.offsetY, startY)}px`;
    });

    window.addEventListener("mouseup", () => {
      if (selectionBox) selectionBox.remove();
      isSelecting = false;
    });
  }
}
