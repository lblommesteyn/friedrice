// Global variables
let scene, camera, renderer, wok;
let ingredients = [];
let heat = 50;
let score = 0;
let isStirring = false;
let timeLeft = 180;
let timerInterval;
let gameActive = true;
let combo = 0;
let highestCombo = 0;
let stirCount = 0;
let currentOrder = null;
let orderTimer = null;
let dishesServed = 0;
let perfectDishes = 0;
let level = 1;

// Game systems
const recipes = {
  friedRice: {
    name: "Classic Fried Rice",
    required: ['rice', 'egg'],
    bonus: ['carrot', 'peas', 'sauce'],
    multiplier: 2.0,
    description: "Rice + Egg (Bonus: Vegetables & Sauce)"
  },
  shrimpFriedRice: {
    name: "Shrimp Fried Rice",
    required: ['rice', 'shrimp'],
    bonus: ['egg', 'peas', 'sauce'],
    multiplier: 2.5,
    description: "Rice + Shrimp (Bonus: Egg & Sauce)"
  },
  veggieMix: {
    name: "Veggie Special",
    required: ['rice', 'carrot', 'peas'],
    bonus: ['onion', 'sauce'],
    multiplier: 1.8,
    description: "Rice + Carrots + Peas (Bonus: Onion)"
  }
};

const challenges = [
  {
    name: "Speed Chef",
    condition: "Serve 3 dishes in 30 seconds",
    reward: 500,
    check: () => dishesServed >= 3
  },
  {
    name: "Heat Master",
    condition: "Keep perfect heat for 20 seconds",
    reward: 300,
    check: () => heat >= 40 && heat <= 70
  },
  {
    name: "Combo King",
    condition: "Achieve 5x combo",
    reward: 1000,
    check: () => combo >= 5
  }
];

// Initialize game
window.onload = () => {
  if (typeof THREE !== 'undefined') {
    init();
    initializeGameSystems();
  } else {
    setTimeout(window.onload, 100);
  }
};

function initializeGameSystems() {
  updateRecipeBook();
  generateNewOrder();
  updateChallenges();
  startPowerUpSpawner();
}

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // Camera setup
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Lighting
  setupLighting();

  // Create wok and base
  createWok();
  createBase();

  // Start animation
  animate();

  // Event listeners
  window.addEventListener('resize', onWindowResize, false);
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(10, 10, 10);
  mainLight.castShadow = true;
  setupShadowCamera(mainLight);
  scene.add(mainLight);

  const wokLight = new THREE.PointLight(0xffaa00, 0.8);
  wokLight.position.set(0, 2, 0);
  scene.add(wokLight);
}

function setupShadowCamera(light) {
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 100;
  light.shadow.camera.left = -10;
  light.shadow.camera.right = 10;
  light.shadow.camera.top = 10;
  light.shadow.camera.bottom = -10;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
}

function createWok() {
  const wokGeo = new THREE.CylinderGeometry(5, 4, 2, 32);
  const wokMat = new THREE.MeshPhongMaterial({
    color: 0x777777,
    specular: 0x444444,
    shininess: 60
  });
  wok = new THREE.Mesh(wokGeo, wokMat);
  wok.receiveShadow = true;
  wok.castShadow = true;
  scene.add(wok);
}

function createBase() {
  const baseGeo = new THREE.CylinderGeometry(6, 6, 0.5, 32);
  const baseMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -1.25;
  base.receiveShadow = true;
  scene.add(base);
}

function startTimer() {
  if (timerInterval) return;
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = document.getElementById('timer');
  timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  if (timeLeft <= 30) {
    timerDisplay.classList.add('warning');
  }
}

function generateNewOrder() {
  const recipeKeys = Object.keys(recipes);
  const randomRecipe = recipes[recipeKeys[Math.floor(Math.random() * recipeKeys.length)]];
  
  currentOrder = {
    recipe: randomRecipe,
    timeLimit: 60,
    reward: 200 * level
  };

  document.getElementById('current-order').innerHTML = `
    <div>${randomRecipe.name}</div>
    <div>Required: ${randomRecipe.required.join(', ')}</div>
    <div>Bonus: ${randomRecipe.bonus.join(', ')}</div>
    <div>Reward: ${currentOrder.reward}</div>
  `;

  if (orderTimer) clearInterval(orderTimer);
  orderTimer = setInterval(updateOrderTimer, 1000);
}

function updateOrderTimer() {
  if (!currentOrder) return;
  
  currentOrder.timeLimit--;
  document.getElementById('order-timer').textContent = 
    `Time left: ${currentOrder.timeLimit}s`;

  if (currentOrder.timeLimit <= 0) {
    showNotification("Order expired!");
    generateNewOrder();
  }
}

function checkRecipe(ingredientList) {
  for (const recipe of Object.values(recipes)) {
    const hasRequired = recipe.required.every(item => 
      ingredientList.includes(item)
    );
    
    if (hasRequired) {
        const bonusCount = recipe.bonus.filter(item => 
            ingredientList.includes(item)
          ).length;
          
          return {
            name: recipe.name,
            multiplier: recipe.multiplier + (bonusCount * 0.2)
          };
        }
      }
      return { name: "Basic Dish", multiplier: 1.0 };
    }
    
    function updateCombo(success) {
      if (success) {
        combo++;
        highestCombo = Math.max(highestCombo, combo);
        document.getElementById('combo-display').textContent = `Combo: ${combo}x`;
        return 1 + (combo * 0.1);
      } else {
        combo = 0;
        document.getElementById('combo-display').textContent = '';
        return 1;
      }
    }
    
    function showNotification(text) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = text;
      document.getElementById('notifications').appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }
    
    function createIngredientMesh(type) {
      let geometry, material;
      
      switch(type) {
        case 'rice':
          geometry = new THREE.SphereGeometry(0.3);
          material = new THREE.MeshPhongMaterial({ color: 0xffffff });
          break;
        case 'egg':
          geometry = new THREE.SphereGeometry(0.4);
          material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
          break;
        case 'carrot':
          geometry = new THREE.ConeGeometry(0.2, 0.8);
          material = new THREE.MeshPhongMaterial({ color: 0xff6600 });
          break;
        case 'shrimp':
          geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16, Math.PI);
          material = new THREE.MeshPhongMaterial({ color: 0xff9999 });
          break;
        case 'peas':
          geometry = new THREE.SphereGeometry(0.2);
          material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
          break;
        case 'onion':
          geometry = new THREE.SphereGeometry(0.3, 8, 8);
          material = new THREE.MeshPhongMaterial({ color: 0xffffff });
          break;
        case 'sauce':
          ingredients.forEach(i => {
            i.material.color.multiplyScalar(0.8);
          });
          showNotification("Added sauce! 🥫");
          return null;
      }
    
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.type = type;
      return mesh;
    }
    
    function addIngredient(type) {
      if (!gameActive) return;
      if (!timerInterval) startTimer();
      
      if (ingredients.length >= 30 && type !== 'sauce') {
        showNotification("Wok is full! 🍳");
        return;
      }
    
      const mesh = createIngredientMesh(type);
      if (!mesh) return;
    
      mesh.position.set(
        Math.random() * 6 - 3,
        1,
        Math.random() * 6 - 3
      );
    
      ingredients.push(mesh);
      scene.add(mesh);
      createSteamEffect(mesh.position);
      showNotification(`Added ${type}! ✨`);
    }
    
    function createSteamEffect(position) {
      const particleCount = 10;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x + Math.random() * 0.5 - 0.25;
        positions[i * 3 + 1] = position.y + Math.random() * 0.5;
        positions[i * 3 + 2] = position.z + Math.random() * 0.5 - 0.25;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.1,
        transparent: true,
        opacity: 0.6
      });
      
      const particles = new THREE.Points(geometry, material);
      scene.add(particles);
      
      setTimeout(() => scene.remove(particles), 1000);
    }
    
    function stir() {
      if (!gameActive || isStirring || ingredients.length === 0) return;
      
      isStirring = true;
      stirCount++;
      showNotification("Stirring! 🥄");
    
      ingredients.forEach(i => {
        i.userData.targetPos = {
          x: Math.random() * 6 - 3,
          z: Math.random() * 6 - 3
        };
      });
    
      // Add stir effect
      const stirEffect = new THREE.Mesh(
        new THREE.RingGeometry(3, 3.2, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3
        })
      );
      stirEffect.rotation.x = -Math.PI / 2;
      stirEffect.position.y = 0.5;
      scene.add(stirEffect);
    
      setTimeout(() => {
        scene.remove(stirEffect);
        isStirring = false;
      }, 1000);
    }
    
    function adjustHeat(change) {
      if (!gameActive) return;
      heat = Math.max(0, Math.min(100, heat + change));
      document.getElementById('heat').textContent = heat;
    
      const intensity = heat / 100;
      scene.background = new THREE.Color(0.1, 0.1, 0.1 + intensity * 0.2);
      
      if (heat >= 40 && heat <= 70) {
        showNotification("Perfect heat! 🔥");
      }
    }
    
    function serve() {
      if (!gameActive || ingredients.length === 0) return;
      
      const ingredientTypes = ingredients.map(i => i.userData.type);
      const recipe = checkRecipe(ingredientTypes);
      const isCorrectHeat = heat >= 40 && heat <= 70;
      const isWellStirred = stirCount >= 2 && stirCount <= 5;
      
      let points = ingredients.length * 10 * recipe.multiplier;
      
      // Apply bonuses
      if (isCorrectHeat) points *= 1.5;
      if (isWellStirred) points *= 1.2;
      
      const comboMultiplier = updateCombo(isCorrectHeat && isWellStirred);
      points *= comboMultiplier;
    
      // Check current order
      if (currentOrder && recipe.name === currentOrder.recipe.name) {
        points += currentOrder.reward;
        showNotification(`Order complete! +${currentOrder.reward} points! 🌟`);
        generateNewOrder();
      }
    
      score += Math.round(points);
      dishesServed++;
      if (isCorrectHeat && isWellStirred) perfectDishes++;
      
      document.getElementById('score').textContent = score;
      showNotification(`${recipe.name} served! +${Math.round(points)} points! ✨`);
      
      // Level up every 1000 points
      const newLevel = Math.floor(score / 1000) + 1;
      if (newLevel > level) {
        level = newLevel;
        document.getElementById('level').textContent = level;
        showNotification(`Level Up! 🎖️`);
      }
    
      // Serving animation
      ingredients.forEach(i => {
        i.userData.serving = true;
      });
    
      setTimeout(() => {
        ingredients.forEach(i => scene.remove(i));
        ingredients = [];
        stirCount = 0;
      }, 1000);
    }
    
    function endGame() {
      clearInterval(timerInterval);
      clearInterval(orderTimer);
      gameActive = false;
      
      document.getElementById('gameOver').style.display = 'block';
      document.getElementById('finalScore').textContent = score;
      document.getElementById('dishesServed').textContent = dishesServed;
      document.getElementById('perfectDishes').textContent = perfectDishes;
      document.getElementById('highestCombo').textContent = highestCombo;
      
      document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }
    
    function animate() {
      requestAnimationFrame(animate);
    
      if (isStirring) {
        ingredients.forEach(i => {
          if (i.userData.targetPos) {
            i.position.x += (i.userData.targetPos.x - i.position.x) * 0.1;
            i.position.z += (i.userData.targetPos.z - i.position.z) * 0.1;
            i.rotation.x += 0.1;
            i.rotation.z += 0.1;
          }
        });
      }
    
      ingredients.forEach(i => {
        if (i.userData.serving) {
          i.position.y += 0.2;
          i.rotation.y += 0.2;
          i.scale.multiplyScalar(0.95);
        } else {
          i.position.y = 1 + Math.sin(Date.now() * 0.002 + i.position.x) * 0.1;
          i.rotation.y += 0.02;
        }
      });
    
      wok.rotation.y += 0.001;
      renderer.render(scene, camera);
    }
    
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function updateRecipeBook() {
      const recipeDiv = document.getElementById('recipes');
      recipeDiv.innerHTML = Object.values(recipes).map(recipe => `
        <div style="margin-bottom: 10px;">
          <strong>${recipe.name}</strong><br>
          ${recipe.description}
        </div>
      `).join('');
    }
    
    // Start the game
    window.addEventListener('load', () => {
      updateRecipeBook();
      updateTimer();
    });