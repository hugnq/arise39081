document.addEventListener("DOMContentLoaded", function () {
    /* ==========================================================================
       1. HIỆU ỨNG BACKGROUND BẦU TRỜI SAO ĐỘNG (DI CHUYỂN QUA LẠI)
       ========================================================================== */
    const starCanvas = document.getElementById("starfield");
    const ctx = starCanvas.getContext("2d");

    let stars = [];
    const STAR_COUNT = 160;

    function resizeStarCanvas() {
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * starCanvas.width,
                y: Math.random() * starCanvas.height,
                radius: Math.random() * 1.8 + 0.4,
                // Vận tốc trôi qua lại theo cả chiều ngang và dọc
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                // Dao động lượn sóng nhẹ để đốm sáng bay tự nhiên hơn
                angle: Math.random() * Math.PI * 2,
                angleSpeed: Math.random() * 0.02 + 0.005,
                swayRange: Math.random() * 0.35,
                alpha: Math.random() * 0.7 + 0.3,
                twinkleSpeed: (Math.random() * 0.015 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
                // Phối màu trắng và xanh lơ công nghệ (#8da4ff)
                color: Math.random() > 0.35 ? "#ffffff" : "#8da4ff"
            });
        }
    }

    function animateStars() {
        ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];

            // Cập nhật góc dao động qua lại
            s.angle += s.angleSpeed;
            s.x += s.vx + Math.cos(s.angle) * s.swayRange;
            s.y += s.vy + Math.sin(s.angle) * s.swayRange;

            // Cho các đốm sáng lặp lại khi đi qua rìa màn hình
            if (s.x < 0) s.x = starCanvas.width;
            if (s.x > starCanvas.width) s.x = 0;
            if (s.y < 0) s.y = starCanvas.height;
            if (s.y > starCanvas.height) s.y = 0;

            // Hiệu ứng nhấp nháy
            s.alpha += s.twinkleSpeed;
            if (s.alpha > 1) {
                s.alpha = 1;
                s.twinkleSpeed *= -1;
            } else if (s.alpha < 0.2) {
                s.alpha = 0.2;
                s.twinkleSpeed *= -1;
            }

            // Vẽ đốm sáng kèm hào quang nhẹ
            ctx.save();
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.shadowBlur = s.radius * 5;
            ctx.shadowColor = s.color;
            ctx.fill();
            ctx.restore();
        }

        requestAnimationFrame(animateStars);
    }

    resizeStarCanvas();
    initStars();
    animateStars();

    window.addEventListener("resize", () => {
        resizeStarCanvas();
    });

    /* ==========================================================================
       2. MÔ HÌNH HẠC ORIGAMI 3D & ANIMATION LẮP GHÉP KHI MỞ WEB
       ========================================================================== */
    const container = document.getElementById("robot-canvas-container");
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(10, 7, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    // Ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x8da4ff, 2.5);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    backLight.position.set(-10, -5, -10);
    scene.add(backLight);

    const birdGroup = new THREE.Group();
    scene.add(birdGroup);

    // Tọa độ các đỉnh gốc của Hạc Origami
    const baseVertices = new Float32Array([
         5.0,  3.0,  0.0,
         3.5,  4.5,  0.0,
         3.0,  2.5,  0.0,
         1.0, -1.0,  0.0,
        -2.0, -1.0,  0.0,
        -5.0,  3.0,  0.0,
         0.0,  1.5,  0.0,
         1.0,  1.0,  1.0,
        -1.5,  1.0,  1.0,
        -2.0,  5.0,  5.0,
         0.0,  0.5,  2.0,
         1.0,  1.0, -1.0,
        -1.5,  1.0, -1.0,
        -2.0,  5.0, -5.0,
         0.0,  0.5, -2.0
    ]);

    const indices = [
        0, 1, 2,  2, 1, 7,  2, 11, 1,  2, 7, 3,  2, 3, 11,
        7, 1, 6,  11, 6, 1,
        7, 3, 10,  11, 14, 3,  10, 3, 4,  14, 4, 3,  8, 10, 4,  12, 4, 14,
        7, 6, 10,  11, 14, 6,  10, 6, 8,  14, 12, 6,
        8, 6, 5,  12, 5, 6,  8, 5, 4,  12, 4, 5,
        7, 10, 9,  10, 8, 9,  8, 6, 9,  7, 9, 6,
        11, 13, 14,  14, 13, 12,  12, 13, 6,  11, 6, 13
    ];

    // Tạo Geometry chuẩn để lấy khung dây (Wireframe)
    const indexedGeo = new THREE.BufferGeometry();
    indexedGeo.setAttribute("position", new THREE.BufferAttribute(baseVertices, 3));
    indexedGeo.setIndex(indices);
    indexedGeo.computeVertexNormals();

    // Tách các mặt tam giác độc lập (Non-Indexed) để tạo hiệu ứng từng mảnh bay vào ghép thành con hạc
    const craneGeo = indexedGeo.toNonIndexed();
    const targetPositions = craneGeo.attributes.position.array.slice();
    const startPositions = new Float32Array(targetPositions.length);
    const currentPositions = new Float32Array(targetPositions.length);

    // Tính vị trí phân tán ban đầu cho từng mảnh tam giác
    for (let i = 0; i < targetPositions.length; i += 9) {
        // Tâm của mảnh tam giác
        const cx = (targetPositions[i] + targetPositions[i + 3] + targetPositions[i + 6]) / 3;
        const cy = (targetPositions[i + 1] + targetPositions[i + 4] + targetPositions[i + 7]) / 3;
        const cz = (targetPositions[i + 2] + targetPositions[i + 5] + targetPositions[i + 8]) / 3;

        // Đẩy mảnh tam giác ra xa theo hướng ngẫu nhiên trong không gian
        const spreadDist = 12 + Math.random() * 14;
        const rx = (Math.random() - 0.5) * spreadDist + cx * 2.2;
        const ry = (Math.random() - 0.5) * spreadDist + cy * 2.2;
        const rz = (Math.random() - 0.5) * spreadDist + cz * 2.2;

        for (let j = 0; j < 9; j += 3) {
            startPositions[i + j]     = targetPositions[i + j]     + rx;
            startPositions[i + j + 1] = targetPositions[i + j + 1] + ry;
            startPositions[i + j + 2] = targetPositions[i + j + 2] + rz;

            currentPositions[i + j]     = startPositions[i + j];
            currentPositions[i + j + 1] = startPositions[i + j + 1];
            currentPositions[i + j + 2] = startPositions[i + j + 2];
        }
    }

    craneGeo.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));
    craneGeo.computeVertexNormals();

    const solidMat = new THREE.MeshPhysicalMaterial({
        color: 0x111827,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide,
        flatShading: true,
        transparent: true,
        opacity: 0
    });
    const craneSolid = new THREE.Mesh(craneGeo, solidMat);
    birdGroup.add(craneSolid);

    // Khung dây phát sáng xuất hiện khi các mảnh ghép khớp lại
    const edges = new THREE.EdgesGeometry(indexedGeo);
    const wireMat = new THREE.LineBasicMaterial({
        color: 0x8da4ff,
        transparent: true,
        opacity: 0
    });
    const craneWire = new THREE.LineSegments(edges, wireMat);
    birdGroup.add(craneWire);

    // Lõi năng lượng (Heart Core)
    const coreGeo = new THREE.IcosahedronGeometry(0.8, 0);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x5a189a,
        emissiveIntensity: 1.5,
        flatShading: true
    });
    const heartCore = new THREE.Mesh(coreGeo, coreMat);
    heartCore.position.set(0.5, 0.5, 0);
    heartCore.scale.setScalar(0.01);

    const coreLight = new THREE.PointLight(0x8da4ff, 2, 8);
    heartCore.add(coreLight);
    birdGroup.add(heartCore);

    birdGroup.rotation.z = Math.PI / 12;

    const clock = new THREE.Clock();
    const ASSEMBLY_DURATION = 2.6; // Thời gian hiệu ứng tạo nên con hạc (giây)

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function animate3D() {
        requestAnimationFrame(animate3D);
        const time = clock.getElapsedTime();

        // Tiến trình lắp ghép con hạc khi mới mở trang
        if (time <= ASSEMBLY_DURATION) {
            const progress = Math.min(time / ASSEMBLY_DURATION, 1);
            const eased = easeOutCubic(progress);

            const posAttr = craneGeo.attributes.position;
            for (let i = 0; i < targetPositions.length; i++) {
                posAttr.array[i] = startPositions[i] + (targetPositions[i] - startPositions[i]) * eased;
            }
            posAttr.needsUpdate = true;
            craneGeo.computeVertexNormals();

            // Tăng dần độ rõ của thân hạc và khung lưới
            solidMat.opacity = eased * 0.95;
            if (progress > 0.65) {
                const wireProgress = (progress - 0.65) / 0.35;
                wireMat.opacity = wireProgress * 0.7;
                craneWire.scale.setScalar(0.92 + wireProgress * 0.08);
            }

            // Lõi năng lượng lớn dần từ tâm
            heartCore.scale.setScalar(eased);
            // Hiệu ứng xoay hội tụ khi khởi tạo
            birdGroup.rotation.y = (1 - eased) * Math.PI * 1.5 + time * 0.2;
        } else {
            // Đảm bảo giữ nguyên hình dáng chuẩn sau khi ghép xong
            solidMat.opacity = 0.95;
            wireMat.opacity = 0.7;
            craneWire.scale.setScalar(1);

            birdGroup.rotation.y = time * 0.2;
            heartCore.scale.setScalar(1 + Math.sin(time * 4) * 0.15);
        }

        // Chuyển động bay lơ lửng nhịp nhàng
        birdGroup.position.y = Math.sin(time * 1.5) * 0.4;
        heartCore.rotation.x -= 0.02;
        heartCore.rotation.y += 0.03;

        controls.update();
        renderer.render(scene, camera);
    }

    animate3D();

    window.addEventListener("resize", () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    /* ==========================================================================
       3. HIỆU ỨNG CUỘN TRANG 2: TIÊU ĐỀ "ABOUT US" BAY TỪ NGOÀI VÀO GIỮA TRANG
       ========================================================================== */
    const aboutSection = document.getElementById("about-section");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    aboutSection.classList.add("in-view");
                } else {
                    // Reset lại để mỗi lần cuộn xuống đều thấy hiệu ứng bay vào
                    aboutSection.classList.remove("in-view");
                }
            });
        },
        {
            threshold: 0.25 // Kích hoạt khi 25% Trang 2 xuất hiện trên màn hình
        }
    );

    if (aboutSection) {
        observer.observe(aboutSection);
    }
});