/**
 * Created by Мария on 08.12.2016.
 */

function addDot(dot) {
    var dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(dot);
    dotMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
    var d = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(d);
}




function getVertices(obj, start, stop, ind, f) {
    var lines = obj.children;
    var dots = [];
    var vertices = lines[ind].geometry.vertices;

    for (var i = start; i < stop; ++i) {
        var pos = new THREE.Vector3();
        pos.copy(vertices[i]);
        pos.applyMatrix4(obj.matrixWorld);

        dots.push(pos);
        if (f)
            addDot(pos);


    }

    return dots;
}


var Lines = [];
var Contours = [];


function getContour(dots) {
    var geometry = new THREE.Geometry();
    var vertices = geometry.vertices;
    for (var i = 0; i < dots.length; ++i) {
        vertices.push(dots[i]);
    }
    var material = new THREE.LineBasicMaterial();
    material.side = THREE.doubleSided;
    return new THREE.Line(geometry, material);
}

function Line(basis,  lineArrs)
{
    this.startBasis = new Array(4);
    this.basis = basis;
    this.lines = new Array(lineArrs.length);
    this.BC = [];
    this.linePoints = new Array(lineArrs.length);
    this.endBasis = new Array(4);

    for (var i = 0; i < 4; ++i)
    {
        this.startBasis[i] = basis[i].slice();
        this.endBasis[i] = basis[i].slice();
    }

    Lines.push(this);

    for (var i = 0; i < lineArrs.length; ++i)
    {
        var m = new THREE.LineBasicMaterial();
        m.side = THREE.DoubleSide;
        var geo = new THREE.Geometry();
        var vertices = lineArrs[i];

        this.linePoints[i] = vertices;
        geo.vertices = vertices;
        this.lines[i] = new THREE.Line(geo, m);

    }



    this.getBc = function(x, y, z){
        var coords = [];
        var b1 = this.basis[0];
        var b2 = this.basis[1];
        var b3 = this.basis[2];
        var b4 = this.basis[3];
        var m1, m2, m3, m4;
        var maindet = (b2[0] - b1[0]) * (b3[1] - b1[1]) * (b4[2] - b1[2]) +
            (b2[1] - b1[1]) * (b3[2] - b1[2]) * (b4[0] - b1[0]) +
            (b3[0] - b1[0]) * (b4[1] - b1[1]) * (b2[2] - b1[2]) -
            (b4[0] - b1[0]) * (b3[1] - b1[1]) * (b2[2] - b1[2]) -
            (b3[2] - b1[2]) * (b4[1] - b1[1]) * (b2[0] - b1[0]) -
            (b3[0] - b1[0]) * (b2[1] - b1[1]) * (b4[2] - b1[2]);
        var det = (x - b1[0]) * (b3[1] - b1[1]) * (b4[2] - b1[2]) +
            (y - b1[1]) * (b3[2] - b1[2]) * (b4[0] - b1[0]) +
            (b3[0] - b1[0]) * (b4[1] - b1[1]) * (z - b1[2]) -
            (b4[0] - b1[0]) * (b3[1] - b1[1]) * (z - b1[2]) -
            (b3[2] - b1[2]) * (b4[1] - b1[1]) * (x - b1[0]) -
            (b3[0] - b1[0]) * (y - b1[1]) * (b4[2] - b1[2]);
        m2 = det / maindet;
        det = (b2[0] - b1[0]) * (y - b1[1]) * (b4[2] - b1[2]) +
            (b2[1] - b1[1]) * (z - b1[2]) * (b4[0] - b1[0]) +
            (x - b1[0]) * (b4[1] - b1[1]) * (b2[2] - b1[2]) -
            (b4[0] - b1[0]) * (y - b1[1]) * (b2[2] - b1[2]) -
            (z - b1[2]) * (b4[1] - b1[1]) * (b2[0] - b1[0]) -
            (x - b1[0]) * (b2[1] - b1[1]) * (b4[2] - b1[2]);

        m3 = det / maindet;
        det = (b2[0] - b1[0]) * (b3[1] - b1[1]) * (z - b1[2]) +
            (b2[1] - b1[1]) * (b3[2] - b1[2]) * (x - b1[0]) +
            (b3[0] - b1[0]) * (y - b1[1]) * (b2[2] - b1[2]) -
            (x - b1[0]) * (b3[1] - b1[1]) * (b2[2] - b1[2]) -
            (b3[2] - b1[2]) * (y - b1[1]) * (b2[0] - b1[0]) -
            (b3[0] - b1[0]) * (b2[1] - b1[1]) * (z - b1[2]);

        m4 = det / maindet;
        m1 = 1 - m2 - m3 - m4;
        coords.push(m1);
        coords.push(m2);
        coords.push(m3);
        coords.push(m4);
        return coords;
    }

    this.rtd = function(m1, m2, m3, m4){
        var coords = [];
        var b1 = this.basis[0];
        var b2 = this.basis[1];
        var b3 = this.basis[2];
        var b4 = this.basis[3];
        coords.push((m1 * b1[0] + m2 * b2[0] + m3 * b3[0] + m4 * b4[0]) / (m1 + m2 + m3 + m4));
        coords.push((m1 * b1[1] + m2 * b2[1] + m3 * b3[1] + m4 * b4[1]) / (m1 + m2 + m3 + m4));
        coords.push((m1 * b1[2] + m2 * b2[2] + m3 * b3[2] + m4 * b4[2]) / (m1 + m2 + m3 + m4));
        return coords;
    }

    this.setBC = function() {

        this.BC = new Array(this.linePoints.length);
        for (var i = 0; i < this.linePoints.length; ++i) {

            var points = this.linePoints[i];
            var bcpoints = [];
            for (var j = 0; j < points.length; ++j) {

                var coords = this.getBc(points[j].x, points[j].y, points[j].z);
                bcpoints.push(coords[0]);
                bcpoints.push(coords[1]);
                bcpoints.push(coords[2]);
                bcpoints.push(coords[3]);
            }
            this.BC[i] = bcpoints;

        }

    }

    this.changeBasis = function() {
        for (var i = 0; i < this.BC.length; ++i) {
            var bcpoints = this.BC[i];
            var points = [];
            for (var j = 0; j < bcpoints.length; j += 4) {

                var coords = this.rtd(bcpoints[j], bcpoints[j + 1], bcpoints[j + 2], bcpoints[j + 3]);
                points.push(new THREE.Vector3(coords[0], coords[1], coords[2]));
            }
            this.linePoints[i] = points;
        }

    }


    this.show = function(scene)
    {
        for (var i = 0; i < this.lines.length; ++i)
        {
            scene.add(this.lines[i]);
        }
    }


    this.rm = function (scene) {
        for (var i = 0; i < this.lines.length; ++i)
        {
            scene.remove(this.lines[i]);
        }
    }

    this.refresh = function(scene)
    {
        //this.rm(scene);
        var m = new THREE.LineBasicMaterial();
        m.side = THREE.DoubleSide;
        for (var i = 0; i < this.linePoints.length; ++i)
        {
            var points = this.linePoints[i];
            //var geometry = new THREE.Geometry;
            var geometry = this.lines[i].geometry;

            geometry.vertices = points;
            //geometry.vertices.need
            //this.lines[i] = new THREE.Line(geometry, m);
            geometry.verticesNeedUpdate = true;


        }
        //this.show(scene);
    }

    this.systole = function (start, stop, cur) {

        for (var i = 0; i < 4; ++i)
        {
            var hx = (this.endBasis[i][0] - this.startBasis[i][0]) / (stop - start);
            var hy = (this.endBasis[i][1] - this.startBasis[i][1]) / (stop - start);
            var hz = (this.endBasis[i][2] - this.startBasis[i][2]) / (stop - start);

            this.basis[i][0] = this.startBasis[i][0] + (cur - start) * hx;
            this.basis[i][1] = this.startBasis[i][1] + (cur - start) * hy;
            this.basis[i][2] = this.startBasis[i][2] + (cur - start) * hz;
        }

        this.changeBasis();
        //this.refresh(scene);
    }
    this.diastole = function (start, stop, cur) {

        for (var i = 0; i < 4; ++i)
        {
            var hx = (this.endBasis[i][0] - this.startBasis[i][0]) / (stop - start);
            var hy = (this.endBasis[i][1] - this.startBasis[i][1]) / (stop - start);
            var hz = (this.endBasis[i][2] - this.startBasis[i][2]) / (stop - start);

            this.basis[i][0] = this.endBasis[i][0] - (cur - start) * hx;
            this.basis[i][1] = this.endBasis[i][1] - (cur - start) * hy;
            this.basis[i][2] = this.endBasis[i][2] - (cur - start) * hz;
        }

        this.changeBasis();
    }


}


var l;
var B;
var A;
var O;
var C;
var Al;
var l1;
var Al1;
var Al12;
var Ale;
var l2;
var Wl;
var l3;
var l4;
var Oav;
var l5;
var l6;
var O1;
var A1;
var B11;
var C1;
var l7;
var l8;
var Are;
var Ar;
var l9;
var l10;
var Wr;
var l11;
var l12;
var Oav1;
var l13;
var TC;

var B1 = new THREE.Vector3(-0.0676400677466707, 0.04936012042695931, -0.03467059713270282);
var Wl1 = new THREE.Vector3(-0.1776992063468648, 0.03396957441289414, 0.010803932482879919);
var B111 = new THREE.Vector3(-0.35541137596468336, -0.03305056249775101, 0.1291245570535613);
var Wr1 = new THREE.Vector3(-0.27569618746416075, -0.02287116891976776, 0.09721803267849571);
var TC1 = new THREE.Vector3(-0.34958315129205036, 0.10782716107890195, -0.022393813507450955);
var M = new THREE.Vector3(-0.16676541157496794, 0.15599433323137576, -0.12199309781849299);

function test(scene) {
    var obj = lv.contour;
    var lines = lv.contour.children;
    lines[0].material.color = new THREE.Color(1, 0, 0);
    //lines[0].visible = false;


    var ind = lv.searchMinY();
    var apex = new THREE.Vector3(lv.currentMesh.points[ind], lv.currentMesh.points[ind + 1], lv.currentMesh.points[ind + 2]).projectOnPlane(plane.normal);
    var tc = new THREE.Vector3(tricuspid.avgh[0], tricuspid.avgh[1], tricuspid.avgh[2]).projectOnPlane(plane.normal);
    var mc = new THREE.Vector3(mitral.avgh[0], mitral.avgh[1], mitral.avgh[2]).projectOnPlane(plane.normal);
    var axisGeom = new THREE.Geometry();
    axisGeom.vertices.push(mc, apex);
    var axis = new THREE.Line(axisGeom);
    //scene.add(axis);
    var d = new THREE.Vector3().subVectors(apex, mc);// apex - mc;
    O = new THREE.Vector3().addVectors(mc, d.multiplyScalar(1/3.0));
    //addDot(O);
    Al1 = new THREE.Vector3().addVectors(mc, d.multiplyScalar(2.4)).projectOnPlane(plane.normal);
    //addDot(Al1);
    var dots = getVertices(obj, 0, 21, 0, false);


    var obj1 = heart.contour;
    lines = heart.contour.children;
    lines[0].material.color = new THREE.Color(0, 1, 0);
    var dots1 = getVertices(obj1, 52, 58, 0, false);

    var temp = getVertices(obj1, 0, 52, 0, false);
    Contours.push(getContour(temp));
    var temp1 = getVertices(obj1, 91, 155, 0, false);
    Contours.push(getContour(temp1));


    for (var i = 1; i < lines.length; ++i) {
        var temp2 = getVertices(obj1, 0, lines[i].geometry.vertices.length, i, false);
        Contours.push(getContour(temp2));
    }


    var obj5 = la.contour;
    //console.log(obj5);
    lines = obj5.children;
    for (var i = 0; i < lines.length; ++i) {
        var temp3 = getVertices(obj5, 0, lines[i].geometry.vertices.length, i, false);
        Contours.push(getContour(temp3));
    }

    var obj6 = ra.contour;
    //console.log(obj6);
    lines = obj6.children;
    for (var i = 0; i < lines.length; ++i) {
        var temp4 = getVertices(obj6, 0, lines[i].geometry.vertices.length, i, false);
        Contours.push(getContour(temp4));
    }

    var obj7 = pulmonary.contour;
    //console.log(obj6);
    lines = obj7.children;
    for (var i = 0; i < lines.length; ++i) {
        var temp5 = getVertices(obj7, 0, lines[i].geometry.vertices.length, i, false);
        Contours.push(getContour(temp5));
    }

    var obj8 = aortha.contour;
    //console.log(obj6);
    lines = obj8.children;
    for (var i = 0; i < lines.length; ++i) {
        var temp6 = getVertices(obj8, 0, lines[i].geometry.vertices.length, i, false);
        Contours.push(getContour(temp6));
    }

    //var temp6 = getVertices(obj5, 0, lines[0].)

    C = dots1[5];

    A = dots1[0];
    B = dots[20];
    var basis = [];
    basis.push([A.x, A.y, A.z],
        [B.x, B.y, B.z], [C.x, C.y, C.z], [1, 1, 1]);


    l = new Line(basis, [dots, dots1]);
    l.show(scene);
    l.setBC();
    //console.log(l);

    var dots2 = getVertices(obj1, 57, 75, 0, false);
    var dots3 = getVertices(obj, 21, 109, 0, false);
    Al = dots3[dots3.length - 1];
    var basis1 = [[O.x, O.y, O.z], [B.x, B.y, B.z], [Al.x, Al.y, Al.z], [1, 1, 1]];
    l1 = new Line(basis1, [dots3]);
    l1.show(scene);
    l1.setBC();
    Ale = dots2[dots2.length - 1];
    var basis2 = [[O.x, O.y, O.z], [C.x, C.y, C.z], [Ale.x, Ale.y, Ale.z], [1, 1, 1]];
    l2 = new Line(basis2, [dots2]);
    l2.show(scene);
    l2.setBC();

    var dots4 = getVertices(obj, 108, 149, 0, false);
    //addDot(B1);
    Wl = dots4[dots4.length - 1];
    var basis3 = [[O.x, O.y, O.z], [Wl.x, Wl.y, Wl.z], [Al.x, Al.y, Al.z], [1, 1, 1]];
    l3 = new Line(basis3, [dots4]);
    l3.show(scene);
    l3.setBC();

    var dots5 = getVertices(obj, 148, 168, 0, false);
    Oav = dots5[dots5.length - 1];
    var basis4 = [[O.x, O.y, O.z], [Wl.x, Wl.y, Wl.z], [Oav.x, Oav.y, Oav.z], [1, 1, 1]];
    l4 = new Line(basis4, [dots5]);
    l4.show(scene);
    l4.setBC();

    var obj2 = mitral.contour;
    lines = obj2.children;
    lines[0].material.color = new THREE.Color(1, 0, 0);
    //console.log(lines[0]);
    var dots6 = getVertices(obj2, 0, 22, 0, false);
    //addDot(dots6[5]);
    var M1 = dots6[5];
    var M2 = dots6[0];
    var M3 = dots6[dots6.length - 1];
    var basis5 = [[M1.x, M1.y, M1.z], [M2.x, M2.y, M2.z], [M3.x, M3.y, M3.z], [1, 1, 1]];
    l5 = new Line(basis5, [dots6]);
    l5.show(scene);
    l5.setBC();

    //console.log(lines[1]);
    var dots7 = getVertices(obj2, 0, 23, 1, false);
    l6 = new Line(basis, [dots7]);
    l6.show(scene);
    l6.setBC();

    var obj3 = rv.contour;
    lines = obj3.children;
    lines[0].material.color = new THREE.Color(0,0,1);
    //console.log(lines[0]);

    var index = rv.searchMinY();
    var apex1 = new THREE.Vector3(rv.currentMesh.points[index], rv.currentMesh.points[index + 1], rv.currentMesh.points[index + 2]).projectOnPlane(plane.normal);
    //addDot(apex1);
    var axisGeom = new THREE.Geometry();
    axisGeom.vertices.push(tc, apex1);
    axis = new THREE.Line(axisGeom);
    //scene.add(axis);

    d = new THREE.Vector3().subVectors(apex1, tc);// apex - tc;
    O1 = new THREE.Vector3().addVectors(tc, d.multiplyScalar(1/3.0));
    //addDot(O1);
    Al12 = new THREE.Vector3().addVectors(tc, d.multiplyScalar(2.4)).projectOnPlane(plane.normal);
    //addDot(Al12);
    var dots8 = getVertices(obj3, 0, 16, 0, false);
    var dots9 = getVertices(obj1, 89, 91, 0, false);
    A1 = dots9[1];
    B11 = dots8[dots8.length - 1];
    C1 = dots9[0];
    var basis6 = [[A1.x, A1.y, A1.z], [B11.x, B11.y, B11.z], [C1.x, C1.y, C1.z], [1, 1, 1]];
    l7 = new Line(basis6, [dots8, dots9]);
    l7.show(scene);
    l7.setBC();

    var obj4 = tricuspid.contour;
    lines = obj4.children;
    lines[0].material.color = new THREE.Color(0, 0, 1);
    //console.log(lines[0]);
    console.log(lines[1]);
    console.log(lines[2]);
    console.log(lines[3]);
    lines[3].visible = false;
    var dots16 = getVertices(obj4, 0, 9, 2, false);
    var dots17 = getVertices(obj4, 0, 11, 0, false);
    var dots18 = getVertices(obj4, 0, 11, 4, false);
    //addDot(dots16[dots16.length - 1]);
    //addDot(dots16[0]);
    TC = (dots16[5]);
    var T1 = dots16[0];
    var T2 = dots16[dots16.length - 1];
    var dots11 = getVertices(obj4, 0, 22, 1, false);



    l8 = new Line(basis6, [dots11]);
    l8.show(scene);
    l8.setBC();

    var dots12 = getVertices(obj1, 75, 90, 0, false);
    Are = dots12[6]; //снаружи
    var dots13 = getVertices(obj3, 15, 56, 0, false);
    Ar = dots13[dots13.length - 1]; //внутри
    //addDot(Are);

    var basis7 = [[C1.x, C1.y, C1.z], [Are.x, Are.y, Are.z], [O1.x, O1.y, O1.z], [1, 1, 1] ];
    l9 = new Line(basis7, [dots12]);
    l9.show(scene);
    l9.setBC();

    var basis8 = [[B11.x, B11.y, B11.z], [Ar.x, Ar.y, Ar.z], [O1.x, O1.y, O1.z], [1, 1, 1] ];
    l10 = new Line(basis8, [dots13]);
    l10.show(scene);
    l10.setBC();

    var dots14 = getVertices(obj3, 55, 98, 0, false);
    Wr = dots14[dots14.length - 1];
    var basis9 = [[Wr.x, Wr.y, Wr.z], [Ar.x, Ar.y, Ar.z], [O1.x, O1.y, O1.z], [1, 1, 1] ];
    l11 = new Line(basis9, [dots14]);
    l11.show(scene);
    l11.setBC();
    //addDot(B111);

    var dots15 = getVertices(obj3, 97, 112, 0, false);
    var Oav1 = dots15[dots15.length - 1];
    var basis10 = [[Wr.x, Wr.y, Wr.z], [Oav1.x, Oav1.y, Oav1.z], [O1.x, O1.y, O1.z], [1, 1, 1] ];
    l12 = new Line(basis10, [dots15]);
    l12.show(scene);
    l12.setBC();
    //addDot(Wr);

    var basis11 = [[TC.x, TC.y, TC.z], [T1.x, T1.y, T1.z], [T2.x, T2.y, T2.z], [1, 1, 1] ];
    l13 = new Line(basis11, [dots16, dots17, dots18]);
    l13.show(scene);
    l13.setBC();



    l.endBasis[1] = [B1.x, B1.y, B1.z];
    l.endBasis[2] = [B.x, B.y, B.z];

    //console.log(l);
    l1.endBasis[1] = [B1.x, B1.y, B1.z];
    l1.endBasis[2] = [Al1.x, Al1.y, Al1.z];


    l2.endBasis[1] = [B.x, B.y, B.z];
    l2.endBasis[2] = [Al.x, Al.y, Al.z];


    l3.endBasis[2] = [Al1.x, Al1.y, Al1.z];
    l3.endBasis[1] = [Wl1.x, Wl1.y, Wl1.z];


    l4.endBasis[1] = [Wl1.x, Wl1.y, Wl1.z];


    l5.endBasis[0] = [M.x, M.y, M.z];


    l6.endBasis[1] = [B1.x, B1.y, B1.z];
    l6.endBasis[2] = [B.x, B.y, B.z];


    l7.endBasis[1] = [B111.x, B111.y, B111.z];
    l7.endBasis[2] = [B11.x, B11.y, B11.z];


    l8.endBasis[1] = [B111.x, B111.y, B111.z];
    l8.endBasis[2] = [B11.x, B11.y, B11.z];


    l9.endBasis[1] = [Ar.x, Ar.y, Ar.z];
    l9.endBasis[0] = [B11.x, B11.y, B11.z];
    l9.linePoints[0][0] = l2.linePoints[0][l2.linePoints[0].length - 1];

    l10.endBasis[1] = [Al12.x, Al12.y, Al12.z];
    l10.endBasis[0] = [B111.x, B111.y, B111.z];

    l11.endBasis[1] = [Al12.x, Al12.y, Al12.z];
    l11.endBasis[0] = [Wr1.x, Wr1.y, Wr1.z];



    l12.endBasis[0] = [Wr1.x, Wr1.y, Wr1.z];


    l13.endBasis[0] = [TC1.x, TC1.y, TC1.z];



}


function changeLine(dt) {

    /*
    l.endBasis = l.basis;

    l.endBasis[1] = [B1.x, B1.y, B1.z];
    l.endBasis[2] = [B.x, B.y, B.z];
    l.cycle(0, 1, 1);

    console.log(l);
    l1.endBasis = l1.basis;
    l1.endBasis[1] = [B1.x, B1.y, B1.z];
    l1.endBasis[2] = [Al1.x, Al1.y, Al1.z];
    l1.cycle(0, 1, 1);


    l2.endBasis = l2.basis;
    l2.endBasis[1] = [B.x, B.y, B.z];
    l2.endBasis[2] = [Al.x, Al.y, Al.z];
    l2.cycle(0, 1, 1);


    l3.endBasis = l3.basis;
    l3.endBasis[2] = [Al1.x, Al1.y, Al1.z];
    l3.endBasis[1] = [Wl1.x, Wl1.y, Wl1.z];
    l3.cycle(0, 1, 1);


    l4.endBasis = l4.basis;
    l4.endBasis[1] = [Wl1.x, Wl1.y, Wl1.z];
    l4.cycle(0, 1, 1);


    l5.endBasis = l5.basis;
    l5.endBasis[0] = [M.x, M.y, M.z];
    l5.cycle(0, 1, 1);


    l6.endBasis = l6.basis;
    l6.endBasis[1] = [B1.x, B1.y, B1.z];
    l6.endBasis[2] = [B.x, B.y, B.z];
    l6.cycle(0, 1, 1);


    l7.endBasis = l7.basis;
    l7.endBasis[1] = [B111.x, B111.y, B111.z];
    l7.endBasis[2] = [B11.x, B11.y, B11.z];
    l7.cycle(0, 1, 1);


    l8.endBasis = l8.basis;
    l8.endBasis[1] = [B111.x, B111.y, B111.z];
    l8.endBasis[2] = [B11.x, B11.y, B11.z];
    l8.cycle(0, 1, 1);


    l9.endBasis = l9.basis;
    l9.endBasis[1] = [Ar.x, Ar.y, Ar.z];
    l9.endBasis[0] = [B11.x, B11.y, B11.z];
    l9.cycle(0, 1, 1);
    l9.linePoints[0][0] = l2.linePoints[0][l2.linePoints[0].length - 1];
    l9.refresh(scene);

    l10.endBasis = l10.basis;
    l10.endBasis[1] = [Al12.x, Al12.y, Al12.z];
    l10.endBasis[0] = [B111.x, B111.y, B111.z];
    l10.cycle(0, 1, 1);

    l11.endBasis = l11.basis;
    l11.endBasis[1] = [Al12.x, Al12.y, Al12.z];
    l11.endBasis[0] = [Wr1.x, Wr1.y, Wr1.z];
    l11.cycle(0, 1, 1);



    l12.endBasis = l12.basis;
    l12.endBasis[0] = [Wr1.x, Wr1.y, Wr1.z];
    l12.cycle(0, 1, 1);


    l13.endBasis = l13.basis;
    l13.endBasis[0] = [TC1.x, TC1.y, TC1.z];
    l13.cycle(0, 1, 1);

    */
    for (var i = 0; i < Lines.length; ++i)
    {
        Lines[i].cycle(0, 1, 0.3);

        if (i == 9) {
            l9.linePoints[0][0] = l2.linePoints[0][l2.linePoints[0].length - 1];
        }
        Lines[i].refresh(scene);

    }

}

function Heart_cycle(data, cur) {

    for (var j = 0; j < data.length; ++j) {
        if (cur <= data[j][1] && cur >= data[j][0]) {
            for (var i = 0; i < Lines.length; ++i) {

                if (data[j][2] == 1) {
                    Lines[i].systole(data[j][0], data[j][1], cur);
                }
                else if (data[j][2] == -1) {
                    Lines[i].diastole(data[j][0], data[j][1], cur);
                }

                if (i == 9) {
                    l9.linePoints[0][0] = l2.linePoints[0][l2.linePoints[0].length - 1];
                }
                Lines[i].refresh(scene);

            }
            break;
        }
    }
    
}

//lines[0].material.color.needsUpdate = true;