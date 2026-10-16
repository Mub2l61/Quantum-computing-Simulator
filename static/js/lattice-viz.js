// 3D Multi-Qubit Lattice Visualization using Three.js

class QCSLatticeVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.blochSpheres = [];
        this.entanglementLines = [];
        this.particles = null;
        this.autoRotate = true;
        this.qubitData = [
            { label: '|00⟩', pos: new THREE.Vector3(0, 1.8, 0) },
            { label: '|01⟩', pos: new THREE.Vector3(-1.8, 0.9, -1.0) },
            { label: '|10⟩', pos: new THREE.Vector3(1.8, 0.9, 1.0) },
            { label: '|11⟩', pos: new THREE.Vector3(-1.8, -0.9, 1.0) },
            { label: '|0Y⟩', pos: new THREE.Vector3(1.8, -0.9, -1.0) },
            { label: '|1Y⟩', pos: new THREE.Vector3(0, -1.8, 0) }
        ];

        this.initScene();
        this.buildLattice();
        this.animate();
        this.bindControls();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    initScene() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x060913, 0.08);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 7.5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x00f2fe, 0.6);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x00f2fe, 2, 50);
        pointLight1.position.set(5, 5, 5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xa855f7, 2, 50);
        pointLight2.position.set(-5, -5, -5);
        this.scene.add(pointLight2);
    }

    buildLattice() {
        this.latticeGroup = new THREE.Group();
        this.scene.add(this.latticeGroup);

        // Wireframe central lattice grid geometry
        const wireSphereGeo = new THREE.SphereGeometry(0.55, 18, 18);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f2fe,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });

        // Inner core glowing sphere material
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x00f2fe,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.8
        });

        // Build 6 outer Bloch sphere nodes arranged in a star/hexagon lattice
        this.qubitData.forEach((node, index) => {
            const sphereGroup = new THREE.Group();
            sphereGroup.position.copy(node.pos);

            // Outer Wireframe Sphere
            const wireMesh = new THREE.Mesh(wireSphereGeo, sphereMaterial.clone());
            sphereGroup.add(wireMesh);

            // Inner Nucleus
            const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), coreMaterial);
            sphereGroup.add(coreMesh);

            // X/Y/Z Coordinate Ring
            const ringGeo = new THREE.RingGeometry(0.53, 0.55, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.rotation.x = Math.PI / 2;
            sphereGroup.add(ringMesh);

            // Vector Arrow Pointer (|ψ⟩)
            const arrowDir = new THREE.Vector3(0, 1, 0).normalize();
            const arrowLength = 0.52;
            const arrowColor = index % 2 === 0 ? 0x00f2fe : 0xa855f7;
            const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0,0,0), arrowLength, arrowColor, 0.12, 0.08);
            sphereGroup.add(arrowHelper);
            sphereGroup.userData = { arrowHelper, wireMesh };

            this.blochSpheres.push(sphereGroup);
            this.latticeGroup.add(sphereGroup);
        });

        // Interconnecting Quantum Entanglement Lines
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45
        });

        for (let i = 0; i < this.qubitData.length; i++) {
            for (let j = i + 1; j < this.qubitData.length; j++) {
                const points = [this.qubitData[i].pos, this.qubitData[j].pos];
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(lineGeo, lineMaterial);
                this.entanglementLines.push(line);
                this.latticeGroup.add(line);
            }
        }

        // Particle Swarm Quantum Cloud
        const particleCount = 450;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 6;
            positions[i + 1] = (Math.random() - 0.5) * 6;
            positions[i + 2] = (Math.random() - 0.5) * 6;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x38bdf8,
            size: 0.025,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(particleGeo, particleMat);
        this.latticeGroup.add(this.particles);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.autoRotate && this.latticeGroup) {
            this.latticeGroup.rotation.y += 0.0035;
            this.latticeGroup.rotation.x += 0.0012;
        }

        if (this.particles) {
            this.particles.rotation.y -= 0.002;
        }

        // Gentle pulsation for Bloch Spheres
        const time = Date.now() * 0.002;
        this.blochSpheres.forEach((sphere, idx) => {
            const scale = 1 + Math.sin(time + idx) * 0.04;
            sphere.scale.set(scale, scale, scale);
        });

        this.renderer.render(this.scene, this.camera);
    }

    updateQubitState(blochCoords) {
        if (!blochCoords || !Array.isArray(blochCoords)) return;

        blochCoords.forEach((coord, i) => {
            if (i < this.blochSpheres.length) {
                const sphere = this.blochSpheres[i];
                const arrow = sphere.userData.arrowHelper;

                if (arrow && coord.x !== undefined) {
                    const dir = new THREE.Vector3(coord.x, coord.z, coord.y).normalize();
                    if (dir.length() > 0.1) {
                        arrow.setDirection(dir);
                    }
                }
            }
        });
    }

    bindControls() {
        const zoomIn = document.getElementById('vpZoomIn');
        const zoomOut = document.getElementById('vpZoomOut');
        const rotateToggle = document.getElementById('vpRotateToggle');
        const reset = document.getElementById('vpReset');

        if (zoomIn) zoomIn.addEventListener('click', () => this.camera.position.z = Math.max(3, this.camera.position.z - 0.8));
        if (zoomOut) zoomOut.addEventListener('click', () => this.camera.position.z = Math.min(15, this.camera.position.z + 0.8));
        if (rotateToggle) rotateToggle.addEventListener('click', () => {
            this.autoRotate = !this.autoRotate;
            rotateToggle.classList.toggle('active', this.autoRotate);
        });
        if (reset) reset.addEventListener('click', () => {
            this.camera.position.set(0, 0, 7.5);
            this.latticeGroup.rotation.set(0, 0, 0);
        });
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

let latticeVisualizer = null;
document.addEventListener('DOMContentLoaded', () => {
    latticeVisualizer = new QCSLatticeVisualizer('latticeCanvasContainer');
});
