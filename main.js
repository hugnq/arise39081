
document.addEventListener('DOMContentLoaded', () => {
  const scrollIndicator = document.querySelector('.scroll-indicator');

  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', (e) => {
      e.preventDefault();

      
      const mainContent = document.querySelector('.main-content');
      const nextSection = mainContent ? mainContent.nextElementSibling : null;

      if (nextSection && nextSection.tagName !== 'SCRIPT') {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        
        window.scrollBy({
          top: window.innerHeight,
          behavior: 'smooth'
        });
      }
    });
  }
});

