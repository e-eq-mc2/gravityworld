var Matter  = require("matter-js");
//var MatterAttractors = require("matter-attractors");

//Matter.use(MatterAttractors);

var Engine     = Matter.Engine,
    Events     = Matter.Events,
    Runner     = Matter.Runner,
    Render     = Matter.Render,
    World      = Matter.World,
    Body       = Matter.Body,
    Mouse      = Matter.Mouse,
    Common     = Matter.Common,
    Composites = Matter.Composites,
    Composite  = Matter.Composite,
    Bodies     = Matter.Bodies;

// create engine
var engine = Engine.create();
var world = engine.world;

engine.constraintIterations = 1
engine.positionIterations = 1
engine.velocityIterations = 1

const worldWidth  = document.documentElement.clientWidth
const worldHeight = document.documentElement.clientHeight

// create renderer
var render = Render.create({
  element: document.body,
  engine: engine,
  //canvas: canvas,
  options: {
    width: worldWidth,
    height: worldHeight,
    //showAngleIndicator: true,
    wireframes: false,
    background: '#000000',
    pixelRatio: 'auto'
  }
});

Render.run(render);

// create runner
var runner = Runner.create();
Runner.run(runner, engine);

// add bodies
const wallStyle = { fillStyle: '#222' };
const wallThickness = 50;
Composite.add(world, [
  Bodies.rectangle(worldWidth/2,             0,    worldWidth, wallThickness, { isStatic: true, render: wallStyle }),
  Bodies.rectangle(worldWidth/2,   worldHeight,    worldWidth, wallThickness, { isStatic: true, render: wallStyle }),
  Bodies.rectangle(  worldWidth, worldHeight/2, wallThickness,   worldHeight, { isStatic: true, render: wallStyle }),
  Bodies.rectangle(           0, worldHeight/2, wallThickness,   worldHeight, { isStatic: true, render: wallStyle })
]);

// create a body with an attractor
world.gravity.scale = 0.0;

const attract = function(bodyA, bodyB) {
  return {
    x: (bodyA.position.x - bodyB.position.x) * 3.5e-7,
    y: (bodyA.position.y - bodyB.position.y) * 3.5e-7
  }
}

var attractiveBody = Bodies.circle(
	render.options.width / 2,
	render.options.height / 2,
	20, 
	{
		isStatic: true,
		//plugin: {
		//	attractors: [
    //    attract
		//	]
		//}
	}
);

World.add(world, attractiveBody);

var attraction = function(engine) {
  var bodies = Composite.allBodies(engine.world);

  for (var i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    if ( body.isStatic ) continue;

    Body.applyForce(body, body.position, attract(attractiveBody, body));
  }
};

var explosion = function(engine) {
  var bodies = Composite.allBodies(engine.world);

  const abx = attractiveBody.position.x;
  const aby = attractiveBody.position.y;

  for (var i = 0; i < bodies.length; i++) {
    const body = bodies[i];

    if ( body.isStatic ) continue;

    const dx = body.position.x - abx;
    const dy = body.position.y - aby;
    const invl = 1.0 / (dx * dx + dy * dy) ** 0.5;

    const forceMagnitude = 1.0e-1 * Common.random() * body.mass ;

    Body.applyForce(body, body.position, {
      x: forceMagnitude * dx * invl, 
      y: forceMagnitude * dy * invl
    });
  }
};

const timeScaleTargetMax = 0.8;
const timeScaleTargetMin = 0.1;
var timeScaleTarget = timeScaleTargetMax;
var counter = 0;

Events.on(engine, 'afterUpdate', function(event) {
  // tween the timescale for bullet time slow-mo
  engine.timing.timeScale += (timeScaleTarget - engine.timing.timeScale) * 0.05;
  counter += 1;

  //console.log(`counter: ${counter} timeScale: ${engine.timing.timeScale} timeScaleTarget: ${timeScaleTarget}`);
  // every 1.5 sec
  if (counter >= 60 * 3) {

    // flip the timescale
    if (timeScaleTarget < timeScaleTargetMax) {
      timeScaleTarget = timeScaleTargetMax;
    } else {
      timeScaleTarget = timeScaleTargetMin;
    }

    // create some random forces
    explosion(engine);

    // reset counter
    counter = 0;
  } else{
    attraction(engine)
  }
});

const circleStack = function(numx, numy, cx, cy, minRadius, maxRadius) {
  // add some small bouncy circles... remember Swordfish?  
  const aveRadius = (maxRadius - minRadius) / 2
  const x = cx - numx * aveRadius
  const y = cy - numy * aveRadius

  return Composites.stack(x, y, numx, numy, 0, 0, function(x, y) {
    return Bodies.circle(x, y, Common.random(minRadius, maxRadius));
  })
}

Composite.add(world, circleStack(30, 30, worldWidth/2, worldHeight/2, 1, 15));
//Composite.add(world, circleStack(10, 10, worldWidth/2, worldHeight/2, 1,  8));

// add mouse control
var mouse = Mouse.create(render.canvas);

Events.on(engine, 'afterUpdate', function() {
	if ( ! mouse.position.x ) return

	// smoothly move the attractor body towards the mouse
	Body.translate(attractiveBody, {
		x: (mouse.position.x - attractiveBody.position.x) * 0.25,
		y: (mouse.position.y - attractiveBody.position.y) * 0.25
	});
});

//looks for key presses and logs them
document.body.addEventListener("keydown", function(e) {
  //if (e.code == "KeyA") {
  //  Composite.add(world, circleStack(10, 10, worldWidth/2, worldHeight/2, 1,  8));
    console.log(`keydown: ${e.code}`);
  //}
});
document.body.addEventListener("keyup", function(e) {
  if (e.code == "KeyA") {
    Composite.add(world, circleStack(1, 10, worldWidth/2, worldHeight/2, 1,  8));
  }
  console.log(`keyup: ${e.code}`);
});

// fit the render viewport to the scene
Render.lookAt(render, {
  min: { x: 0, y: 0 },
  max: { x: worldWidth, y: worldHeight }
});
