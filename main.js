document.addEventListener("DOMContentLoaded", () => {
    let isLightMode = false;

    const canvasEl = document.getElementById("starfield");
    const ctx2d = canvasEl.getContext("2d");
    const particleList = [];
    const TOTAL_PARTICLES = 160;

    const updateCanvasSize = () => {
        canvasEl.width = window.innerWidth;
        canvasEl.height = window.innerHeight;
    };

    const buildParticles = () => {
        particleList.length = 0;
        for (let i = 0; i < TOTAL_PARTICLES; i++) {
            const primary = Math.random() > 0.35;
            particleList.push({
                x: Math.random() * canvasEl.width,
                y: Math.random() * canvasEl.height,
                r: Math.random() * 1.8 + 0.4,
                dx: (Math.random() - 0.5) * 0.45,
                dy: (Math.random() - 0.5) * 0.45,
                ang: Math.random() * Math.PI * 2,
                angVel: Math.random() * 0.02 + 0.005,
                amp: Math.random() * 0.35,
                opacity: Math.random() * 0.7 + 0.3,
                fadeStep: (Math.random() * 0.015 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
                darkHex: primary ? "#ffffff" : "#8da4ff",
                lightHex: primary ? "#1e3a8a" : "#4f46e5"
            });
        }
    };

    const renderStarfield = () => {
        ctx2d.clearRect(0, 0, canvasEl.width, canvasEl.height);

        for (const p of particleList) {
            p.ang += p.angVel;
            p.x += p.dx + Math.cos(p.ang) * p.amp;
            p.y += p.dy + Math.sin(p.ang) * p.amp;

            if (p.x < 0) p.x = canvasEl.width;
            if (p.x > canvasEl.width) p.x = 0;
            if (p.y < 0) p.y = canvasEl.height;
            if (p.y > canvasEl.height) p.y = 0;

            p.opacity += p.fadeStep;
            if (p.opacity >= 1 || p.opacity <= 0.2) {
                p.opacity = Math.max(0.2, Math.min(1, p.opacity));
                p.fadeStep *= -1;
            }

            const activeHex = isLightMode ? p.lightHex : p.darkHex;

            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.arc(p.x, sY = p.y, p.r, 0, Math.PI * 2);
            ctx2d.fillStyle = activeHex;
            ctx2d.globalAlpha = p.opacity;
            ctx2d.shadowBlur = p.r * 5;
            ctx2d.shadowColor = activeHex;
            ctx2d.fill();
            ctx2d.restore();
        }

        requestAnimationFrame(renderStarfield);
    };

    updateCanvasSize();
    buildParticles();
    renderStarfield();
    window.addEventListener("resize", updateCanvasSize);

    const mountNode = document.getElementById("robot-canvas-container");
    const scene3d = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
    cam.position.set(10, 7, 14);

    const webgl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    webgl.setSize(mountNode.clientWidth, mountNode.clientHeight);
    webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(webgl.domElement);

    const orbit = new THREE.OrbitControls(cam, webgl.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.enableZoom = true;

    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    const mainLight = new THREE.DirectionalLight(0x8da4ff, 2.5);
    mainLight.position.set(10, 15, 10);
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    rimLight.position.set(-10, -5, -10);
    scene3d.add(ambLight, mainLight, rimLight);

    const craneRoot = new THREE.Group();
    craneRoot.rotation.z = Math.PI / 12;
    scene3d.add(craneRoot);

    const rawCoords = new Float32Array([
         5.0,  3.0,  0.0,   3.5,  4.5,  0.0,   3.0,  2.5,  0.0,
         1.0, -1.0,  0.0,  -2.0, -1.0,  0.0,  -5.0,  3.0,  0.0,
         0.0,  1.5,  0.0,   1.0,  1.0,  1.0,  -1.5,  1.0,  1.0,
        -2.0,  5.0,  5.0,   0.0,  0.5,  2.0,   1.0,  1.0, -1.0,
        -1.5,  1.0, -1.0,  -2.0,  5.0, -5.0,   0.0,  0.5, -2.0
    ]);

    const triIndices = [
        0, 1, 2,  2, 1, 7,  2, 11, 1,  2, 7, 3,  2, 3, 11,
        7, 1, 6,  11, 6, 1,
        7, 3, 10,  11, 14, 3,  10, 3, 4,  14, 4, 3,  8, 10, 4,  12, 4, 14,
        7, 6, 10,  11, 14, 6,  10, 6, 8,  14, 12, 6,
        8, 6, 5,  12, 5, 6,  8, 5, 4,  12, 4, 5,
        7, 10, 9,  10, 8, 9,  8, 6, 9,  7, 9, 6,
        11, 13, 14,  14, 13, 12,  12, 13, 6,  11, 6, 13
    ];

    const baseGeo = new THREE.BufferGeometry();
    baseGeo.setAttribute("position", new THREE.BufferAttribute(rawCoords, 3));
    baseGeo.setIndex(triIndices);
    baseGeo.computeVertexNormals();

    const meshGeo = baseGeo.toNonIndexed();
    const finalVerts = meshGeo.attributes.position.array.slice();
    const initVerts = new Float32Array(finalVerts.length);
    const liveVerts = new Float32Array(finalVerts.length);

    for (let i = 0; i < finalVerts.length; i += 9) {
        const midX = (finalVerts[i] + finalVerts[i + 3] + finalVerts[i + 6]) / 3;
        const midY = (finalVerts[i + 1] + finalVerts[i + 4] + finalVerts[i + 7]) / 3;
        const midZ = (finalVerts[i + 2] + finalVerts[i + 5] + finalVerts[i + 8]) / 3;
        const dist = 12 + Math.random() * 14;
        const offX = (Math.random() - 0.5) * dist + midX * 2.2;
        const offY = (Math.random() - 0.5) * dist + midY * 2.2;
        const offZ = (Math.random() - 0.5) * dist + midZ * 2.2;

        for (let j = 0; j < 9; j += 3) {
            initVerts[i + j] = finalVerts[i + j] + offX;
            initVerts[i + j + 1] = finalVerts[i + j + 1] + offY;
            initVerts[i + j + 2] = finalVerts[i + j + 2] + offZ;
            liveVerts[i + j] = initVerts[i + j];
            liveVerts[i + j + 1] = initVerts[i + j + 1];
            liveVerts[i + j + 2] = initVerts[i + j + 2];
        }
    }

    meshGeo.setAttribute("position", new THREE.BufferAttribute(liveVerts, 3));
    meshGeo.computeVertexNormals();

    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x111827,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide,
        flatShading: true,
        transparent: true,
        opacity: 0
    });
    const solidCrane = new THREE.Mesh(meshGeo, bodyMaterial);
    craneRoot.add(solidCrane);

    const edgeGeo = new THREE.EdgesGeometry(baseGeo);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x8da4ff,
        transparent: true,
        opacity: 0
    });
    const darkWireCrane = new THREE.LineSegments(edgeGeo, edgeMaterial);
    craneRoot.add(darkWireCrane);

    const cadLines = [];
    const cloudCoords = [];
    const cloudColors = [];

    const getV = (idx) => new THREE.Vector3(
        rawCoords[idx * 3],
        rawCoords[idx * 3 + 1],
        rawCoords[idx * 3 + 2]
    );

    const pushSegment = (p1, p2) => {
        cadLines.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    };

    const SUBDIVISIONS = 9;
    const LAYER_OFFSETS = [0, -0.14, 0.14];

    for (let i = 0; i < triIndices.length; i += 3) {
        const vA = getV(triIndices[i]);
        const vB = getV(triIndices[i + 1]);
        const vC = getV(triIndices[i + 2]);

        const normal = new THREE.Vector3()
            .subVectors(vB, vA)
            .cross(new THREE.Vector3().subVectors(vC, vA))
            .normalize();

        for (const offset of LAYER_OFFSETS) {
            const shift = normal.clone().multiplyScalar(offset);
            const A = vA.clone().add(shift);
            const B = vB.clone().add(shift);
            const C = vC.clone().add(shift);

            for (let k = 1; k < SUBDIVISIONS; k++) {
                const t = k / SUBDIVISIONS;
                pushSegment(new THREE.Vector3().lerpVectors(A, B, t), new THREE.Vector3().lerpVectors(A, C, t));
                pushSegment(new THREE.Vector3().lerpVectors(B, A, t), new THREE.Vector3().lerpVectors(B, C, t));
                pushSegment(new THREE.Vector3().lerpVectors(C, A, t), new THREE.Vector3().lerpVectors(C, B, t));
            }
            pushSegment(A, B);
            pushSegment(B, C);
            pushSegment(C, A);
        }

        for (let k = 0; k <= 6; k++) {
            const t = k / 6;
            const pAB = new THREE.Vector3().lerpVectors(vA, vB, t);
            const pBC = new THREE.Vector3().lerpVectors(vB, vC, t);
            const pCA = new THREE.Vector3().lerpVectors(vC, vA, t);
            const nShift = normal.clone().multiplyScalar(0.14);
            pushSegment(pAB.clone().sub(nShift), pAB.clone().add(nShift));
            pushSegment(pBC.clone().sub(nShift), pBC.clone().add(nShift));
            pushSegment(pCA.clone().sub(nShift), pCA.clone().add(nShift));
        }

        const area = new THREE.Vector3().subVectors(vB, vA).cross(new THREE.Vector3().subVectors(vC, vA)).length() * 0.5;
        const dotCount = Math.floor(area * 38) + 60;

        for (let d = 0; d < dotCount; d++) {
            let r1 = Math.random();
            let r2 = Math.random();
            if (r1 + r2 > 1) {
                r1 = 1 - r1;
                r2 = 1 - r2;
            }
            const r3 = 1 - r1 - r2;
            const spread = (Math.random() - 0.5) * 0.28;

            const px = vA.x * r1 + vB.x * r2 + vC.x * r3 + normal.x * spread + (Math.random() - 0.5) * 0.08;
            const py = vA.y * r1 + vB.y * r2 + vC.y * r3 + normal.y * spread + (Math.random() - 0.5) * 0.08;
            const pz = vA.z * r1 + vB.z * r2 + vC.z * r3 + normal.z * spread + (Math.random() - 0.5) * 0.08;

            cloudCoords.push(px, py, pz);

            if (Math.random() > 0.42) {
                cloudColors.push(0.14, 0.38, 0.92);
            } else {
                cloudColors.push(0.28, 0.33, 0.42);
            }
        }
    }

    const cadWireGeo = new THREE.BufferGeometry();
    cadWireGeo.setAttribute("position", new THREE.Float32BufferAttribute(cadLines, 3));
    const cadWireMat = new THREE.LineBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: 0
    });
    const cadWireMesh = new THREE.LineSegments(cadWireGeo, cadWireMat);
    craneRoot.add(cadWireMesh);

    const pointCloudGeo = new THREE.BufferGeometry();
    pointCloudGeo.setAttribute("position", new THREE.Float32BufferAttribute(cloudCoords, 3));
    pointCloudGeo.setAttribute("color", new THREE.Float32BufferAttribute(cloudColors, 3));

    const pointCloudMat = new THREE.PointsMaterial({
        size: 0.085,
        vertexColors: true,
        transparent: true,
        opacity: 0
    });
    const cranePointCloud = new THREE.Points(pointCloudGeo, pointCloudMat);
    craneRoot.add(cranePointCloud);

    const coreMesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 0),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x5a189a,
            emissiveIntensity: 1.5,
            flatShading: true,
            transparent: true,
            opacity: 1
        })
    );
    coreMesh.position.set(0.5, 0.5, 0);
    coreMesh.scale.setScalar(0.01);
    coreMesh.add(new THREE.PointLight(0x8da4ff, 2, 8));
    craneRoot.add(coreMesh);

    const timer = new THREE.Clock();
    const INTRO_TIME = 2.6;

    const renderScene3D = () => {
        requestAnimationFrame(renderScene3D);
        const elapsed = timer.getElapsedTime();

        if (elapsed <= INTRO_TIME) {
            const ratio = Math.min(elapsed / INTRO_TIME, 1);
            const ease = 1 - Math.pow(1 - ratio, 3);

            const attr = meshGeo.attributes.position;
            for (let i = 0; i < finalVerts.length; i++) {
                attr.array[i] = initVerts[i] + (finalVerts[i] - initVerts[i]) * ease;
            }
            attr.needsUpdate = true;
            meshGeo.computeVertexNormals();

            bodyMaterial.opacity = isLightMode ? 0 : ease * 0.95;

            if (ratio > 0.65) {
                const subRatio = (ratio - 0.65) / 0.35;
                edgeMaterial.opacity = isLightMode ? subRatio * 0.6 : subRatio * 0.7;
                cadWireMat.opacity = isLightMode ? subRatio * 0.28 : 0;
                pointCloudMat.opacity = isLightMode ? subRatio * 0.95 : 0;

                const s = 0.92 + subRatio * 0.08;
                darkWireCrane.scale.setScalar(s);
                cadWireMesh.scale.setScalar(s);
                cranePointCloud.scale.setScalar(s);
            }

            coreMesh.visible = !isLightMode;
            coreMesh.scale.setScalar(ease);
            craneRoot.rotation.y = (1 - ease) * Math.PI * 1.5 + elapsed * 0.2;
        } else {
            bodyMaterial.opacity = isLightMode ? 0 : 0.95;
            edgeMaterial.opacity = isLightMode ? 0.65 : 0.7;
            cadWireMat.opacity = isLightMode ? 0.28 : 0;
            pointCloudMat.opacity = isLightMode ? 0.95 : 0;

            darkWireCrane.scale.setScalar(1);
            cadWireMesh.scale.setScalar(1);
            cranePointCloud.scale.setScalar(1);

            coreMesh.visible = !isLightMode;
            craneRoot.rotation.y = elapsed * 0.2;
            coreMesh.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.15);
        }

        craneRoot.position.y = Math.sin(elapsed * 1.5) * 0.4;
        coreMesh.rotation.x -= 0.02;
        coreMesh.rotation.y += 0.03;

        orbit.update();
        webgl.render(scene3d, cam);
    };

    renderScene3D();

    window.addEventListener("resize", () => {
        cam.aspect = mountNode.clientWidth / mountNode.clientHeight;
        cam.updateProjectionMatrix();
        webgl.setSize(mountNode.clientWidth, mountNode.clientHeight);
    });

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");
            isLightMode = document.body.classList.contains("light-mode");

            if (isLightMode) {
                edgeMaterial.color.setHex(0x334155);
                ambLight.intensity = 1.1;
            } else {
                edgeMaterial.color.setHex(0x8da4ff);
                ambLight.intensity = 0.6;
            }
        });
    }

    const storyEl = document.getElementById("about-section");
    if (storyEl) {
        const io = new IntersectionObserver(
            (items) => {
                for (const item of items) {
                    storyEl.classList.toggle("in-view", item.isIntersecting);
                }
            },
            { threshold: 0.25 }
        );
        io.observe(storyEl);
    }
});