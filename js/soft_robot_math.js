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
function Compute3TouchingCircles(ra,rb,rc) {
  const A = new THREE.Vector2(-ra,0);
  const B = new THREE.Vector2(rb,0);
  const a  = rb + rc;
  const b  = ra + rc;
  const c  = ra + rb;
  const theta = Math.acos((a**2 + c**2 - b**2)/(2*a*c));
  const cy = a * Math.sin(theta);
  const cx = B.x - a * Math.cos(theta)
//  const cx = A.x - Math.sqrt(b**2 - cy**2);
  const C = new THREE.Vector2(cx,cy);
  return [A,B,C];
}
function testCircle(ra,rb,rc) {
  const vs = Compute3TouchingCircles(ra,rb,rc);

  const A = vs[0];
  const B = vs[1];
  const C = vs[2];

  console.assert(near(A.y,0));
  console.assert(near(B.y,0));
  console.assert(near(A.distanceTo(B),ra+rb));
  console.assert(near(B.distanceTo(C),rb+rc));
  console.assert(near(A.distanceTo(C),ra+rc));

  console.log("C",C);
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

function runUnitTests() {

  testCompute3TouchingCirclesSimple();
  testCompute3TouchingCircles();

 // testClosestPoint();
  // testComputeRotation();
  // testComputeRotationFull();

  // testComputeRotationIntoPlane();
  // testComputeRotationIntoPlane2();

  // runChaslesTests();
  // testThreeIsRightHanded();
  // testPointOnAxisRotationMatrix();

}
