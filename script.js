/* --- Preloader Logic --- */
window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  preloader.classList.add('loaded');
});

document.addEventListener('DOMContentLoaded', function() {
    const gridContainer = document.getElementById('grid-container');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');
    const winnerList = document.getElementById('winner-list');
    const tittel = document.getElementById('lottotitle');

    const winSound = new Audio('success.mp3');

    const musicPlayer = document.getElementById('background-music');
    const musicToggleButton = document.getElementById('music-toggle-button');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    /* --- Web Audio API Tick Sound --- */
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    /* --- Random Song Loader --- */
    const songs = [
      'music.mp3',
      'music2.mp3',
      
      // add as many as you like
    ];

const randomSong = songs[Math.floor(Math.random() * songs.length)];
musicPlayer.src = randomSong;

const songTitle = randomSong.replace(/\.mp3$/, "");
tittel.innerText = songTitle;

function playTick(frequency = 600, duration = 0.06) {
  // --- Layer 1: Tonal click ---
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(audioCtx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, audioCtx.currentTime + duration);

  filter.type = 'highpass';
  filter.frequency.value = 200;

  oscGain.gain.setValueAtTime(0, audioCtx.currentTime);
  oscGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.004);
  oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);

  // --- Layer 2: Noise thud ---
  const bufferSize = audioCtx.sampleRate * 0.05;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = audioCtx.createBufferSource();
  const noiseGain = audioCtx.createGain();
  const noiseFilter = audioCtx.createBiquadFilter();

  noise.buffer = buffer;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);

  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1200;
  noiseFilter.Q.value = 0.8;

  noiseGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

  noise.start(audioCtx.currentTime);
  noise.stop(audioCtx.currentTime + 0.05);
}

    let boxes = [];

    // Create 10x10 grid of editable boxes
    for (let i = 0; i < 100; i++) {
      const box = document.createElement('input');
      box.classList.add('box');
      box.type = 'text';
      box.maxLength = 3;
      box.addEventListener('input', function() {
        box.value = box.value.toUpperCase();
      });
      gridContainer.appendChild(box);
      boxes.push(box);
    }

    function selectRandomBox() {
      // Get all boxes that have text and are not already 'selected'
      const availableBoxes = boxes.filter(box => box.value.trim() !== '' && !box.classList.contains('selected'));

      if (availableBoxes.length === 0) {
        alert("No valid entries left!");
        return;
      }

      startButton.disabled = true;

      // Pre-select a winner
      const winnerBox = availableBoxes[Math.floor(Math.random() * availableBoxes.length)];
      const winnerIndex = boxes.indexOf(winnerBox);
      const targetRow = Math.floor(winnerIndex / 10);
      const targetCol = winnerIndex % 10;

      // STEP 1: Sweep Rows - smooth linear animation
      function animateRows() {
        let displayRow = 0;
        let totalSteps = 0;
        const loopsBeforeTarget = 3;
        const fullLoopSteps = loopsBeforeTarget * 10;
        const totalRowSteps = fullLoopSteps + targetRow;
        let rowDelay = 80;

        function rowLoop() {
          // Clear previous highlight
          boxes.forEach(b => b.classList.remove('row-highlight'));

          // Highlight current row
          const rowStart = displayRow * 10;
          for (let i = 0; i < 10; i++) {
            boxes[rowStart + i].classList.add('row-highlight');
          }

          // Rising pitch as it slows into the target row
          const progress = totalSteps / totalRowSteps;
          playTick(400 + progress * 400);

          if (totalSteps < totalRowSteps) {
            totalSteps++;
            displayRow = (displayRow + 1) % 10;
            // Slow down only in the final loop
            rowDelay += (totalSteps >= fullLoopSteps) ? 40 : 5;
            setTimeout(rowLoop, rowDelay);
          } else {
            // Landed on targetRow — pause then move to cell sweep
            setTimeout(() => {
              boxes.forEach(b => b.classList.remove('row-highlight'));
              animateCells(targetRow, targetCol);
            }, 400);
          }
        }

        rowLoop();
      }

      // STEP 2: Sweep Cells
      function animateCells(targetRow, targetCol) {
        let currentCol = 0;
        let cellDelay = 80;
        const totalSteps = 10 + targetCol;
        let currentStep = 0;

        function cellLoop() {
          const rowStart = targetRow * 10;

          // Remove previous highlight
          const prevIdx = ((currentCol - 1 + 10) % 10) + rowStart;
          boxes[prevIdx].classList.remove('highlighted');

          // Add highlight to current
          const currentIdx = (currentCol % 10) + rowStart;
          boxes[currentIdx].classList.add('highlighted');

          // Rising pitch as it slows into the target cell
          const progress = currentStep / totalSteps;
          playTick(400 + progress * 400);

          cellDelay += (currentStep > totalSteps - 6) ? 80 : 10;

          if (currentStep < totalSteps) {
            currentCol++;
            currentStep++;
            setTimeout(cellLoop, cellDelay);
          } else {
            // Landed on winner
            boxes[currentIdx].classList.remove('highlighted');
            winnerBox.classList.add('selected', 'winner');
            winSound.play();
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

            const winnerName = winnerBox.value.trim();
            const li = document.createElement('li');
            li.textContent = winnerName;
            winnerList.appendChild(li);

            startButton.disabled = false;
          }
        }

        cellLoop();
      }

      animateRows();
    }

    // Event listener for start button
    startButton.addEventListener('click', function() {
      // Remove 'winner' class but KEEP 'selected' so they stay marked as unavailable
      const winners = document.querySelectorAll('.winner');
      winners.forEach(winner => winner.classList.remove('winner'));

      selectRandomBox();
    });

    // Event listener for reset button
    resetButton.addEventListener('click', function() {
      boxes.forEach(box => {
        box.value = '';
        box.classList.remove('winner', 'selected', 'row-highlight', 'highlighted');
      });
      winnerList.innerHTML = '';
      startButton.disabled = false;
    });

    // Music toggle
    musicToggleButton.addEventListener('click', function() {
      if (musicPlayer.paused) {
        musicPlayer.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline-block';
      } else {
        musicPlayer.pause();
        playIcon.style.display = 'inline-block';
        pauseIcon.style.display = 'none';
      }
    });

    // Arrow Key Navigation
    gridContainer.addEventListener('keydown', function(e) {
      const activeElement = document.activeElement;
      if (!activeElement || !activeElement.classList.contains('box')) return;
      const currentIndex = boxes.indexOf(activeElement);
      let targetIndex = -1;
      const rowSize = 10;
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); if (currentIndex >= rowSize) targetIndex = currentIndex - rowSize; break;
        case 'ArrowDown':  e.preventDefault(); if (currentIndex < boxes.length - rowSize) targetIndex = currentIndex + rowSize; break;
        case 'ArrowLeft':  if (currentIndex % rowSize !== 0) targetIndex = currentIndex - 1; break;
        case 'ArrowRight': if (currentIndex % rowSize !== rowSize - 1) targetIndex = currentIndex + 1; break;
        case 'Enter':      e.preventDefault(); targetIndex = (currentIndex + 1) % boxes.length; break;
      }
      if (targetIndex !== -1) boxes[targetIndex].focus();
    });
});
