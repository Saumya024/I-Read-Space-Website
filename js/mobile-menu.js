// Mobile Menu Script - Shared across all pages
(function() {
  'use strict';

  // Wait for DOM to be ready
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    const body = document.body;

    // If elements don't exist, exit early
    if (!hamburger || !nav) {
      return;
    }

    function findNavLink(label) {
      return Array.from(nav.querySelectorAll('a')).find(link => {
        return link.textContent.trim().toLowerCase() === label.toLowerCase();
      });
    }

    function cloneLink(label, extraClass) {
      const source = findNavLink(label);
      if (!source) return null;
      const clone = source.cloneNode(true);
      clone.removeAttribute('id');
      clone.removeAttribute('style');
      clone.classList.remove('header-cta');
      clone.classList.add('mobile-menu-link');
      if (extraClass) clone.classList.add(extraClass);
      return clone;
    }

    function createLink(label, href, extraClass) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.className = 'mobile-menu-link';
      if (extraClass) link.classList.add(extraClass);
      return link;
    }

    function createGroup(title, children) {
      const availableChildren = children.filter(Boolean);
      if (availableChildren.length === 0) return null;

      const group = document.createElement('div');
      group.className = 'mobile-menu-group';
      group.classList.add(`mobile-menu-group--${title.toLowerCase().replace(/\s+/g, '-')}`);

      const heading = document.createElement('div');
      heading.className = 'mobile-menu-section-heading';
      heading.textContent = title;
      group.appendChild(heading);

      availableChildren.forEach(child => group.appendChild(child));
      return group;
    }

    function buildGroupedMobileMenu() {
      if (nav.querySelector('.mobile-menu-panel')) return;

      const panel = document.createElement('div');
      panel.className = 'mobile-menu-panel';

      const workGroup = createGroup('Work With Me', [
        cloneLink('Services'),
        cloneLink('Pricing')
      ]);

      const learnChildren = [cloneLink('About')];
      const resourceLinks = [
        cloneLink('Insights', 'mobile-menu-resource-link'),
        cloneLink('Healing', 'mobile-menu-resource-link'),
        cloneLink('Conscious Living', 'mobile-menu-resource-link'),
        cloneLink('Reset', 'mobile-menu-resource-link')
      ].filter(Boolean);

      if (resourceLinks.length > 0) {
        const resourcesBlock = document.createElement('div');
        resourcesBlock.className = 'mobile-menu-resources';

        const resourcesHeading = document.createElement('div');
        resourcesHeading.className = 'mobile-menu-subheading';
        resourcesHeading.textContent = 'Resources';
        resourcesBlock.appendChild(resourcesHeading);

        resourceLinks.forEach(link => resourcesBlock.appendChild(link));
        learnChildren.push(resourcesBlock);
      }

      const learnGroup = createGroup('Learn More', learnChildren);

      const contactRow = document.createElement('div');
      contactRow.className = 'mobile-menu-contact-row';
      contactRow.appendChild(createLink('WhatsApp', 'https://wa.me/919217679635', 'mobile-menu-contact-cta'));
      contactRow.appendChild(createLink('Email', 'mailto:consult@ireadspace.com', 'mobile-menu-contact-cta'));

      const sourceCta = nav.querySelector('.header-cta');
      const bookCta = sourceCta ? sourceCta.cloneNode(true) : cloneLink('Pricing');
      if (bookCta) {
        bookCta.removeAttribute('id');
        bookCta.removeAttribute('style');
        bookCta.classList.add('header-cta', 'mobile-menu-book-cta');
        bookCta.textContent = bookCta.textContent.trim() || 'Book a Session';
      }

      const reachGroup = createGroup('Reach Out', [contactRow, bookCta].filter(Boolean));

      [workGroup, learnGroup, reachGroup].filter(Boolean).forEach(group => panel.appendChild(group));

      nav.appendChild(panel);
      nav.classList.add('mobile-menu-enhanced');
    }

    buildGroupedMobileMenu();

    function toggleMenu() {
      hamburger.classList.toggle('active');
      nav.classList.toggle('active');
      body.classList.toggle('menu-open');
    }

    function closeMenu() {
      hamburger.classList.remove('active');
      nav.classList.remove('active');
      body.classList.remove('menu-open');
    }

    // Toggle menu on hamburger click
    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when clicking on a nav link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') {
          closeMenu();
          return;
        }
        if (href.startsWith('#')) {
          closeMenu();
          return;
        }
        e.preventDefault();
        // Close menu instantly (no transition) so text doesn't double before navigation
        nav.style.transition = 'none';
        closeMenu();
        requestAnimationFrame(function() {
          nav.style.transition = '';
        });
        window.location.href = href;
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
        if (nav.classList.contains('active')) {
          closeMenu();
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();

