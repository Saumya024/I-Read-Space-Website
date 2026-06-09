// Testimonial carousel: fixed-height crossfade (no layout shift between slides)
(function () {
  'use strict';

  function initTestimonialCarousel(carouselId) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const slidesWrapper = carousel.querySelector('.testimonial-slides-wrapper');
    const slides = slidesWrapper ? slidesWrapper.querySelectorAll('.testimonial-slide') : [];
    const leftArrow = carousel.querySelector('.testimonial-arrow-left');
    const rightArrow = carousel.querySelector('.testimonial-arrow-right');

    if (!slidesWrapper || slides.length === 0) return;

    let currentIndex = 0;
    let autoTimer = null;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(currentIndex);
    }

    function restartAuto() {
      if (slides.length <= 1) return;
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(nextSlide, 10000);
    }

    showSlide(0);
    restartAuto();

    if (rightArrow) {
      rightArrow.addEventListener('click', function () {
        nextSlide();
        restartAuto();
      });
    }

    if (leftArrow) {
      leftArrow.addEventListener('click', function () {
        prevSlide();
        restartAuto();
      });
    }
  }

  function initAll() {
    document.querySelectorAll('.testimonial-carousel[id]').forEach(function (carousel) {
      initTestimonialCarousel(carousel.id);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
