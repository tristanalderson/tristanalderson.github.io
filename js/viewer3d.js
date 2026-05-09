(function () {
  const viewerNodes = Array.from(document.querySelectorAll(".vrml-viewer"));
  if (!viewerNodes.length) {
    return;
  }

  const sources = [
    "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js",
    "https://cdn.jsdelivr.net/npm/chevrotain@10.5.0/lib/chevrotain.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
    "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/VRMLLoader.js",
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function addOverlay(container, text) {
    let overlay = container.querySelector(".vrml-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "vrml-overlay";
      container.appendChild(overlay);
    }
    // Show a spinner + label so the user knows something is happening
    overlay.innerHTML = `<span class="vrml-spinner"></span><span>${text}</span>`;
    return overlay;
  }

  // ── Lazy-load strategy ──────────────────────────────────────────────────────
  // VRMLLoader.parse() is a heavy synchronous operation that blocks the main
  // thread. If it runs while the user hasn't scrolled to the viewer yet, any
  // pending navigation click (e.g. a navbar link) gets queued behind the parse
  // and the page appears frozen.
  //
  // Fix: use IntersectionObserver to defer ALL work (fetch + parse) until the
  // viewer container is actually visible. Since the 3D viewer is always below
  // the fold, clicking nav links at the top navigates instantly because the
  // heavy parse hasn't started yet.
  //
  // Additionally, we use an AbortController so that if the user navigates away
  // mid-fetch, the download is cancelled and we never enter the parse step.
  // ───────────────────────────────────────────────────────────────────────────

  function initViewer(container, modelUrl) {
    const overlay = addOverlay(container, "Loading 3D model\u2026");

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.domElement.className = "vrml-canvas";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const directional1 = new THREE.DirectionalLight(0xffffff, 0.6);
    directional1.position.set(1, 1, 1);
    const directional2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directional2.position.set(-1, -1, -1);
    scene.add(ambient, directional1, directional2);

    // AbortController lets us cancel the fetch if the user navigates away
    const abortCtrl = new AbortController();
    window.addEventListener("beforeunload", () => abortCtrl.abort(), { once: true });

    const loader = new THREE.VRMLLoader();

    fetch(modelUrl, { signal: abortCtrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((vrmlText) => {
        // Yield to browser event loop before the CPU-heavy parse step.
        // This lets any queued click/navigation events fire first.
        return new Promise((resolve) => setTimeout(() => resolve(vrmlText), 0));
      })
      .then((vrmlText) => {
        const object = loader.parse(vrmlText, modelUrl);

        scene.add(object);
        object.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        object.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        cameraZ *= 0.8;
        camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);

        camera.near = maxDim / 100;
        camera.far = cameraZ * 10;
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);

        controls.target.set(0, 0, 0);
        controls.update();

        overlay.remove();
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // user navigated away, ignore
        console.error("VRML Load Error:", err);
        overlay.innerHTML = "Failed to load model";
      });

    return { container, renderer, scene, camera, controls };
  }

  function initAll() {
    const viewers = [];

    // Use IntersectionObserver to lazy-init each viewer only when it scrolls
    // into view.  rootMargin gives a 200px head-start so the load begins just
    // before the user reaches it.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const node = entry.target;
          observer.unobserve(node); // only trigger once per viewer

          const modelUrl = node.dataset.model;
          if (!modelUrl) {
            addOverlay(node, "Missing model path");
            return;
          }

          const viewer = initViewer(node, modelUrl);
          viewers.push(viewer);

          // Start the render loop for this viewer (each gets its own rAF)
          function animate() {
            requestAnimationFrame(animate);
            viewer.controls.update();
            viewer.renderer.render(viewer.scene, viewer.camera);
          }
          animate();
        });
      },
      { rootMargin: "200px" }
    );

    viewerNodes.forEach((node) => {
      addOverlay(node, "Scroll to load 3D model");
      observer.observe(node);
    });

    window.addEventListener("resize", () => {
      viewers.forEach(({ container, renderer, camera }) => {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    });
  }

  sources
    .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
    .then(initAll)
    .catch((err) => {
      console.warn("VRML viewer failed to initialize", err);
      viewerNodes.forEach((node) => addOverlay(node, "3D viewer unavailable"));
    });
})();
