/* --- NEW: Preloader Logic --- */
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
    const tickSound = new Audio('success.mp3'); 

    const musicPlayer = document.getElementById('background-music');
    const musicToggleButton = document.getElementById('music-toggle-button');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

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
  
    // --- Updated Select Logic ---
function selectRandomBox() {
      // 1. Get all boxes that have text and are not already 'selected'
      const availableBoxes = boxes.filter(box => box.value.trim() !== '' && !box.classList.contains('selected'));
      
      if (availableBoxes.length === 0) {
        alert("No valid entries left!");
        return;
      }

      startButton.disabled = true;

      // 2. Pre-select a winner
      const winnerBox = availableBoxes[Math.floor(Math.random() * availableBoxes.length)];
      const winnerIndex = boxes.indexOf(winnerBox);
      const targetRow = Math.floor(winnerIndex / 10);
      const targetCol = winnerIndex % 10;

      // 3. Animation Settings
      let currentRow = 0;
      let rowCounter = 0;
      const totalRowLoops = 15 + targetRow; 
      let rowDelay = 80;

// STEP 1: Sweep Rows - smooth linear animation
function animateRows() {
  let displayRow = 0;        // which row is currently lit (0-9)
  let totalSteps = 0;
  const loopsBeforeTarget = 2; // how many full loops before slowing into targetRow
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

    tickSound.currentTime = 0;
    tickSound.play();

    if (totalSteps < totalRowSteps) {
      totalSteps++;
      displayRow = (displayRow + 1) % 10; // always moves to next row, wraps 9→0
      // Start slowing down only in the final loop
      if (totalSteps >= fullLoopSteps) {
        rowDelay += 40;
      } else {
        rowDelay += 5;
      }
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

      // STEP 2: Sweep Cells (Linear progression)
      function animateCells(targetRow, targetCol) {
        let currentCol = 0;
        let cellDelay = 80;
        // Total steps: loop through the row once, then stop at the targetCol
        const totalSteps = 20 + targetCol; 
        let currentStep = 0;

        function cellLoop() {
          const rowStart = targetRow * 10;
          
          // Remove previous highlight
          const prevIdx = ((currentCol - 1 + 10) % 10) + rowStart;
          boxes[prevIdx].classList.remove('highlighted');

          // Add highlight to current
          const currentIdx = (currentCol % 10) + rowStart;
          boxes[currentIdx].classList.add('highlighted');

          tickSound.currentTime = 0;
          tickSound.play();

          // Smoothly slow down
          cellDelay += (currentStep > totalSteps - 6) ? 80 : 10;

          if (currentStep < totalSteps) {
            currentCol++;
            currentStep++;
            setTimeout(cellLoop, cellDelay);
          } else {
            // FINALIZE: Landed exactly on winnerBox
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

      function finalizeWinner(selectedBox) {
        // Clear all highlights
        boxes.forEach(b => b.classList.remove('highlighted', 'row-highlight'));
        
        selectedBox.classList.add('selected', 'winner');
        
        winSound.play();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

        const winnerName = selectedBox.value.trim();
        const li = document.createElement('li');
        li.textContent = winnerName;
        winnerList.appendChild(li);
        
        startButton.disabled = false;
      }

     
  
    // Event listener for start button
    startButton.addEventListener('click', function() {
      // Remove 'winner' class (for CSS styling/resetting animations)
      // but KEEP 'selected' so they stay marked as unavailable
      const winners = document.querySelectorAll('.winner');
      winners.forEach(winner => {
        winner.classList.remove('winner');
      });
      
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
        case 'ArrowUp': e.preventDefault(); if (currentIndex >= rowSize) targetIndex = currentIndex - rowSize; break;
        case 'ArrowDown': e.preventDefault(); if (currentIndex < boxes.length - rowSize) targetIndex = currentIndex + rowSize; break;
        case 'ArrowLeft': if (currentIndex % rowSize !== 0) targetIndex = currentIndex - 1; break;
        case 'ArrowRight': if (currentIndex % rowSize !== rowSize - 1) targetIndex = currentIndex + 1; break;
        case 'Enter': e.preventDefault(); targetIndex = (currentIndex + 1) % boxes.length; break;
      }
      if (targetIndex !== -1) boxes[targetIndex].focus();
    });
});
