// main.js


// Import the Three.js library to create the 3D scene, camera, renderer, etc.
import * as THREE from 'three';

// OrbitControls so the user can rotate the camera with their mouse
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Import the Ball class I made in Ball.js
import { Ball } from './Ball.js';

// Import the physics functions from physics.js
import { applyGravity, resolveWallCollisions, resolveBallCollisions } from './physics.js';


// --- SETTINGS ---
// Change these numbers to adjust the simulation

// How many balls to put in the pit
const NUM_BALLS = 300;

// How big each ball is 
const BALL_RADIUS = 0.4;

// How wide, tall, and deep the box is (measured from the center)
const BOX_W = 6; // width
const BOX_H = 7; // height
const BOX_D = 6; // depth


// --- BOUNDS ---

// This object stores the inner edges of the box
// The physics code uses these to know when a ball has hit a wall
const BOUNDS = {
  minX: -BOX_W,  // left wall
  maxX:  BOX_W,  // right wall
  minY:  0,      // floor
  maxY:  BOX_H * 2, // ceiling (balls don't really reach this)
  minZ: -BOX_D,  // back wall
  maxZ:  BOX_D,  // front wall
};


// --- RENDERER ---

// The renderer is what actually draws everything onto the screen

// Get the canvas element from the HTML file
const canvas = document.getElementById('canvas');

// Create the renderer and attach it to the canvas
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

// Make the renderer fill the whole window
renderer.setSize(window.innerWidth, window.innerHeight);

// Set the pixel ratio so it looks sharp on high DPI screens (like Retina displays)
// capped it at 2 so it doesn't get too slow on really high resolution screens
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Turn on shadows so balls cast shadows on the floor
renderer.shadowMap.enabled = true;


// --- SCENE ---
// The scene is like a container that holds everything in the 3D world

const scene = new THREE.Scene();

// Set the background colour to a dark navy so the balls stand out
scene.background = new THREE.Color(0x0a0a12);


// --- CAMERA ---

// PerspectiveCamera makes things look 3D (further away = smaller)

const camera = new THREE.PerspectiveCamera(
  60,                               // field of view in degrees (60 is like normal human vision)
  window.innerWidth / window.innerHeight, // aspect ratio (width divided by height)
  0.1,                              // near clipping plane (things closer than this disappear)
  100                               // far clipping plane (things further than this disappear)
);

// Position the camera so can see the whole box
camera.position.set(14, 15, 16);

// Make the camera look at the middle of the box
camera.lookAt(0, BOX_H / 2, 0);


// --- ORBIT CONTROLS ---
// OrbitControls lets the user click and drag to rotate the camera around the scene

const controls = new OrbitControls(camera, renderer.domElement);

// Set the point the camera rotates around (the center of the box)
controls.target.set(0, BOX_H / 2, 0);

// Damping makes the camera slow down smoothly when you let go instead of stopping suddenly
controls.enableDamping = true;
controls.dampingFactor = 0.06;

// Set the minimum and maximum zoom distance so the user can't zoom too far in or out
controls.minDistance = 8;
controls.maxDistance = 40;

// Call update once at the start to apply all the settings above
controls.update();


// --- LIGHTS ---
// Lights illuminate the scene so the balls can be seen
// Without any lights everything would be completely black

// Ambient light shines equally on everything in the scene from all directions
// This makes sure nothing is completely dark even if it's not facing the main light
const ambientLight = new THREE.AmbientLight(
  0xffffff, // colour (white)
  0.5       // intensity (0 = off, 1 = full brightness)
);
scene.add(ambientLight); // add it to the scene so it actually does something

// Directional light is like sunlight - it shines from one direction
// This is the main light that makes the balls look 3D and cast shadows
const dirLight = new THREE.DirectionalLight(
  0xffffff, // colour (white)
  1.5       // intensity
);

// Position the light above and to the side of the scene
dirLight.position.set(10, 20, 10);

// Tell the light to cast shadows
dirLight.castShadow = true;

// Set the size of the shadow map - bigger = sharper shadows but slower
dirLight.shadow.mapSize.width  = 1024;
dirLight.shadow.mapSize.height = 1024;

// Add the directional light to the scene
scene.add(dirLight);

// A point light sits at a specific position and shines outward in all directions (like a lightbulb)
// I put this near the bottom of the pit to make the balls glow a bit
const pitLight = new THREE.PointLight(
  0xffd4a0, // warm orange colour
  1.0,      // brightness
  20        // how far the light reaches before fading out
);
pitLight.position.set(0, 1, 0); // place it near the floor of the pit
scene.add(pitLight); // add to scene


// --- CONTAINER ---
// The container is the box that holds all the balls
// It's made of several flat panels arranged into a box shape

// This is the material for the side walls - I made it transparent so you can see inside
const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x88aaff,     // blue tint
  transparent: true,   // allow transparency
  opacity: 0.08,       // almost completely see-through
  side: THREE.DoubleSide, // render both sides of the panel so it's visible from inside and outside
  roughness: 0.1,      // how rough the surface is (0 = mirror, 1 = completely rough)
  metalness: 0.05,     // how metallic it looks
  depthWrite: false,   // stops the transparent walls from hiding things behind them
});

// This is the material for the floor - slightly more visible so you can see it
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x334466,     // dark blue-grey
  transparent: true,
  opacity: 0.55,
  roughness: 0.8,
  metalness: 0.0,
});

// This function creates a flat rectangular wall and adds it to the scene
// width and height are the size, position is where to put it, rotX and rotY rotate it
function createWall(width, height, position, rotX, rotY, material) {

  // PlaneGeometry makes a flat rectangle
  const geometry = new THREE.PlaneGeometry(width, height);

  // Combine the shape and the material to make a mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Move the wall to the right position
  mesh.position.copy(position);

  // Rotate the wall so it faces the right direction
  mesh.rotation.x = rotX;
  mesh.rotation.y = rotY;

  // Allow the floor and walls to receive shadows from the balls
  mesh.receiveShadow = true;

  // Add the wall to the scene
  scene.add(mesh);
}

// Create the floor at the bottom of the box
createWall(BOX_W * 2, BOX_D * 2, new THREE.Vector3(0, 0, 0), -Math.PI / 2, 0, floorMaterial);

// Create the left wall
createWall(BOX_D * 2, BOX_H * 2, new THREE.Vector3(-BOX_W, BOX_H, 0), 0, Math.PI / 2, glassMaterial);

// Create the right wall
createWall(BOX_D * 2, BOX_H * 2, new THREE.Vector3(BOX_W, BOX_H, 0), 0, -Math.PI / 2, glassMaterial);

// Create the back wall
createWall(BOX_W * 2, BOX_H * 2, new THREE.Vector3(0, BOX_H, -BOX_D), 0, 0, glassMaterial);

// Create the front wall
createWall(BOX_W * 2, BOX_H * 2, new THREE.Vector3(0, BOX_H, BOX_D), 0, Math.PI, glassMaterial);

// Add a wireframe outline around the box so you can clearly see its edges
const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX_W * 2, BOX_H * 2, BOX_D * 2));
const edgesMat = new THREE.LineBasicMaterial({ color: 0x6688cc, transparent: true, opacity: 0.4 });
const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);

// Move the wireframe to the center of the box
wireframe.position.set(0, BOX_H, 0);
scene.add(wireframe);


// --- SPAWN BALLS ---
// Create all the balls and add them to the scene

// This array will hold all the ball objects
const balls = [];

// Loop and create one ball at a time
for (let i = 0; i < NUM_BALLS; i++) {

  // Add a small margin so balls don't spawn inside the walls
  const margin = BALL_RADIUS + 0.2;

  // Pick a random x position inside the box
  const spawnX = (Math.random() * 2 - 1) * (BOX_W - margin);

  // Spawn balls above the box so they fall down into it
  const spawnY = BOX_H + Math.random() * BOX_H * 0.8;

  // Pick a random z position inside the box
  const spawnZ = (Math.random() * 2 - 1) * (BOX_D - margin);

  // Create a Vector3 to store the starting position
  const startPos = new THREE.Vector3(spawnX, spawnY, spawnZ);

  // Create a new Ball object and add it to the array
  // The Ball constructor also adds the mesh to the scene automatically
  balls.push(new Ball(BALL_RADIUS, startPos, scene));
}


// --- ANIMATION LOOP ---
// This function runs over and over, once per frame, to update and draw everything

// Store the time of the previous frame so we can calculate deltaTime
let previousTime = 0;

function animate(currentTime) {

  // Calculate how many seconds have passed since the last frame
  // We divide by 1000 because currentTime is in milliseconds
  // We also clamp it to 0.05 so if the tab is hidden and then shown again,
  // the balls don't suddenly shoot across the screen
  const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.05);

  // Save the current time so we can use it next frame
  previousTime = currentTime;


  // Step 1: apply gravity to push all balls downward
  applyGravity(balls);

  // Step 2: move each ball based on its velocity
  for (const ball of balls) {
    ball.update(deltaTime);
  }

  // Step 3: check if any ball has gone through a wall and push it back inside
  for (const ball of balls) {
    resolveWallCollisions(ball, BOUNDS);
  }

  // Step 4: check if any two balls are overlapping and bounce them apart
  resolveBallCollisions(balls);


  // Update the orbit controls so the camera damping works
  controls.update();

  // Draw the current frame
  renderer.render(scene, camera);

  // Ask the browser to call animate again before the next screen repaint
  requestAnimationFrame(animate);
}

// Start the animation loop for the first time
requestAnimationFrame(animate);


// --- RESIZE HANDLER ---
// If the user resizes the window, update the camera and renderer to match

window.addEventListener('resize', () => {

  // Update the camera's aspect ratio to match the new window size
  camera.aspect = window.innerWidth / window.innerHeight;

  // Apply the aspect ratio change to the camera
  camera.updateProjectionMatrix();

  // Resize the renderer to fill the new window size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update the pixel ratio in case they moved the window to a different monitor
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
