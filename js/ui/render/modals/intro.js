import { renderIntroCarousel } from '../../visuals/intro-carousel.js';

export function renderIntroOverlay() {
  let root = document.getElementById('tutorial-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'tutorial-root';
    document.body.appendChild(root);
  }
  renderIntroCarousel(root);
}
