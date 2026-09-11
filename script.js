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

    const winSound = new Audio('success.mp3');

    const musicPlayer = document.getElementById('background-music');
    const musicToggleButton = document.getElementById('music-toggle-button');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    /* --- Web Audio API Tick Sound --- */
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

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

    /* --- Random Song Loader --- */
    const songs = [
      'aerobic.mp3',
      'arsenal.mp3',
      'roundball.mp3',
      'price.mp3',
      'mysterySong1.mp3',
      // add as many as you like
    ];
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    musicPlayer.src = randomSong;

    const tittel = document.getElementById('lottotitle');
    const songTitle = randomSong.replace(/\.mp3$/, "");
    tittel.innerText = songTitle;

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
      const availableBoxes = boxes.filter(box => box.value.trim() !== '' && !box.classList.contains('selected'));

      if (availableBoxes.length === 0) {
        alert("No valid entries left!");
        return;
      }

      startButton.disabled = true;

      const winnerBox = availableBoxes[Math.floor(Math.random() * availableBoxes.length)];
      const winnerIndex = boxes.indexOf(winnerBox);
      const targetRow = Math.floor(winnerIndex / 10);
      const targetCol = winnerIndex % 10;

      // STEP 1: Sweep Rows
      function animateRows() {
        let displayRow = 0;
        let totalSteps = 0;
        const loopsBeforeTarget = 3;
        const fullLoopSteps = loopsBeforeTarget * 10;
        const totalRowSteps = fullLoopSteps + targetRow;
        let rowDelay = 80;

        function rowLoop() {
          boxes.forEach(b => b.classList.remove('row-highlight'));

          const rowStart = displayRow * 10;
          for (let i = 0; i < 10; i++) {
            boxes[rowStart + i].classList.add('row-highlight');
          }

          const progress = totalSteps / totalRowSteps;
          playTick(400 + progress * 400);

          if (totalSteps < totalRowSteps) {
            totalSteps++;
            displayRow = (displayRow + 1) % 10;
            rowDelay += (totalSteps >= fullLoopSteps) ? 60 : 3;
            setTimeout(rowLoop, rowDelay);
          } else {
            setTimeout(() => {
              boxes.forEach(b => b.classList.remove('row-highlight'));

              // 35% chance the cell sweep runs on a neighbouring row first
              const doRowFakeOut = Math.random() < 0.5;

              if (doRowFakeOut && (targetRow > 0 || targetRow < 9)) {
                // Pick a neighbouring row (above or below)
                const rowOptions = [];
                if (targetRow > 0) rowOptions.push(targetRow - 1);
                if (targetRow < 9) rowOptions.push(targetRow + 1);
                const fakeRow = rowOptions[Math.floor(Math.random() * rowOptions.length)];

                // Pick a random FILLED col on that fake row
                // Only consider cols directly above/below or diagonal (targetCol -1, 0, +1)
                const nearCols = [targetCol - 1, targetCol, targetCol + 1].filter(c => c >= 0 && c <= 9);
                const filledCols = nearCols.filter(c => {
                  const box = boxes[fakeRow * 10 + c];
                  return box.value.trim() !== '' && !box.classList.contains('selected');
                });

                // If no filled cells on that row, skip row fake-out
                if (filledCols.length === 0) {
                  animateCells(targetRow, targetCol, () => maybeFakeOut(targetRow, targetCol));
                  return;
                }

                const fakeCol = filledCols[Math.floor(Math.random() * filledCols.length)];

                // Run cell sweep on the fake row
                animateCells(fakeRow, fakeCol, () => {
                  // Briefly highlight the landed cell so it registers visually
                  const landedIndex = fakeRow * 10 + fakeCol;
                  boxes[landedIndex].classList.add('highlighted');
                  playTick(850, 0.2);

                  setTimeout(() => {
                    boxes[landedIndex].classList.remove('highlighted');

                    setTimeout(() => {
                      maybeFakeOut(targetRow, targetCol);
                    }, 300);

                  }, 1200); // how long it lingers on the fake cell before jumping
                });
              } else {
                animateCells(targetRow, targetCol, () => maybeFakeOut(targetRow, targetCol));
              }
            }, 400);
          }
        }

        rowLoop();
      }

      // STEP 2: Sweep Cells
      function animateCells(row, col, onComplete) {
        let currentCol = 0;
        let cellDelay = 80;
        const totalSteps = 30 + col;
        let currentStep = 0;

        function cellLoop() {
          const rowStart = row * 10;

          const prevIdx = ((currentCol - 1 + 10) % 10) + rowStart;
          boxes[prevIdx].classList.remove('highlighted');

          const currentIdx = (currentCol % 10) + rowStart;
          boxes[currentIdx].classList.add('highlighted');

          const progress = currentStep / totalSteps;
          playTick(400 + progress * 400);

          cellDelay += (currentStep > totalSteps - 8) ? 100 : 3;

          if (currentStep < totalSteps) {
            currentCol++;
            currentStep++;
            setTimeout(cellLoop, cellDelay);
          } else {
            boxes[currentIdx].classList.remove('highlighted');
            onComplete();
          }
        }

        cellLoop();
      }

      // STEP 2.5: Optional fake-out after cell sweep lands
      function maybeFakeOut(targetRow, targetCol) {
        const shouldFakeOut = Math.random() < 0.5;

        if (!shouldFakeOut) {
          finalizeWinner();
          return;
        }

        // Only same row neighbours that have a value and aren't already selected
        const neighbours = [];
        if (targetCol > 0) {
          const leftBox = boxes[targetRow * 10 + targetCol - 1];
          if (leftBox.value.trim() !== '' && !leftBox.classList.contains('selected')) {
            neighbours.push({ row: targetRow, col: targetCol - 1 });
          }
        }
        if (targetCol < 9) {
          const rightBox = boxes[targetRow * 10 + targetCol + 1];
          if (rightBox.value.trim() !== '' && !rightBox.classList.contains('selected')) {
            neighbours.push({ row: targetRow, col: targetCol + 1 });
          }
        }

        // If no valid neighbours, skip fake-out
        if (neighbours.length === 0) {
          finalizeWinner();
          return;
        }

        const fake = neighbours[Math.floor(Math.random() * neighbours.length)];
        const fakeIndex = fake.row * 10 + fake.col;

        // Flash the fake cell with suspense
        boxes[fakeIndex].classList.add('highlighted');
        playTick(850, 0.2);

        setTimeout(() => {
          boxes[fakeIndex].classList.remove('highlighted');

          setTimeout(() => {
            playTick(1100, 0.12);
            finalizeWinner();
          }, 200);

        }, 2000);
      }

      function finalizeWinner() {
        winnerBox.classList.add('selected', 'winner');
        winSound.play();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

        // Background flash
        document.body.classList.add('winner-flash');
        setTimeout(() => document.body.classList.remove('winner-flash'), 800);

        const winnerName = winnerBox.value.trim();
        const li = document.createElement('li');
        li.textContent = winnerName;
        winnerList.appendChild(li);

        startButton.disabled = false;
      }

      animateRows();
    }

    // Start button
    startButton.addEventListener('click', function() {
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const winners = document.querySelectorAll('.winner');
      winners.forEach(winner => winner.classList.remove('winner'));

      selectRandomBox();
    });

    // Reset button
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
