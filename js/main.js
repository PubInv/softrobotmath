// Copyright (C) 2019 by
//   Robert L. Read <read.robert@gmail.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// var tm = UGLY_GLOBAL_SINCE_I_CANT_GET_MY_MODULE_INTO_THE_BROWSER;
// var OPERATION = "normal"; // "normal" or "helices"

"use strict";

var WINDOW_HEIGHT_FACTOR = 0.68;

// Detects webgl
if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
  document.getElementById('threecontainer').innerHTML = "";
}



// Here I attempt to create an abstract prism object.

const PRISM_FACE_RATIO_LENGTH = 1/2;


var PHI_SPRITE;

var bncG;

var INITIAL_NORM_POINT_Y = -0.7;
var INITIAL_NORM_POINT_X = -0.62;

var WORLD_HEIGHT = 2.0;
var GTRANS = new THREE.Matrix4().makeTranslation(0,WORLD_HEIGHT,0);

function addShadowedLight(scene, x, y, z, color, intensity) {
  var directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(x, y, z);
  scene.add(directionalLight);
  directionalLight.castShadow = true;
  var d = 1;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 4;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.bias = -0.005;
}
function createParalellepiped(sx, sy, sz, pos, quat, material) {
  var pp = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
  pp.castShadow = false;;
  pp.receiveShadow = true;
  pp.position.set(pos.x, pos.y, pos.z);
  return pp;

}
// Not sure how to use the quaternion here,
function createSphere(r, pos, color) {
  //    var cmat = memo_color_mat(tcolor);
  var tcolor = new THREE.Color(color);
  var cmat = new THREE.MeshPhongMaterial({ color: tcolor });
  var ball = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), cmat);
  ball.position.set(pos.x, pos.y, pos.z);
  ball.castShadow = false;;
  ball.receiveShadow = true;

  return ball;
}

function get_member_color(gui, len) {
  if (len < am.MIN_EDGE_LENGTH)
    return d3.color("black");
  else if (len > am.MAX_EDGE_LENGTH)
    return d3.color("black");
  else {
    var p = (len - am.MIN_EDGE_LENGTH) / (am.MAX_EDGE_LENGTH - am.MIN_EDGE_LENGTH);
    return d3.rgb(gui.color_scale(len));
  }
}

function create_actuator(b_a, b_z, pos, cmat) {
  var len = b_z.distanceTo(b_a) + -am.JOINT_RADIUS;
  var quat = new THREE.Quaternion();

  var pos = new THREE.Vector3(b_z.x, b_z.y, b_z.z);
  pos.add(b_a);
  pos.divideScalar(2);

  var mesh = createParalellepiped(
    am.INITIAL_EDGE_WIDTH,
    am.INITIAL_EDGE_WIDTH,
    len,
    pos,
    quat,
    cmat);

  mesh.lookAt(b_z);

  mesh.castShadow = false;;
  mesh.receiveShadow = true;
  am.scene.add(mesh);
  mesh.structureKind = "member";
  mesh.name = b_a.name + " " + b_z.name;
  return mesh;
}

function create_actuator_pure(b_a, b_z,jr,w, cmat) {
  var len = b_z.distanceTo(b_a) + -jr;
  var quat = new THREE.Quaternion();

  var pos = new THREE.Vector3(b_z.x, b_z.y, b_z.z);
  pos.add(b_a);
  pos.divideScalar(2);

  var mesh = createParalellepiped(
    w,
    w,
    len,
    pos,
    quat,
    cmat);

  mesh.lookAt(b_z);

  mesh.castShadow = false;;
  mesh.receiveShadow = true;
  //    am.scene.add(mesh);
  mesh.structureKind = "member";
  mesh.name = b_a.name + " " + b_z.name;
  return mesh;
}

function memo_color_mat(tcolor) {
  var string = tcolor.getHexString();
  if (!(string in am.color_material_palette)) {
    var cmat = new THREE.MeshPhongMaterial({ color: tcolor });
    am.color_material_palette[string] = cmat;
  }
  return am.color_material_palette[string]
}

var scolors = [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Indigo")];
var smats = [new THREE.Color(0x8B0000),
             new THREE.Color(0xFF8C00),
             new THREE.Color(0x000082)];

function create_vertex_mesh(pos, c) {
  var mesh = createSphere(am.JOINT_RADIUS/2, pos, c.hex());
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  am.scene.add(mesh);
  return mesh;
}

function cto3(c) {
  return new THREE.Color(c.hex());
}

function get_random_int(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function get_direction(n, v, i) {
  if (n < 10)
    return get_random_int(3);
  else return -1;
}

function get_vertex(n, v, i, pa, pb, pc, s, l, m) {
  var valid = { v: true };
  var l0 = pa.distanceTo(pb);
  var l1 = pc.distanceTo(pa);
  var l2 = pb.distanceTo(pc);
  var ad = m ? s[0]-l0 : (n % 2 == 0) ? l[0] : l[3];
  var bd = m ? s[1]-l1 : (n % 2 == 0) ? l[1] : l[4];
  var cd = m ? s[2]-l2 : (n % 2 == 0) ? l[2] : l[5];
  var pd = find_fourth_point_given_three_points_and_three_distances(
    CHIRALITY_CCW,
    pa, pb, pc,
    ad, bd, cd,
    valid);
  return pd;
}
var colors = [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Indigo"), d3.color("purple"), d3.color("black")];
function get_colors(n, v, i) {
  return [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Indigo"), d3.color("purple")];
}

var AM = function () {
  this.container,
  this.stats;
  this.camera;
  this.controls;
  this.scene;
  this.sceneOrtho;
  this.renderer;
  this.textureLoader;
  this.clock = new THREE.Clock();
  this.clickRequest = false;
  this.mouseCoords = new THREE.Vector2();
  this.raycaster = new THREE.Raycaster();
  this.ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
  this.pos = new THREE.Vector3();
  this.quat = new THREE.Quaternion();


  this.BT_CONSTRAINT_STOP_CFM = 3;
  this.BT_CONSTRAINT_STOP_ERP = 1
  this.myCFMvalue = 0.0;
  this.myERPvalue = 0.8;

  this.jointBody = null;

  this.playgroundDimensions = {
    w: 10,
    d: 10,
    h: 3
  };
  this.GROUND_WIDTH = 1.0;

  this.gravity_on = true;
  this.margin = 0.05;

  this.armMovement = 0;

  //    this.window_height_factor = 1/4.0;
  this.window_height_factor = WINDOW_HEIGHT_FACTOR;
  // Sadly, this seems to do nothing!
  this.CAMERA_RADIUS_FACTOR = 1;

  this.grid_scene = null;
  // Used in manipulation of objects
  this.gplane = false;


  this.NUMBER_OF_TETRAHEDRA = 70;


//  this.JOINT_RADIUS = 0.09 * this.INITIAL_EDGE_LENGTH; // This is the current turret joint ball.

  this.LENGTH_FACTOR = 20;

  // Helices look like this...
  // {
  // 	helix_joints: [],
  // 	helix_members: []
  // }
  this.helices = [];



  this.meshes = [];
  this.bodies = [];


  // This is sometimes useful for debugging.
  //    this.jointGeo = new THREE.BoxGeometry( this.JOINT_RADIUS*2,this.JOINT_RADIUS*2,this.JOINT_RADIUS*2);
//  this.jointGeo = new THREE.SphereGeometry(this.JOINT_RADIUS, 32, 32);
  this.jointMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });

  this.floorTexture = new THREE.ImageUtils.loadTexture("images/logo-white-background.png");

  this.MIN_EDGE_LENGTH = this.INITIAL_EDGE_LENGTH / 2;
  this.MAX_EDGE_LENGTH = this.INITIAL_EDGE_LENGTH * 2;
  this.color_scale = d3.scale.quantile().domain([this.MIN_EDGE_LENGTH, this.MAX_EDGE_LENGTH])
    .range(['violet', 'indigo', '#8A2BE2', 'blue', 'green', 'yellow', '#FFD700', 'orange', '#FF4500']);
  this.color_material_palette = {};

  this.GROUND_PLANE_MESH;
  this.GROUND_BODY;

  this.latestLookAt = new THREE.Vector3(0, 0, 0);

  this.helix_params = [];

  // a final adjustment
  this.INITIAL_EDGE_WIDTH *= 4;
  this.JOINT_RADIUS *= 3;

}

AM.prototype.clear_non_floor_body_mesh_pairs = function () {
  this.meshes = [];
  this.bodies = [];
  this.meshes.push(am.GROUND_PLANE_MESH);
  this.bodies.push(am.GROUND_BODY);
}

var am = new AM();


var bulbLight, bulbMat, ambientLight, object, loader, stats;
var ballMat, cubeMat, floorMat;
// ref for lumens: http://www.power-sure.com/lumens.htm
var bulbLuminousPowers = {
  "110000 lm (1000W)": 110000,
  "3500 lm (300W)": 3500,
  "1700 lm (100W)": 1700,
  "800 lm (60W)": 800,
  "400 lm (40W)": 400,
  "180 lm (25W)": 180,
  "20 lm (4W)": 20,
  "Off": 0
};
// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
var hemiLuminousIrradiances = {
  "0.0001 lx (Moonless Night)": 0.0001,
  "0.002 lx (Night Airglow)": 0.002,
  "0.5 lx (Full Moon)": 0.5,
  "3.4 lx (City Twilight)": 3.4,
  "50 lx (Living Room)": 50,
  "100 lx (Very Overcast)": 100,
  "350 lx (Office Room)": 350,
  "400 lx (Sunrise/Sunset)": 400,
  "1000 lx (Overcast)": 1000,
  "18000 lx (Daylight)": 18000,
  "50000 lx (Direct Sun)": 50000
};
var params = {
  shadows: true,
  exposure: 0.68,
  bulbPower: Object.keys(bulbLuminousPowers)[4],
  hemiIrradiance: Object.keys(hemiLuminousIrradiances)[0]
};


function initGraphics() {

  am.container = document.getElementById('threecontainer');

  var PERSPECTIVE_NEAR = 0.3;

  am.camera = new THREE.PerspectiveCamera(60, window.innerWidth / (window.innerHeight * am.window_height_factor), PERSPECTIVE_NEAR, 2000);

  //   am.camera.aspect = window.innerWidth / (window.innerHeight * am.window_height_factor);

  var origin = new THREE.Vector3(0, 0, 0);
  am.camera.lookAt(origin);

  am.scene = new THREE.Scene();
  am.scene.fog = new THREE.Fog(0x000000, 500, 10000);

  am.camera.position.x = -0.25;
  am.camera.position.y = 2.5;
  am.camera.position.z = 4;

  am.controls = new THREE.OrbitControls(am.camera, am.container);
  am.controls.target.set(0, 0, 0);

  am.renderer = new THREE.WebGLRenderer({ antialias: true });
  am.renderer.setClearColor(0xffffff);
  am.renderer.autoClearColor = true;

  am.renderer.setPixelRatio(window.devicePixelRatio);
  am.renderer.setSize(window.innerWidth, window.innerHeight * am.window_height_factor);
  am.SCREEN_WIDTH = am.renderer.getSize().width;
  am.SCREEN_HEIGHT = am.renderer.getSize().height;
  am.CAMERA_RADIUS_FACTOR = 1;
  am.camera.radius = (am.SCREEN_WIDTH + am.SCREEN_HEIGHT) / am.CAMERA_RADIUS_FACTOR;


  am.cameraOrtho = new THREE.OrthographicCamera(0, am.SCREEN_WIDTH, am.SCREEN_HEIGHT, 0, - 10, 10);

  var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  am.scene.add(hemiLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//  directionalLight.position = new THREE.Vector3(100, 5, 0);
  am.scene.add(directionalLight);

  var ambientLight = new THREE.AmbientLight(0x404040);

  am.grid_scene = new THREE.Scene();
  am.grid_scene.fog = new THREE.Fog(0x000000, 500, 10000);

  // GROUND
  var groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
  var groundMat;
  groundMat = new THREE.MeshPhongMaterial({ color: 0x777777, specular: 0x050505 });

  var ground = new THREE.Mesh(groundGeo, groundMat);
  ground.name = "GROUND";
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  am.scene.add(ground);

  ground.receiveShadow = true;

  // HACK:  These diemensions are probably not right here!
  gridInit(am.grid_scene, am.playgroundDimensions);

  {
    var xdir = new THREE.Vector3( 1, 0, 0 );
    var ydir = new THREE.Vector3( 0, 1, 0 );
    var zdir = new THREE.Vector3( 0, 0, 1 );

    // a good idea
    xdir.normalize();
    ydir.normalize();
    zdir.normalize();

    var origin = new THREE.Vector3( 0, 0, 0 );
    var length = 1.5;
    var hex = 0xffff00;

    var xarrowHelper = new THREE.ArrowHelper( xdir, origin, length, 0xff0000 );
    var yarrowHelper = new THREE.ArrowHelper( ydir, origin, length, 0x00aa00 );
    var zarrowHelper = new THREE.ArrowHelper( zdir, origin, length, 0x0000ff );

    am.scene.add( xarrowHelper );
    am.scene.add( yarrowHelper );
    am.scene.add( zarrowHelper );
  }


  am.container.innerHTML = "";

  am.container.appendChild(am.renderer.domElement);

  am.sceneOrtho = new THREE.Scene();

  window.addEventListener('resize', onWindowResize, false);




}

AM.prototype.push_body_mesh_pair = function (body, mesh) {
  this.meshes.push(mesh);
  this.bodies.push(body);
}
AM.prototype.remove_body_mesh_pair = function (body, mesh) {
  for (var i = this.meshes.length - 1; i >= 0; i--) {
    if (this.meshes[i].name === mesh.name) {
      this.meshes.splice(i, 1);
      this.bodies.splice(i, 1);
    }
  }
  for (var i = this.rigidBodies.length - 1; i >= 0; i--) {
    if (this.rigidBodies[i].name === body.name) {
      this.rigidBodies.splice(i, 1);
    }
  }
}


function onWindowResize() {
  am.camera.aspect = window.innerWidth / (window.innerHeight * am.window_height_factor);
  am.renderer.setSize(window.innerWidth, window.innerHeight * am.window_height_factor);

  am.camera.updateProjectionMatrix();
  am.SCREEN_WIDTH = am.renderer.getSize().width;
  am.SCREEN_HEIGHT = am.renderer.getSize().height;
  this.CAMERA_RADIUS_FACTOR = 1;
  am.camera.radius = (am.SCREEN_WIDTH + am.SCREEN_HEIGHT) / this.CAMERA_RADIUS_FACTOR;

  am.cameraOrtho = new THREE.OrthographicCamera(0, am.SCREEN_WIDTH, am.SCREEN_HEIGHT, 0, - 10, 10);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

var sprite_controls = new function () {
  this.size = 50;
  this.sprite = 0;
  this.transparent = true;
  this.opacity = 0.6;
  this.colorize = 0xffffff;
  this.textcolor = "yellow";
  this.rotateSystem = true;

  this.clear = function (x, y) {
    am.sceneOrtho.children.forEach(function (child) {
      if (child instanceof THREE.Sprite) am.sceneOrtho.remove(child);
    })
  };

  this.draw_and_create = function (sprite, x, y, message) {
    var fontsize = 128;
    var ctx, texture,
        spriteMaterial,
        canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    ctx.font = fontsize + "px Arial";

    // setting canvas width/height before ctx draw, else canvas is empty
    canvas.width = ctx.measureText(message).width;
    canvas.height = fontsize * 1; // fontsize * 1.5

    // after setting the canvas width/height we have to re-set font to apply!?! looks like ctx reset
    ctx.font = fontsize + "px Arial";
    ctx.fillStyle = this.textcolor;
    ctx.fillText(message, 0, fontsize);

    texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter; // NearestFilter;
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({
      opacity: this.opacity,
      color: this.colorize,
      transparent: this.transparent,
      map: texture
    });

    spriteMaterial.scaleByViewport = true;
    spriteMaterial.blending = THREE.AdditiveBlending;

    if (!sprite) {
      sprite = new THREE.Sprite(spriteMaterial);
    }

    sprite.scale.set(this.size, this.size, this.size);
    sprite.position.set(x, y, 0);

    am.sceneOrtho.add(sprite);
    return sprite;
  };
};

function render() {
  var deltaTime = am.clock.getDelta();

//  sprite_controls.clear();
  am.controls.update(deltaTime);


  // note this....
  //    am.renderer.autoClear = true;
  am.renderer.render(am.scene, am.camera);
  am.renderer.render(am.grid_scene, am.camera);
  am.renderer.autoClear = false;
  am.renderer.render(am.sceneOrtho, am.cameraOrtho);
}

function initiation_stuff() {
  // Initialize Three.js
  if (!Detector.webgl) Detector.addGetWebGLMessage();
}


function init() {
  initGraphics();
}


initiation_stuff();

init();
animate();



// Find the normal to a triangle in 3space: https://stackoverflow.com/questions/19350792/calculate-normal-of-a-single-triangle-in-3d-space
// arguments THREE.js Vector3's
function normal(a, b, c) {
  var U = b.sub(a);
  var V = c.sub(a);
  return U.cross(V);
}

function clearAm() {
  am.clear_non_floor_body_mesh_pairs();
  for (var i = am.scene.children.length - 1; i >= 0; i--) {
    var obj = am.scene.children[i];
    if (obj.debugObject) {
      am.scene.remove(obj);
    }
    if (obj.type == "Mesh" && obj.name != "GROUND") {
      am.scene.remove(obj);
    }
    if ((obj.name == "HELIX") || (obj.name == "AXIS") || (obj.name == "SUPERSTRUCTURE")) {
      am.scene.remove(obj);
    }
    if ((obj.type == "PROTRACTOR_LINE") || (obj.type == "PROTRACTOR_SPHERE")) {
      am.scene.remove(obj);
    }

  }
  am.helices = [];
  am.helix_params = [];
}


// construct a cone that is sort of around sphere at c
// with apex at point apex of half-angle angle
function positionConeOnSphere(apex,c,angle,color) {
  var len = apex.distanceTo(c);
  var r = len * Math.tan(angle);
  var geometry = new THREE.ConeGeometry( r, len, 32, false );
  var material = new THREE.MeshPhongMaterial( {color: color, opacity: 0.3, transparent: true} );
  var cone = new THREE.Mesh( geometry, material );
  cone.castShadow = true;
  cone.receiveShadow = true;
  cone.debugObject = true;
  const TM0 = new THREE.Matrix4().makeTranslation(0,(len/2),0);
  cone.applyMatrix(TM0);

  const Y = new THREE.Vector3(0,1,0);
  const apex_dir = apex.clone();
  apex_dir.sub(c);
  apex_dir.normalize();
  let qzn = new THREE.Quaternion();
  qzn.setFromUnitVectors(Y,apex_dir);
  const RM1 = new THREE.Matrix4().makeRotationFromQuaternion(qzn);
  cone.applyMatrix(RM1);

  const TM1 = new THREE.Matrix4().makeTranslation(c.x,c.y,c.z);
  cone.applyMatrix(TM1);

  return cone;
}
// This is done only for the rendering...
function render_tentacle() {
  const NUM_LEVELS = 10;
  const R = 1;
  for(var i = 0; i < NUM_LEVELS; i++) {
    const a = R*2;
    const h = a*Math.sqrt(3)/2;
    var A = new THREE.Vector3(a/2,i*R*2,-h/2);
    var B = new THREE.Vector3(0,i*R*2,h/2);
    var C = new THREE.Vector3(-a/2,i*R*2,-h/2);

    var ma = createSphere(R,A,colors[0].hex());
    var mb = createSphere(R,B,colors[1].hex());
    var mc = createSphere(R,C,colors[2].hex());

    ma.castShadow = false;
    ma.receiveShadow = false;
    ma.debugObject = true;
    am.scene.add(ma);

    mb.castShadow = false;
    mb.receiveShadow = false;
    mb.debugObject = true;
    am.scene.add(mb);

    mc.castShadow = false;
    mc.receiveShadow = false;
    mc.debugObject = true;
    am.scene.add(mc);

    var geometry = new THREE.CircleGeometry( 2*R, 32 );
    geometry.rotateX(Math.PI/2);
    geometry.translate(0,i*2+R,0);

    var pmaterial = new THREE.MeshPhongMaterial( {color: 0xffff00, transparent: true, opacity: 0.7, side: THREE.DoubleSide} );
    var circle = new THREE.Mesh( geometry,pmaterial );
    circle.debugObject = true;

    am.scene.add( circle );
  }

}
const RENDER_TENTACLE = false;

// This routine will be constantly evolving
// This is my attempt to use the interface to check my inversion math as I develop it.
// I have had a lot of trouble with this; I have to go carefully and check every step.
function computeInversion_fromUI() {
  const [a,b,c,U_x,H_y,Z_z] = computeInversion(RADIUS_A,THETA_D*Math.PI/180,GAMMA_D*Math.PI/180);
  if (isNaN(U_x)) debugger;
  $( "#U_x" ).val( format_num(U_x,3) );
  $( "#H_y" ).val( format_num(H_y,3) );
  $( "#r_b_inv" ).val( format_num(b,3) );
  $( "#Z_z" ).val( format_num(Z_z,3) );
  $( "#c_inv" ).val( format_num(c,3) );

  return [a,b,c,U_x,H_y,Z_z];
}

function setThetaGammaValues(theta,gamma) {
  if (isNaN(gamma)) debugger;
  if (isNaN(theta)) debugger;
  THETA_D = theta * 180 / Math.PI;
  GAMMA_D = gamma * 180 / Math.PI;
  $( "#theta_slider" ).slider( "value", THETA_D );
  $( "#d_theta" ).val( format_num(THETA_D,3) );
  $( "#theta" ).val( format_num(THETA_D,3) );

  $( "#gamma_slider" ).slider( "value", GAMMA_D );
  $( "#d_gamma" ).val( format_num(GAMMA_D,3) );
  $( "#gamma" ).val( format_num(GAMMA_D,3) );

}

// This is the main recomputation
function onComputeParams() {

  clearAm();
  if (RENDER_TENTACLE) {
    render_tentacle();
    return;
  }

  const ra = $( "#radius_a_slider" ).slider( "value" );
  const rb = $( "#radius_b_slider" ).slider( "value" );
  const rc = $( "#radius_c_slider" ).slider( "value" );

  let colors = [d3.color("DarkRed"),
                d3.color("DarkOrange"),
                d3.color("Green")];

  const vs = Compute3TouchingCircles(ra,rb,rc);

  const A2d = vs[0];
  const B2d = vs[1];
  const C2d = vs[2];
  const A = new THREE.Vector3(A2d.x,0,A2d.y);
  const B = new THREE.Vector3(B2d.x,0,B2d.y);
  const C = new THREE.Vector3(C2d.x,0,C2d.y);

  console.assert(near(A.distanceTo(B),ra+rb));
  console.assert(near(B.distanceTo(C),rb+rc));
  console.assert(near(A.distanceTo(C),ra+rc));

  // Cone Axes
  // const A1 = new THREE.Vector3().subVectors(A,B);
  // const A2 = new THREE.Vector3().subVectors(B,C);
  // const A3 = new THREE.Vector3().subVectors(C,A);

  // const A1unit = A1.clone().clampLength(1.0,1.0);
  // const A2unit = A2.clone().clampLength(1.0,1.0);
  // const A3unit = A3.clone().clampLength(1.0,1.0);


  const theta1 = ComputeAxisAngleOfCone(ra,rb);
  if (isNaN(theta1)) {
    debugger;
  }
  const theta2 = ComputeAxisAngleOfCone(rb,rc);
  if (isNaN(theta2)) {
    debugger;
  }
  const theta3 = ComputeAxisAngleOfCone(rc,ra);
  if (isNaN(theta3)) {
    debugger;
  }

  let [cA1,cA2,cA3] = GetConeApices(ra,rb,rc,A,B,C,theta1,theta2,theta3);
  var ma = createSphere(ra,A,colors[0].hex());
  var mb = createSphere(rb,B,colors[1].hex());
  var mc = createSphere(rc,C,colors[2].hex());

  ma.castShadow = false;
  ma.receiveShadow = false;
  ma.debugObject = true;
  am.scene.add(ma);

  mb.castShadow = false;
  mb.receiveShadow = false;
  mb.debugObject = true;
  am.scene.add(mb);

  mc.castShadow = false;
  mc.receiveShadow = false;
  mc.debugObject = true;
  am.scene.add(mc);

  // Add Apex points

  var map = createSphere(0.1,cA1,colors[0].hex());
  var mbp = createSphere(0.1,cA2,colors[1].hex());
  var mcp = createSphere(0.1,cA3,colors[2].hex());
  map.debugObject = true;
  mbp.debugObject = true;
  mcp.debugObject = true;
  am.scene.add(map);
  am.scene.add(mbp);
  am.scene.add(mcp);


  // Add Cones
  var coneab;
  var coneac;
  var conebc;
  if (ra != rb) {
    var coneab = positionConeOnSphere(cA1,A,ComputeAxisAngleOfCone(ra,rb),0xff00);
    am.scene.add(coneab);
  }
  if (ra != rc) {
    var coneac = positionConeOnSphere(cA3,A,ComputeAxisAngleOfCone(ra,rc),0x0000ff);
    am.scene.add(coneac);
  }
  if (rb != rc) {
    var conebc = positionConeOnSphere(cA2,B,ComputeAxisAngleOfCone(rb,rc),0x00ff00);
    am.scene.add(conebc);
  }


  var gamma;
  var theta;
  var zprime;

  [theta,gamma,zprime] =
    ComputeThetaAndGamma(ra,rb,rc,A,B,C,cA1,cA2,cA3);
  if (isNaN(gamma)) debugger;

  // The THREE system uses a different coordinate system that what we are using, so we negate these here...
  theta = -theta;

  const Z = new THREE.Vector3(0,0,1);
  const Y = new THREE.Vector3(0,1,0);
  const X = new THREE.Vector3(1,0,0);

  var Pp = new THREE.Vector3(0,1,0);
  var Pp1 = new THREE.Vector3(0,1,0);
  var Pp2 = new THREE.Vector3(0,1,0);

  Pp.applyAxisAngle(Z,theta);
  Pp1.applyAxisAngle(Z,theta);

  Pp2.applyAxisAngle(Z,Math.PI/2);

  Pp.applyAxisAngle(X,gamma);

  Pp2.applyAxisAngle(X,gamma);

  // var ppHelper = new THREE.ArrowHelper( Pp, A, 4, 0xff0000 );
  // ppHelper.debugObject = true;
  // am.scene.add( ppHelper );

  var ppHelper1 = new THREE.ArrowHelper( Pp1, A, 3, 0x00ff00 );
  ppHelper1.debugObject = true;
  am.scene.add( ppHelper1 );

  var ppHelper2 = new THREE.ArrowHelper( Pp2, A, 3, 0x0000ff );
  ppHelper2.debugObject = true;
  am.scene.add( ppHelper2 );

  var N = Pp.clone();
  N.clampLength(1,1);
  // is this the normal? YES

  // Now I want the equation of the plane...
  var H_y;
  if (ra != rb) {
    const U = new THREE.Vector3(cA1.length(),0,0);
    const plane_const = N.dot(U);
    // Now I want to create
    // Check... This is the sphere at y intersection on the plane
    var H_y =  plane_const/N.y;
  } else {
    H_y = ra;
  }

  var check_s = createSphere(0.05,
                             new THREE.Vector3(0,H_y,0),0x00ff88);

  check_s.castShadow = false;
  check_s.receiveShadow = false;
  check_s.debugObject = true;
  am.scene.add(check_s);

//  const H = new THREE.Vector3(0,H_y,0);

  const Origin = new THREE.Vector3(0,0,0);

  var geometry = new THREE.PlaneGeometry( 20, 20, 32 );
  var pmaterial = new THREE.MeshPhongMaterial( {color: 0xffff00, transparent: true, opacity: 0.2, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, pmaterial );
  plane.debugObject = true;
  let qz = new THREE.Quaternion();
  qz.setFromUnitVectors(Z,Y);
  const RM0 = new THREE.Matrix4().makeRotationFromQuaternion(qz);
  plane.applyMatrix(RM0);

  // S is my attempt to construct a true "support point"
  const S = A.clone().add(N.clone().clampLength(ra,ra));
   let qzn = new THREE.Quaternion();
  qzn.setFromUnitVectors(Y,N);
  const RM1 = new THREE.Matrix4().makeRotationFromQuaternion(qzn);
  plane.applyMatrix(RM1);

  const TM0 = new THREE.Matrix4().makeTranslation(S.x,S.y,S.z);
  plane.applyMatrix(TM0);
  am.scene.add( plane );

  var narrowHelper = new THREE.ArrowHelper( N, S,2, 0xff00ff );
  narrowHelper.debugObject = true;
  am.scene.add( narrowHelper );

  var zc = createSphere(0.1,new THREE.Vector3(0,0,zprime),0xffffff);

  zc.castShadow = false;
  zc.receiveShadow = false;
  zc.debugObject = true;
  am.scene.add(zc);

  // Now in the UI, set debugging values...
  if (ra != rb) {
    $( "#U_x" ).val( format_num(cA1.x,3) );
  }
  $( "#H_y" ).val( format_num(H_y,3) );
  $( "#r_b_inv" ).val( format_num(rb,3) );
  $( "#Z_z" ).val( format_num(zprime,3) );
  $( "#c_inv" ).val( format_num(rc,3) );

  // We're returning this in our computational system,
  // but we've set it up differently in THREE.
  // THREE is right handed, but we use a left-handed system in our paper.
  // We use the left-handed system in our description of Z on
  // the website for debugging purposes.
  return [-theta,gamma];
}

function main() {
  const [theta,gamma] = onComputeParams();
  setThetaGammaValues(theta,gamma);
}



// Render a Helix of radius r, with theta, v is the vector
// The helix is parallel to the vector v.
// The helix is centered on the y axis, and the two points
// at n = -1, n = 0, or centered on the z axis.
var gmat = new THREE.LineBasicMaterial({color: "green"});

function format_num(num,digits) {
  return parseFloat(Math.round(num * 10**digits) / 10**digits).toFixed(digits);
}

// I'm treating a label spreat as an object having postion p,
// color c, and text t.
var A_SPRITE = { p: new THREE.Vector3(0,0,0),
                 c: "red",
                 yd: -0.0,
                 t: "A"};
var B_SPRITE = { p: new THREE.Vector3(0,0,0),
                 c: "blue",
                 yd: -0.0,
                 t: "B"};
var C_SPRITE = { p: new THREE.Vector3(0,0,0),
                 c: "green",
                 yd: -0.0,
                 t: "C"};

var Ba_SPRITE = { p: new THREE.Vector3(0,0,0),
                  c: "blue",
                  yd: -0.4,
                  t: "Ba"};
var Ca_SPRITE = { p: new THREE.Vector3(0,0,0),
                  c: "green",
                  yd: -0.4,
                  t: "Ca"};

var D_SPRITE = { p: new THREE.Vector3(0,0,0),
                 c: "purple",
                 yd: 0,
                 t: "D"};
var PHI_SPRITE = { p: new THREE.Vector3(0,0,0),
                   c: "green",
                   yd: 0,
                   t: "D"};
var TAU_SPRITE = { p: new THREE.Vector3(0,0,0),
                   c: "green",
                   yd: 0,
                   t: "D"};
var THETA_SPRITE = { p: new THREE.Vector3(0,0,0),
                     c: "green",
                     yd: 0,
                     t: "D"};

var LABEL_SPRITES = [
  A_SPRITE,
  B_SPRITE,
  C_SPRITE,
  Ba_SPRITE,
  Ca_SPRITE,
  D_SPRITE,
  PHI_SPRITE,
  TAU_SPRITE,
  THETA_SPRITE
                    ];
// Create a visual protractor betwen points A, B, C in 3space
// This should really use an ellipse curver to make a fine
// protractor. However, I will just use a straightline instead
// for now.
// obj is a sprite object to attach the label two
  function lineBetwixt(A,B,color) {
    var BApoints = new THREE.Geometry();
    BApoints.vertices.push(B.clone());
    BApoints.vertices.push(A.clone());
    var BAline = new THREE.Line(BApoints, new THREE.LineBasicMaterial({color: color,linewidth: 10}));
    am.scene.add(BAline);
    BAline.type = "PROTRACTOR_LINE";
    return BAline;
  }
  function cSphere(size,p,color) {
    var mesh = createSphere(size, p, color);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.debugObject = true;
    mesh.type = "PROTRACTOR_SPHERE";
    am.scene.add(mesh);
  }

// Create an arc centered on B, touch A and C.
// At the moment, I will insist that BA = BC.
function createArc(color,A,B,C) {
  const radius = B.distanceTo(A);
  const BA = A.clone().sub(B);
  const BC = C.clone().sub(B);
  const M = vMidPoint(A,C);
  const BM = M.clone().sub(B); // Vector from B to Midpoint M.

  const angle = BA.angleTo(BC);

  const normal = BA.cross(BC);
  normal.normalize();
  // we compute the normal so we have one vector to rotate


  const Mc = BM.clone();
  const Z = new THREE.Vector3(0,0,1);
  const X = new THREE.Vector3(1,0,0);
  let qz = new THREE.Quaternion();
  qz.setFromUnitVectors(normal,Z);
  // q is the inverse quaternion to qz..
  let q = new THREE.Quaternion();
  q.setFromUnitVectors(Z,normal);

  // qz will now rotate the "normal" into Z.
  Mc.applyQuaternion(qz);
  // Mc is now rotated such that the normal is at Z...
  // that puts Mc somewhere in the Z = 0 XY plane.

  // We we want to compute the angle around the X axis...
  const rotAboutNorm = Math.atan2(Mc.y,Mc.x);

  // now we create the actual ellipse...
  // The idea is to split the difference between the angles
  // by taking the midpoint.
  var curve = new THREE.EllipseCurve(
    0,  0,            // ax, aY
    radius, radius,           // xRadius, yRadius
    rotAboutNorm-angle/2,  rotAboutNorm + angle/2,  // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
  );

  var points = curve.getPoints( 50 );
  var geometry = new THREE.BufferGeometry().setFromPoints( points );

  var material = new THREE.LineBasicMaterial( { color : color } );

  // Create the final object to add to the scene
  var ellipse = new THREE.Line( geometry, material );

  ellipse.quaternion = q.clone();

  // This is the inverse quaternion; it seems to be required to
  // set it this qy.
  ellipse.quaternion.setFromUnitVectors(Z,normal);

  ellipse.type = "PROTRACTOR_LINE";
  ellipse.position.copy(B);

  am.scene.add(ellipse);
}
function vMidPoint(A,B) {
    return new THREE.Vector3((A.x + B.x)/2,(A.y + B.y)/2,(A.z + B.z)/2);
}
function createProtractor(obj,prefix,color,A,B,C) {

  const size = am.JOINT_RADIUS/5;

  function cSphere(size,p,color) {
    var mesh = createSphere(size, p, color);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.debugObject = true;
    mesh.type = "PROTRACTOR_SPHERE";
    am.scene.add(mesh);
  }

  cSphere(size,A,color);
  cSphere(size,B,color);
  cSphere(size,C,color);
  lineBetwixt(B,A,color);
  lineBetwixt(B,C,color);


  // now compute intermediate points....
  // how should this work if one is very small?
  const BtoA = A.clone().sub(B);
  const BtoC = C.clone().sub(B);
  const b_to_a = BtoA.length();
  const b_to_c = BtoC.length();
  var minLength = Math.min(b_to_a,b_to_c);
  var avgMidLength = (b_to_a + b_to_c)/4;
  var lengthToDraw = Math.min(minLength,avgMidLength);
  // Now that we have the length, we'll move along our vectors
  // to create new points...
  BtoA.clampLength(lengthToDraw,lengthToDraw);
  BtoC.clampLength(lengthToDraw,lengthToDraw);
  const Ap = B.clone().add(BtoA);
  const Cp = B.clone().add(BtoC);
  cSphere(size/4.0,Ap,color);
  cSphere(size/4.0,Cp,color);

  // TODO: This sometimes fails based on order
  createArc(color,Ap,B,Cp);
//  createArc(color,Cp,B,Ap);

  const PpCp_mid = vMidPoint(Ap,Cp);

  obj.p = PpCp_mid.clone();

  // There is a problem here that this is unsigned...
  const angle_rads = BtoA.angleTo(BtoC);
  obj.t = prefix + format_num((angle_rads * 180 / Math.PI),1) + " deg";
  obj.c = color;
}


const LABEL_SPRITE_FONT_SIZE = 20;
function renderSprite(obj) {
  const FifteenSpaces = "               ";

  if (obj.s) {
    am.grid_scene.remove(obj.s);
  }

  obj.s = makeTextSprite(FifteenSpaces + obj.t,
                              {fontsize: LABEL_SPRITE_FONT_SIZE},
                              obj.c );

  obj.s.position.set(obj.p.x,obj.p.y+obj.yd,obj.p.z);
  am.grid_scene.add(obj.s);
}

function renderSprites() {
  LABEL_SPRITES.forEach(s => renderSprite(s));
}

function addDebugSphere(am,pos,color) {
  if (!color) {
    color = "yellow";
  }
  var mesh = createSphere(am.JOINT_RADIUS/5, pos, color);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.debugObject = true;
  am.scene.add(mesh);
}
var RADIUS_A = 1.2;
var RADIUS_B = 0.9;
var RADIUS_C = 0.5;

var THETA_D = 0;
var GAMMA_D = 0;
  // Note: C may be null, meaning we have an unspecified value
  function setRadiusValues(a,b,c) {
    if (c == null) {
      console.log("c is null");
      debugger;
    }
    RADIUS_A =  a;
    RADIUS_B =  b;
    RADIUS_C =  c;
    $( "#radius_a_slider" ).slider( "value", RADIUS_A );
    $( "#r_a" ).val( format_num(RADIUS_A,3) );
    $( "#radius_a" ).val( format_num(RADIUS_A,3) );

    $( "#radius_b_slider" ).slider( "value", RADIUS_B );
    $( "#r_b" ).val( format_num(RADIUS_B,3) );
    $( "#radius_b" ).val( format_num(RADIUS_B,3) );

    $( "#radius_c_slider" ).slider( "value", RADIUS_C );
    $( "#r_c" ).val( format_num(RADIUS_C,3) );
    $( "#radius_c" ).val( format_num(RADIUS_C,3) );
    const [theta,gamma] = onComputeParams();
  }

{


  $(function() {
    $( "#radius_a_slider" ).slider({
      range: "max",
      min: 0,
      max: 2,
      value: RADIUS_A,
      step: 0.001,
      slide: function( event, ui ) {
	$( "#r_a" ).val( ui.value );
	$( "#radius_a" ).val( ui.value );
	RADIUS_A = ui.value;
        const [theta,gamma] = onComputeParams();
        setThetaGammaValues(theta,gamma);
      }
    });
    $( "#r_a" ).val( $( "#radius_a_slider" ).slider( "value" ) );
  });

  $(function() {
    $( "#radius_b_slider" ).slider({
      range: "max",
      min: 0,
      max: 2,
      value: RADIUS_B,
      step: 0.001,
      slide: function( event, ui ) {
	$( "#r_b" ).val( ui.value );
	$( "#radius_b" ).val( ui.value );
	RADIUS_B = ui.value;
        const [theta,gamma] = onComputeParams();
        setThetaGammaValues(theta,gamma);
      }
    });
    $( "#r_b" ).val( $( "#radius_b_slider" ).slider( "value" ) );
  });

  $(function() {
    $( "#radius_c_slider" ).slider({
      range: "max",
      min: 0,
      max: 2,
      value: RADIUS_C,
      step: 0.001,
      slide: function( event, ui ) {
	$( "#r_c" ).val( ui.value );
	$( "#radius_c" ).val( ui.value );
	RADIUS_C = ui.value;
        const [theta,gamma] = onComputeParams();
        setThetaGammaValues(theta,gamma);
      }
    });
    $( "#r_c" ).val( $( "#radius_c_slider" ).slider( "value" ) );
  });

  $(function() {
    $( "#theta_slider" ).slider({
      range: "max",
      min: -45,
      max: 45,
      value: THETA_D,
      step: 1,
      slide: function( event, ui ) {
	$( "#d_theta" ).val( ui.value );
	$( "#theta" ).val( ui.value );
	$( "#theta_slider" ).val( ui.value );
	THETA_D = ui.value;
        const [a,b,c] = computeInversion_fromUI();
        if (c < 0) {
          debugger;
        }
        setRadiusValues(a,b,c);
      }
    });
    $( "#theta" ).val( $( "#theta_slider" ).slider( "value" ) );
  });

  $(function() {
    $( "#gamma_slider" ).slider({
      range: "max",
      min: -45,
      max: 45,
      value: GAMMA_D,
      step: 1,
      slide: function( event, ui ) {
	$( "#d_gamma" ).val( ui.value );
	$( "#gamma" ).val( ui.value );
	$( "#gamma_slider" ).val( ui.value );
	GAMMA_D = ui.value;
        const [a,b,c] = computeInversion_fromUI();
        setRadiusValues(a,b,c);
      }
    });
    $( "#gamma" ).val( $( "#gamma_slider" ).slider( "value" ) );
  });
}

function setup_input_molecule(slider,ro,txt,x,set,f)
{
  $( slider ).slider( "value",x );
  $( ro ).val( x );
  $( txt ).val( "" );

  $( txt ).keypress(function(event) {
    if (event.which == 13) {
      // Does this change the value or the parameter?
      x = event.currentTarget.value;
      // It is possible to enter a non-number
      if (!isNaN(x)) {
        set(x);
        console.log("x=",x);
        $( slider ).slider( "value",x );
        $( ro ).val( x );
        $( txt ).val( x );
        f();
      }
    }
  });
}

$( document ).ready(function() {
  runUnitTests();

  setup_input_molecule("#radius_a_slider","#radius_a",
                       "#r_a",RADIUS_A,(v => RADIUS_A = v),(() => {
                                                                    const [theta,gamma] = onComputeParams();
                                                                    setThetaGammaValues(theta,gamma);
                                                                  }
                                                           ));
  setup_input_molecule("#radius_b_slider","#radius_b",
                       "#r_b",RADIUS_B,(v => RADIUS_B = v),(() => {
                                                                    const [theta,gamma] = onComputeParams();
                                                                    setThetaGammaValues(theta,gamma);
                                                                  }
                                                           ));
  setup_input_molecule("#radius_c_slider","#radius_c",
                       "#r_c",RADIUS_C,(v => RADIUS_C = v),(() => {
                                                                    const [theta,gamma] = onComputeParams();
                                                                    setThetaGammaValues(theta,gamma);
                                                                  }
                                                           ));

  setup_input_molecule("#theta_slider","#theta",
                       "#d_theta",THETA_D,(v => THETA_D = v),( () => {
                         const [a,b,c ] = computeInversion_fromUI();
                         if (c < 0) {
                           debugger;
                         }
                         setRadiusValues(a,b,c);
                         onComputeParams();
                       }));

  setup_input_molecule("#gamma_slider","#gamma",
                       "#d_gamma",GAMMA_D,(v => GAMMA_D = v),( () => {
                         const [a,b,c ] = computeInversion_fromUI();
                         if (c < 0) {
                           debugger;
                         }
                         setRadiusValues(a,b,c);
                         onComputeParams();
                       }));



  $(function () { main(); });

  onComputeParams();

  $('.collapse').trigger('click');


});
