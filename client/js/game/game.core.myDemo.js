$('body').removeClass('body');
window.game = window.game || {};

window.game.core = function () {
	var _game = {

		// initial value for level
		levelDifficulty: 1,
		// initial limit value for randomly generated shapes affected by levelDifficulty
		shapeLimit: 10,
		// initial limit value for randomly generated cross beams
		crossBeamLimit: null,
		crossBeamRangeMin: 165000,
		crossBeamRangeMax: 50000,
		crossBeamLimitAdjuster: 10,

		// initial position values to dynamically change for shape generation
		positionToBeginShapes: 99000,
		positionToStopShapes: 50000,
		levelTransition: 155000,

		// Attributes
		player: {
			// Attributes

			// an array to hold the positions where points have been accumulated
			positionArr: [],

			// Player entity including mesh and rigid body
			model: null,
			mesh: null,
			shape: null,
			rigidBody: null,
			// Player mass which affects other rigid bodies in the world
			mass: 3,
			startPosition: 199950,

			// HingeConstraint to limit player's air-twisting
			orientationConstraint: null,

			// Jump flags
			isGrounded: false,
			jumpHeight: 50,

			// Configuration for player speed (acceleration and maximum speed)
			speed: 1.5,
			speedMax: 500,
			// Configuration for player rotation (rotation acceleration and maximum rotation speed)
			rotationSpeed: 0.007,
			rotationSpeedMax: 0.04,
			// Rotation values
			rotationRadians: new THREE.Vector3(0, 0, 0),
			rotationAngleX: null,
			rotationAngleY: null,
			// Damping which means deceleration	(values between 0.8 and 0.98 are recommended)
			damping: 0.9,
			// Damping or easing for player rotation
			rotationDamping: 0.8,
			// Acceleration values
			acceleration: 0,
			rotationAcceleration: 0,
			// Enum for an easier method access to acceleration/rotation
			playerAccelerationValues: {
				position: {
					acceleration: "acceleration",
					speed: "speed",
					speedMax: "speedMax"
				},
				rotation: {
					acceleration: "rotationAcceleration",
					speed: "rotationSpeed",
					speedMax: "rotationSpeedMax"
				}
			},

			// Third-person camera configuration
			playerCoords: null,
			cameraCoords: null,
			// Camera offsets behind the player (horizontally and vertically)
			cameraOffsetH: 280,
			cameraOffsetV: 100,

			// Keyboard configuration for game.events.js (controlKeys must be associated to game.events.keyboard.keyCodes)
			controlKeys: {
				forward: "w",
				backward: "s",
				left: "a",
				right: "d",
				jump: "space"
				// reset: "r"
			},

			// Methods
			create: function() {

				// Create a global physics material for the player which will be used as ContactMaterial for all other objects in the level
				_cannon.playerPhysicsMaterial = new CANNON.Material("playerMaterial");

				// Create a player character based on an imported 3D model that was already loaded as JSON into game.models.player
				_game.player.model = _three.createModel(window.game.models.player, 12, [
					new THREE.MeshLambertMaterial({ color: window.game.static.colors.cyan, shading: THREE.FlatShading }),
					new THREE.MeshLambertMaterial({ color: window.game.static.colors.green, shading: THREE.FlatShading })
				]);

				// Create the shape, mesh and rigid body for the player character and assign the physics material to it
				_game.player.shape = new CANNON.Box(_game.player.model.halfExtents);
				_game.player.rigidBody = new CANNON.RigidBody(_game.player.mass, _game.player.shape, _cannon.createPhysicsMaterial(_cannon.playerPhysicsMaterial));
				_game.player.rigidBody.position.set(_game.player.startPosition, 0, 50);
				_game.player.mesh = _cannon.addVisual(_game.player.rigidBody, null, _game.player.model.mesh);

				// Create a HingeConstraint to limit player's air-twisting - this needs improvement
				_game.player.orientationConstraint = new CANNON.HingeConstraint(_game.player.rigidBody, new CANNON.Vec3(0, 0, 0), new CANNON.Vec3(0, 0, 1), _game.player.rigidBody, new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(0, 0, 1));
				_cannon.world.addConstraint(_game.player.orientationConstraint);

				_game.player.rigidBody.postStep = function() {
					// Reset player's angularVelocity to limit possible exceeding rotation and
					_game.player.rigidBody.angularVelocity.z = 0;

					// update player's orientation afterwards
					_game.player.updateOrientation();
				};
				// Collision event listener for the jump mechanism
				_game.player.rigidBody.addEventListener("collide", function(event) {
					// Checks if player's is on ground
					if (!_game.player.isGrounded) {
						// Ray intersection test to check if player is colliding with an object beneath him
						_game.player.isGrounded = (new CANNON.Ray(_game.player.mesh.position, new CANNON.Vec3(0, 0, -1)).intersectBody(event.contact.bi).length > 0);
					}
				});
			},
			update: function() {
				// Basic game logic to update player and camera
				_game.player.processUserInput();
				_game.player.accelerate();
				_game.player.rotate();
				_game.player.updateCamera();

				// Level-specific logic
				var playerCurPosition = _game.player.mesh.position.x;
				// change the shape limit based on levelDifficulty. Limit increases by 10 each level.
				var newShapeLimit = _game.shapeLimit + _game.levelDifficulty * 10;

				// totalDistance = 199950 - Math.floor(_game.player.mesh.position.x);
				_game.player.checkGameOver();

				// point accumulation based on player's position.
				// _game.player.accumulatePoints(playerCurPosition);

				// function to remove shapes as player passes them
				_game.removeShapes();
				// console.log(playerCurPosition);

				if (_game.levelDifficulty > 1) {
					_game.crossBeamLimit = _game.levelDifficulty * 5 + _game.crossBeamLimitAdjuster;
				} else {
					_game.crossBeamLimit = _game.crossBeamLimitAdjuster;
				}

				if (playerCurPosition <= _game.positionToBeginShapes && playerCurPosition > _game.positionToStopShapes && _cannon.bodies.length - _game.crossBeamLimit < newShapeLimit) {
					_game.randomShapes();
				}

				if (playerCurPosition < _game.positionToStopShapes) {
					_game.positionToBeginShapes -= _game.levelTransition;
					_game.positionToStopShapes -= _game.levelTransition;
					_game.crossBeamRangeMin -= _game.levelTransition;
					_game.crossBeamRangeMax -= _game.levelTransition;
					_game.levelDifficulty += 1;
					for (var i = counter; i < _game.level.additionalLevels.length; counter++) {
						return _game.level.additionalLevels[i]();
					}
				}
				if (playerCurPosition <= -199950) {
					finishedLevels = 'Yes';
				}
				// console.log('the current score is: ' + score);
				// console.log('current lives are: ' + lives);
			},
			updateCamera: function() {
				// Calculate camera coordinates by using Euler radians from player's last rotation
				_game.player.cameraCoords = window.game.helpers.polarToCartesian(_game.player.cameraOffsetH, _game.player.rotationRadians.z);

				// Apply camera coordinates to camera position
				_three.camera.position.x = _game.player.mesh.position.x + _game.player.cameraCoords.x;
				_three.camera.position.y = _game.player.mesh.position.y + _game.player.cameraCoords.y;
				_three.camera.position.z = _game.player.mesh.position.z + _game.player.cameraOffsetV;
				// console.log(_game.player.mesh.position.x);
				// Place camera focus on player mesh
				_three.camera.lookAt(_game.player.mesh.position);

			},
			updateAcceleration: function(values, direction) {
				// Distinguish between acceleration/rotation and forward/right (1) and backward/left (-1)
				if (direction === 1) {
					// Forward/right
					if (_game.player[values.acceleration] > -_game.player[values.speedMax]) {
						if (_game.player[values.acceleration] >= _game.player[values.speedMax] / 2) {
							_game.player[values.acceleration] = -(_game.player[values.speedMax] / 4);
						} else {
							_game.player[values.acceleration] -= _game.player[values.speed];
						}
					} else {
						_game.player[values.acceleration] = -_game.player[values.speedMax];
					}
				} else {
					// Backward/left
					if (_game.player[values.acceleration] < _game.player[values.speedMax]) {
						if (_game.player[values.acceleration] <= -(_game.player[values.speedMax] / 2)) {
							_game.player[values.acceleration] = _game.player[values.speedMax] / 4;
						} else {
							_game.player[values.acceleration] += _game.player[values.speed];
						}
					} else {
						_game.player[values.acceleration] = _game.player[values.speedMax];
					}
				}
			},
			accumulatePoints: function(playerPosition) {
				// check if position is in array
				if (_game.player.positionArr.indexOf(Math.floor(playerPosition)) === -1) {
					// console.log(playerPosition);
					// if not, check to see if points should be accumulated
					if (Math.floor(playerPosition) % 100 === (50 || -50)) {
						_game.player.points += 10;
						_game.player.positionArr.push(Math.floor(playerPosition));
						// console.log(_game.player.points);
					}
				}
			},
			processUserInput: function() {
				// Jump
				if (_events.keyboard.pressed[_game.player.controlKeys.jump]) {
					_game.player.jump();
				}

				// Movement: forward, backward, left, right
				if (_events.keyboard.pressed[_game.player.controlKeys.forward]) {
					_game.player.updateAcceleration(_game.player.playerAccelerationValues.position, 1);

					// Reset orientation in air
					if (!_cannon.getCollisions(_game.player.rigidBody.index)) {
						_game.player.rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), _game.player.rotationRadians.z);
					}
				}

				if (_events.keyboard.pressed[_game.player.controlKeys.backward]) {
					_game.player.updateAcceleration(_game.player.playerAccelerationValues.position, -1);
				}

				if (_events.keyboard.pressed[_game.player.controlKeys.right]) {
					_game.player.updateAcceleration(_game.player.playerAccelerationValues.rotation, 1);
				}

				if (_events.keyboard.pressed[_game.player.controlKeys.left]) {
					_game.player.updateAcceleration(_game.player.playerAccelerationValues.rotation, -1);
				}

				// if (_events.keyboard.pressed[_game.player.controlKeys.reset]) {
				// 	_game.destroy();
				// }

			},
			accelerate: function() {
				// Calculate player coordinates by using current acceleration Euler radians from player's last rotation
				_game.player.playerCoords = window.game.helpers.polarToCartesian(_game.player.acceleration, _game.player.rotationRadians.z);

				// Set actual XYZ velocity by using calculated Cartesian coordinates
				_game.player.rigidBody.velocity.set(_game.player.playerCoords.x, _game.player.playerCoords.y, _game.player.rigidBody.velocity.z);

				// Damping
				if (!_events.keyboard.pressed[_game.player.controlKeys.forward] && !_events.keyboard.pressed[_game.player.controlKeys.backward]) {
					_game.player.acceleration *= _game.player.damping;
				}
			},
			rotate: function() {
				// Rotate player around Z axis
				_cannon.rotateOnAxis(_game.player.rigidBody, new CANNON.Vec3(0, 0, 1), _game.player.rotationAcceleration);

				// Damping
				if (!_events.keyboard.pressed[_game.player.controlKeys.left] && !_events.keyboard.pressed[_game.player.controlKeys.right]) {
					_game.player.rotationAcceleration *= _game.player.rotationDamping;
				}
			},
			jump: function() {
				// Perform a jump if player has collisions and the collision contact is beneath him (ground)
				if (_cannon.getCollisions(_game.player.rigidBody.index) && _game.player.isGrounded) {
					_game.player.isGrounded = false;
					_game.player.rigidBody.velocity.z = _game.player.jumpHeight;
				}
			},
			updateOrientation: function() {
				// Convert player's Quaternion to Euler radians and save them to _game.player.rotationRadians
				_game.player.rotationRadians = new THREE.Euler().setFromQuaternion(_game.player.rigidBody.quaternion);

				// Round angles
				_game.player.rotationAngleX = Math.round(window.game.helpers.radToDeg(_game.player.rotationRadians.x));
				_game.player.rotationAngleY = Math.round(window.game.helpers.radToDeg(_game.player.rotationRadians.y));

				// Prevent player from being upside-down on a slope - this needs improvement
				if ((_cannon.getCollisions(_game.player.rigidBody.index) &&
					((_game.player.rotationAngleX >= 90) ||
						(_game.player.rotationAngleX <= -90) ||
						(_game.player.rotationAngleY >= 90) ||
						(_game.player.rotationAngleY <= -90)))
					)
				{
					// Reset orientation
					_game.player.rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), _game.player.rotationRadians.z);
				}
			},
			checkGameOver: function () {
				// Example game over mechanism which resets the game if the player is falling beneath -800
				if (_game.player.mesh.position.z <= -800 || _cannon.getCollisions(_game.player.rigidBody.index) > 1) {
					_game.destroy();
				}
			}
		},
		level: {

			// Define floor settings
			floorSize: 200000,
			floorWidth: 1000,
			floorHeight: 20,

			// Methods
			create: function() {
				console.log(_game.shapeLimit);
				console.log(_cannon.bodies);
				console.log('the level difficulty is: ' + _game.levelDifficulty);

				// Create a solid material for all objects in the world
				_cannon.solidMaterial = _cannon.createPhysicsMaterial(new CANNON.Material("solidMaterial"), 0, 0.1);

				// create a finish wall
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 300)),
					mass: 0,
					position: new CANNON.Vec3(-200020, 0, 300),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.green
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// Add a floor
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(_game.level.floorSize, _game.level.floorWidth, _game.level.floorHeight)),
					mass: 0,
					position: new CANNON.Vec3(0, 0, -_game.level.floorHeight),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.black
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// add walls
				// right side
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(_game.level.floorSize, 20, 1000)),
					mass: 0,
					position: new CANNON.Vec3(0, _game.level.floorWidth, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.black
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// left side
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(_game.level.floorSize, 20, 1000)),
					mass: 0,
					position: new CANNON.Vec3(0, -_game.level.floorWidth, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.black
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// random cross beams
				for (var i = 0; i < _game.crossBeamLimitAdjuster; i++) {
					_game.randomCrossBeams();
				}

//VVVVVVVVVVVVVVVVV//
/// *** GATES *** ///
//VVVVVVVVVVVVVVVVV//

				// ---------- //
				// FIRST GATE //
				// ---------- //

				// top of gate
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(195000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right side
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 250, 100)),
					mass: 0,
					position: new CANNON.Vec3(195000, 750, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left side
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 250, 100)),
					mass: 0,
					position: new CANNON.Vec3(195000, -750, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// -------------- //
				// END FIRST GATE //
				// -------------- //

				// ----------- //
				// SECOND GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(192000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 100, 100)),
					mass: 0,
					position: new CANNON.Vec3(192000, 900, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 400, 100)),
					mass: 0,
					position: new CANNON.Vec3(192000, -600, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END SECOND GATE //
				// --------------- //

				// ----------- //
				// THIRD GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(189000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 350, 100)),
					mass: 0,
					position: new CANNON.Vec3(189000, 650, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 150, 100)),
					mass: 0,
					position: new CANNON.Vec3(189000, -850, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END THIRD GATE //
				// --------------- //

				// ----------- //
				// FOURTH GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(186000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 300, 100)),
					mass: 0,
					position: new CANNON.Vec3(186000, 700, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 200, 100)),
					mass: 0,
					position: new CANNON.Vec3(186000, -800, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END FOURTH GATE //
				// --------------- //

				// ----------- //
				// FIFTH GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(183000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 450, 100)),
					mass: 0,
					position: new CANNON.Vec3(183000, 550, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 50, 100)),
					mass: 0,
					position: new CANNON.Vec3(183000, -950, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END FIFTH GATE //
				// --------------- //

				// ----------- //
				// SIXTH GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(180000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 300, 100)),
					mass: 0,
					position: new CANNON.Vec3(180000, 700, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 200, 100)),
					mass: 0,
					position: new CANNON.Vec3(180000, -800, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END SIXTH GATE //
				// --------------- //

				// ----------- //
				// SEVENTH GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(177000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 300, 100)),
					mass: 0,
					position: new CANNON.Vec3(177000, 700, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 200, 100)),
					mass: 0,
					position: new CANNON.Vec3(177000, -800, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END SEVENTH GATE //
				// --------------- //

				// ----------- //
				// EIGHTH GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(174000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 50, 100)),
					mass: 0,
					position: new CANNON.Vec3(174000, 950, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 450, 100)),
					mass: 0,
					position: new CANNON.Vec3(174000, -550, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END EIGHTH GATE //
				// --------------- //

				// ----------- //
				// NINTH GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(171000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 300, 100)),
					mass: 0,
					position: new CANNON.Vec3(171000, 700, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 200, 100)),
					mass: 0,
					position: new CANNON.Vec3(171000, -800, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END NINTH GATE //
				// --------------- //

				// ----------- //
				// TENTH GATE //
				// ----------- //

				// top
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
					mass: 0,
					position: new CANNON.Vec3(168000, 0, 250),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// right
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 175, 100)),
					mass: 0,
					position: new CANNON.Vec3(168000, 825, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// left
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, 175, 100)),
					mass: 0,
					position: new CANNON.Vec3(168000, -825, 100),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				// bottom
				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 12.5)),
					mass: 0,
					position: new CANNON.Vec3(168000, 0, 12.5),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.red
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// --------------- //
				// END TENTH GATE //
				// --------------- //

//^^^^^^^^^^^^^^^^^//
/// *** GATES *** ///
//^^^^^^^^^^^^^^^^^//

//VVVVVVVVVVVVVVVVV//
// *** PILLARS *** //
//VVVVVVVVVVVVVVVVV//

				var pillar = new CANNON.Box(new CANNON.Vec3(20, 20, 1000));

				// first line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(165000, 0, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end first line

				// second line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(160000, -333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(160000, 333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end second line

				// third line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(155000, 0, 500),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(155000, -500, 500),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(155000, 500, 500),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end of third line

				// fourth line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(150000, -600, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(150000, -200, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(150000, 200, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(150000, 600, 550),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end of fourth line

				// start fifth line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(145000, -666, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(145000, -333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(145000, 0, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(145000, 333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(145000, 666, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end of fifth line

				// start sixth line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(140000, -714, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(140000, -428, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(140000, -142, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(140000, 142, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(140000, 428, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(140000, 714, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end sixth line

				// start seventh line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(135000, -750, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(135000, -500, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(135000, -250, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(135000, 0, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(135000, 250, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(135000, 500, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(135000, 750, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end seventh line

				// start eighth line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, -778, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, -556, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, -334, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, -112, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, 112, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, 334, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, 556, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(130000, 778, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end eighth line

				// start ninth line
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, -800, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, -600, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, -400, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, -200, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, 0, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, 200, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, 400, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, 600, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(125000, 800, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end ninth line

				// start tenth line
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, -818, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, -636, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, -454, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, -272, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, -90, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, 90, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, 272, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, 454, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, 636, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(120000, 818, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end tenth line

				// start eleventh line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, -833, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, -666, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, -500, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, -333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, -166, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, 0, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, 166, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, 333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, 500, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, 666, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(115000, 833, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end eleventh line

				// start twelfth line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, -846, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, -692, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, -538, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, -384, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, -230, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, -77, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, 77, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, 230, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, 384, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, 538, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, 692, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(110000, 846, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end twelfth line

				// start thirteenth line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, -857, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, -714, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, -571, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, -428, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, -285, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, -143, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, 0, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, 143, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, 285, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, 428, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, 571, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, 714, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(105000, 857, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end thirteenth line

				// start last line of pillars
				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, -866, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, -733, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, -600, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, -467, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, -333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, -200, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, -67, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, 67, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, 200, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, 333, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, 467, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, 600, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, 733, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});

				_cannon.createRigidBody({
					shape: pillar,
					mass: 0,
					position: new CANNON.Vec3(100000, 866, 1000),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
				// end last line

//^^^^^^^^^^^^^^^^^//
// *** PILLARS *** //
//^^^^^^^^^^^^^^^^^//

				// Grid Helper
				var grid = new THREE.GridHelper(_game.level.floorSize, _game.level.floorSize / 1000);
				grid.position.z = 0.5;
				grid.rotation.x = window.game.helpers.degToRad(90);
				_three.scene.add(grid);
			},

			//------------------------------------------//
			// ARRAY OF FUNCTIONS FOR ADDITIONAL LEVELS //
			//------------------------------------------//

			additionalLevels: [
				function() {
					console.log('the level difficulty is: ' + _game.levelDifficulty);
					// random cross beams
					for (var i = 0; i < _game.crossBeamLimit; i++) {
						_game.randomCrossBeams();
					}

					//VVVVVVVVVVVVVVVVV//
					/// *** GATES *** ///
					//VVVVVVVVVVVVVVVVV//

					// ---------- //
					// FIRST GATE //
					// ---------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(40000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth / 2, 100)),
						mass: 0,
						position: new CANNON.Vec3(40000, 600, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 500, 100)),
						mass: 0,
						position: new CANNON.Vec3(40000, -600, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// -------------- //
					// END FIRST GATE //
					// -------------- //

					// ----------- //
					// SECOND GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(37000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth / 2, 100)),
						mass: 0,
						position: new CANNON.Vec3(37000, 1200, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 900, 100)),
						mass: 0,
						position: new CANNON.Vec3(37000, -400, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END SECOND GATE //
					// --------------- //

					// ----------- //
					// THIRD GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(34000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 800, 100)),
						mass: 0,
						position: new CANNON.Vec3(34000, 300, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 400, 100)),
						mass: 0,
						position: new CANNON.Vec3(34000, -1100, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END THIRD GATE //
					// --------------- //

					// ----------- //
					// FOURTH GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(31000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth / 2, 100)),
						mass: 0,
						position: new CANNON.Vec3(31000, 500, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 400, 100)),
						mass: 0,
						position: new CANNON.Vec3(31000, -600, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END FOURTH GATE //
					// --------------- //

					// ----------- //
					// FIFTH GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(28000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 850, 100)),
						mass: 0,
						position: new CANNON.Vec3(28000, 150, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 50, 100)),
						mass: 0,
						position: new CANNON.Vec3(28000, -950, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END FIFTH GATE //
					// --------------- //

					// ----------- //
					// SIXTH GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(25000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 650, 100)),
						mass: 0,
						position: new CANNON.Vec3(25000, 350, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 250, 100)),
						mass: 0,
						position: new CANNON.Vec3(25000, -750, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END SIXTH GATE //
					// --------------- //

					// ----------- //
					// SEVENTH GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(22000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth / 2, 100)),
						mass: 0,
						position: new CANNON.Vec3(22000, 500, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 400, 100)),
						mass: 0,
						position: new CANNON.Vec3(22000, -600, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END SEVENTH GATE //
					// --------------- //

					// ----------- //
					// EIGHTH GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(19000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 350, 100)),
						mass: 0,
						position: new CANNON.Vec3(19000, 650, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 550, 100)),
						mass: 0,
						position: new CANNON.Vec3(19000, -450, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END EIGHTH GATE //
					// --------------- //

					// ----------- //
					// NINTH GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(16000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth / 2, 100)),
						mass: 0,
						position: new CANNON.Vec3(16000, 500, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 400, 100)),
						mass: 0,
						position: new CANNON.Vec3(16000, -600, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END NINTH GATE //
					// --------------- //

					// ----------- //
					// TENTH GATE //
					// ----------- //
					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, _game.level.floorWidth, 100)),
						mass: 0,
						position: new CANNON.Vec3(13000, 0, 250),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 400, 100)),
						mass: 0,
						position: new CANNON.Vec3(13000, 600, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 400, 100)),
						mass: 0,
						position: new CANNON.Vec3(13000, -600, 50),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: new CANNON.Box(new CANNON.Vec3(20, 400, 115)),
						mass: 0,
						position: new CANNON.Vec3(13000, 0, 0),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.red
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// --------------- //
					// END TENTH GATE //
					// --------------- //

	//^^^^^^^^^^^^^^^^^//
	/// *** GATES *** ///
	//^^^^^^^^^^^^^^^^^//

	//VVVVVVVVVVVVVVVVV//
	// *** PILLARS *** //
	//VVVVVVVVVVVVVVVVV//

					var pillar = new CANNON.Box(new CANNON.Vec3(20, 20, 1000));

					// first line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(10000, 0, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end first line

					// second line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(5000, -333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(5000, 333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end second line

					// third line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(0, 0, 500),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(0, -500, 500),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(0, 500, 500),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end of third line

					// fourth line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-5000, -600, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-5000, -200, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-5000, 200, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-5000, 600, 550),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end of fourth line

					// start fifth line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-10000, -666, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-10000, -333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-10000, 0, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-10000, 333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-10000, 666, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end of fifth line

					// start sixth line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-15000, -714, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-15000, -428, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-15000, -142, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-15000, 142, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-15000, 428, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-15000, 714, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end sixth line

					// start seventh line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-20000, -750, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-20000, -500, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-20000, -250, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-20000, 0, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-20000, 250, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-20000, 500, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-20000, 750, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end seventh line

					// start eighth line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, -778, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, -556, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, -334, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, -112, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, 112, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, 334, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, 556, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-25000, 778, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end eighth line

					// start ninth line
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, -800, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, -600, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, -400, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, -200, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, 0, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, 200, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, 400, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, 600, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-30000, 800, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end ninth line

					// start tenth line
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, -818, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, -636, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, -454, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, -272, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, -90, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, 90, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, 272, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, 454, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, 636, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-35000, 818, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end tenth line

					// start eleventh line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, -833, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, -666, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, -500, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, -333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, -166, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, 0, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, 166, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, 333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, 500, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, 666, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-40000, 833, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end eleventh line

					// start twelfth line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, -846, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, -692, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, -538, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, -384, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, -230, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, -77, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, 77, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, 230, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, 384, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, 538, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, 692, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-45000, 846, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end twelfth line

					// start thirteenth line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, -857, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, -714, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, -571, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, -428, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, -285, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, -143, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, 0, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, 143, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, 285, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, 428, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, 571, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, 714, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-50000, 857, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end thirteenth line

					// start last line of pillars
					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, -866, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, -733, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, -600, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, -467, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, -333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, -200, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, -67, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, 67, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, 200, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, 333, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, 467, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, 600, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, 733, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});

					_cannon.createRigidBody({
						shape: pillar,
						mass: 0,
						position: new CANNON.Vec3(-55000, 866, 1000),
						meshMaterial: new THREE.MeshLambertMaterial({
							color: window.game.static.colors.cyan
						}),
						physicsMaterial: _cannon.solidMaterial
					});
					// end last line

	//^^^^^^^^^^^^^^^^^//
	// *** PILLARS *** //
	//^^^^^^^^^^^^^^^^^//
				}
			]
		},
		determineRandomShapes: function() {
			console.log('create shapes');
			var shapeMinXPosition = _game.player.mesh.position.x - 5000,
					shapeMaxXPosition = _game.player.mesh.position.x - 8000,
					shapeMinSize = 10,
					shapeMaxSize = 50;

			var randX = Math.random() * (shapeMaxXPosition - shapeMinXPosition) + shapeMinXPosition,
		  		randY = Math.random() * 1800 - 900;

		  var randSize = Math.random() * (shapeMaxSize - shapeMinSize) + shapeMinSize,
		  	  randRadius = randSize;

		  var mass = 5,
					zPosition = 200;

		  // var randCylRad = (Math.random() * 200) + 10;
			//
		  // var randomSelected = Math.floor(Math.random() * 2);
			//
		  // switch (randomSelected) {
		  //   case 0:
			// 			_cannon.createRigidBody({
			//         shape: new CANNON.Box(new CANNON.Vec3(randSize, randSize, randSize)),
			//         mass: mass,
			//         position: new CANNON.Vec3(randX, randY, zPosition),
			//         meshMaterial: new THREE.MeshLambertMaterial({
			//           color: window.game.static.colors.cyan
			//         }),
			//         physicsMaterial: _cannon.solidMaterial
		  //     	});
		  //     break;
		    // case 1:
				// 		_cannon.createRigidBody({
			  //       shape: new CANNON.Sphere(randRadius),
			  //       mass: mass,
			  //       position: new CANNON.Vec3(randX, randY, zPosition),
			  //       meshMaterial: new THREE.MeshLambertMaterial({
			  //         color: window.game.static.colors.cyan
			  //       }),
			  //       physicsMaterial: _cannon.solidMaterial
			  //     });
		    //   break;

		  // }
			_cannon.createRigidBody({
				shape: new CANNON.Box(new CANNON.Vec3(randSize, randSize, randSize)),
				mass: mass,
				position: new CANNON.Vec3(randX, randY, zPosition),
				meshMaterial: new THREE.MeshLambertMaterial({
					color: window.game.static.colors.cyan
				}),
				physicsMaterial: _cannon.solidMaterial
			});

		},
		randomShapes: function() {
			_game.determineRandomShapes();
		},
		removeShapes: function() {
			if (_cannon.bodies.length > 4) {
				for (var i = 5; i < _cannon.bodies.length; i++) {
					if (_cannon.bodies[i].position.x >= (_game.player.mesh.position.x + 500)) {
						console.log('removing shapes: ' + _cannon.bodies[i]);
						_cannon.removeVisual(_cannon.bodies[i]);
						// _three.scene.remove()
					}
				}
			} else {
				return;
			}
		},
		randomCrossBeams: function() {
			var zMin = 25,
					zMax = 75,
					xMin = _game.crossBeamRangeMin,
					xMax = _game.crossBeamRangeMax;

			var randX = Math.random() * (xMax - xMin) + xMin,
					randZ = Math.random() * (zMax - zMin) + zMin;

				_cannon.createRigidBody({
					shape: new CANNON.Box(new CANNON.Vec3(25, _game.level.floorWidth, 25)),
					mass: 0,
					position: new CANNON.Vec3(randX, 0, randZ),
					meshMaterial: new THREE.MeshLambertMaterial({
						color: window.game.static.colors.cyan
					}),
					physicsMaterial: _cannon.solidMaterial
				});
		},

		// Methods
		init: function(options) {
			// Setup necessary game components (_events, _three, _cannon, _ui)
			_game.initComponents(options);

			// Create player and level
			_game.player.create();
			_game.level.create();

			// Initiate the game loop
			_game.loop();
		},
		destroy: function() {
			// Pause animation frame loop
			window.cancelAnimationFrame(_animationFrameLoop);

			// Destroy THREE.js scene and Cannon.js world and recreate them
			_cannon.destroy();
			_cannon.setup();
			_three.destroy();
			_three.setup();

			time = _ui.elements.time.textContent;
			totalDistance = 199950 - Math.floor(_game.player.mesh.position.x);
			console.log('the position at the time of destruction is.. ' + _game.player.mesh.position.x);

			// Recreate player and level objects by using initial values which were copied at the first start
			_game.player = window.game.helpers.cloneObject(_gameDefaults.player);
			_game.level = window.game.helpers.cloneObject(_gameDefaults.level);

			_game.levelDifficulty = 1;
			_game.crossBeamRangeMin = 165000;
			_game.crossBeamRangeMax = 50000;

			_game.positionToBeginShapes = 99000;
			_game.positionToStopShapes = 50000;

			// Create player and level again
			_game.player.create();
			_game.level.create();

			updateDatabase();

			// score -= 5;
			// lives -= 1;
			// _ui.elements.time.textContent = '00:00:00';
			// clearTimeout(_ui.elements.t);

			// Continue with the game loop
			_game.loop();
		},
		loop: function() {
			// Assign an id to the animation frame loop
			_animationFrameLoop = window.requestAnimationFrame(_game.loop);

			// Update Cannon.js world and player state
			_cannon.updatePhysics();
			_game.player.update();

			// Render visual scene
			_three.render();
		},
		initComponents: function (options) {
			// Reference game components one time
			_events = window.game.events();
			_three = window.game.three();
			_cannon = window.game.cannon();
			_ui = window.game.ui();

			// Setup lights for THREE.js
			_three.setupLights = function () {
				var hemiLight = new THREE.HemisphereLight(window.game.static.colors.white, window.game.static.colors.white, 0.6);
				hemiLight.position.set(0, 0, -1);
				_three.scene.add(hemiLight);

				var pointLight = new THREE.PointLight(window.game.static.colors.white, 0.5);
				pointLight.position.set(0, 0, 500);
				_three.scene.add(pointLight);
			};

			// Initialize components with options
			_three.init(options);
			_cannon.init(_three);
			_ui.init();
			_events.init();

			// Add specific events for key down
			_events.onKeyDown = function () {
				if (!_ui.hasClass("infoboxIntro", "fade-out")) {
					_ui.fadeOut("infoboxIntro");
				}
				if (!timerStart) {
					_ui.timer();
					timerStart = true;
				}
			};

			updateDatabase = function() {
				$.ajax({
	  			type: "POST",
	  			url: '/update',
	  			data: {time: _ui.elements.time.textContent - time,
								finished: finishedLevels,
								distanceTraveled: totalDistance + ' feet traveled'}
				})
				.done(function() {
					if (finishedLevels === 'Yes') {
						alertify.log('You beat the game in ' + _ui.elements.time.textContent + '! Good Job!', 'success', 5000)
					} else {
						alertify.log('You traveled ' + totalDistance + ' feet in ' + _ui.elements.time.textContent, 'success', 5000);
					}
				})
				.fail(function() {
					alertify.log('Sorry, we couldn\'t update your stats :\(', 'error', 5000);
				});
			};
		}
	};

	// counter variable to keep track of which level function should be called.
	var counter = 0;
	// score variable to keep track of score independent game
	// var score = 10000;
	// lives variable to keep track of lives independent of Game
	// var lives = 3;

	var timerStart = false;
	var finishedLevels = 'No';
	var totalDistance = 0;
	var time = 0;

	// Internal variables
	var _events;
	var _three;
	var _cannon;
	var _ui;
	var _animationFrameLoop;
	// Game defaults which will be set one time after first start
	var _gameDefaults = {
		player: window.game.helpers.cloneObject(_game.player),
		level: window.game.helpers.cloneObject(_game.level)
	};

	return _game;
};
