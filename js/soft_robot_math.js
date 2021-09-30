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


// I don't believe this is returning things correctly now.
function ComputeThetaAndGamma(ra,rb,rc,A,B,C,cA1,cA2,cA3) {
  if ((ra == rb)  && (rb == rc)) {
    // This is not correct!
    return [0,0,null];
  }
  // Note: This is an absolute angle of the cone,
  // but we need a signed angle to represent the rotation
  // of the plane, so we process separately...
  var theta1 = ComputeAxisAngleOfCone(ra,rb);
//  if (rb > ra) theta1 = -theta1;
  if (ra > rb) theta1 = -theta1;

  if (isNaN(cA3.x)) {
    debugger;
  } else {
    var zprime = cA3.z * cA1.x / ((cA1.x) - (cA3.x));
    if (isNaN(zprime)) debugger;
    // in this case we have to do something a little different...
    if (ra == rb) {
      // in this case, the Apex line is parallel to the x axis...
      // that means that cA2.z == cA3.z == zprime;
      console.assert(near(cA2.z,cA3.z));
      var zprime = cA3.z;
      return [0,Math.asin(ra/zprime),zprime];
    }


    var h = ra;
    // I am not sure this is really correct!!!
    var gamma = Math.asin(h/zprime);
    // CHANGE THIS TO POINT OUT THAT rc is probably too small
    if (isNaN(gamma)) {
      console.log("WARNING! PROBABLY rc too small rc:",rc);
      return [theta1,null,zprime];
    }
   if (zprime < 0) {
     gamma = -Math.abs(gamma);
   } else {
     gamma = Math.abs(gamma);
   }
    // I'm not sure why I am negating gamma here...
    return [theta1,gamma,zprime];
  }
}

// Note that we will treat gamma as positive if it
// represents a clockwise tilt of the plane when sighting
// down the positive X axis to the origin. This is
// in accordance with the THREE.js convention, and
// theta is measured as clockwise tilt when sighting
// along the Z axis.
// Therefore, roughly speaking a large c means a positive
// gamma, and a small c means a negative gamma.
function testComputeThetaAndGamma() {
  const ra = 1.2;
  const rb0 = 1.1;
  const rb1 = 1.3;
  const rc0 = 0.6;
  const rc1 = 1.6;
  const [theta0,gamma0,zprime0] =
        computeFromRadii(ra,rb0,rc0);
  console.assert(zprime0 > 0);
  console.assert(gamma0 > 0);

  const [theta1,gamma1,zprime1] =
        computeFromRadii(ra,rb0,rc1);
  console.assert(zprime1 < 0);
  console.assert(gamma1 < 0);

  // I have a bug when theta is negative (when rb > ra).
  const [theta2,gamma2,zprime2] =
        computeFromRadii(ra,rb1,rc0);
  console.assert(theta2 < 0);
  console.assert(zprime2 > 0);
  console.assert(gamma2 > 0);

  const [theta3,gamma3,zprime3] =
        computeFromRadii(ra,rb1,rc1);
  console.assert(theta3 < 0);
  console.assert(zprime3 < 0);
  console.assert(gamma3 < 0);

}

function computeNormalFromExtrinsicEuler(theta,gamma) {
  // Note: I believed I was confused about the coordinate
  // system. We should use -theta here (where theta
  // is the the angle in the XY plane measured from U_X.
  var Pp = new THREE.Vector3(0,1,0);
  const Z = new THREE.Vector3(0,0,1);
  const X = new THREE.Vector3(1,0,0);
  Pp.applyAxisAngle(Z,theta);
  Pp.applyAxisAngle(X,gamma);
  return Pp;
}

function testComputeNormalFromExtrinsicEuler() {
  const thetaP = 1.0*Math.PI/180;
  const gamma = 15.0*Math.PI/180;
  const thetaN = -1.0*Math.PI/180;
  const Np = computeNormalFromExtrinsicEuler(thetaP,gamma);
  const Nn = computeNormalFromExtrinsicEuler(thetaN,gamma);
  console.assert(Math.abs(Np.x) == Math.abs(Nn.x));
  console.assert(Np.x > 0);
  console.assert(Nn.x < 0);
}

/*
M = ((a + b + a nx - b nx)^2 - 4 a b nz^2)
L = (a (a + b + a nx - b nx) - b (a + b) nz^2)
G = -a^2 (a - b)^2 b nz^2
H = (2 a (-1 + nx) - b ((-1 + nx)^2 + nz^2))
F = Sqrt[G H]
K = 4 a^2 b^2 nz^2 + 2 a^3 b (-3 + nx) nz^2
J = b^3 (-1 + nx) nz^2

{{x -> (2 (F + a L))/M,
  z -> (K + 2 b F (-1 + nx) -
    2 a (F (1 + nx) + b^3 (-1 + nx) nz^2))/((a -
      b) M nz)},
{x -> (-2 F + 2 a L)/M,
  z -> (K - 2 b F (-1 + nx) +
    2 a (F (1 + nx) - b^3 (-1 + nx) nz^2))/((a - b) M nz)}}
*/

// This function is not allowed to return a negative z value;
// but sometimes it does!
function GetXZC(a,b,N) {

  const nx = N.x;
  const nz = N.z;

  const M = ((a + b + a * nx - b * nx)**2 - 4 * a * b * nz**2);
  const L = (a * (a + b + a * nx - b * nx) - b * (a + b) * nz**2);
  const G = -(a**2) * (a - b)**2 *  b * nz**2;
  const H = (2 * a * (-1 + nx) - b * ((-1 + nx)**2 + nz**2));
  const F = Math.sqrt(G * H);
  const K = 4 * a**2 * b**2 * nz**2 + 2 * a**3 * b * (-3 + nx) * nz**2;
  const J = b**3  * (-1 + nx) * nz**2;

  const x0 = (2 * (F + a * L))/M;
  const z0 = (K + 2 * b * F * (-1 + nx) -
              2 * a * (F * (1 + nx) + b**3 * (-1 + nx) * nz**2))/
        ((a - b) *  M * nz);
  const x1 = (-2 * F + 2 * a * L)/M;
  const z1 = (K - 2 * b * F * (-1 + nx) +
              2 * a * (F * (1 + nx) - b**3  * (-1 + nx) * nz**2))/
        ((a - b) * M * nz);

  const x = (z0 > 0) ? x0 : x1;
  const z = (z0 > 0) ? z0 : z1;

  if (z0 > 0) console.log("first!");
  else console.log("second");

  const c = Math.sqrt(x**2 + z**2)-a;

  return [x,z,c];
}

// TODO: remove the GUI calls from this move to soft_robot_math and test.
// This returns a number of parameters:
// [a,b,c,U_x,H_y,Z_z]
// a : radius a
// b : radius b
// c : radius c
// U_x : The x-coordinate of the U point on the apex line
// H_y : The y coordinate of the top plane at x = 0, z = 0
// Z_z : The z-coordinate of the Z point on the apex line
function computeInversion(a,theta,gamma) {
  if (isNaN(gamma)) debugger;
  var t = theta;
  var g = gamma;
  const N = computeNormalFromExtrinsicEuler(theta,gamma);
  console.log("theta,gamma,N",theta,gamma,N);
  var U_x;
  var b;
  var U;
  var plane_const = a;
  var Z_z;
  var Z;
  var H_y;
  if (theta != 0) {
    // this may not respect the negative value. plane_const may be a
    U_x = a / Math.sin(t);
    b = (U_x - a) * Math.sin(t)/ (Math.sin(t) + 1);
    U = new THREE.Vector3(U_x,0,0);
    H_y =  plane_const/N.y;
    Z_z = H_y / Math.sin(g);

    Z = new THREE.Vector3(0,0,Z_z);
  } else {
    if (gamma == 0) {
      return [a,a,a,null,a,null,];
    }
    U_x = null;
    b = a;
    Z_z = a / Math.sin(g);
    U = null;
    Z = new THREE.Vector3(0,0,Z_z);

    H_y = Math.tan(g) * Z_z;

    const z0 = (2 * a**2 * Z_z - Math.sqrt(a**4 * Z_z**2 + 3 * a**2 * Z_z**4))/(a**2 - Z_z**2);
    const c = a * ( Z_z - z0)/Z_z;
    return [a,b,c,U_x,H_y,Z_z];
  }

  const Y = new THREE.Vector3(0,1,0).normalize();
  const H = new THREE.Vector3(0,H_y,0);

  if (N.z == 0) {
    var u = U_x;
    // This equation found by Mathematica....
    var mc = -((a *(a + b) * (a - u))/(a**2 - a*b + a*u + b*u));
    return [a,b,mc,U_x,H_y,Z_z];
  }

  const [x,z,c] = GetXZC(a,b,N);

  if (isNaN(c)) {
    debugger;
  }
  return [a,b,c,U_x,H_y,Z_z];

/*

This seems to work:
Solve[eqn2, {x}]

Although we have iota, and more direct approach is to use
the normal to compute the distance from the point to the plane
and set it equal to q:

c == | n dot v |, where v = U - C, for instance.

This may not be any better, but it should be simpler!

Let N be the normal to the plane and k be the constant
so that the equation of the plane is N\cdot X = k.

This is three equations in 3 unkowns, so may be solvable.
Let nx = N_x and nz = N_z:
a + c == Sqrt[x^2 + z ^2]
eqn0 = %
b + c == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %
c == Abs[nx * x + nz * z - k]
eqn3 = %

Note: Possibly I can simplify this by asserting that k == a.

a + Abs[nx * x + nz * z - k] == Sqrt[x^2 + z ^2]
eqn0 = %
b + Abs[nx * x + nz * z - k] == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %

// Hypothesis: nx * x + nz * z - a is almost always negative.
// This would always be true if let a == 1, though I am not sure
// if that helps us overall.
a + Abs[nx * x + nz * z - a] == Sqrt[x^2 + z ^2]
eqn0 = %
b + Abs[nx * x + nz * z - a] == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %

If the inner expression nx*x + nz*z -a is positive, we get:
nx * x + nz * z  == Sqrt[x^2 + z ^2]
eqn0 = %
nx * x + nz * z == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %
posrules = FullSimplify[Solve[eqn0 && eqn1, {x, z}]]
{{x -> (a + b)/2,
  z -> -(((a + b) (nx nz + Sqrt[-1 + nx^2 + nz^2]))/(
    2 (-1 + nz^2)))}, {x -> (a + b)/2,
  z -> ((a + b) (-nx nz + Sqrt[-1 + nx^2 + nz^2]))/(2 (-1 + nz^2))}}

Which ALWAYS produces imaginary expressions.  So,
we can assume nx * x + nz * z - a < 0, and so:
a + -nx * x + -nz * z + a == Sqrt[x^2 + z ^2]
eqn0 = %
b + -nx * x + -nz * z + a == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %

This produces a simple expression set of two rules, but the
sign of the z value depends on the nz value (which is what
we want.) We must evaluate both and take the positive z value
as our solution.

M = ((a + b + a nx - b nx)^2 - 4 a b nz^2)
L = (a (a + b + a nx - b nx) - b (a + b) nz^2)
G = -a^2 (a - b)^2 b nz^2
H = (2 a (-1 + nx) - b ((-1 + nx)^2 + nz^2))
F = Sqrt[G H]
K = 4 a^2 b^2 nz^2 + 2 a^3 b (-3 + nx) nz^2
J = b^3 (-1 + nx) nz^2

{{x -> (2 (F + a L))/M,
  z -> (K + 2 b F (-1 + nx) -
    2 a (F (1 + nx) + b^3 (-1 + nx) nz^2))/((a -
      b) M nz)},
{x -> (-2 F + 2 a L)/M,
  z -> (K - 2 b F (-1 + nx) +
    2 a (F (1 + nx) - b^3 (-1 + nx) nz^2))/((a - b) M nz)}}

This was all checked with Mathematica.
*/
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
function computeFromRadii(ra,rb,rc) {

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

  let [cA1,cA2,cA3] = GetConeApices(ra,rb,rc,A,B,C,theta1,theta2,theta3);
  var gamma;
  var theta;
  var zprime;

  [theta,gamma,zprime] =
    ComputeThetaAndGamma(ra,rb,rc,A,B,C,cA1,cA2,cA3);
  return [theta,gamma,zprime];
}

function testInverseProblem() {
  const ra = 1.2;
  const rb = 0.8;
  const rc = 0.5;

  var [theta,gamma,zprime] = computeFromRadii(ra,rb,rc);

  // const [a,b,c] = computeRadiiFromAngles(ra,theta,gamma);
  // console.log(" input",ra,rb,rc);
  // console.log("output",a,b,b,c);
  // console.assert(near(a,ra));
  // console.assert(near(b,rb));
  // console.assert(near(c,rc));
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

  let [cA1,cA2,cA3] = GetConeApices(ra,rb,rc,A,B,C,theta1,theta2,theta3);

  var gamma;
  var theta;
  var zprime;
  [theta,gamma,zprime] =
    ComputeThetaAndGamma(ra,rb,rc,A,B,C,cA1,cA2,cA3);
}


function testInversionWorksWithNegativeAndPostiveGamma() {
  const ai = 1.2;
  const theta = 30*Math.PI/180;
  const gamma = 30*Math.PI/180;
  const [a,b,c,U_x,H_y,Z_z] = computeInversion(ai,theta,gamma);
  const ngamma = -30*Math.PI/180;
  const [na,nb,nc,nU_x,nH_y,nZ_z] = computeInversion(ai,theta,ngamma);
  // Now, with a negative gamma, Z should be negative,
  // and nc > c.
  console.assert(nZ_z < 0);
  console.assert(nc > c);
}

function testInversionWorksWithNegativeTheta() {
  const ai = 1.2;
  const theta = -1*Math.PI/180;
  const gamma = 13*Math.PI/180;
  const [a,b,c,U_x,H_y,Z_z] = computeInversion(ai,theta,gamma);
  console.assert(Z_z > 0);
  console.assert(c < ai);
}

// This is a major test. We will first test a wide range
// of theta,gamma pairings and make sure that the inversion produces
// a,b,c values from which theta,gamma are calculable near our starting point.
function testInversionExhaustively() {
  const OneDeg_radians = 1*Math.PI/180;
  const ai = 1.2;
  const LIMIT = 10;
  const STEP = 2;
  for(var theta_deg = -LIMIT; theta_deg < LIMIT; theta_deg += 2) {
    var theta = theta_deg * OneDeg_radians;
    for(var gamma_deg = -LIMIT; gamma_deg < LIMIT; gamma_deg += 2) {
      var gamma = gamma_deg * OneDeg_radians;
      const [a,b,c,U_x,H_y,Z_z] = computeInversion(ai,theta,gamma);
      var [calc_theta,calc_gamma,calc_zprime] = computeFromRadii(a,b,c);
      // c == null means we don't have three points of contact--probably, we need to check this.
      if (c != null) {
        if (!near(calc_theta,theta) || !near(calc_gamma,gamma,1e-2)) {
          console.log("failure of test!");
          console.log("a,b,c,U_x,H_y,Z_z:",a,b,c,U_x,H_y,Z_z);
          console.log("theta, gamma           :",theta_deg,gamma_deg);
          console.log("calculated theta, gamma:",calc_theta / OneDeg_radians, calc_gamma / OneDeg_radians);
//          debugger;
        }
      }
    }
  }
}

function testInversionThetaZeroGamma15() {
  const OneDeg_radians = 1*Math.PI/180;
  const ai = 1.2;
  const LIMIT = 10;
  var theta_deg = 0;
  var theta = theta_deg * OneDeg_radians;
  var gamma_deg = 15;
  var gamma = gamma_deg * OneDeg_radians;

  {
  const [a,b,c,U_x,H_y,Z_z] = computeInversion(ai,theta+0.001,gamma);
  var [calc_theta,calc_gamma,calc_zprime] = computeFromRadii(a,b,c);
  // c == null means we don't have three points of contact--probably, we need to check this.
  if (c != null) {
    if (!near(calc_theta,theta) || !near(calc_gamma,gamma,1e-2)) {
      console.log("failure of test!");
      console.log("a,b,c,U_x,H_y,Z_z:",a,b,c,U_x,H_y,Z_z);
      console.log("theta, gamma           :",theta_deg,gamma_deg);
      console.log("calculated theta, gamma:",calc_theta / OneDeg_radians, calc_gamma / OneDeg_radians);
    }
  }
  }
  {
  const [a,b,c,U_x,H_y,Z_z] = computeInversion(ai,theta,gamma);
  var [calc_theta,calc_gamma,calc_zprime] = computeFromRadii(a,b,c);
  // c == null means we don't have three points of contact--probably, we need to check this.
  if (c != null) {
    if (!near(calc_theta,theta) || !near(calc_gamma,gamma,1e-2)) {
      console.log("failure of test!");
      console.log("a,b,c,U_x,H_y,Z_z:",a,b,c,U_x,H_y,Z_z);
      console.log("theta, gamma           :",theta_deg,gamma_deg);
      console.log("calculated theta, gamma:",calc_theta / OneDeg_radians, calc_gamma / OneDeg_radians);
    }
  }
  }
}


function testGetXZC() {
  const a = 1.2;
  const b = 1.0;
  const k = 1.2;
  const N = new THREE.Vector3(0.5,0.75,-0.433);
  const [x,z,c] = GetXZC(a,b,N,k);
  console.assert(z > 0);
}
function runUnitTests() {

  testCompute3TouchingCirclesSimple();
  testCompute3TouchingCircles();

  testComputeAxisAngleOfCone();

  testInverseProblem();
  testInverseProblemRaIsRb();

  testComputeThetaAndGamma();

  testComputeNormalFromExtrinsicEuler();

  testGetXZC();

  testInversionWorksWithNegativeAndPostiveGamma();

  testInversionWorksWithNegativeTheta();

  testInversionThetaZeroGamma15();

  testInversionExhaustively();

 // testClosestPoint();
  // testComputeRotation();
  // testComputeRotationFull();

  // testComputeRotationIntoPlane();
  // testComputeRotationIntoPlane2();

  // runChaslesTests();
  // testPointOnAxisRotationMatrix();

}
