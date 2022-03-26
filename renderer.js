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

const w  = document.documentElement.clientWidth
const h = document.documentElement.clientHeight

const canvas = document.getElementById("blackboard")

// create renderer
const render = Render.create({
  element: document.body,
  engine: engine,
  canvas: canvas,
  options: {
    width: w,
    height: h,
    //showAngleIndicator: true,
    wireframes: false,
    background: '#000000',
    //pixelRatio: 'auto',
    pixelRatio: 1,
    hasBounds: true
  }
});


const walls = new Walls(world, 100)

window.addEventListener('resize', () => { 
  //Matter.Render.setPixelRatio(render, pixelRatio)
  const w = window.innerWidth
  const h = window.innerHeight

  render.bounds.max.x = w
  render.bounds.max.y = h

  render.options.width = w
  render.options.height = h

  render.canvas.width = w
  render.canvas.height = h

  walls.update(w, h)

  //render.canvas.setAttribute('width', w)
  //render.canvas.setAttribute('height', h)

  //Render.lookAt(render, {
  //  min: { x: 0, y: 0 },
  //  max: { x: w, y: h }
  //});

});

Render.run(render);

// create runner
var runner = Runner.create();
Runner.run(runner, engine);

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

function attraction(engine) {
  var bodies = Composite.allBodies(engine.world);

  for (var i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    if ( body.isStatic ) continue;

    Body.applyForce(body, body.position, attract(attractiveBody, body));
  }
};

function explosion(engine) {
  var bodies = Composite.allBodies(engine.world);

  const abx = attractiveBody.position.x;
  const aby = attractiveBody.position.y;

  for (var i = 0; i < bodies.length; i++) {
    const body = bodies[i];

    if ( body.isStatic ) continue;

    const dx = body.position.x - abx;
    const dy = body.position.y - aby;
    const invl = 1.0 / (dx * dx + dy * dy) ** 0.5;

    const forceMagnitude = 2.0e-1 * Common.random() * body.mass ;

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
  if (counter >= 60 * 6) {

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

Composite.add(world, circleStack(30, 30, w/2, h/2, 1, 15));

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

class Walls {
  constructor(world, th, w = window.innerWidth, h = window.innerHeight) {
    this.thickness = th

    this.shiftX = this.thickness / 2 + 2000
    this.world = world

    const baseW = w + this.shiftX*2 + this.thickness
    this.base  = Bodies.rectangle(            w/2, h + this.thickness/2,          baseW, this.thickness, { isStatic: true })
    this.left  = Bodies.rectangle(0 - this.shiftX,                  h/2, this.thickness,              h, { isStatic: true })
    this.right = Bodies.rectangle(w + this.shiftX,                  h/2, this.thickness,              h, { isStatic: true })

    World.add(this.world, this.array())
  }

  array() {
    return [this.base, this.left, this.right]
  }

  update(w = window.innerWidth, h = window.innerHeight) {
    const baseW = w + this.shiftX*2 + this.thickness
    Matter.Body.setPosition(this.base, {x: w/2, y: h + this.thickness/2}) 
    Matter.Body.setVertices(this.base, Matter.Vertices.fromPath(
      'L 0 0 L ' + baseW + ' 0 L ' + baseW + ' ' + this.thickness + ' L 0 ' + this.thickness 
    ))

    Matter.Body.setPosition(this.left, {x: 0 - this.shiftX, y: h/2}) 
    Matter.Body.setVertices(this.left, Matter.Vertices.fromPath(
      'L 0 0 L ' + this.thickness + ' 0 L ' + this.thickness + ' ' + h + ' L 0 ' + h 
    ))

    Matter.Body.setPosition(this.right, {x: w + this.shiftX, y: h/2}) 
    Matter.Body.setVertices(this.right, Matter.Vertices.fromPath(
      'L 0 0 L ' + this.thickness + ' 0 L ' + this.thickness + ' ' + h + ' L 0 ' + h 
    ))
  }

}
