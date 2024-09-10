// Get the font control buttons and font size display element
var incrementButton = document.querySelector('.font-size-increment');
var decrementButton = document.querySelector('.font-size-decrement');
var defaultButton = document.querySelector('.font-size-default');
var fontSizeDisplay = document.querySelector('.font-size');

// Set the default font size
var fontSize = 16;

// Add event listeners to the font control buttons
incrementButton.addEventListener('click', function() {
    fontSize++;
    updateFontSize();
});

decrementButton.addEventListener('click', function() {
    if (fontSize > 1) {
        fontSize--;
        updateFontSize();
    }
});

defaultButton.addEventListener('click', function() {
    fontSize = 16;
    updateFontSize();
});

// Function to update the font size display
function updateFontSize() {
    fontSizeDisplay.textContent = fontSize;
    document.body.style.fontSize = fontSize + 'px';
}

// Get the theme buttons
var neonThemeButton = document.querySelector('.neon-theme');
var lightThemeButton = document.querySelector('.light-theme');

// Add event listeners to the theme buttons
neonThemeButton.addEventListener('click', function() {
    // Apply neon theme styles to body
    document.body.classList.add('neon-theme');
    document.body.classList.remove('light-theme');
    // Apply neon theme styles to specific elements if needed
    // Example: document.querySelector('.some-element').classList.add('neon-theme');
});

lightThemeButton.addEventListener('click', function() {
    // Apply light theme styles to body
    document.body.classList.remove('neon-theme');
    document.body.classList.add('light-theme');
    // Apply light theme styles to specific elements if needed
    // Example: document.querySelector('.some-element').classList.remove('neon-theme');
});




// Select the news slider element
const newsSlider = document.querySelector('.news-slider');

// Set the interval for sliding the news headlines
setInterval(() => {
    // Get the first news headline
    const firstHeadline = newsSlider.querySelector('.news-headline:first-child');

    // Add animation to slide the first news headline up
    firstHeadline.style.animation = 'slideUp 2s forwards';

    // Remove the animation after it completes
    setTimeout(() => {
        firstHeadline.style.animation = '';
        // Move the first headline to the end of the list
        newsSlider.appendChild(firstHeadline);
    }, 500);
}, 2000); // Change 2000 to the desired interval in milliseconds (e.g., 3000 for 3 seconds)

let slideIndex = 0;
const slides = document.querySelectorAll('.slider img');

function moveSlide(n) {
  slideIndex += n;
  if (slideIndex > slides.length - 1) slideIndex = 0;
  if (slideIndex < 0) slideIndex = slides.length - 1;
  document.querySelector('.slider').style.transform = `translateX(-${slideIndex * 1270}px)`;
}

function autoSlide() {
  moveSlide(1);
}

setInterval(autoSlide, 2000);
/*------------------------------------------------13-MAY-2024-----------------------------------------*/