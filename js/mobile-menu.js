// Mobile Menu Script - Shared across all pages
(function() {
  'use strict';

  const SITE_CONTACT = {
    phoneDisplay: '+91 92176 79635',
    phoneHref: 'tel:+919217679635',
    email: 'consult@ireadspace.com',
    whatsapp: 'https://wa.me/919217679635',
    socials: [
      { icon: 'icons8-instagram-logo-100.png', href: 'https://www.instagram.com/ireadspace?igsh=MmVlbWhzcjFwYmN5&utm_source=qr', aria: 'Instagram' },
      { icon: 'icons8-linkedin-logo-100.png', href: 'https://www.linkedin.com/in/theonesaumya/', aria: 'LinkedIn' },
      { icon: 'icons8-threads-50.png', href: 'https://www.threads.com/@ireadspace', aria: 'Threads' },
      { icon: 'icons8-facebook-50.png', href: 'https://www.facebook.com/profile.php?id=61590787133182', aria: 'Facebook' }
    ]
  };

  function getImagesBase() {
    const styleLink = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
    if (!styleLink) return 'assets/images/';
    const href = (styleLink.getAttribute('href') || '').split('?')[0];
    return href.replace(/styles\.css$/, 'assets/images/');
  }

  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    const body = document.body;

    if (!hamburger || !nav) {
      return;
    }

    function findNavLink(label) {
      return Array.from(nav.querySelectorAll('a')).find(link => {
        return link.textContent.trim().toLowerCase() === label.toLowerCase();
      });
    }

    function addClasses(element, classNames) {
      if (!classNames) return;
      classNames.trim().split(/\s+/).forEach(name => {
        if (name) element.classList.add(name);
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
      addClasses(clone, extraClass);
      return clone;
    }

    function createLink(label, href, extraClass, options) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.className = 'mobile-menu-link';
      addClasses(link, extraClass);
      if (options && options.target) link.target = options.target;
      if (options && options.rel) link.rel = options.rel;
      if (options && options.ariaLabel) link.setAttribute('aria-label', options.ariaLabel);
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

    function createContactDetails() {
      const details = document.createElement('div');
      details.className = 'mobile-menu-contact-details';

      const phoneRow = document.createElement('div');
      phoneRow.className = 'mobile-menu-contact-detail-row';
      phoneRow.innerHTML = '<span class="mobile-menu-contact-label">Phone</span>';
      const phoneLink = document.createElement('a');
      phoneLink.className = 'mobile-menu-contact-value';
      phoneLink.href = SITE_CONTACT.phoneHref;
      phoneLink.textContent = SITE_CONTACT.phoneDisplay;
      phoneRow.appendChild(phoneLink);
      details.appendChild(phoneRow);

      const emailRow = document.createElement('div');
      emailRow.className = 'mobile-menu-contact-detail-row';
      emailRow.innerHTML = '<span class="mobile-menu-contact-label">Email</span>';
      const emailLink = document.createElement('a');
      emailLink.className = 'mobile-menu-contact-value';
      emailLink.href = `mailto:${SITE_CONTACT.email}`;
      emailLink.textContent = SITE_CONTACT.email;
      emailRow.appendChild(emailLink);
      details.appendChild(emailRow);

      return details;
    }

    function createReachDivider() {
      const divider = document.createElement('div');
      divider.className = 'mobile-menu-reach-divider';
      divider.setAttribute('aria-hidden', 'true');
      return divider;
    }

    function wrapReachBlock(className, children) {
      const block = document.createElement('div');
      block.className = className;
      children.filter(Boolean).forEach(child => block.appendChild(child));
      return block;
    }

    function createSocialRow() {
      const row = document.createElement('div');
      row.className = 'mobile-menu-social-row';
      const imagesBase = getImagesBase();

      SITE_CONTACT.socials.forEach(social => {
        const link = document.createElement('a');
        link.href = social.href;
        link.className = 'mobile-menu-social-icon';
        link.setAttribute('aria-label', social.aria);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        const img = document.createElement('img');
        img.src = imagesBase + social.icon;
        img.alt = '';
        img.loading = 'lazy';
        link.appendChild(img);
        row.appendChild(link);
      });

      return row;
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
      contactRow.appendChild(createLink('WhatsApp', SITE_CONTACT.whatsapp, 'mobile-menu-contact-cta mobile-menu-contact-cta--whatsapp', {
        target: '_blank',
        rel: 'noopener noreferrer',
        ariaLabel: 'WhatsApp'
      }));
      contactRow.appendChild(createLink('Email', `mailto:${SITE_CONTACT.email}`, 'mobile-menu-contact-cta mobile-menu-contact-cta--email', {
        ariaLabel: 'Email'
      }));

      const sourceCta = nav.querySelector('.header-cta');
      const bookCta = sourceCta ? sourceCta.cloneNode(true) : cloneLink('Pricing');
      if (bookCta) {
        bookCta.removeAttribute('id');
        bookCta.removeAttribute('style');
        bookCta.classList.add('header-cta', 'mobile-menu-book-cta');
        bookCta.textContent = bookCta.textContent.trim() || 'Book a Session';
      }

      const reachPrimary = wrapReachBlock('mobile-menu-reach-primary', [
        createContactDetails()
      ]);

      const reachSecondary = wrapReachBlock('mobile-menu-reach-secondary', [
        contactRow,
        createSocialRow(),
        bookCta
      ]);

      const reachGroup = createGroup('Reach Out', [reachPrimary]);

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'mobile-menu-close';
      closeBtn.setAttribute('aria-label', 'Close menu');
      closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>';

      const scrollArea = document.createElement('div');
      scrollArea.className = 'mobile-menu-scroll';
      [workGroup, learnGroup, reachGroup].filter(Boolean).forEach(group => scrollArea.appendChild(group));

      const ctaDock = document.createElement('div');
      ctaDock.className = 'mobile-menu-cta-dock';
      ctaDock.appendChild(createReachDivider());
      ctaDock.appendChild(reachSecondary);

      panel.appendChild(scrollArea);
      panel.appendChild(ctaDock);

      nav.appendChild(closeBtn);
      nav.appendChild(panel);
      nav.classList.add('mobile-menu-enhanced');
    }

    buildGroupedMobileMenu();

    const scrollArea = nav.querySelector('.mobile-menu-scroll');
    if (scrollArea) {
      let scrollHideTimer = null;
      scrollArea.addEventListener('scroll', function () {
        scrollArea.classList.add('is-scrolling');
        if (scrollHideTimer) clearTimeout(scrollHideTimer);
        scrollHideTimer = setTimeout(function () {
          scrollArea.classList.remove('is-scrolling');
        }, 700);
      }, { passive: true });
    }

    let scrollLockY = 0;

    function openMenu() {
      scrollLockY = window.scrollY || window.pageYOffset;
      hamburger.classList.add('active');
      nav.classList.add('active');
      body.classList.add('menu-open');
      body.style.position = 'fixed';
      body.style.top = `-${scrollLockY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
    }

    function closeMenu() {
      const menuScroll = nav.querySelector('.mobile-menu-scroll');
      if (menuScroll) menuScroll.classList.remove('is-scrolling');
      hamburger.classList.remove('active');
      nav.classList.remove('active');
      body.classList.remove('menu-open');
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      window.scrollTo(0, scrollLockY);
    }

    function toggleMenu() {
      if (nav.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });

    const menuCloseBtn = nav.querySelector('.mobile-menu-close');
    if (menuCloseBtn) {
      menuCloseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeMenu();
      });
    }

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
        nav.style.transition = 'none';
        closeMenu();
        requestAnimationFrame(function() {
          nav.style.transition = '';
        });
        if (this.target === '_blank') {
          window.open(href, '_blank', 'noopener');
          return;
        }
        window.location.href = href;
      });
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
        if (nav.classList.contains('active')) {
          closeMenu();
        }
      }
    });
  }

  function initNavDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    if (dropdowns.length === 0) return;

    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.nav-dropdown-toggle');

      dropdown.addEventListener('mouseenter', function() {
        if (window.innerWidth > 1024) {
          dropdown.classList.add('active');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
      });

      dropdown.addEventListener('mouseleave', function() {
        if (window.innerWidth > 1024) {
          dropdown.classList.remove('active');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });

      if (toggle) {
        toggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const isActive = dropdown.classList.contains('active');
          dropdown.classList.toggle('active');
          toggle.setAttribute('aria-expanded', String(!isActive));

          dropdowns.forEach(other => {
            if (other !== dropdown) {
              other.classList.remove('active');
              const otherToggle = other.querySelector('.nav-dropdown-toggle');
              if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
            }
          });
        });

        toggle.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const isActive = dropdown.classList.contains('active');
            dropdown.classList.toggle('active');
            toggle.setAttribute('aria-expanded', String(!isActive));
          }
        });
      }
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.nav-dropdown')) {
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
          const toggle = dropdown.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  function init() {
    initMobileMenu();
    initNavDropdowns();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
