/* ============================================================
   MAIN.JS — Portfolio Interactions & Animations
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- AOS Init ----
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 80,
  });

  // ---- Sticky Navbar ----
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    const scrollY = window.scrollY;

    // Sticky class
    navbar.classList.toggle('scrolled', scrollY > 50);

    // Active nav link
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Mobile Nav Toggle ----
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-links');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  // Close on link click
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // ---- Media Tabs ----
  document.querySelectorAll('.media-tabs').forEach(tabBar => {
    const tabs = tabBar.querySelectorAll('.media-tab');
    const card = tabBar.closest('.cluster-visual') || tabBar.closest('.project-media') || tabBar.parentElement;
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.target;
        // Deactivate all
        tabs.forEach(t => t.classList.remove('active'));
        card.querySelectorAll('.media-panel').forEach(p => p.classList.remove('active'));
        // Activate clicked
        tab.classList.add('active');
        const panel = document.getElementById(targetId);
        if (panel) panel.classList.add('active');
      });
    });
  });

  // ---- Hardware Project Switcher & Mode Toggle ----
  const hardwareSection = document.getElementById('hardware-pcb-section');
  if (hardwareSection) {
    const projectTabs = hardwareSection.querySelectorAll('.project-selector .sub-tab');
    const modeTabs = hardwareSection.querySelectorAll('.visual-mode-tabs .media-tab');
    const carouselTrack = hardwareSection.querySelector('#carousel-hardware .carousel-track');
    const viewer = hardwareSection.querySelector('#viewer-hardware');
    const infoContainer = document.getElementById('hardware-project-info');

    const projectData = {
      'gps-module': {
        title: 'GPS Module',
        model: 'assets/models/GPS_Module.wrl',
        context: '<strong>Modular PCIeX1 GPS receiver and telemetry node.</strong> Engineered an STM32-based module that interfaces with the avionics AIM network backplane. Processes real-time location data using a SAM-M10Q sensor and handles CAN bus forwarding with a 466mW power footprint.',
        images: [
          { src: 'assets/images/projects/gps_module_front.png', alt: 'GPS Module Front' },
          { src: 'assets/images/projects/gps_module_back.png', alt: 'GPS Module Back' },
          { src: 'assets/images/projects/gps_module_traces.png', alt: 'GPS Module Traces' }
        ]
      },
      'gps-antenna': {
        title: 'GPS Antenna',
        model: 'assets/models/GPS_Antenna_Board.wrl',
        context: '<strong>Custom SAM-M10Q active GPS receiver board.</strong> Designed, fabricated, and integrated a dedicated GPS daughter board. Successfully flight-proven while serving on a 10-person launch team in New Mexico.',
        images: [
          { src: 'assets/images/projects/gps_antenna_front.png', alt: 'GPS Antenna Front' },
          { src: 'assets/images/projects/gps_antenna_back.png', alt: 'GPS Antenna Back' },
          { src: 'assets/images/projects/gps_antenna_traces.png', alt: 'GPS Antenna Traces' }
        ]
      },
      'prop-controller': {
        title: 'Propulsion Controller',
        model: 'assets/models/upper_lc_board.wrl',
        context: '<strong>Distributed DAQ & launch management.</strong> ESP32-based upper valve control module for a hybrid engine. Interfaces with solenoids, pressure transducers, thermocouples, and initiates launch via CAN bus. High-bandwidth pre-launch telemetry over WiFi',
        images: [
          { src: 'assets/images/projects/prop_module_front.png', alt: 'Propulsion Controller Front' },
          { src: 'assets/images/projects/prop_module_back.png', alt: 'Propulsion Controller Back' },
          { src: 'assets/images/projects/prop_module_traces.png', alt: 'Propulsion Controller Traces' }
        ]
      }
    };

    function switchProject(projectId) {
      const data = projectData[projectId];
      if (!data) return;

      // Update Info
      infoContainer.innerHTML = `<p class="cluster-context">${data.context}</p>`;

      // Update Carousel Images
      carouselTrack.innerHTML = data.images.map((img, i) =>
        `<img src="${img.src}" alt="${img.alt}" class="carousel-slide ${i === 0 ? 'active' : ''}" />`
      ).join('');

      // Update 3D Model Path
      viewer.dataset.model = data.model;

      // Always reset the viewer so it reloads for the new project
      viewer.dispatchEvent(new CustomEvent('resetViewer'));

      // Re-init carousel logic for this specific carousel
      initSingleCarousel(hardwareSection.querySelector('#carousel-hardware'));
    }

    const imagesPanel = document.getElementById('hardware-images');
    const viewerPanel = document.getElementById('hardware-3d');
    const imagesTab = hardwareSection.querySelector('.visual-mode-tabs [data-target="hardware-images"]');
    const viewerTab = hardwareSection.querySelector('.visual-mode-tabs [data-target="hardware-3d"]');

    function showImagesPanel() {
      if (!imagesTab || !viewerTab || !imagesPanel || !viewerPanel) return;
      modeTabs.forEach(t => t.classList.remove('active'));
      imagesTab.classList.add('active');
      imagesPanel.classList.add('active');
      imagesPanel.style.display = 'block';
      viewerPanel.classList.remove('active');
      viewerPanel.style.display = 'none';
    }

    // When user clicks Images or 3D Viewer, clear inline display so CSS controls visibility
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        imagesPanel.style.display = '';
        viewerPanel.style.display = '';
      });
    });

    projectTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        projectTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        switchProject(tab.dataset.project);

        // Force switch back to Images when changing project so 3D viewer doesn't stay stuck
        showImagesPanel();
      });
    });
  }

  // Refactor carousel init to a function so it can be re-run
  function initSingleCarousel(carousel) {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');

    // Clear old dots
    dotsContainer.innerHTML = '';

    let current = 0;
    let autoTimer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    function goTo(index) {
      if (slides.length === 0) return;
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    prevBtn.onclick = () => goTo(current - 1);
    nextBtn.onclick = () => goTo(current + 1);
  }

  // Initial init for all carousels
  document.querySelectorAll('.image-carousel').forEach(c => initSingleCarousel(c));

  // ---- Gallery: load from manifest ----
  const galleryGrid = document.getElementById('gallery-grid');
  const GALLERY_BASE = 'assets/images/gallery/';

  function filenameToCaption(file) {
    return file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }

  if (galleryGrid) {
    fetch(GALLERY_BASE + 'manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((manifest) => {
        manifest.forEach(({ file }) => {
          const src = GALLERY_BASE + encodeURIComponent(file);
          const alt = filenameToCaption(file);
          const item = document.createElement('div');
          item.className = 'gallery-item';
          item.setAttribute('data-aos', 'fade-up');
          item.dataset.caption = alt;
          item.innerHTML = `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy">`;
          galleryGrid.appendChild(item);
        });
        if (typeof AOS !== 'undefined') AOS.refresh();
      })
      .catch(() => { });
  }

  // ---- Gallery Lightbox ----
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (galleryGrid) {
    galleryGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item) return;
      const img = item.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightboxCaption.textContent = item.dataset.caption || '';
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ---- Hero Particle / Circuit Canvas ----
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height, particles, animId;
    const PARTICLE_COUNT = 150;
    const CONNECTION_DIST = 120;
    const MOUSE_DIST = 200;
    let mouse = { x: -9999, y: -9999 };

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const colors = [
        'rgba(255, 255, 255,', // White
        'rgba(224, 242, 254,', // Very light blue
        'rgba(186, 230, 253,', // Light blue
        'rgba(255, 255, 255,'  // More white
      ];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.8 + 0.5,
          baseColor: colors[Math.floor(Math.random() * colors.length)],
          twinkleSpeed: 0.01 + Math.random() * 0.03,
          twinkleFactor: Math.random() * Math.PI,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of particles) {
        // Mouse interaction
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        let glowAlpha = 0.6;
        if (mDist < MOUSE_DIST) {
          glowAlpha = 1;
          const force = (MOUSE_DIST - mDist) / MOUSE_DIST;
          p.vx += (mdx / mDist) * force * 0.02;
          p.vy += (mdy / mDist) * force * 0.02;
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Bounce
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Twinkle effect
        p.twinkleFactor += p.twinkleSpeed;
        const opacity = 0.4 + Math.abs(Math.sin(p.twinkleFactor)) * 0.6;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.baseColor} ${opacity * glowAlpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  }

  // ---- Smooth scroll for anchor links (fallback) ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});
