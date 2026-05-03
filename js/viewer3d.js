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
    overlay.textContent = text;
    return overlay;
  }

  function initViewer(container, modelUrl) {
    const overlay = addOverlay(container, "Loading 3D model");

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

    const loader = new THREE.VRMLLoader();
    loader.load(
      modelUrl,
      (object) => {
        scene.add(object);

        // Ensure all matrices are updated before calculating bounding box
        object.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the model relative to its bounding box
        object.position.sub(center);

        // Calculate camera distance based on model size and FOV
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        // Add padding and set angled position
        cameraZ *= 0.8; 
        camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
        
        camera.near = maxDim / 100;
        camera.far = cameraZ * 10;
        camera.updateProjectionMatrix();

        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }

        overlay.remove();
      },
      undefined,
      (err) => {
        console.error("VRML Load Error:", err);
        overlay.textContent = "Failed to load model";
      }
    );

    return { container, renderer, scene, camera, controls };
  }

  function initAll() {
    const viewers = viewerNodes.map((node) => {
      const modelUrl = node.dataset.model;
      if (!modelUrl) {
        addOverlay(node, "Missing model path");
        return null;
      }
      return initViewer(node, modelUrl);
    }).filter(Boolean);

    function onResize() {
      viewers.forEach((viewer) => {
        const { container, renderer, camera } = viewer;
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    }

    window.addEventListener("resize", onResize);

    function animate() {
      requestAnimationFrame(animate);
      viewers.forEach(({ renderer, scene, camera, controls }) => {
        controls.update();
        renderer.render(scene, camera);
      });
    }

    animate();
  }

  sources
    .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
    .then(initAll)
    .catch((err) => {
      console.warn("VRML viewer failed to initialize", err);
      viewerNodes.forEach((node) => addOverlay(node, "3D viewer unavailable"));
    });
})();
