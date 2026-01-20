// ============ ÉTAT DU JEU ============
let scene, camera, renderer;
let ship, sun, asteroids = [], words = [];
let currentSystem = null;
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
let timeLeft = 75;
let wordsCollected = 0;
let collisions = 0;
let health = 100;
let startTime = 0;
let gameTimer = null;
let consecutiveCollections = 0;
let slowMotionActive = false;

// Contrôles
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };
let shipVelocity = new THREE.Vector3();
const keysPressed = {};

// Contrôle caméra souris
let mouseDown = false;
let cameraRotation = { horizontal: 0, vertical: 0.3 };
let lastMousePos = { x: 0, y: 0 };

// Progression
let progressData = {
    teknolojia: { stars: 0, bestTime: null, completed: false },
    haikanto: { stars: 0, bestTime: null, completed: false },
    fanabeazana: { stars: 0, bestTime: null, completed: false },
    fandraharahana: { stars: 0, bestTime: null, completed: false },
    haitarika: { stars: 0, bestTime: null, completed: false }
};

// ============ GESTION PROGRESSION ============
function loadProgress() {
    const saved = localStorage.getItem('tenyrun_progress');
    if (saved) {
        progressData = JSON.parse(saved);
        updateStarsDisplay();
    }
}

function saveProgress() {
    localStorage.setItem('tenyrun_progress', JSON.stringify(progressData));
}

function updateStarsDisplay() {
    document.querySelectorAll('.system-btn').forEach(btn => {
        const system = btn.dataset.system;
        const stars = progressData[system].stars;
        const starsSpan = btn.querySelector('.stars');
        starsSpan.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        starsSpan.dataset.stars = stars;
    });
    
    // Débloquer mode infini si au moins 1★ sur chaque système
    const allUnlocked = Object.values(progressData).every(s => s.stars > 0);
    if (allUnlocked) {
        document.getElementById('infinite-btn').style.display = 'block';
    }
}

// ============ MENU NAVIGATION ============
function initMenus() {
    const playBtn = document.getElementById('play-btn');
    const glossaryBtn = document.getElementById('glossary-btn');
    const tutorialBtn = document.getElementById('tutorial-btn');
    const backBtn = document.getElementById('back-to-main');
    
    const mainMenu = document.getElementById('main-menu');
    const systemsMenu = document.getElementById('systems-menu');
    const tutorialModal = document.getElementById('tutorial-modal');
    const closeTutorial = document.getElementById('close-tutorial');
    
    // Milalao -> Systems menu
    playBtn.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        systemsMenu.classList.remove('hidden');
    });
    
    // Hiverina -> Main menu
    backBtn.addEventListener('click', () => {
        systemsMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });
    
    // Mianatra Milalao -> Tutorial
    tutorialBtn.addEventListener('click', () => {
        tutorialModal.classList.remove('hidden');
    });
    
    closeTutorial.addEventListener('click', () => {
        tutorialModal.classList.add('hidden');
    });
    
    // Rakibolana
    glossaryBtn.addEventListener('click', () => {
        renderGlossary('all');
        document.getElementById('glossary-modal').classList.remove('hidden');
    });
}

// ============ GLOSSAIRE ============
function initGlossary() {
    const glossaryModal = document.getElementById('glossary-modal');
    const closeBtn = document.getElementById('close-glossary');
    
    closeBtn.addEventListener('click', () => {
        glossaryModal.classList.add('hidden');
    });
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderGlossary(btn.dataset.tab);
        });
    });
}

function renderGlossary(filter) {
    const content = document.getElementById('glossary-content');
    content.innerHTML = '';
    
    const systems = filter === 'all' 
        ? Object.keys(GAME_DATA.systems)
        : [filter];
    
    systems.forEach(systemKey => {
        const system = GAME_DATA.systems[systemKey];
        const isCompleted = progressData[systemKey].completed;
        
        const section = document.createElement('div');
        section.className = 'glossary-section';
        
        const title = document.createElement('h3');
        title.textContent = `${system.name} ${isCompleted ? '✓' : '🔒'}`;
        section.appendChild(title);
        
        system.words.forEach(word => {
            const item = document.createElement('div');
            item.className = isCompleted ? 'word-item' : 'word-item locked';
            
            item.innerHTML = `
                <div class="word-col">
                    <span class="word-label">Malagasy</span>
                    <span class="word-text">${isCompleted ? word.mg : '???'}</span>
                </div>
                <div class="word-col">
                    <span class="word-label">Français</span>
                    <span class="word-text">${isCompleted ? word.fr : '???'}</span>
                </div>
                <div class="word-col">
                    <span class="word-label">English</span>
                    <span class="word-text">${isCompleted ? word.en : '???'}</span>
                </div>
            `;
            
            section.appendChild(item);
        });
        
        content.appendChild(section);
    });
}

// ============ INITIALISATION 3D ============
function init3D() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a1f, 0.001);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 15, 35);
    camera.lookAt(25, 10, 25);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a1f);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Lumières
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);
    
    // Étoiles de fond
    createStarfield();
    
    // Soleil dangereux
    const sunGeometry = new THREE.SphereGeometry(GAME_DATA.settings.boundaries.sunRadius, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(
        GAME_DATA.settings.boundaries.sunPosition.x,
        GAME_DATA.settings.boundaries.sunPosition.y,
        GAME_DATA.settings.boundaries.sunPosition.z
    );
    scene.add(sun);
    
    // Glow autour du soleil
    const glowGeometry = new THREE.SphereGeometry(GAME_DATA.settings.boundaries.sunRadius + 1, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);
    
    // Zone de danger du soleil (invisible)
    const dangerGeometry = new THREE.SphereGeometry(GAME_DATA.settings.boundaries.sunDangerRadius, 16, 16);
    const dangerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.1,
        wireframe: true
    });
    const dangerZone = new THREE.Mesh(dangerGeometry, dangerMaterial);
    sun.add(dangerZone);
    
    // Vaisseau
    createShip();
    
    window.addEventListener('resize', onWindowResize);
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    
    for (let i = 0; i < 3000; i++) {
        const x = (Math.random() - 0.5) * 300;
        const y = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createShip() {
    const shipGroup = new THREE.Group();
    
    // Corps principal (pyramide)
    const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI;
    shipGroup.add(body);
    
    // Ailes
    const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8b5cf6,
        emissive: 0x8b5cf6,
        emissiveIntensity: 0.3
    });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = -0.3;
    shipGroup.add(wing);
    
    shipGroup.position.set(0, 0, 0);
    ship = shipGroup;
    scene.add(ship);
}

function createAsteroids(count = GAME_DATA.settings.physics.asteroidCount) {
    // Nettoyer anciens astéroïdes
    asteroids.forEach(a => scene.remove(a.mesh));
    asteroids = [];
    
    const bounds = GAME_DATA.settings.boundaries;
    
    // 40% des astéroïdes autour des mots (danger zones)
    const dangerAsteroids = Math.floor(count * 0.4);
    const randomAsteroids = count - dangerAsteroids;
    
    // Créer astéroïdes dangereux autour des mots
    if (words.length > 0) {
        for (let i = 0; i < dangerAsteroids; i++) {
            // Choisir un mot au hasard
            const targetWord = words[Math.floor(Math.random() * words.length)];
            
            const size = Math.random() * 1.5 + 0.5;
            const geometry = new THREE.DodecahedronGeometry(size, 0);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x888888,
                flatShading: true
            });
            const asteroid = new THREE.Mesh(geometry, material);
            
            // Position proche du mot (rayon de 8-15 unités)
            const distance = 8 + Math.random() * 7;
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = (Math.random() - 0.5) * Math.PI;
            
            asteroid.position.set(
                targetWord.mesh.position.x + Math.cos(angle1) * Math.cos(angle2) * distance,
                targetWord.mesh.position.y + Math.sin(angle2) * distance,
                targetWord.mesh.position.z + Math.sin(angle1) * Math.cos(angle2) * distance
            );
            
            // Vitesse de rotation
            const rotationSpeed = {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            };
            
            // Vitesse de dérive lente en orbite autour du mot
            const orbitSpeed = 0.01;
            const velocity = new THREE.Vector3(
                -Math.sin(angle1) * orbitSpeed,
                (Math.random() - 0.5) * 0.005,
                Math.cos(angle1) * orbitSpeed
            );
            
            scene.add(asteroid);
            asteroids.push({ 
                mesh: asteroid, 
                rotationSpeed, 
                velocity,
                radius: size,
                orbitCenter: targetWord.mesh.position.clone(),
                orbitDistance: distance,
                orbitAngle: angle1
            });
        }
    }
    
    // Créer astéroïdes aléatoires dans l'espace
    for (let i = 0; i < randomAsteroids; i++) {
        const size = Math.random() * 1.5 + 0.5;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x888888,
            flatShading: true
        });
        const asteroid = new THREE.Mesh(geometry, material);
        
        // Position aléatoire dans les limites étendues
        asteroid.position.set(
            (Math.random() - 0.5) * bounds.x * 1.5,
            (Math.random() - 0.5) * bounds.y * 1.5,
            (Math.random() - 0.5) * bounds.z * 1.5
        );
        
        // Éviter le spawn près du vaisseau (spawn point)
        if (asteroid.position.length() < 15) {
            asteroid.position.normalize().multiplyScalar(20);
        }
        
        // Éviter le spawn dans le soleil (centre)
        if (asteroid.position.distanceTo(sun.position) < 12) {
            const direction = asteroid.position.clone().sub(sun.position).normalize();
            asteroid.position.copy(sun.position).add(direction.multiplyScalar(15));
        }
        
        // Vitesse de rotation
        const rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };
        
        // Vitesse de dérive
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * GAME_DATA.settings.physics.asteroidSpeedMultiplier,
            (Math.random() - 0.5) * GAME_DATA.settings.physics.asteroidSpeedMultiplier,
            (Math.random() - 0.5) * GAME_DATA.settings.physics.asteroidSpeedMultiplier
        );
        
        scene.add(asteroid);
        asteroids.push({ 
            mesh: asteroid, 
            rotationSpeed, 
            velocity,
            radius: size 
        });
    }
}

function createWords(wordList) {
    // Nettoyer anciens mots
    words.forEach(w => scene.remove(w.mesh));
    words = [];
    
    const bounds = GAME_DATA.settings.boundaries;
    
    wordList.forEach((wordData, i) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Fond transparent avec glow
        context.fillStyle = 'rgba(0, 255, 255, 0.2)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texte
        context.font = 'bold 60px Orbitron';
        context.fillStyle = '#00ffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(wordData.mg, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 2, 1);
        
        // Position aléatoire (ÉVITER LE CENTRE - le soleil)
        let position;
        let safePosition = false;
        let attempts = 0;
        
        while (!safePosition && attempts < 100) {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * bounds.x,
                (Math.random() - 0.5) * bounds.y,
                (Math.random() - 0.5) * bounds.z
            );
            
            safePosition = true;
            
            // ÉVITER LE CENTRE (soleil au centre)
            if (position.distanceTo(sun.position) < 20) {
                safePosition = false;
            }
            
            // Pas trop près du spawn (spawn point éloigné du centre maintenant)
            if (position.length() < 15) {
                safePosition = false;
            }
            
            attempts++;
        }
        
        // Si pas de position trouvée, forcer une position en périphérie
        if (!safePosition) {
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = (Math.random() - 0.5) * Math.PI * 0.5;
            const distance = 25 + Math.random() * 15;
            
            position = new THREE.Vector3(
                Math.cos(angle1) * Math.cos(angle2) * distance,
                Math.sin(angle2) * distance,
                Math.sin(angle1) * Math.cos(angle2) * distance
            );
        }
        
        sprite.position.copy(position);
        scene.add(sprite);
        
        words.push({ 
            mesh: sprite, 
            word: wordData.mg,
            collected: false,
            pulsePhase: Math.random() * Math.PI * 2
        });
    });
}

// ============ DÉMARRAGE DU JEU ============
function startGame(systemKey) {
    currentSystem = systemKey;
    const systemData = GAME_DATA.systems[systemKey];
    
    // Reset état
    gameState = 'playing';
    timeLeft = GAME_DATA.settings.gameplay.startTime;
    wordsCollected = 0;
    collisions = 0;
    health = 100;
    startTime = Date.now();
    consecutiveCollections = 0;
    slowMotionActive = false;
    
    // Reset vaisseau (spawn loin du soleil central)
    ship.position.set(25, 10, 25);
    shipVelocity.set(0, 0, 0);
    
    // Reset caméra
    cameraRotation = { horizontal: 0, vertical: 0.3 };
    
    // Couleur du système
    sun.material.color.setHex(systemData.color);
    sun.children[0].material.color.setHex(systemData.color);
    sun.children[1].material.color.setHex(systemData.color);
    
    // Générer niveau
    createAsteroids();
    createWords(systemData.words);
    
    // UI
    document.getElementById('systems-menu').classList.add('hidden');
    document.getElementById('game-hud').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    document.getElementById('instructions').classList.add('hidden');
    updateHUD();
    
    // Timer
    gameTimer = setInterval(() => {
        if (gameState === 'playing') {
            timeLeft -= 0.1;
            if (timeLeft <= 0) {
                endGame(false);
            }
            updateHUD();
        }
    }, 100);
}

function endGame(success) {
    gameState = 'gameover';
    clearInterval(gameTimer);
    
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Calculer étoiles
    let stars = 0;
    if (success) {
        stars = 1; // Complétion
        if (finalTime < 60) stars = 2; // Vitesse
        if (health >= 50) stars = 3; // Bonne santé
        
        // Débloquer glossaire
        progressData[currentSystem].completed = true;
    }
    
    // Sauvegarder progression
    if (stars > progressData[currentSystem].stars) {
        progressData[currentSystem].stars = stars;
    }
    if (!progressData[currentSystem].bestTime || finalTime < progressData[currentSystem].bestTime) {
        progressData[currentSystem].bestTime = finalTime;
    }
    saveProgress();
    
    // Afficher écran de fin
    const gameOverDiv = document.getElementById('game-over');
    const title = document.getElementById('game-over-title');
    const newWordsDiv = document.getElementById('new-words-unlocked');
    
    if (success) {
        title.textContent = 'Nahomby!';
        gameOverDiv.classList.remove('failure');
        gameOverDiv.classList.add('success');
        
        if (progressData[currentSystem].completed) {
            newWordsDiv.classList.remove('hidden');
        }
    } else {
        title.textContent = health <= 0 ? 'Simba ny Sambo!' : 'Supernova!';
        gameOverDiv.classList.remove('success');
        gameOverDiv.classList.add('failure');
        newWordsDiv.classList.add('hidden');
    }
    
    document.getElementById('stars-earned').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('final-time').textContent = finalTime + 's';
    document.getElementById('final-health').textContent = health + '%';
    document.getElementById('final-collisions').textContent = collisions;
    
    gameOverDiv.style.display = 'block';
    document.getElementById('game-hud').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
}

function updateHUD() {
    const timerDiv = document.getElementById('timer');
    timerDiv.textContent = Math.ceil(timeLeft);
    
    if (timeLeft <= 20) {
        timerDiv.classList.add('warning');
        sun.material.color.setHex(0xff006e);
        sun.children[0].material.color.setHex(0xff006e);
    } else {
        timerDiv.classList.remove('warning');
    }
    
    document.getElementById('score').textContent = `Teny: ${wordsCollected}/${GAME_DATA.settings.gameplay.wordsPerLevel}`;
    
    // Health bar
    const healthFill = document.getElementById('health-fill');
    healthFill.style.width = `${health}%`;
    
    if (health > 50) {
        healthFill.className = '';
    } else if (health > 25) {
        healthFill.className = 'warning';
    } else {
        healthFill.className = 'danger';
    }
}

// ============ CONTRÔLES ============
function setupControls() {
    const joystickArea = document.getElementById('joystick-area');
    const joystickStick = document.getElementById('joystick-stick');
    
    // Joystick
    joystickArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        updateJoystick(e.touches[0]);
    });
    
    joystickArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickActive) {
            updateJoystick(e.touches[0]);
        }
    });
    
    joystickArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        joystickActive = false;
        joystickVector = { x: 0, y: 0 };
        joystickStick.style.transform = 'translate(-50%, -50%)';
    });
    
    function updateJoystick(touch) {
        const rect = joystickArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 35);
        const angle = Math.atan2(deltaY, deltaX);
        
        const stickX = Math.cos(angle) * distance;
        const stickY = Math.sin(angle) * distance;
        
        joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
        
        joystickVector.x = deltaX / 35;
        joystickVector.y = -deltaY / 35;
    }
}

// Pause/Resume
document.getElementById('pause-btn').addEventListener('click', pauseGame);
document.getElementById('resume-btn').addEventListener('click', resumeGame);
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('menu-from-pause-btn').addEventListener('click', quitToMenu);
document.getElementById('quit-btn').addEventListener('click', quitToMenu);

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pause-menu').classList.remove('hidden');
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
    }
}

function restartGame() {
    document.getElementById('pause-menu').classList.add('hidden');
    startGame(currentSystem);
}

function quitToMenu() {
    clearInterval(gameTimer);
    gameState = 'menu';
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('game-hud').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('systems-menu').classList.remove('hidden');
    document.getElementById('instructions').classList.remove('hidden');
    updateStarsDisplay();
}

// Clavier - événements globaux
window.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    
    // Empêcher scroll avec flèches
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'z', 's', 'Z', 'S'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Pause avec Echap
    if (e.key === 'Escape') {
        pauseGame();
    }
    
    keysPressed[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

// Souris - rotation de caméra
window.addEventListener('mousedown', (e) => {
    if (gameState === 'playing' && e.button === 0) {
        mouseDown = true;
        lastMousePos = { x: e.clientX, y: e.clientY };
    }
});

window.addEventListener('mousemove', (e) => {
    if (mouseDown && gameState === 'playing') {
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        
        cameraRotation.horizontal -= deltaX * GAME_DATA.settings.camera.mouseSensitivity;
        cameraRotation.vertical -= deltaY * GAME_DATA.settings.camera.mouseSensitivity;
        
        cameraRotation.vertical = Math.max(
            GAME_DATA.settings.camera.minVertical,
            Math.min(GAME_DATA.settings.camera.maxVertical, cameraRotation.vertical)
        );
        
        lastMousePos = { x: e.clientX, y: e.clientY };
    }
});

window.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Touch pour mobile (rotation caméra avec 2 doigts)
let touchRotating = false;
let lastTouchPos = { x: 0, y: 0 };

window.addEventListener('touchstart', (e) => {
    if (gameState === 'playing' && e.touches.length === 2) {
        touchRotating = true;
        lastTouchPos = { 
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
    }
});

window.addEventListener('touchmove', (e) => {
    if (touchRotating && gameState === 'playing' && e.touches.length === 2) {
        const currentTouchPos = { 
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        
        const deltaX = currentTouchPos.x - lastTouchPos.x;
        const deltaY = currentTouchPos.y - lastTouchPos.y;
        
        cameraRotation.horizontal -= deltaX * GAME_DATA.settings.camera.mouseSensitivity;
        cameraRotation.vertical -= deltaY * GAME_DATA.settings.camera.mouseSensitivity;
        
        cameraRotation.vertical = Math.max(
            GAME_DATA.settings.camera.minVertical,
            Math.min(GAME_DATA.settings.camera.maxVertical, cameraRotation.vertical)
        );
        
        lastTouchPos = currentTouchPos;
    }
});

window.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        touchRotating = false;
    }
});

// ============ GAME LOOP ============
let slowMotionStart = 0;

function animate() {
    requestAnimationFrame(animate);
    
    if (gameState === 'playing') {
        const settings = GAME_DATA.settings;
        
        // Déplacement vaisseau - RELATIF AU VAISSEAU
        const keyboardInput = { forward: 0, right: 0, up: 0 };
        
        // Clavier - mouvements relatifs au vaisseau
        if (keysPressed['ArrowLeft']) keyboardInput.right = -1;
        if (keysPressed['ArrowRight']) keyboardInput.right = 1;
        if (keysPressed['ArrowUp']) keyboardInput.forward = 1;
        if (keysPressed['ArrowDown']) keyboardInput.forward = -1;
        if (keysPressed['z'] || keysPressed['Z']) keyboardInput.up = 1;
        if (keysPressed['s'] || keysPressed['S']) keyboardInput.up = -1;
        
        // Joystick contrôle right et up
        const inputForward = keyboardInput.forward;
        const inputRight = joystickVector.x || keyboardInput.right;
        const inputUp = joystickVector.y || keyboardInput.up;
        
        // Calculer direction du vaisseau basée sur la rotation de la caméra
        const shipForward = new THREE.Vector3(
            -Math.sin(cameraRotation.horizontal),
            0,
            -Math.cos(cameraRotation.horizontal)
        );
        const shipRight = new THREE.Vector3(
            Math.cos(cameraRotation.horizontal),
            0,
            -Math.sin(cameraRotation.horizontal)
        );
        const shipUp = new THREE.Vector3(0, 1, 0);
        
        const speed = slowMotionActive ? 0.15 : settings.physics.maxSpeed;
        
        // Appliquer les forces relatives au vaisseau
        shipVelocity.add(shipForward.multiplyScalar(inputForward * settings.physics.acceleration));
        shipVelocity.add(shipRight.multiplyScalar(inputRight * settings.physics.acceleration));
        shipVelocity.add(shipUp.multiplyScalar(inputUp * settings.physics.acceleration));
        
        // Friction
        shipVelocity.multiplyScalar(settings.physics.friction);
        
        // Limiter vitesse
        const maxSpeed = slowMotionActive ? 0.15 : settings.physics.maxSpeed;
        if (shipVelocity.length() > maxSpeed) {
            shipVelocity.normalize().multiplyScalar(maxSpeed);
        }
        
        ship.position.add(shipVelocity);
        
        // Limites du terrain étendues
        const bounds = settings.boundaries;
        ship.position.x = Math.max(-bounds.x, Math.min(bounds.x, ship.position.x));
        ship.position.y = Math.max(-bounds.y, Math.min(bounds.y, ship.position.y));
        ship.position.z = Math.max(-bounds.z, Math.min(bounds.z, ship.position.z));
        
        // Rotation vaisseau selon direction de mouvement
        if (shipVelocity.length() > 0.01) {
            const targetRotation = Math.atan2(shipVelocity.x, shipVelocity.z);
            ship.rotation.y = targetRotation;
            
            ship.rotation.x = -inputUp * 0.3;
            ship.rotation.z = -inputRight * 0.3;
        }
        
        // Collision avec le soleil = mort immédiate
        const distanceToSun = ship.position.distanceTo(sun.position);
        if (distanceToSun < settings.boundaries.sunDangerRadius) {
            health = 0;
            endGame(false);
            return;
        }
        
        // Animation astéroïdes
        asteroids.forEach(asteroid => {
            asteroid.mesh.rotation.x += asteroid.rotationSpeed.x;
            asteroid.mesh.rotation.y += asteroid.rotationSpeed.y;
            asteroid.mesh.rotation.z += asteroid.rotationSpeed.z;
            
            // Si l'astéroïde orbite autour d'un mot
            if (asteroid.orbitCenter) {
                // Orbite circulaire autour du mot
                asteroid.orbitAngle += 0.01;
                
                asteroid.mesh.position.set(
                    asteroid.orbitCenter.x + Math.cos(asteroid.orbitAngle) * asteroid.orbitDistance,
                    asteroid.orbitCenter.y + Math.sin(asteroid.orbitAngle * 0.5) * (asteroid.orbitDistance * 0.3),
                    asteroid.orbitCenter.z + Math.sin(asteroid.orbitAngle) * asteroid.orbitDistance
                );
            } else {
                // Dérive normale
                asteroid.mesh.position.add(asteroid.velocity);
                
                // Wraparound étendu
                if (asteroid.mesh.position.x > bounds.x) asteroid.mesh.position.x = -bounds.x;
                if (asteroid.mesh.position.x < -bounds.x) asteroid.mesh.position.x = bounds.x;
                if (asteroid.mesh.position.y > bounds.y) asteroid.mesh.position.y = -bounds.y;
                if (asteroid.mesh.position.y < -bounds.y) asteroid.mesh.position.y = bounds.y;
            }
            
            // Collision élastique avec rebond
            const distance = ship.position.distanceTo(asteroid.mesh.position);
            const collisionRadius = asteroid.radius + 0.8;
            
            if (distance < collisionRadius) {
                collisions++;
                consecutiveCollections = 0;
                
                // Dégâts
                health = Math.max(0, health - settings.physics.collisionDamage);
                updateHUD();
                
                // Game over si santé à 0
                if (health <= 0) {
                    endGame(false);
                    return;
                }
                
                // Rebond élastique
                const collisionNormal = new THREE.Vector3()
                    .subVectors(ship.position, asteroid.mesh.position)
                    .normalize();
                
                // Pousser le vaisseau hors de l'astéroïde
                const overlap = collisionRadius - distance;
                ship.position.add(collisionNormal.clone().multiplyScalar(overlap));
                
                // Réfléchir la vélocité (rebond)
                const velocityAlongNormal = shipVelocity.clone().dot(collisionNormal);
                if (velocityAlongNormal < 0) {
                    const reflection = collisionNormal.clone().multiplyScalar(2 * velocityAlongNormal);
                    shipVelocity.sub(reflection);
                    shipVelocity.multiplyScalar(0.5);
                }
                
                // Effet visuel collision
                ship.children[0].material.emissive.setHex(0xff0000);
                ship.children[0].material.emissiveIntensity = 1;
                
                setTimeout(() => {
                    ship.children[0].material.emissive.setHex(0x00ffff);
                    ship.children[0].material.emissiveIntensity = 0.5;
                }, 200);
            }
        });
        
        // Animation mots
        words.forEach(word => {
            if (word.collected) return;
            
            // Pulse
            word.pulsePhase += 0.05;
            const scale = 1 + Math.sin(word.pulsePhase) * 0.1;
            word.mesh.scale.set(4 * scale, 2 * scale, 1);
            
            // Rotation lente
            word.mesh.material.rotation += 0.01;
            
            // Collection
            if (ship.position.distanceTo(word.mesh.position) < settings.gameplay.collectionRadius) {
                collectWord(word);
            }
        });
        
        // Pulse soleil
        const sunScale = 1 + Math.sin(Date.now() * 0.001) * 0.05;
        sun.scale.set(sunScale, sunScale, sunScale);
        
        // Slow motion
        if (slowMotionActive && Date.now() - slowMotionStart > settings.gameplay.slowMotionDuration) {
            slowMotionActive = false;
        }
    }
    
    // Camera suit le vaisseau avec rotation contrôlée par souris
    const camSettings = GAME_DATA.settings.camera;
    const distance = camSettings.distance;
    const height = camSettings.height;
    
    const targetCameraPos = new THREE.Vector3(
        ship.position.x + Math.sin(cameraRotation.horizontal) * Math.cos(cameraRotation.vertical) * distance,
        ship.position.y + Math.sin(cameraRotation.vertical) * distance + height,
        ship.position.z + Math.cos(cameraRotation.horizontal) * Math.cos(cameraRotation.vertical) * distance
    );
    
    camera.position.lerp(targetCameraPos, camSettings.smoothing);
    camera.lookAt(ship.position);
    
    renderer.render(scene, camera);
}

function collectWord(word) {
    word.collected = true;
    wordsCollected++;
    consecutiveCollections++;
    
    // Bonus temps
    timeLeft += GAME_DATA.settings.gameplay.timeBonus;
    
    // Slow motion après 3 collections consécutives
    if (consecutiveCollections >= GAME_DATA.settings.gameplay.slowMotionThreshold) {
        slowMotionActive = true;
        slowMotionStart = Date.now();
        consecutiveCollections = 0;
    }
    
    // Effet particules
    createParticles(word.mesh.position);
    
    // Retirer de la scène
    scene.remove(word.mesh);
    
    updateHUD();
    
    // Victoire
    if (wordsCollected >= GAME_DATA.settings.gameplay.wordsPerLevel) {
        setTimeout(() => endGame(true), 500);
    }
}

function createParticles(position) {
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        scene.add(particle);
        particles.push({ mesh: particle, velocity, life: 1 });
    }
    
    // Animation particules
    function animateParticles() {
        particles.forEach((p, i) => {
            p.mesh.position.add(p.velocity);
            p.life -= 0.02;
            p.mesh.material.opacity = p.life;
            
            if (p.life <= 0) {
                scene.remove(p.mesh);
                particles.splice(i, 1);
            }
        });
        
        if (particles.length > 0) {
            requestAnimationFrame(animateParticles);
        }
    }
    animateParticles();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============ EVENT LISTENERS ============
document.querySelectorAll('.system-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const system = btn.dataset.system;
        startGame(system);
    });
});

document.getElementById('replay-btn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    startGame(currentSystem);
});

document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('systems-menu').classList.remove('hidden');
    document.getElementById('instructions').classList.remove('hidden');
    updateStarsDisplay();
    gameState = 'menu';
});

// ============ INIT ============
loadProgress();
init3D();
setupControls();
initMenus();
initGlossary();
animate();
