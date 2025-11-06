/* --- NEW: Preloader Logic --- */
// We use 'load' which waits for everything (fonts, etc.)
window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  preloader.classList.add('loaded');
});
/* --- End of new code --- */

document.addEventListener('DOMContentLoaded', function() {
    const gridContainer = document.getElementById('grid-container');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');
    const winnerList = document.getElementById('winner-list');
    
    const winSound = new Audio('success.mp3');
    const tickSound = new Audio('success.mp3'); 

    // --- NEW: Music Player Elements ---
    const musicPlayer = document.getElementById('background-music');
    const musicToggleButton = document.getElementById('music-toggle-button');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    // --- End of new code ---

    let boxes = [];
  
    // Create 10x10 grid of editable boxes
    for (let i = 0; i < 100; i++) {
      const box = document.createElement('input');
      box.classList.add('box');
      box.type = 'text';
      box.maxLength = 3; // Set max characters to 3
      box.addEventListener('input', function() {
        // Force the value to uppercase as the user types
        box.value = box.value.toUpperCase();
      });
      gridContainer.appendChild(box);
      boxes.push(box);
    }
  
    // Function to select a random box
    function selectRandomBox() {
      startButton.disabled = true; 
  
      const delay = 100; 
      let shuffledIndexes = Array.from({ length: boxes.length }, (_, i) => i);
      shuffledIndexes = shuffleArray(shuffledIndexes);
      let currentIndex = 0;
  
      const interval = setInterval(() => {
        const index = shuffledIndexes[currentIndex];

        tickSound.currentTime = 0;
        tickSound.play();

        boxes[index].classList.add('highlighted');
  
        setTimeout(() => {
          boxes[index].classList.remove('highlighted');
        }, delay);
  
        currentIndex++;
  
        if (currentIndex === boxes.length) {
          clearInterval(interval);
          setTimeout(() => {
            const availableBoxes = boxes.filter(box => !box.classList.contains('selected') && box.value.trim() !== '');
            if (availableBoxes.length > 0) {
              const randomIndex = Math.floor(Math.random() * availableBoxes.length);
              const selectedBox = availableBoxes[randomIndex];
              selectedBox.classList.add('selected'); 
              selectedBox.classList.add('winner');
              
              winSound.play(); 

              confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
              });

              const winnerName = selectedBox.value.trim();
              const displayName = winnerName !== '' ? winnerName : `[Empty Box]`;
              
              const li = document.createElement('li');
              li.textContent = displayName;
              winnerList.appendChild(li);
            }
            
            startButton.disabled = false;
          }, delay);
        }
      }, delay);
    }
  
    // Function to shuffle an array
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  
    // Event listener for start button
    startButton.addEventListener('click', function() {
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
        box.classList.remove('winner');
        box.classList.remove('selected');
      });
      
      winnerList.innerHTML = ''; 
      startButton.disabled = false;
    });
// --- NEW: Music Toggle Listener ---
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
    // --- End of new code ---
    // --- Arrow Key and Enter Key Navigation ---
    gridContainer.addEventListener('keydown', function(e) {
      const activeElement = document.activeElement;

      if (!activeElement || !activeElement.classList.contains('box')) {
        return;
      }

      const currentIndex = boxes.indexOf(activeElement);
      if (currentIndex === -1) {
        return;
      }

      let targetIndex = -1;
      const rowSize = 10;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault(); 
          if (currentIndex >= rowSize) {
            targetIndex = currentIndex - rowSize;
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < boxes.length - rowSize) {
            targetIndex = currentIndex + rowSize;
          }
          break;
        case 'ArrowLeft':
          if (currentIndex % rowSize !== 0) {
            targetIndex = currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          if (currentIndex % rowSize !== rowSize - 1) {
            targetIndex = currentIndex + 1;
          }
          break;
        // --- NEW: Added Enter key logic ---
        case 'Enter':
          e.preventDefault(); // Stop default form submission/newline
          if (currentIndex < boxes.length - 1) { // If not the last box
            targetIndex = currentIndex + 1;
          } else { // If it is the last box
            targetIndex = 0; // Loop back to the first box
          }
          break;
        // --- End of new code ---
        default:
          return; 
      }

      if (targetIndex !== -1) {
        boxes[targetIndex].focus();
      }
    });
  
});