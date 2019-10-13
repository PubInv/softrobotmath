// Copyright (C) 2019 by
//   Robert L. Read <read.robert@gmail.com>
//   Megan Cadena <megancad@gmail.com>

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

// This is a scratch program just to check some math.

// Our goal is to compute the intersection points between a point p
// and lines tangent to the circle of radius r and the origin.

var r = 1.0; // radius of a circle centered at origin.
var p = [3.0,3.0]; // point to intersect the tangent of the circle

// Now we perform some angular computation
var phi = Math.atan2(p[1],p[0]);

var d = Math.sqrt(p[0]*p[0] + p[1]*p[1]);

var psi = Math.asin(r/d);

var alpha = Math.PI/2 - psi;

var theta0 = phi - alpha;
var theta1 = phi + alpha;

var s0 = [r*Math.cos(theta0),r*Math.sin(theta0)];
var s1 = [r*Math.cos(theta1),r*Math.sin(theta1)];

console.log("r",r);
console.log("p",p);
console.log("phi",phi * 180 / Math.PI);
console.log("d",d);
console.log("psi",psi * 180 / Math.PI);
console.log("alpha",alpha * 180 / Math.PI);
console.log("theta0",theta0 * 180 / Math.PI);
console.log("theta1",theta1 * 180 / Math.PI);
console.log("s0",s0);
console.log("s1",s1);
