// Testimonial carousel: fixed-height crossfade on all screen sizes (no layout shift)
(function () {
  'use strict';

  function lockSlideHeight(slidesWrapper, slides) {
    if (!slidesWrapper || slides.length === 0) return;

    slidesWrapper.classList.add('is-measuring');
    const maxHeight = slidesWrapper.offsetHeight;
    slidesWrapper.classList.remove('is-measuring');
    slidesWrapper.style.minHeight = maxHeight + 'px';
  }

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
    let resizeTimer = null;

    function showSlide(index) {
      slides.forEach(function (slide, i) {
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

    function refreshHeight() {
      lockSlideHeight(slidesWrapper, slides);
    }

    function scheduleRefresh() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshHeight, 150);
    }

    showSlide(0);
    refreshHeight();
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

    window.addEventListener('resize', scheduleRefresh);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(scheduleRefresh);
      observer.observe(slidesWrapper);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refreshHeight);
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
