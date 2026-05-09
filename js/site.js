(function () {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      const expanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", String(!expanded));
      navLinks.classList.toggle("open");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function ensureLightbox() {
    let lightbox = document.getElementById("lightbox");
    if (lightbox) {
      return lightbox;
    }

    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
      <div class="lightbox-inner" role="dialog" aria-modal="true" aria-label="Image preview">
        <button class="lightbox-close" type="button" aria-label="Close image">&times;</button>
        <img class="lightbox-img" alt="" />
      </div>
    `;

    document.body.appendChild(lightbox);

    const closeBtn = lightbox.querySelector(".lightbox-close");
    closeBtn.addEventListener("click", () => closeLightbox(lightbox));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox(lightbox);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox(lightbox);
      }
    });

    return lightbox;
  }

  function openLightbox(img) {
    const lightbox = ensureLightbox();
    const preview = lightbox.querySelector(".lightbox-img");
    preview.src = img.currentSrc || img.src;
    preview.alt = img.alt || "";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox(lightbox) {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    const preview = lightbox.querySelector(".lightbox-img");
    preview.src = "";
    preview.alt = "";
  }

  const lightboxImages = document.querySelectorAll(
    ".project-gallery img, .gallery-grid img, .project-thumb img"
  );
  lightboxImages.forEach((img) => {
    img.classList.add("lightboxable");
    img.addEventListener("click", () => openLightbox(img));
  });

  const gallery = document.getElementById("gallery-grid");
  const galleryNote = document.getElementById("gallery-note");

  if (gallery) {
    const isSubfolder = window.location.pathname.includes("/projects/");
    const basePath = isSubfolder ? "../" : "";

    fetch(`${basePath}assets/gallery/manifest.json`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load gallery manifest");
        return res.json();
      })
      .then((data) => {
        const entries = Array.isArray(data) ? data : data.images || [];
        gallery.innerHTML = "";

        // Per-image observer — fires when each image scrolls into view
        const imgObserver = new IntersectionObserver((observed, obs) => {
          observed.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
            }
            obs.unobserve(img);
          });
        }, { rootMargin: "300px" });

        // Insert ALL figure shells immediately so the masonry layout is computed
        // correctly — images load in real viewport order as the user scrolls
        entries.forEach((entry) => {
          const file = typeof entry === "string" ? entry : entry.file;
          if (!file) return;

          const caption = typeof entry === "object" && entry.caption ? entry.caption : "";
          const img = document.createElement("img");
          img.dataset.src = `${basePath}assets/gallery/${encodeURIComponent(file)}`;
          img.alt = caption || file.replace(/[_-]+/g, " ").replace(/\.[^.]+$/, "");
          img.decoding = "async";

          const figure = document.createElement("figure");
          figure.className = "gallery-item";
          figure.setAttribute("role", "listitem");
          figure.appendChild(img);
          gallery.appendChild(figure);

          imgObserver.observe(img);
        });

        if (galleryNote) {
          galleryNote.textContent = `Gallery: ${entries.length} photos.`;
        }
      })
      .catch((err) => {
        console.warn("Gallery load failed", err);
        if (galleryNote) {
          galleryNote.textContent = "Gallery unavailable.";
        }
      });
  }
})();
