// Ball.js
// This file defines the Ball 
// Each ball has a position, velocity, and a 3D mesh that gets drawn on screen

import * as THREE from 'three';

// A list of colours to randomly pick from for each ball

const BALL_COLOURS = [
  0xa78bfa, // violet
  0x34d399, // emerald
  0xfb923c, // orange
  0x60a5fa, // blue
  0xf472b6, // pink
  0xfbbf24, // amber
  0x4ade80, // green
  0xe879f9, // fuchsia
  0x38bdf8, // sky
  0xf87171, // red
];

// The Ball class represents a single ball in the simulation
export class Ball {

  // constructor runs automatically when you do: new Ball( )
  // radius = how big the ball is
  // startPosition = where to place it when it first appears
  // scene = the Three.js scene to add the ball's mesh to
  constructor(radius, startPosition, scene) {

    // Save the radius so physics code can use it for collision checks
    this.radius = radius;

    // Copy the starting position so each ball gets its own separate Vector3
    // (if we didn't clone it, all balls would share the same position object)
    this.position = startPosition.clone();

    // Give the ball a random starting velocity so they spread out when they fall
    // Math.random() returns a number between 0 and 1
    // Subtracting 0.5 gives us a range of -0.5 to 0.5
    // Multiplying by 6 gives us a range of -3 to 3
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 6, // random x velocity (left or right)
      Math.random() * 2,          // random y velocity (upward only at start)
      (Math.random() - 0.5) * 6  // random z velocity (forward or backward)
    );

    // Acceleration starts at zero - gravity will be added every frame in physics.js
    this.acceleration = new THREE.Vector3(0, 0, 0);

    // Pick a random colour from the BALL_COLOURS array
    // Math.floor rounds down so we get a whole number index
    const colour = BALL_COLOURS[Math.floor(Math.random() * BALL_COLOURS.length)];

    // SphereGeometry creates the 3D shape of the ball
    // Parameters: radius, number of width segments, number of height segments
    // More segments = rounder looking ball 
    const geometry = new THREE.SphereGeometry(radius, 28, 28);

    // MeshStandardMaterial is a realistic-looking material that responds to lights
    const material = new THREE.MeshStandardMaterial({
      color: colour,          // the main colour of the ball
      roughness: 0.25,        // how shiny it is (0 = mirror-like, 1 = very matte)
      metalness: 0.1,         // how metallic it looks
      emissive: colour,       // emissive makes the ball glow slightly its own colour
      emissiveIntensity: 0.12 // how much it glows (a small amount so it doesn't look too bright)
    });

    // Mesh combines a geometry and a material into one object
    this.mesh = new THREE.Mesh(geometry, material);

    // Allow this ball to cast a shadow onto the floor
    this.mesh.castShadow = true;

    // Allow the ball to receive shadows from other balls (usually barely visible)
    this.mesh.receiveShadow = true;

    // Add the mesh to the scene so Three.js knows to draw it
    scene.add(this.mesh);
  }

  // update() is called every frame from the animation loop in main.js
  // deltaTime is the number of seconds since the last frame
  update(deltaTime) {

    // Add the acceleration to the velocity
    // addScaledVector adds (acceleration * deltaTime) to velocity
    // This is the basic physics formula: velocity += acceleration * time
    this.velocity.addScaledVector(this.acceleration, deltaTime);

    // If the ball is barely moving, stop it completely
    // This prevents balls from wobbling forever when they should be sitting still
    // lengthSq() is the squared length of the velocity vector, which is faster to calculate than length()
    if (this.velocity.lengthSq() < 0.05) {
      this.velocity.set(0, 0, 0); // set velocity to zero
    }

    // Move the ball by adding (velocity * deltaTime) to the position
    // This is the formula: position += velocity * time
    this.position.addScaledVector(this.velocity, deltaTime);

    // Update the 3D mesh position to match the ball's position
    // Without this the ball would move in the physics but stay still on screen
    this.mesh.position.copy(this.position);
  }
}
