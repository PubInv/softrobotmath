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


/////////////////////////////////////////////////////////////////////
// for testing, we need to know when somethigns is "closeto a target"
// to deal with roundoff error
"use strict";


function near(x, y, e = 1e-5) {
  return Math.abs(x - y) <= e;
}

function vnear(a, b, e = 1e-5) {
  try {
    return near(a.x,b.x,e) && near(a.y,b.y,e) && near(a.z,b.z,e);
  } catch (e) {
    debugger;
    return new THREE.Vector3();
  }
}



function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}




function TraceMatrix4(A) {
  let t = 0;
  let xAxis = new THREE.Vector3();
  let yAxis = new THREE.Vector3();
  let zAxis = new THREE.Vector3();
  A.extractBasis(xAxis,yAxis,zAxis);
  t = xAxis.x + yAxis.y + zAxis.z;
  // for(var i = 0; i < 4; i++) {
  //   console.log(i + i * 4);
  //   t += A.elements[i + i*4];
  // }
  return t;
}

function testTrace() {
  const theta = Math.PI/11;
  // now create a rotation matrix based on this angle...
  const axis = new THREE.Vector3(0,0,1);
  const R = new THREE.Matrix4().makeRotationAxis(axis,theta);
  const t0 = TraceMatrix4(R);
  console.log("TRACE0",t0);
}

function SubtractMatrices(A,B) {
  const Ae = A.elements();
  const Be = B.elements();
  const Ce = Ae.clone();
  for(var i = 0; i < Be.elements.length; i++) {
    Ce[i] -= Be[i];
  }
  const C = A.clone();
  C.fromArray(Ce);
  return C;
}


// https://math.stackexchange.com/questions/1053105/know-if-a-4x4-matrix-is-a-composition-of-rotations-and-translations-quaternions
function isRigidTransformation(R) {
  const det = R.determinant()
  if (near(det,-1)) {
    console.log("R.det :",R.determinant());
    return false;
  }
  if (det < 0) {
    console.log("R is a reflection! :",det);
    return false;
  }
  console.assert(checkNonScaling(R));
  if (!checkNonScaling(R)) {
    debugger;
    return false;
  }
  const s = R.elements[15];
  console.assert(near(s,1));

  let xA = new THREE.Vector3();
  let yA = new THREE.Vector3();
  let zA = new THREE.Vector3();
  R.extractBasis(xA,yA,zA);
  const A = new THREE.Matrix3();
  A.setFromMatrix4(R);
  const At = A.clone().transpose();
  const T = new THREE.Matrix3().multiplyMatrices(A,At);
  console.assert(near(T.elements[0],1));
  console.assert(near(T.elements[1],0));
  console.assert(near(T.elements[2],0));

  console.assert(near(T.elements[3],0));
  console.assert(near(T.elements[4],1));
  console.assert(near(T.elements[5],0));

  console.assert(near(T.elements[6],0));
  console.assert(near(T.elements[7],0));
  console.assert(near(T.elements[8],1));
  if (!near(T.elements[0],1)) {
    return false;
  }
  if (!near(T.elements[1],0)) {
    return false;
  }
  if (!near(T.elements[2],0)) {
    return false;
  }
  if (!near(T.elements[3],0)) {
    return false;
  }
  if (!near(T.elements[4],1)) {
    return false;
  }
  if (!near(T.elements[5],0)) {
    return false;
  }
  if (!near(T.elements[6],0)) {
    return false;
  }
  if (!near(T.elements[7],0)) {
    return false;
  }
  if (!near(T.elements[8],1)) {
    return false;
  }

  return true;
}

// This returns 3 Vecto2 obects, A, B, C in our convention.
// function Compute3TouchingCirclesX(ra,rb,rc) {
//   const A = new THREE.Vector2(-ra,0);
//   const B = new THREE.Vector2(rb,0);
//   const a  = rb + rc;
//   const b  = ra + rc;
//   const c  = ra + rb;
//   const theta = Math.acos((a**2 + c**2 - b**2)/(2*a*c));
//   const cy = a * Math.sin(theta);
//   const cx = B.x - a * Math.cos(theta)
// //  const cx = A.x - Math.sqrt(b**2 - cy**2);
//   const C = new THREE.Vector2(cx,cy);
//   console.assert(near(A.distanceTo(B),ra+rb));
//   console.assert(near(B.distanceTo(C),rb+rc));
//   console.assert(near(A.distanceTo(C),ra+rc));
//   return [A,B,C];
// }
function Compute3TouchingCircles(ra,rb,rc) {
  const A = new THREE.Vector2(0,0);
  const B = new THREE.Vector2(ra+rb,0);
  const a  = rb + rc;
  const b  = ra + rc;
  const c  = ra + rb;
  const theta = Math.acos((a**2 + c**2 - b**2)/(2*a*c));
  const cy = a * Math.sin(theta);
  const cx = B.x - a * Math.cos(theta)
//  const cx = A.x - Math.sqrt(b**2 - cy**2);
  const C = new THREE.Vector2(cx,cy);
  if (!near(A.distanceTo(B),ra+rb)) {
    debugger;
  }
  console.assert(near(A.distanceTo(B),ra+rb));
  if (!near(B.distanceTo(C),rb+rc)) {
    debugger;
  }
  console.assert(near(B.distanceTo(C),rb+rc));
  if (!near(A.distanceTo(C),ra+rc)) {
    debugger;
  }
  console.assert(near(A.distanceTo(C),ra+rc));
  return [A,B,C];
}

function ComputeThetaAndGamma(ra,rb,rc,A,B,C,cA1,cA2,cA3) {
  if (ra == rb == rc) {
    // This is not correct!
    return [0,0,null];
  }

  var theta1 = ComputeAxisAngleOfCone(ra,rb);

  // Experimental...
  // Assume A > B, and A and B are on the z axis (z = 0)
  console.assert(A.z == 0);
  console.assert(B.z == 0);
  // Assume their contact point is at the origin,
  // so that A.x == -ra;
  console.assert(A.x == 0);

  if (isNaN(cA3.x)) {
    debugger;


  } else {
    var zprime = cA3.z * cA1.x / ((cA1.x) - (cA3.x));

    if (isNaN(zprime)) debugger;
    // in this case we have to do something a little different...
    if (ra == rb) {
      zprime = cA3.z;
      console.log("SPECIAL",zprime);
      return [0,Math.asin(ra/zprime),zprime];
    }
    console.log("theta1",theta1);
    if (ra < rb) theta1 = -theta1;
    // h is a height tilted about x-axis; distance of the plane to origin.
    var h = Math.tan(theta1) * cA1.x;


    //  var gamma = Math.asin(ra/zprime);
    // Zprime cannot be computed if all are equal.
    console.log("h,zprime",h,zprime);

    // I am not sure this is really correct!!!
    var gamma = Math.asin(h/zprime);
    if (isNaN(gamma)) debugger;

    console.log("gamma",gamma * 180 / Math.PI);
    return [-theta1,gamma,zprime];
  }
}

// Return [ra,rb,rc0,rc1] This math assumes ra+rb=2.0
function computeRadiiFromAngles(theta,gamma) {
  // theta is negative in our typical case...
  // I'm not sure what that means, but something is wrong with
  // my math below...
  // I'm going to fudge it...
  const st = Math.sin(Math.abs(theta))
  const ra = 1.0 + st;
  const rb = 1.0 - st;
  const Ux = ra / st;
  const Hy = Ux * Math.tan(theta);
  const Wz = Hy / Math.sin(gamma);
  const M = Wz / Ux;
  const Q = 1.0 + M*M;
  const P = ra*ra - 2*ra*rb + rb*rb*Q;
  const P_or_M = Math.sqrt(P/Q);
  const rc_raw = rb - ra/Q;
  const denom = (-1 + 1/Q);
  const rc_m = (rc_raw - P_or_M)/denom;
  const rc_p = (rc_raw + P_or_M)/denom;
  return [ra,rb,rc_m];
}

function testCircle(ra,rb,rc) {
  const vs = Compute3TouchingCircles(ra,rb,rc);

  const A = vs[0];
  const B = vs[1];
  const C = vs[2];

  console.assert(near(A.y,0));
  console.assert(near(B.y,0));


  return true;
}
function testCompute3TouchingCirclesSimple() {
  const ra = 1;
  const rb = 2;
  const rc = 3;
  var result = testCircle(ra,rb,rc);
  if (!result) {
    console.log("ra,rb,rc",ra,rb,rc);
  }
}

function testCompute3TouchingCircles() {
  const ra = 1;
  for(var rb = 1; rb < 3; rb += 0.2) {
    for(var rc = 1; rc < 3; rc += 0.2) {
      var result = testCircle(ra,rb,rc);
      if (!result) {
        console.log("ra,rb,rc",ra,rb,rc);
      }
    }
  }
}

// // "Axis Angle" is the half-aperture
// function ComputeAxisAngleOfConeX(r1,r2) {
//   if (r1 == r2) {
//     return 0;
//   }
//   if ((r1 == 0) || (r2 == 0)) {
//     console.log("error! We can't handle zero radii!");
//     return null;
//   }

//   if (r2 < r1) {
//     var temp = r1;
//     r1 = r2;
//     r2 = temp;
//   }
//   let z = -2 * (r1**2 / (r1 - r2));
//   console.assert( z >= 0);

//   let psi = Math.asin(r1/ (z + r1));
//   console.log("r1,r2,z,psi",r1,r2,z,psi *180/Math.PI);
//   console.assert(near((z+r1)**2,r1**2 + (Math.cos(psi)*(z+r1))**2));
//   return psi;
// }

function ComputeAxisAngleOfCone(r1,r2) {
  if (r1 == r2) {
    return 0;
  }
  if ((r1 == 0) || (r2 == 0)) {
    console.log("error! We can't handle zero radii!");
    debugger;
    return null;
  }

  if (r2 < r1) {
    var temp = r1;
    r1 = r2;
    r2 = temp;
  }
  let z = -2 * (r1**2 / (r1 - r2));
  console.assert( z >= 0);

  console.assert(near((r2-r1)/(r2+r1),r1/ (z + r1)));
  let psi = Math.asin((r2-r1)/(r2+r1));

//  console.log("r1,r2,z,psi",r1,r2,z,psi *180/Math.PI);
  console.assert(near((z+r1)**2,r1**2 + (Math.cos(psi)*(z+r1))**2));
  return psi;
}

// TODO: This is not a good enough test!!! Need to fix.
function testComputeAxisAngleOfCone() {
  {
    let r1 = 3;
    let r2 = 1;
    let c1 = new THREE.Vector3(0,0,0);
    let c2 = new THREE.Vector3(10,0,0);
    let psi = ComputeAxisAngleOfCone(r1,r2);
    console.log("computed psi",psi * 180 / Math.PI);
  }
  {
    let r1 = 2;
    let r2 = 2;
    let c1 = new THREE.Vector3(0,0,0);
    let c2 = new THREE.Vector3(10,0,0);
    let psi = ComputeAxisAngleOfCone(r1,r2);
    console.log("computed psi",psi * 180 / Math.PI);
  }
}

function GetConeApices(ra,rb,rc,A,B,C,theta1,theta2,theta3) {
  const A1 = new THREE.Vector3().subVectors(A,B);
  const A2 = new THREE.Vector3().subVectors(B,C);
  const A3 = new THREE.Vector3().subVectors(C,A);

  const A1unit = A1.clone().clampLength(1.0,1.0);
  const A2unit = A2.clone().clampLength(1.0,1.0);
  const A3unit = A3.clone().clampLength(1.0,1.0);

    // Cone Apexes - TODO -- put this is soft_robot_math.js
  var cA1 = A.clone();
  if (theta1 != 0) {
    var sgn = (rb > ra) ? 1 : -1;
    cA1.add(A1unit.clone().multiplyScalar( sgn * ra / Math.sin(theta1)));
  }
  var cA2 = B.clone();
  if (theta2 != 0) {
    var sgn = (rc > rb) ? 1 : -1;
    cA2.add(A2unit.clone().multiplyScalar( sgn * rb / Math.sin(theta2)));
  }
  var cA3 = C.clone();
  if (theta3 != 0) {
    var sgn = (ra > rc) ? 1 : -1;
    cA3.add(A3unit.clone().multiplyScalar( sgn * rc / Math.sin(theta3)));

  }
  return [cA1,cA2,cA3];
}
function testInverseProblem() {
  const ra = 1.2;
  const rb = 0.8;
  const rc = 0.5;
  const vs = Compute3TouchingCircles(ra,rb,rc);

  const A2d = vs[0];
  const B2d = vs[1];
  const C2d = vs[2];
  const A = new THREE.Vector3(A2d.x,0,A2d.y);
  const B = new THREE.Vector3(B2d.x,0,B2d.y);
  const C = new THREE.Vector3(C2d.x,0,C2d.y);

  const theta1 = ComputeAxisAngleOfCone(ra,rb);
  const theta2 = ComputeAxisAngleOfCone(rb,rc);
  const theta3 = ComputeAxisAngleOfCone(rc,ra);

  console.log("theta3",theta3 * 180 / Math.PI);

  let [cA1,cA2,cA3] = GetConeApices(ra,rb,rc,A,B,C,theta1,theta2,theta3);
  console.log("cA3",cA3);
  var gamma;
  var theta;
  var zprime;
  [theta,gamma,zprime] =
    ComputeThetaAndGamma(ra,rb,rc,A,B,C,cA1,cA2,cA3);

  theta = Math.abs(theta);
  const [a,b,c] = computeRadiiFromAngles(theta,gamma);
  console.log(" input",ra,rb,rc);
  console.log("output",a,b,b,c);
}


function testInverseProblemRaIsRb() {
  const ra = 0.8;
  const rb = 0.8;
  const rc = 0.5;
  const vs = Compute3TouchingCircles(ra,rb,rc);

  const A2d = vs[0];
  const B2d = vs[1];
  const C2d = vs[2];
  const A = new THREE.Vector3(A2d.x,0,A2d.y);
  const B = new THREE.Vector3(B2d.x,0,B2d.y);
  const C = new THREE.Vector3(C2d.x,0,C2d.y);

  const theta1 = ComputeAxisAngleOfCone(ra,rb);
  const theta2 = ComputeAxisAngleOfCone(rb,rc);
  const theta3 = ComputeAxisAngleOfCone(rc,ra);

  console.log("theta3",theta3 * 180 / Math.PI);

  let [cA1,cA2,cA3] = GetConeApices(ra,rb,rc,A,B,C,theta1,theta2,theta3);
  console.log("cA3",cA3);
  var gamma;
  var theta;
  var zprime;
  [theta,gamma,zprime] =
    ComputeThetaAndGamma(ra,rb,rc,A,B,C,cA1,cA2,cA3);

  theta = Math.abs(theta);
  const [a,b,c] = computeRadiiFromAngles(theta,gamma);
  console.log(" input",ra,rb,rc);
  console.log("output",a,b,b,c);
}

function runUnitTests() {

  testCompute3TouchingCirclesSimple();
  testCompute3TouchingCircles();

  testComputeAxisAngleOfCone();

  testInverseProblem();
  testInverseProblemRaIsRb();

 // testClosestPoint();
  // testComputeRotation();
  // testComputeRotationFull();

  // testComputeRotationIntoPlane();
  // testComputeRotationIntoPlane2();

  // runChaslesTests();
  // testThreeIsRightHanded();
  // testPointOnAxisRotationMatrix();

}
