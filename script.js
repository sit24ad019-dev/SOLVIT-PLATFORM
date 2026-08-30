// ─── 1. THREE.JS 3D SCENE ───
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Wait for DOM to render the canvas
const canvasContainer = document.getElementById('three-canvas');
if (canvasContainer) {
    canvasContainer.appendChild(renderer.domElement);
}

// ─── 2. LIGHTS ───
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xff9933, 0.4);
backLight.position.set(-5, 0, -5);
scene.add(backLight);

const rimLight = new THREE.DirectionalLight(0x138808, 0.3);
rimLight.position.set(0, -5, 5);
scene.add(rimLight);

// ─── 3. GOVERNMENT THEME: ASHOKA CHAKRA ───
const mainGroup = new THREE.Group();
scene.add(mainGroup);

// 3a. Ashoka Chakra Ring
const chakraRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.08, 16, 64),
    new THREE.MeshPhysicalMaterial({
        color: '#FF9933',
        emissive: '#FF6600',
        emissiveIntensity: 0.15,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
    })
);
chakraRing.rotation.x = Math.PI / 2;
mainGroup.add(chakraRing);

// 3b. 24 Spokes
for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 2.0, 4),
        new THREE.MeshPhysicalMaterial({
            color: '#FF9933',
            metalness: 0.6,
            roughness: 0.3,
        })
    );
    spoke.position.set(Math.cos(angle) * 1.1, 0, Math.sin(angle) * 1.1);
    spoke.rotation.y = -angle;
    spoke.rotation.x = Math.PI / 2;
    mainGroup.add(spoke);
}

// 3c. Inner Ring (Saffron)
const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.6, 0.05, 8, 32),
    new THREE.MeshPhysicalMaterial({
        color: '#FF9933',
        emissive: '#FF6600',
        emissiveIntensity: 0.1,
        metalness: 0.5,
        roughness: 0.3,
    })
);
innerRing.rotation.x = Math.PI / 2;
mainGroup.add(innerRing);

// 3d. Central Pillar (Democracy/Constitution)
const pillarGroup = new THREE.Group();
mainGroup.add(pillarGroup);

const pillarBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8),
    new THREE.MeshPhysicalMaterial({
        color: '#000080',
        metalness: 0.9,
        roughness: 0.2,
    })
);
pillarBase.position.y = -1.5;
pillarGroup.add(pillarBase);

const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 2.0, 8),
    new THREE.MeshPhysicalMaterial({
        color: '#000080',
        metalness: 0.8,
        roughness: 0.3,
    })
);
pillar.position.y = -0.2;
pillarGroup.add(pillar);

// 3e. Golden Top (Lion Capital / Emblem)
const topSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 16),
    new THREE.MeshPhysicalMaterial({
        color: '#FFD700',
        emissive: '#FFA500',
        emissiveIntensity: 0.2,
        metalness: 0.9,
        roughness: 0.1,
    })
);
topSphere.position.y = 1.4;
pillarGroup.add(topSphere);

const topRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.06, 8, 24),
    new THREE.MeshPhysicalMaterial({
        color: '#FFD700',
        emissive: '#FFA500',
        emissiveIntensity: 0.1,
        metalness: 0.8,
        roughness: 0.2,
    })
);
topRing.position.y = 1.5;
topRing.rotation.x = Math.PI / 2;
pillarGroup.add(topRing);

// 3f. Floating Stars (States)
const starsGroup = new THREE.Group();
mainGroup.add(starsGroup);

const starColors = ['#FF9933', '#FFFFFF', '#138808', '#000080', '#FFD700', '#FF3366', '#00CED1', '#FF6347'];
const starMeshes = [];
const starPositions = [];

for (let i = 0; i < 28; i++) {
    const size = 0.04 + Math.random() * 0.08;
    const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(size, 0),
        new THREE.MeshPhysicalMaterial({
            color: starColors[Math.floor(Math.random() * starColors.length)],
            emissive: '#FFFFFF',
            emissiveIntensity: 0.1 + Math.random() * 0.2,
            metalness: 0.3,
            roughness: 0.5,
        })
    );
    const radius = 3.5 + Math.random() * 2.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    star.position.set(
        Math.cos(theta) * Math.sin(phi) * radius,
        (Math.random() - 0.5) * 4,
        Math.sin(theta) * Math.sin(phi) * radius
    );
    starsGroup.add(star);
    starMeshes.push(star);
    starPositions.push({
        theta: theta,
        phi: phi,
        radius: radius,
        speed: 0.001 + Math.random() * 0.002,
        ySpeed: 0.001 + Math.random() * 0.002,
    });
}

// ─── 4. ORBITING STATE SPHERES (6 regions) ───
const orbiters = [];
const regionColors = ['#FF9933', '#FFFFFF', '#138808', '#000080', '#FFD700', '#FF3366'];

for (let i = 0; i < 6; i++) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 12, 12),
        new THREE.MeshPhysicalMaterial({
            color: regionColors[i],
            emissive: regionColors[i],
            emissiveIntensity: 0.1,
            metalness: 0.4,
            roughness: 0.4,
            transparent: true,
            opacity: 0.9,
        })
    );
    const angle = (i / 6) * Math.PI * 2;
    const radius = 3.8;
    sphere.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.8, Math.sin(angle) * radius);
    scene.add(sphere);
    orbiters.push({
        mesh: sphere,
        angle: angle,
        radius: radius,
        yOffset: 0.8,
        speed: 0.3 + i * 0.05,
    });
}

// ─── 5. MOUSE TRACKING ───
let mouseX = 0,
    mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// ─── 6. RESIZE HANDLER ───
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── 7. ANIMATION LOOP ───
function animate() {
    requestAnimationFrame(animate);

    // Rotate Ashoka Chakra (main group)
    mainGroup.rotation.y += 0.005;

    // Slight floating for the pillar
    pillarGroup.position.y = Math.sin(Date.now() * 0.001) * 0.08;

    // Rotate orbiting states
    orbiters.forEach((orb) => {
        orb.angle += 0.003 * orb.speed;
        orb.mesh.position.x = Math.cos(orb.angle) * orb.radius;
        orb.mesh.position.z = Math.sin(orb.angle) * orb.radius;
        orb.mesh.position.y = Math.sin(orb.angle * 2) * orb.yOffset;
        orb.mesh.rotation.x += 0.02;
        orb.mesh.rotation.y += 0.03;
    });

    // Animate stars (subtle movement)
    starMeshes.forEach((star, i) => {
        const pos = starPositions[i];
        pos.theta += pos.speed;
        pos.phi += pos.ySpeed;
        star.position.x = Math.cos(pos.theta) * Math.sin(pos.phi) * pos.radius;
        star.position.z = Math.sin(pos.theta) * Math.sin(pos.phi) * pos.radius;
        star.position.y += Math.sin(Date.now() * 0.001 + i) * 0.0005;
        star.rotation.x += 0.01;
        star.rotation.y += 0.015;
    });

    // Camera follows mouse gently
    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.015;
    camera.position.y += (mouseY * 1.0 + 2 - camera.position.y) * 0.015;
    camera.lookAt(0, 0.5, 0);

    renderer.render(scene, camera);
}
animate();

// ─── 8. ANIMATED COUNTERS ───
const counters = document.querySelectorAll('.counter');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.floor(eased * target);
                counter.textContent = currentValue;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            }
            requestAnimationFrame(updateCounter);
            observer.unobserve(counter);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => observer.observe(counter));

// ─── 9. SCROLL TO TOP BUTTON ───
const scrollBtn = document.createElement('button');
scrollBtn.className = 'scroll-top';
scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(scrollBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        scrollBtn.classList.add('visible');
    } else {
        scrollBtn.classList.remove('visible');
    }
});

scrollBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ─── 10. DYNAMIC NAVIGATION (Context-Aware) ───
function renderNav() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    const session = JSON.parse(localStorage.getItem('solvit_session'));
    const path = window.location.pathname;
    const isCitizen = path.includes('/citizen/') || path.includes('citizen');
    const isGovernment = path.includes('/government/') || path.includes('government');

    if (session && session.name) {
        if (session.role === 'government') {
            // Government navigation
            nav.innerHTML = `
                <a href="../government/gov-index.html">Home</a>
                <a href="../government/gov-services.html">Services</a>
                <a href="../government/government-dashboard.html">Analytics</a>
                <span style="color:rgba(255,255,255,0.7);font-weight:500;">🏛️ ${session.name}</span>
                <a href="#" id="logoutBtn" class="btn-outline" style="border-color:#ef4444;color:#ef4444;">Logout</a>
            `;
        } else {
            // Citizen navigation
            nav.innerHTML = `
                <a href="../citizen/index.html">Home</a>
                <a href="../citizen/services.html">Services</a>
                <a href="../citizen/dashboard.html">Dashboard</a>
                <span style="color:rgba(255,255,255,0.7);font-weight:500;">👋 ${session.name}</span>
                <a href="#" id="logoutBtn" class="btn-outline" style="border-color:#ef4444;color:#ef4444;">Logout</a>
            `;
        }
        // Logout handler
        document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('solvit_session');
            window.location.href = '../login.html';
        });
    } else {
        // Logged out – show login/register
        nav.innerHTML = `
            <a href="../citizen/index.html">Home</a>
            <a href="../citizen/services.html">Services</a>
            <a href="../citizen/dashboard.html">Dashboard</a>
            <a href="../login.html" class="btn-outline">Login</a>
            <a href="../register.html" class="btn-primary">Register</a>
        `;
    }
}

// Run renderNav when DOM is ready
document.addEventListener('DOMContentLoaded', renderNav);

// Re‑render nav when session changes (e.g., after login in another tab)
window.addEventListener('storage', (e) => {
    if (e.key === 'solvit_session') renderNav();
});

// ─── 11. HELPERS FOR FORMS ───
// GPS Location helper (available to all forms)
function getCurrentLocation(buttonId, locationInputId, latId, lngId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            alert('Geolocation not supported. Please enter location manually.');
            return;
        }
        this.textContent = '📍 Fetching...';
        this.disabled = true;

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                document.getElementById(latId).value = lat;
                document.getElementById(lngId).value = lng;
                document.getElementById(locationInputId).value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
                btn.textContent = '✅ Captured';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.textContent = '📍 Get Location';
                    btn.style.background = '#3b82f6';
                    btn.disabled = false;
                }, 3000);
            },
            function() {
                alert('Unable to fetch location. Please enter manually.');
                btn.textContent = '📍 Get Location';
                btn.disabled = false;
            }
        );
    });
}

// ─── 12. FILE NAME DISPLAY HELPER ───
function showFileName(inputId, displayId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', function() {
        const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
        document.getElementById(displayId).textContent = fileName;
    });
}