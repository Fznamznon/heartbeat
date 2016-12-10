/**
 * Created by Мария on 09.08.2016.
 */
var Models = [];
function Model(filename, name, color) {
    this.controlMesh =
    {
        points : [],
        cells : [],
        triangles : [],
        normals : [],
        BC : []

    }
    this.currentMesh =
    {
        points : [],
        cells : [],
        triangles : [],
        normals : [],
        BC : []

    }

    this.filename = filename;
    this.basis = [];
    this.wireframeMode = 0;
    this.visible = true;
    this.default_color = color;
    this.name = name;
    this.current_color = color;
    //this.normal_color = color;

    this.avgh = [0.0, 0.0, 0.0];

    this.mesh = null;
    this.wireframe = null;
    Models.push(this);

    this.geo = null;
    this.contour = null;

    this.getColorArray = function(color) {
        var colors = new Uint8Array(this.currentMesh.points.length);
        for (var i = 0; i < colors.length; i += 3) {
            colors[i] = color.r * 255;
            colors[i + 1] = color.g * 255;
            colors[i + 2] = color.b * 255;
        }
        return colors;
    }
    
    this.setColor = function(color) {
        var colors = this.getColorArray(color);
        this.mesh.geometry.attributes.color.array = colors;
        this.mesh.geometry.attributes.color.needsUpdate = true;
    }


    this.refreshMesh = function (scene, material) {

        var geometry = new THREE.BufferGeometry();

        var vertices = new Float32Array(this.currentMesh.points);
        var indices = new Uint32Array( this.currentMesh.triangles);
        //var normals = new Float32Array(this.currentMesh.normals);
        var temp_color = new THREE.Color(this.current_color);
        //console.log(temp_color);
        var colors = this.getColorArray(temp_color);
        geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );

        geometry.addAttribute( 'position', new THREE.BufferAttribute(vertices , 3 ) );
        //geometry.addAttribute( 'normal', new THREE.BufferAttribute(normals , 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute(colors , 3, true ) );
        geometry.computeVertexNormals();

        geometry.attributes.color.needsUpdate = true;
        this.geo = new THREE.Geometry().fromBufferGeometry(geometry);

        this.mesh = new THREE.Mesh( geometry, material );
        //this.mesh.doubleSided = true;
        
        
    }

    this.Hide = function(scene) {
        if (this.mesh != null)
            scene.remove(this.mesh);
        if (this.wireframe != null)
            scene.remove(this.wireframe);
    }

    this.refreshDisplay = function(scene) {

        if (this.mesh != null) {
            scene.remove(this.mesh);
            //this.mesh.dispose();
        }
        if (this.wireframe != null) {
            scene.remove(this.wireframe);
            //this.mesh.dispose();
        }
        this.mesh = null;
        this.wireframe = null;
        var material;

        switch (this.wireframeMode){
            case 0:
                material = new THREE.MeshPhongMaterial({
                    vertexColors: THREE.VertexColors,
                       specular: 0x666666, shininess: 40 });
                material.side = THREE.DoubleSide;

                //material.color = new THREE.Color(this.current_color);
                //material.color = new THREE.Color(this.default_color.r, this.default_color.g, this.default_color.b);


                this.refreshMesh(scene, material);
                break;
            case 1:

                material = new THREE.MeshPhongMaterial({
                    vertexColors: THREE.VertexColors,
                    specular: 0x666666, shininess: 40 });
                material.side = THREE.DoubleSide;

                this.refreshMesh(scene, material);
                this.wireframe = new THREE.WireframeHelper( this.mesh, 0x0000ff);
                scene.add(this.wireframe);
                break;

            case 2:
                material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors,
                    wireframe: true } );

                material.side = THREE.DoubleSide;
                this.refreshMesh(scene, material);
                break;

        }
        scene.add(this.mesh);

    }

    this.convertToTriangles = function(Mesh) {
        var cells = Mesh.cells;
        Mesh.triangles = [];

        for (var i = 0; i < cells.length; ++i) {
            if (cells[i].length == 3) {
                Mesh.triangles.push(cells[i][0]);
                Mesh.triangles.push(cells[i][1]);
                Mesh.triangles.push(cells[i][2]);

            }
            if (cells[i].length == 4) {
                Mesh.triangles.push(cells[i][0]);
                Mesh.triangles.push(cells[i][1]);
                Mesh.triangles.push(cells[i][2]);

                Mesh.triangles.push(cells[i][0]);
                Mesh.triangles.push(cells[i][2]);
                Mesh.triangles.push(cells[i][3]);

            }
        }
    }

    this.getNormal = function(a, b, c, vertexPositions)
    {
        var v1x = vertexPositions[3 * b] - vertexPositions[3 * a];
        var v1y = vertexPositions[3 * b + 1] - vertexPositions[3 * a + 1];
        var v1z = vertexPositions[3 * b + 2] - vertexPositions[3 * a + 2];

        var v2x = vertexPositions[3 * c] - vertexPositions[3 * a];
        var v2y = vertexPositions[3 * c + 1] - vertexPositions[3 * a + 1];
        var v2z = vertexPositions[3 * c + 2] - vertexPositions[3 * a + 2];


        var r = [];
        var module = Math.sqrt((v1y * v2z - v2y * v1z) * (v1y * v2z - v2y * v1z)  +
            (v1z * v2x - v2z * v1x) * (v1z * v2x - v2z * v1x) +
            (v1x * v2y - v2x * v1y) * (v1x * v2y - v2x * v1y));
        r.push((v1y * v2z - v2y * v1z) / module);
        r.push((v1z * v2x - v2z * v1x) / module);
        r.push((v1x * v2y - v2x * v1y) / module);
        
        return r;

    }

    this.setNormal = function(a, normal, normalBuffer) {
        normalBuffer[3 * a] = normal[0];
        normalBuffer[3 * a + 1] = normal[1];
        normalBuffer[3 * a + 2] = normal[2];
    }

    this.calcNormals = function(Mesh) {


        var triangles = Mesh.triangles;
        var points = Mesh.points;
        var a, b, c;
        var normal;
        Mesh.normals = new Array(points.length);
        for (var i = 0; i < triangles.length; i += 3) { 
            a = triangles[i];
            b = triangles[i + 1];
            c = triangles[i + 2];
            
            normal = this.getNormal(a, c, b, points);
            this.setNormal(a, normal, Mesh.normals);

            normal = this.getNormal(b, a, c, points);
            this.setNormal(b, normal, Mesh.normals);

            normal = this.getNormal(c, b, a, points);
            this.setNormal(c, normal, Mesh.normals);


        }
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
        var b1 = basis[0];
        var b2 = basis[1];
        var b3 = basis[2];
        var b4 = basis[3];
        coords.push((m1 * b1[0] + m2 * b2[0] + m3 * b3[0] + m4 * b4[0]) / (m1 + m2 + m3 + m4));
        coords.push((m1 * b1[1] + m2 * b2[1] + m3 * b3[1] + m4 * b4[1]) / (m1 + m2 + m3 + m4));
        coords.push((m1 * b1[2] + m2 * b2[2] + m3 * b3[2] + m4 * b4[2]) / (m1 + m2 + m3 + m4));
        return coords;
    }

    this.setBC = function(Mesh) {
        Mesh.BC = [];

        for (i = 0; i < Mesh.points.length; i+=3)
        {
            var coords = this.getBc(Mesh.points[i], Mesh.points[i + 1], Mesh.points[i + 2]);
            Mesh.BC.push(coords[0]);
            Mesh.BC.push(coords[1]);
            Mesh.BC.push(coords[2]);
            Mesh.BC.push(coords[3]);


        }
    }
    



    this.parseFile = function(data) {
        var lines = data.split("\n");
        var counts = lines[0].split(" ");

        var v = parseInt(counts[0]);
        var ed = parseInt(counts[1]);
        var f = parseInt(counts[2]);

        var edges = [];

        for (i = 1; i <= v; ++i) {
            var val = lines[i].split(/\s+/);

            for (j = 0; j < val.length - 1; ++j) {
                this.controlMesh.points.push(parseFloat(val[j]));
                this.currentMesh.points.push(parseFloat(val[j]));
                j++;
                this.controlMesh.points.push(parseFloat(val[j]));
                this.currentMesh.points.push(parseFloat(val[j]));
                j++;
                this.controlMesh.points.push(parseFloat(val[j]));
                this.currentMesh.points.push(parseFloat(val[j]));
            }
        }
        for (i = v + 1; i <= v + ed; ++i) {
            var val = lines[i].split(/\s+/);
            for (j = 0; j < val.length - 1; ++j){
                edges.push(parseInt(val[j]));
                j++;
                edges.push(parseInt(val[j]));
                j++;
            }
        }
        for (i = v + ed + 1; i <= v + ed + f; ++i) {
            var val = lines[i].split(/\s+/);
            if (val[0] != 'f') continue;
            var figure_type = parseInt(val[1]);
            var a = [];
            var e, ind;

            for (var j = 2; j < 2 + figure_type; ++j)
            {
                e = parseInt(val[j]);
                ind = (e >= 0)? e * 2 : (-1 * e - 1) * 2 + 1;
                a.push(edges[ind]);
            }
            this.controlMesh.cells.push(a);
            this.currentMesh.cells.push(a);
        }
        this.convertToTriangles(this.controlMesh);
        this.convertToTriangles(this.currentMesh);
        this.calcNormals(this.controlMesh);
        this.calcNormals(this.currentMesh);
        if (this.basis.length == 0){

            var b1 = [];
            var b2 = [];
            var b3 = [];
            var b4 = [];

            b1.push(this.currentMesh.points[297 * 3]);

            b1.push(this.currentMesh.points[297 * 3 + 1]);
            b1.push(this.currentMesh.points[297 * 3 + 2]);

            b2.push(this.currentMesh.points[680 * 3]);
            b2.push(this.currentMesh.points[680 * 3 + 1]);
            b2.push(this.currentMesh.points[680 * 3 + 2]);

            b3.push(this.currentMesh.points[704 * 3]);
            b3.push(this.currentMesh.points[704 * 3 + 1]);
            b3.push(this.currentMesh.points[704 * 3 + 2]);

            b4.push(this.currentMesh.points[24 * 3]);
            b4.push(this.currentMesh.points[24 * 3 + 1]);
            b4.push(this.currentMesh.points[24 * 3 + 2]);
            this.basis.push(b1);
            this.basis.push(b2);
            this.basis.push(b3);
            this.basis.push(b4);
        }
        this.setBC(this.currentMesh);
        this.setBC(this.controlMesh);
        //this.setBuffers(gl);


    }
    
    this.initialize = function() {

        this.parseFile(this.filename);
        /*var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", this.filename, false);
        var obj = this;
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4)
            {
                
                //alert(xmlhttp.responseText);
                obj.parseFile(xmlhttp.responseText);
                console.log('received')
            }
        };
        xmlhttp.send();*/
    };
    
    this.changeBasis = function()
    {
        this.currentMesh.points = [];
        BC = this.currentMesh.BC;
        for (var i = 0; i < BC.length; i += 4)
        {
            var coords = this.rtd(BC[i], BC[i + 1], BC[i + 2], BC[i + 3]);
            this.currentMesh.points.push(coords[0]);
            this.currentMesh.points.push(coords[1]);
            this.currentMesh.points.push(coords[2]);
        }
        this.calcNormals(this.currentMesh);

    }
    this.returnToControlMesh = function() {
        this.currentMesh.points = [];
        this.currentMesh.normals= [];
        this.currentMesh.triangles = [];
        this.currentMesh.BC = [];
        for (var i = 0; i < this.controlMesh.points.length; ++i) {
            this.currentMesh.points.push(this.controlMesh.points[i]);
            this.currentMesh.normals.push(this.controlMesh.normals[i]);
        }
        for (var i = 0; i < this.controlMesh.triangles.length; ++i) {
            this.currentMesh.triangles.push(this.controlMesh.triangles[i]);
        }
        for (var i = 0; i < this.controlMesh.BC.length; ++i) {
            this.currentMesh.BC.push(this.controlMesh.BC[i]);
        }
    }
    this.updateSubdiv = function(numSubdivisions) {

        if (numSubdivisions == 0)
            this.returnToControlMesh();
        else {
            var obj = catmullClark(this.controlMesh.points, this.controlMesh.cells, numSubdivisions);
            this.currentMesh.points = obj.points;
            this.currentMesh.cells = obj.cells;
            this.convertToTriangles(this.currentMesh);
            this.calcNormals(this.currentMesh);
            this.setBC(this.currentMesh);
            this.avgh = obj.avgh;
        }

        //lv.refreshBuffers(gl);
    }
    this.searchMinY = function () {
        var min = 100500;
        var index = -1;
        for (var i = 0; i < this.currentMesh.points.length; i += 3){
            if (this.currentMesh.points[i + 1] < min){
                min = this.currentMesh.points[i + 1];
                index = i;
            }
        }
        return index;
    }
    this.setAvgh = function () {
        var positions = this.currentMesh.points;

        // original points, indexed by their indices.
        // For every point, we store adjacent faces and adjacent edges.
        originalPoints = [];

        // original faces, in their original order.
        // For every face, we store the edges, the points, and the face point.
        faces = [];

        // original edges. Indexed by the sorted indices of their vertices
        // So the edge whose edge vertices has index `6` and `2`, will be
        // indexed by the array [2,6]
        edges = [];
        avghole = [];

        /*
         First we collect all the information that we need to run the algorithm.
         Each point must know its adjacent edges and faces.
         Each face must know its edges and points.
         Each edge must know its adjacent faces and points.

         We collect all this information in this loop.
         */
        var cells = this.currentMesh.cells;
        for (var iCell = 0; iCell < cells.length; ++iCell) {

            var cellPositions = cells[iCell];
            var facePoints = [];

            // initialize:
            faces[iCell] = {};


            // go through all the points of the face.
            for (var j = 0; j < cellPositions.length; ++j) {

                var positionIndex = cellPositions[j];

                var pointObject;

                /*
                 On the fly, Create an object for every point.
                 */
                if (typeof originalPoints[positionIndex] === 'undefined') {
                    // create the object on the fly.

                    var vec = [];
                    vec.push(positions[positionIndex * 3]);
                    vec.push(positions[positionIndex * 3 + 1]);
                    vec.push(positions[positionIndex * 3 + 2]);
                    pointObject = {
                        point: vec,
                        faces: [],
                        edges: new Set()

                    };

                    originalPoints[positionIndex] = pointObject;
                } else {
                    pointObject = originalPoints[positionIndex];
                }

                // every point should have a reference to its face.
                pointObject.faces.push(faces[iCell]);

                facePoints.push(pointObject);
            }

            // every face should know its points.
            faces[iCell].points = facePoints;

            var avg = [0, 0, 0];



            var faceEdges = [];

            // go through all the edges of the face.
            for (var iEdge = 0; iEdge < cellPositions.length; ++iEdge) {

                var edge;

                if (cellPositions.length == 3) { // for triangles
                    if (iEdge == 0) {
                        edge = [cellPositions[0], cellPositions[1]];
                    } else if (iEdge == 1) {
                        edge = [cellPositions[1], cellPositions[2]];
                    } else if (iEdge == 2) {
                        edge = [cellPositions[2], cellPositions[0]];
                    }
                } else { // for quads.
                    if (iEdge == 0) {
                        edge = [cellPositions[0], cellPositions[1]];
                    } else if (iEdge == 1) {
                        edge = [cellPositions[1], cellPositions[2]];
                    } else if (iEdge == 2) {
                        edge = [cellPositions[2], cellPositions[3]];
                    } else if (iEdge == 3) {
                        edge = [cellPositions[3], cellPositions[0]];
                    }
                }

                // every edge is represented by the sorted indices of its vertices.
                // (the sorting ensures that [1,2] and [2,1] are considered the same edge, which they are )
                edge = _sort(edge);

                var edgeObject;
                // on the fly, create an edge object.
                if (typeof edges[edge] === 'undefined') {

                    edgeObject = {
                        points: [originalPoints[edge[0]], originalPoints[edge[1]]],
                        faces: []

                    };

                    edges[edge] = edgeObject;
                } else {
                    edgeObject = edges[edge];
                }

                // every edge should know its adjacent faces.
                edgeObject.faces.push(faces[iCell]);

                // every point should know its adjacent edges.
                edgeObject.points[0].edges.add(edgeObject);
                edgeObject.points[1].edges.add(edgeObject);



                faceEdges.push(edgeObject);
            }

            // every face should know its edges.
            faces[iCell].edges = faceEdges;
        }
        avghole = [0, 0, 0];
        var hc = 0.0;

        for (var i = 0; i < positions.length / 3; ++i) {

            var point = originalPoints[i];
            var n = point.faces.length;


            if (n != point.edges.size) {

                addvec(avghole, point.point);
                hc++;
            }
        }

        multvec(avghole, 1.0 / hc);
        this.avgh = avghole;
    }
}

var la = new Model(MODELS_left_atrium, "Left_Atrium", "#c70000");
var lv = new Model(MODELS_left_ventricle, "Left_Ventricle", "#c70000");
var aortha = new Model(MODELS_aortha, "Aortha", "#c70000");
var heart = new Model(MODELS_heart, "Heart", "#bf4040");
var rv = new Model(MODELS_right_ventricle, "Right_Ventricle", "#335e92");
var ra = new Model(MODELS_right_atrium, "Right_Atrium", "#335e92");
var pulmonary = new Model(MODELS_pulmonary, "Pulmonary_Artery", "#335e92");
var tricuspid = new Model(MODELS_trucuspid_valve, "Tricuspid_Valve", "#ffe6e6");
var mitral = new Model(MODELS_valve, "Mitral_Valve", "#ffe6e6");
var heart_arteries = new Model(MODELS_heart_arteries, "Heart_Arteries", "#c70000");
var heart_veins= new Model(MODELS_heart_veins, "Heart_Veins", "#335e92");


