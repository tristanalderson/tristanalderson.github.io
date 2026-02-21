/* ============================================================
   VIEWER3D.JS — Three.js VRML Model Viewer (Lazy-loaded)
   ============================================================
   Supports: .wrl (VRML) via Three.js VRMLLoader
   Models load only when the user clicks "Explore in 3D"
   ============================================================ */

(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        console.warn('viewer3d: THREE.js not loaded — skipping 3D viewers.');
        return;
    }

    /* ---------- config ---------- */
    const CFG = {
        bg: 0x0d1117,
        fallbackColor: 0x00d4ff,
        fallbackEmissive: 0x003344,
        ambient: 0.5,
        dirLight: 0.8,
        fillLight: 0.4,
        autoRotate: 1.5,
        fov: 45,
    };

    /* ---------- helpers ---------- */

    function showLoading(container) {
        let el = container.querySelector('.viewer-loading');
        if (!el) {
            el = document.createElement('div');
            el.className = 'viewer-loading';
            el.innerHTML = `
                <div class="viewer-loading-inner">
                    <div class="loader-spinner"></div>
                    <span class="loader-text">Loading 3D model…</span>
                </div>`;
            container.appendChild(el);
        }
        el.style.display = 'flex';
    }

    function hideLoading(container) {
        const el = container.querySelector('.viewer-loading');
        if (el) el.style.display = 'none';
    }

    function showError(container, msg) {
        hideLoading(container);
        let el = container.querySelector('.viewer-error');
        if (!el) {
            el = document.createElement('div');
            el.className = 'viewer-error';
            container.appendChild(el);
        }
        el.textContent = msg;
        el.style.display = 'flex';
    }

    /* ---------- VRML loader ---------- */

    function loadVRML(url) {
        return new Promise((resolve, reject) => {
            if (!THREE.VRMLLoader) {
                reject(new Error('VRMLLoader not available — check script tags'));
                return;
            }
            const loader = new THREE.VRMLLoader();
            loader.load(
                url,
                scene => {
                    console.log('viewer3d: VRML loaded —', scene.children.length, 'children');
                    // VRML loads as a Scene; wrap in a Group for consistency
                    const group = new THREE.Group();
                    while (scene.children.length > 0) {
                        group.add(scene.children[0]);
                    }
                    resolve(group);
                },
                undefined,
                err => reject(err)
            );
        });
    }

    /* ---------- fit model ---------- */

    function fitToView(group, camera) {
        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        console.log('viewer3d: bounding box — center:', center.toArray().map(v => v.toFixed(2)),
            'size:', size.toArray().map(v => v.toFixed(2)));

        // Centre the group at origin WITHOUT modifying individual geometries
        // (modifying vertices breaks relative transforms between VRML nodes)
        // Three.js matrix = T * R * S, so: worldPos = position + scale * localPos
        // To center: 0 = position + s * center → position = -s * center
        const maxDim = Math.max(size.x, size.y, size.z);
        const s = maxDim > 0 ? 4 / maxDim : 1;
        group.scale.set(s, s, s);
        group.position.set(-center.x * s, -center.y * s, -center.z * s);

        // Camera position — good angle for flat PCBs
        camera.position.set(3, 3, 4);
        camera.lookAt(0, 0, 0);
    }

    /* ---------- init a single viewer ---------- */

    async function initViewer(container) {
        const modelPath = container.dataset.model;
        if (!modelPath) return;

        // Hide the placeholder button
        const placeholder = container.querySelector('.viewer-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        showLoading(container);

        try {
            /* --- Three.js scene --- */
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(CFG.bg);

            const aspect = (container.clientWidth || 400) / (container.clientHeight || 300);
            const camera = new THREE.PerspectiveCamera(CFG.fov, aspect, 0.1, 1000);
            camera.position.set(0, 0, 5);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setSize(container.clientWidth || 400, container.clientHeight || 300);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.autoRotate = true;
            controls.autoRotateSpeed = CFG.autoRotate;
            controls.enablePan = false;
            controls.minDistance = 1;
            controls.maxDistance = 20;

            /* lights */
            scene.add(new THREE.AmbientLight(0xffffff, CFG.ambient));
            const d1 = new THREE.DirectionalLight(0xffffff, CFG.dirLight);
            d1.position.set(5, 5, 5);
            scene.add(d1);
            const d2 = new THREE.DirectionalLight(0x88ccff, CFG.fillLight);
            d2.position.set(-5, 3, -5);
            scene.add(d2);

            /* grid */
            const grid = new THREE.GridHelper(10, 20, 0x1a2332, 0x1a2332);
            grid.position.y = -2;
            scene.add(grid);

            /* --- load VRML model --- */
            const group = await loadVRML(modelPath);

            fitToView(group, camera);
            scene.add(group);

            /* show canvas */
            hideLoading(container);
            container.appendChild(renderer.domElement);
            console.log('viewer3d: renderer ready for', modelPath);

            /* animation loop */
            let active = false;
            function animate() {
                if (!active) return;
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            }

            /* animate only when visible */
            const observer = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    active = e.isIntersecting;
                    if (active) animate();
                });
            }, { threshold: 0.1 });
            observer.observe(container);

            /* resize handler */
            window.addEventListener('resize', () => {
                const w = container.clientWidth || 400;
                const h = container.clientHeight || 300;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            });

        } catch (err) {
            console.error('viewer3d: error for', modelPath, err);
            showError(container, 'Could not load model:\n' + err.message);
            if (placeholder) placeholder.style.display = '';
        }
    }

    /* ---------- bootstrap: lazy-load on click ---------- */

    document.addEventListener('DOMContentLoaded', () => {
        const containers = document.querySelectorAll('.viewer-container[data-model]');
        console.log('viewer3d: found', containers.length, 'viewer containers');

        const placeholderHTML = `
                <svg class="viewer-placeholder-icon" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
                <button class="viewer-launch-btn" type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Explore in 3D
                </button>`;

        containers.forEach(container => {
            // Use existing placeholder from HTML or create one (single CTA, no duplicate text)
            let placeholder = container.querySelector('.viewer-placeholder');
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'viewer-placeholder';
                container.appendChild(placeholder);
            }
            placeholder.innerHTML = placeholderHTML;

            const btn = placeholder.querySelector('.viewer-launch-btn');
            btn.addEventListener('click', () => {
                console.log('viewer3d: user clicked — loading', container.dataset.model);
                initViewer(container);
            });
        });
    });

})();
