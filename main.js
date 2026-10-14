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
            ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
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

    const createDotStarTexture = () => {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext("2d");
        const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.35, "rgba(255, 255, 255, 0.85)");
        grad.addColorStop(0.7, "rgba(255, 255, 255, 0.2)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
        return new THREE.CanvasTexture(c);
    };

    const createSparkleStarTexture = () => {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext("2d");

        const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 28);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.3, "rgba(255, 255, 255, 0.5)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.moveTo(32, 2);
        ctx.quadraticCurveTo(34, 30, 62, 32);
        ctx.quadraticCurveTo(34, 34, 32, 62);
        ctx.quadraticCurveTo(30, 34, 2, 32);
        ctx.quadraticCurveTo(30, 30, 32, 2);
        ctx.closePath();
        ctx.fill();

        return new THREE.CanvasTexture(c);
    };

    const finalCloudCoords = [];
    const cloudColors = [];
    const finalSparkleCoords = [];
    const sparkleColors = [];

    const starPalette = [
        [0.05, 0.08, 0.18],
        [0.12, 0.23, 0.54],
        [0.23, 0.36, 0.86],
        [0.31, 0.27, 0.90],
        [0.02, 0.52, 0.78]
    ];

    const pickStarColor = (targetArray, isEdge = false) => {
        const rand = Math.random();
        let c;
        if (isEdge) {
            c = rand < 0.45 ? starPalette[0] : (rand < 0.8 ? starPalette[2] : starPalette[1]);
        } else {
            c = starPalette[Math.floor(rand * starPalette.length)];
        }
        targetArray.push(c[0], c[1], c[2]);
    };

    const getV = (idx) => new THREE.Vector3(
        rawCoords[idx * 3],
        rawCoords[idx * 3 + 1],
        rawCoords[idx * 3 + 2]
    );

    const edgePosAttr = edgeGeo.attributes.position.array;
    for (let i = 0; i < edgePosAttr.length; i += 6) {
        const pA = new THREE.Vector3(edgePosAttr[i], edgePosAttr[i + 1], edgePosAttr[i + 2]);
        const pB = new THREE.Vector3(edgePosAttr[i + 3], edgePosAttr[i + 4], edgePosAttr[i + 5]);
        const segLen = pA.distanceTo(pB);

        const steps = Math.floor(segLen * 22);
        for (let s = 0; s <= steps; s++) {
            const t = (s + (Math.random() - 0.5) * 0.4) / steps;
            const pt = new THREE.Vector3().lerpVectors(pA, pB, Math.max(0, Math.min(1, t)));

            for (let layer = 0; layer < 2; layer++) {
                const jitter = 0.045;
                const px = pt.x + (Math.random() - 0.5) * jitter;
                const py = pt.y + (Math.random() - 0.5) * jitter;
                const pz = pt.z + (Math.random() - 0.5) * jitter;
                finalCloudCoords.push(px, py, pz);
                pickStarColor(cloudColors, true);
            }

            if (Math.random() < 0.08) {
                finalSparkleCoords.push(
                    pt.x + (Math.random() - 0.5) * 0.08,
                    pt.y + (Math.random() - 0.5) * 0.08,
                    pt.z + (Math.random() - 0.5) * 0.08
                );
                pickStarColor(sparkleColors, true);
            }
        }
    }

    const SHELL_OFFSETS = [-0.09, 0, 0.09];
    for (let i = 0; i < triIndices.length; i += 3) {
        const vA = getV(triIndices[i]);
        const vB = getV(triIndices[i + 1]);
        const vC = getV(triIndices[i + 2]);

        const crossVec = new THREE.Vector3().subVectors(vB, vA).cross(new THREE.Vector3().subVectors(vC, vA));
        const area = crossVec.length() * 0.5;
        const normal = crossVec.clone().normalize();

        const surfaceDots = Math.floor(area * 52) + 45;
        for (let d = 0; d < surfaceDots; d++) {
            let r1 = Math.random();
            let r2 = Math.random();
            if (r1 + r2 > 1) {
                r1 = 1 - r1;
                r2 = 1 - r2;
            }
            const r3 = 1 - r1 - r2;

            const shell = SHELL_OFFSETS[d % SHELL_OFFSETS.length];
            const spread = shell + (Math.random() - 0.5) * 0.04;

            const px = vA.x * r1 + vB.x * r2 + vC.x * r3 + normal.x * spread;
            const py = vA.y * r1 + vB.y * r2 + vC.y * r3 + normal.y * spread;
            const pz = vA.z * r1 + vB.z * r2 + vC.z * r3 + normal.z * spread;

            finalCloudCoords.push(px, py, pz);
            pickStarColor(cloudColors, false);

            if (Math.random() < 0.035) {
                finalSparkleCoords.push(px, py, pz);
                pickStarColor(sparkleColors, false);
            }
        }

        const auraDots = Math.floor(area * 12) + 10;
        for (let a = 0; a < auraDots; a++) {
            let r1 = Math.random();
            let r2 = Math.random();
            if (r1 + r2 > 1) {
                r1 = 1 - r1;
                r2 = 1 - r2;
            }
            const r3 = 1 - r1 - r2;
            const haloDist = (Math.random() - 0.5) * 0.55;

            const px = vA.x * r1 + vB.x * r2 + vC.x * r3 + normal.x * haloDist + (Math.random() - 0.5) * 0.2;
            const py = vA.y * r1 + vB.y * r2 + vC.y * r3 + normal.y * haloDist + (Math.random() - 0.5) * 0.2;
            const pz = vA.z * r1 + vB.z * r2 + vC.z * r3 + normal.z * haloDist + (Math.random() - 0.5) * 0.2;

            finalCloudCoords.push(px, py, pz);
            pickStarColor(cloudColors, false);
        }
    }

    const createScatteredBuffers = (finalArr) => {
        const initArr = new Float32Array(finalArr.length);
        const liveArr = new Float32Array(finalArr.length);
        for (let i = 0; i < finalArr.length; i += 3) {
            const fx = finalArr[i];
            const fy = finalArr[i + 1];
            const fz = finalArr[i + 2];

            const radius = 10 + Math.random() * 18;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            initArr[i] = fx * 1.8 + radius * Math.sin(phi) * Math.cos(theta);
            initArr[i + 1] = fy * 1.8 + radius * Math.sin(phi) * Math.sin(theta);
            initArr[i + 2] = fz * 1.8 + radius * Math.cos(phi);

            liveArr[i] = initArr[i];
            liveArr[i + 1] = initArr[i + 1];
            liveArr[i + 2] = initArr[i + 2];
        }
        return { initArr, liveArr };
    };

    const mainStarBuffers = createScatteredBuffers(finalCloudCoords);
    const sparkleStarBuffers = createScatteredBuffers(finalSparkleCoords);

    const pointCloudGeo = new THREE.BufferGeometry();
    pointCloudGeo.setAttribute("position", new THREE.BufferAttribute(mainStarBuffers.liveArr, 3));
    pointCloudGeo.setAttribute("color", new THREE.Float32BufferAttribute(cloudColors, 3));

    const pointCloudMat = new THREE.PointsMaterial({
        size: 0.11,
        map: createDotStarTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        alphaTest: 0.01
    });
    const cranePointCloud = new THREE.Points(pointCloudGeo, pointCloudMat);
    craneRoot.add(cranePointCloud);

    const sparkleGeo = new THREE.BufferGeometry();
    sparkleGeo.setAttribute("position", new THREE.BufferAttribute(sparkleStarBuffers.liveArr, 3));
    sparkleGeo.setAttribute("color", new THREE.Float32BufferAttribute(sparkleColors, 3));

    const sparkleMat = new THREE.PointsMaterial({
        size: 0.28,
        map: createSparkleStarTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        alphaTest: 0.01
    });
    const sparklePointCloud = new THREE.Points(sparkleGeo, sparkleMat);
    craneRoot.add(sparklePointCloud);

    const timer = new THREE.Clock();
    const INTRO_TIME = 2.6;
    let lightModeStartTime = 0;

    const updateStarFormation = (progress, elapsed) => {
        const ease = 1 - Math.pow(1 - progress, 3);
        const swirlAngle = (1 - ease) * Math.PI * 1.2;
        const cosA = Math.cos(swirlAngle);
        const sinA = Math.sin(swirlAngle);

        const mainAttr = pointCloudGeo.attributes.position;
        const mArr = mainAttr.array;
        const mInit = mainStarBuffers.initArr;
        for (let i = 0; i < finalCloudCoords.length; i += 3) {
            const ix = mInit[i];
            const iy = mInit[i + 1];
            const iz = mInit[i + 2];

            const rx = ix * cosA - iz * sinA;
            const rz = ix * sinA + iz * cosA;

            mArr[i] = rx + (finalCloudCoords[i] - rx) * ease;
            mArr[i + 1] = iy + (finalCloudCoords[i + 1] - iy) * ease;
            mArr[i + 2] = rz + (finalCloudCoords[i + 2] - rz) * ease;
        }
        mainAttr.needsUpdate = true;

        const spkAttr = sparkleGeo.attributes.position;
        const sArr = spkAttr.array;
        const sInit = sparkleStarBuffers.initArr;
        for (let i = 0; i < finalSparkleCoords.length; i += 3) {
            const ix = sInit[i];
            const iy = sInit[i + 1];
            const iz = sInit[i + 2];

            const rx = ix * cosA - iz * sinA;
            const rz = ix * sinA + iz * cosA;

            const floatOffset = ease * Math.sin(elapsed * 2.5 + i) * 0.025;

            sArr[i] = rx + (finalSparkleCoords[i] - rx) * ease;
            sArr[i + 1] = iy + (finalSparkleCoords[i + 1] - iy) * ease + floatOffset;
            sArr[i + 2] = rz + (finalSparkleCoords[i + 2] - rz) * ease;
        }
        spkAttr.needsUpdate = true;
    };

    const renderScene3D = () => {
        requestAnimationFrame(renderScene3D);
        const elapsed = timer.getElapsedTime();

        if (!isLightMode) {
            solidCrane.visible = true;
            darkWireCrane.visible = true;
            coreMesh.visible = true;
            cranePointCloud.visible = false;
            sparklePointCloud.visible = false;

            if (elapsed <= INTRO_TIME) {
                const ratio = Math.min(elapsed / INTRO_TIME, 1);
                const ease = 1 - Math.pow(1 - ratio, 3);

                const attr = meshGeo.attributes.position;
                for (let i = 0; i < finalVerts.length; i++) {
                    attr.array[i] = initVerts[i] + (finalVerts[i] - initVerts[i]) * ease;
                }
                attr.needsUpdate = true;
                meshGeo.computeVertexNormals();

                bodyMaterial.opacity = ease * 0.95;

                if (ratio > 0.65) {
                    const subRatio = (ratio - 0.65) / 0.35;
                    edgeMaterial.opacity = subRatio * 0.7;
                    darkWireCrane.scale.setScalar(0.92 + subRatio * 0.08);
                }

                coreMesh.scale.setScalar(ease);
                craneRoot.rotation.y = (1 - ease) * Math.PI * 1.5 + elapsed * 0.2;
            } else {
                bodyMaterial.opacity = 0.95;
                edgeMaterial.opacity = 0.7;
                darkWireCrane.scale.setScalar(1);
                craneRoot.rotation.y = elapsed * 0.2;
                coreMesh.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.15);
            }
        } else {
            solidCrane.visible = false;
            darkWireCrane.visible = false;
            coreMesh.visible = false;
            bodyMaterial.opacity = 0;
            edgeMaterial.opacity = 0;

            cranePointCloud.visible = true;
            sparklePointCloud.visible = true;

            const starElapsed = elapsed - lightModeStartTime;
            const starRatio = Math.min(Math.max(starElapsed / INTRO_TIME, 0), 1);
            const starEase = 1 - Math.pow(1 - starRatio, 3);

            updateStarFormation(starRatio, elapsed);

            pointCloudMat.opacity = Math.min(1, starEase * 1.15);
            sparkleMat.opacity = starEase * (0.85 + Math.sin(elapsed * 3.5) * 0.15);
            sparkleMat.size = 0.26 + Math.sin(elapsed * 4) * 0.04;

            craneRoot.rotation.y = (1 - starEase) * Math.PI * 0.8 + elapsed * 0.2;
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
                ambLight.intensity = 1.1;
                lightModeStartTime = timer.getElapsedTime();
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