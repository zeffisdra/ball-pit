// physics.js
// This file handles all the physics for the simulation
// It includes gravity, bouncing off walls, and balls bumping into each other

// Import Three.js because we need Vector3 for the collision maths
import * as THREE from 'three';

// How strong gravity is - negative because it pulls downward (downward is negative Y in Three.js)
const GRAVITY = -18;

// How much speed a ball keeps after bouncing off a wall
// 0.82 means it keeps 82% of its speed and loses 18% (simulates energy loss)
const WALL_DAMPING = 0.82;

// How much speed balls keep after colliding with each other
// 0.92 means they lose a bit of speed on each collision
const BALL_DAMPING = 0.92;


// applyGravity sets the downward acceleration for every ball
// This gets called once per frame before the balls are moved
export function applyGravity(balls) {

  // Loop through every ball in the array
  for (const ball of balls) {

    // Set the ball's acceleration to point downward
    // The x and z are 0 because gravity only pulls down (not sideways)
    ball.acceleration.set(0, GRAVITY, 0);
  }
}


// resolveWallCollisions checks if a ball has gone outside the box
// If it has, it moves it back inside and reverses the relevant velocity
// ball = the ball to check
// bounds = an object with the min and max positions of each wall
export function resolveWallCollisions(ball, bounds) {

  // Check the floor (bottom of the box)
  if (ball.position.y - ball.radius < bounds.minY) {

    // Push the ball back up so it sits on the floor
    ball.position.y = bounds.minY + ball.radius;

    // If the ball is moving slowly downward, just stop it
    // This prevents the ball from bouncing forever with tiny little hops
    if (Math.abs(ball.velocity.y) < 1.0) {
      ball.velocity.y = 0;
    } else {
      // Otherwise reverse the y velocity and apply damping so it bounces back up
      ball.velocity.y = Math.abs(ball.velocity.y) * WALL_DAMPING;
    }
  }

  // Check the left wall
  if (ball.position.x - ball.radius < bounds.minX) {

    // Push the ball back to the right so it's no longer inside the wall
    ball.position.x = bounds.minX + ball.radius;

    // Reverse the x velocity so the ball bounces to the right
    // Math.abs makes sure the velocity is positive (pointing right) before applying damping
    ball.velocity.x = Math.abs(ball.velocity.x) * WALL_DAMPING;
  }

  // Check the right wall
  if (ball.position.x + ball.radius > bounds.maxX) {

    // Push the ball back to the left
    ball.position.x = bounds.maxX - ball.radius;

    // Reverse x velocity so it bounces to the left (negative direction)
    ball.velocity.x = -Math.abs(ball.velocity.x) * WALL_DAMPING;
  }

  // Check the back wall
  if (ball.position.z - ball.radius < bounds.minZ) {

    // Push the ball forward
    ball.position.z = bounds.minZ + ball.radius;

    // Bounce the ball forward (positive z direction)
    ball.velocity.z = Math.abs(ball.velocity.z) * WALL_DAMPING;
  }

  // Check the front wall
  if (ball.position.z + ball.radius > bounds.maxZ) {

    // Push the ball backward
    ball.position.z = bounds.maxZ - ball.radius;

    // Bounce the ball backward (negative z direction)
    ball.velocity.z = -Math.abs(ball.velocity.z) * WALL_DAMPING;
  }
}


// resolveBallCollisions checks every possible pair of balls to see if they overlap
// If two balls are overlapping, it pushes them apart and makes them bounce off each other
export function resolveBallCollisions(balls) {

  // Loop through every ball using index i
  for (let i = 0; i < balls.length; i++) {

    // Loop through every ball after ball i (use i+1 to avoid checking the same pair twice)
    for (let j = i + 1; j < balls.length; j++) {

      // Get references to the two balls we're checking
      const ballA = balls[i];
      const ballB = balls[j];

      // Calculate the distance between the centers of the two balls
      const distance = ballA.position.distanceTo(ballB.position);

      // The minimum distance before they're considered overlapping
      // (sum of both radii - if they're closer than this, they're touching or overlapping)
      const minDistance = ballA.radius + ballB.radius;

      // If they're not overlapping, skip to the next pair
      if (distance >= minDistance) continue;

      // Calculate the direction vector from ball A to ball B
      const direction = new THREE.Vector3();
      direction.subVectors(ballB.position, ballA.position);

      // Edge case: if both balls are at the exact same position, pick a random direction
      // Otherwise we'd be dividing by zero when we normalize
      if (distance === 0) {
        direction.set(Math.random(), Math.random(), Math.random());
      }

      // Normalize the direction vector so it has a length of 1
      // This makes the maths easier because we only care about the direction, not the length
      direction.normalize();

      // Calculate how much the balls are overlapping
      const overlap = minDistance - distance;

      // Push each ball halfway out of the overlap so they no longer intersect
      const halfOverlap = overlap / 2;
      ballA.position.addScaledVector(direction, -halfOverlap); // push A backward
      ballB.position.addScaledVector(direction,  halfOverlap); // push B forward

      // Calculate how fast each ball is moving along the collision direction
      // dot() gives us the component of velocity in a given direction
      const dotA = ballA.velocity.dot(direction);
      const dotB = ballB.velocity.dot(direction);

      // Only resolve the collision if they're actually moving toward each other
      // If they're already moving apart, don't do anything
      if (dotA - dotB <= 0) continue;

      // Swap the velocity components along the collision axis
      // This simulates an elastic collision where both balls have the same mass
      // also apply BALL_DAMPING to lose a bit of energy each collision

      // Calculate the impulse (velocity change) for each ball
      const impulseA = direction.clone().multiplyScalar(dotA * BALL_DAMPING);
      const impulseB = direction.clone().multiplyScalar(dotB * BALL_DAMPING);

      // Remove the old velocity component along the collision axis from each ball
      ballA.velocity.addScaledVector(direction, -dotA);
      ballB.velocity.addScaledVector(direction, -dotB);

      // Add the other ball's velocity component back in (this is the "swap")
      ballA.velocity.add(impulseB);
      ballB.velocity.add(impulseA);
    }
  }
}
