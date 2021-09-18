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
  if ((ra == rb)  && (rb == rc)) {
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
//      console.log("SPECIAL",zprime);
      return [0,Math.asin(ra/zprime),zprime];
    }
//    console.log("theta1",theta1);
    if (ra < rb) theta1 = -theta1;
    // h is a height tilted about x-axis; distance of the plane to origin.
    var h = Math.tan(theta1) * cA1.x;


    //  var gamma = Math.asin(ra/zprime);
    // Zprime cannot be computed if all are equal.
//    console.log("h,zprime",h,zprime);

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
//  var t = Math.abs(theta);
//  var g = Math.abs(gamma);
  var t = theta;
  var g = gamma;
  const N = computeNormalFromExtrinsicEuler(theta,gamma);
  console.log(N);
  var U_x;
  var b;
  var U;
  var plane_const;
  var Z_z;
  var Z;
  var H_y;
  if (theta != 0) {
    // this may not respect the negative value. plane_const may be a
    U_x = a / Math.sin(t);
    b = (U_x - a) * Math.sin(t)/ (Math.sin(t) + 1);
    U = new THREE.Vector3(U_x,0,0);
    plane_const = N.dot(U);
    //
    plane_const = a;
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
    plane_const = N.dot(Z);
    H_y = a;
    // By symmetry, x = a.
    // We compute by using proportionality from gamma
    // d^2 + x^2 == (c + a)^2, solve for c, then
    // the positive solution is c = sqrt(d^2 + x^2) -a
    var xx = a;
    var d = a / Math.sin(gamma);
 //   const c = Math.sqrt(d**2 + xx**2)-a;
    //    return [a,b,c];
    const c = Math.sin(gamma)* ( Z_z -a) / (Math.sin(gamma) + 1);
    return [a,b,c,U_x,H_y,Z_z];
  }

  const Y = new THREE.Vector3(0,1,0).normalize();
  // const N = normal.normalize();
//  const N = normal.clone();
  // These vectors are normalized
//  const CC = new THREE.Vector3(C.x,0,C.z);
  const H = new THREE.Vector3(0,H_y,0);
//  const U = new THREE.Vector3(U_x,0,0);
//  const Atouch = N.clampLength(ra,ra);
//  const d = Math.abs(N.dot(CC) - plane_const);
//  console.log(N.length());
//  console.log(N,C,plane_const);
//  console.log("This should be equal to c:");
//  console.log(d);
//  console.log("This also should be equal to c:");
//  console.log(C.x*N.x+ C.z*N.z - plane_const);
//  console.log("plane_const (k)",plane_const);
  const k = plane_const;
  const J = a - b * N.x + b + k;
  const L = a * b * (N.z**2) *(a -b)**2;
  const I = L *((k - a*N.x)*J + a*b*N.z**2);
  var M;
  // WARNING! This appaears to be a needed because
  // of a floating point error, not a flaw in the math.
  // This fix is inelegant.
  if (I < 0) {
    M = 0;
    console.log("WARNING! Internal error",I);
  } else {
    M = Math.sqrt(I);
  }

  const D =(a * N.x + a - b*N.x + b)**2 - 4*a*b*(N.z**2);
  const E = (a**2 + a*(b+k) -b*k)*(a*N.x + a - b*N.x + b);
  const F = -2*M - 2*a*b*(N.z**2)*(a+b);
  const x = (E+F)/D;

  const R = -2 * a**2 * b * k * N.z**2 + a**3 * b * (-1 + N.x) * N.z**2 - b * (-1 + N.x) * M;
  const S = a *( 2 * b**2 * k * N.z**2 - b**3*(-1 + N.x)* N.z**2 + (1 + N.x)*M);
//  console.log("Numerator:", 2*(R-S));
  //  console.log("D:",N.z * (a-b) * D);

  // This does not work when a == b!!!
  // Also, when N.z is zero, this does not work;
  // c must be computed in a different way
  if (N.z == 0) {
    // how we we comute c so that the top plane
    // touches all three spheres? It will be
    // some value between a and b, close to (a+b)/2

    var u = U_x;
    // This equation found by Mathematic....
    var mc = -((a *(a + b) * (a - u))/(a**2 - a*b + a*u + b*u));
//    return [a,b,mc];
    return [a,b,mc,U_x,H_y,Z_z];
  }
  const z = 2*(R+S)/(N.z *(a-b) * D);
  const c = Math.sqrt(x**2 + z**2)-a;
 // console.log("J,L,M");
//  console.log(J,L,M);
//  console.log("R,S");
//  console.log(R,S);

//  console.log("x,z,c",x,z,c);
  if (isNaN(c)) {
    debugger;
  }
  return [a,b,c,U_x,H_y,Z_z];

/* Mathematica equation entry:
x/z == r/s
eqn1 = %
x^2 + z^2 == (a + c) ^2
eqn2 = %
v == -u*w/q + u
eqn3 = %
r == -u*s/q + u
eqn4 = %
b/(Sqrt[(a + b - v)^2 + w^2]) == c / (Sqrt[(a + b - v)^2 + w^2] - (b + c))
// Or ..
b/(Sqrt[(a + b - v)^2 + w^2]) == c / (Sqrt[(x - v)^2 + (z-w)^2])
eqn5 = %
a/(Sqrt[r^2 + s^2]) == c / (Sqrt[r^2 + s^2] - (a + c))
// or
a/(Sqrt[r^2 + s^2]) == c / (Sqrt[(r -x)^2 + (s - z)^2])
eqn6 = %
z^2 + (a + b - x)^2 == (b + c)^2
 eqn7 = %
// Up until now, we are asymmetric, becasue we have eqn1, but
// not similar equation for the point W = (u,v). We must
// insist that W = (u,v), C = (x,z), and B = (a+b,0) are colinear.
// This does this via the distance formula
Sqrt((u - (a+b))^2 + v^2)  = Sqrt((u-x)^2+(w-z)^2) + b + c
// However, Heron's formula may be better:
// W = (u,v), C = (x,z), and B = (a+b,0)
// 0 = u * (z - 0) + x * ( 0 - v) + (a+b)*(v - z)
0 == uz + -vx + (a+b)*(v-z)
eqn8 = %
// We could do this for the point A = (0,0), C = (x,z) and V = (r,s) as well:
// 0 = 0 + x * (s - 0) + r * (0 - z)
// xs = rz
// So---this amounts to the same equation we alread have!
*/

/* Mathematica, attempt at another approach.

Let q = Zz, Let u = Ux. Let iota = perpendicular plane angle
Let k = Cu, the x intercept of the line through C parallel to
the plane intersection. Let n = sin(alpha), a known.




eqn2 = %
// n == c / i (u - k)
c == - i * n/(k -u)
eqn3 = %

// Could this work? k, x, z are unknowns.
 Sqrt[x^2 + z ^2] - a == -i *n/(k - u)
0 == - u*z/q + -x +  k


We could try adding in :https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line

Based on c/d = sin iota, where d is the distance (a function of u,z) in this case.
Let j = sin(iota)

This seems to produce a correct-looking plot of z and x:
Sqrt[x^2 + z ^2] -a == Sqrt[(a+b-x)^2 + z^2] - b
And this can be solved for x in terms of z

Then:

c == Abs[-u/q*z + -1*x + u]/Sqrt[(-u/q)^2 + (-1)^2] * j

Sqrt[x^2 + z ^2] -a ==  Abs[-u/q*z + -1*x + u]/Sqrt[(-u/q)^2 + (-1)^2] * j

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




a + Abs[nx * x + nz * z - k] == Sqrt[x^2 + z ^2]
eqn0 = %
b + Abs[nx * x + nz * z - k] == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %

Note: This returns a large polynomial as a result,
which I have not tested, but should be testable.
I feel that I am getting closer!!
Tomorrow I can test with with values for a,b,nx, and nz!
Solve[eqn0 && eqn1, {x, z}]

Test:
a = 1.2
b = 0.9
nx = 0.1428571428571428
nz = 0.4593496414986631
k = 1.2
Clear[a]
Clear[b]
Clear[c]
Clear[nx]
Clear[nz]
Clear[k]


Amazingly, This worked in Mathematica! Let's see
if we can clean it up...

To clean this, we need to remove the Abs sign..
Note:
This is negative as we've defined it in our scheme:
nx * x + nz * z - k

a + -(nx * x + nz * z - k) == Sqrt[x^2 + z ^2]
eqn0 = %
b + -(nx * x + nz * z - k) == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %

Now Solve[eqn0,x] provides a relative comprehensible
formula, but it requires a +- split

FullSimplify[Solve[eqn0 && eqn1, {x, z}]]

Gives something almost tractable:

{{x -> ((a^2 - b k + a (b + k)) (a + b + a nx - b nx) -
      2 a b (a + b) nz^2 -
      2 Sqrt[-a (a - b)^2 b nz^2 ((-k + a nx) (a + b + k - b nx) -
          a b nz^2)])/((a + b + a nx - b nx)^2 - 4 a b nz^2),
  z -> (2 (-2 a^2 b k nz^2 + a^3 b (-1 + nx) nz^2 -
        b (-1 + nx) Sqrt[
         a (a - b)^2 b nz^2 ((k - a nx) (a + b + k - b nx) +
            a b nz^2)] +
        a (2 b^2 k nz^2 -
           b^3 (-1 + nx) nz^2 + (1 + nx) Sqrt[
            a (a - b)^2 b nz^2 ((k - a nx) (a + b + k - b nx) +
               a b nz^2)])))/((a - b) nz ((a + b + a nx - b nx)^2 -
        4 a b nz^2))},
{x -> ((a^2 - b k + a (b + k)) (a + b + a nx -
         b nx) - 2 a b (a + b) nz^2 +
      2 Sqrt[-a (a - b)^2 b nz^2 ((-k + a nx) (a + b + k - b nx) -
          a b nz^2)])/((a + b + a nx - b nx)^2 - 4 a b nz^2),
  z -> (2 (-2 a^2 b k nz^2 + a^3 b (-1 + nx) nz^2 +
        b (-1 + nx) Sqrt[
         a (a - b)^2 b nz^2 ((k - a nx) (a + b + k - b nx) +
            a b nz^2)] -
        a (-2 b^2 k nz^2 +
           b^3 (-1 + nx) nz^2 + (1 + nx) Sqrt[
            a (a - b)^2 b nz^2 ((k - a nx) (a + b + k - b nx) +
               a b nz^2)])))/((a - b) nz ((a + b + a nx - b nx)^2 -
        4 a b nz^2))}}

There are in fact two physical solutions, but
by our coordinate system we prefer the one with positive z value.
This the second solution:

x == ((a^2 - b k + a (b + k)) (a + b + a nx - b nx) -
     2 a b (a + b) nz^2 +
     2 Sqrt[-a (a - b)^2 b nz^2 ((-k + a nx) (a + b + k - b nx) -
         a b nz^2)])/((a + b + a nx - b nx)^2 - 4 a b nz^2),
 z == (2 (-2 a^2 b k nz^2 + a^3 b (-1 + nx) nz^2 +
       b (-1 + nx) Sqrt[
        a (a - b)^2 b nz^2 ((k - a nx) (a + b + k - b nx) +
           a b nz^2)] -
       a (-2 b^2 k nz^2 +
          b^3 (-1 + nx) nz^2 + (1 + nx) Sqrt[
           a (a - b)^2 b nz^2 ((k - a nx) (a + b + k - b nx) +
              a b nz^2)])))/((a - b) nz ((a + b + a nx - b nx)^2 -
       4 a b nz^2))

Now, let me try to find substitutions that simply


Now, sadly, When gamma = 0 we have to do something different.
Let s = Sin[theta]
a + c == Sqrt[x^2 + z^2]
eqn0 = %
b + c == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %
c ==(u-x) a / u
eqn2 = %

a + (u-x) a / u == Sqrt[x^2 + z]
eqn0 = %
b + (u-x) a / u == Sqrt[(a+b-x)^2 + z^2]
eqn1 = %

a/u == c / ( u -x) == b/(u - (a + b))

My own algebra:
(a + b -x)^2 - x^2 = (b + s(u-x))^2 - (a + s(u-x))^2

Yields:
{{x -> (a^2 + a b + a s u - b s u)/(a + b + a s - b s)}}


 When \theta = 0:

c = a - x/u

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


function testInverstionWorksWithNegativeAndPostiveGamma() {
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

function runUnitTests() {

  testCompute3TouchingCirclesSimple();
  testCompute3TouchingCircles();

  testComputeAxisAngleOfCone();

  testInverseProblem();
  testInverseProblemRaIsRb();

  testInverstionWorksWithNegativeAndPostiveGamma();

 // testClosestPoint();
  // testComputeRotation();
  // testComputeRotationFull();

  // testComputeRotationIntoPlane();
  // testComputeRotationIntoPlane2();

  // runChaslesTests();
  // testThreeIsRightHanded();
  // testPointOnAxisRotationMatrix();

}
