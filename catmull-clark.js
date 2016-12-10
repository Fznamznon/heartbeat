/**
 * Created by Мария on 09.08.2016.
 */

/*
 Example:
 Given [0,4] return [0,4]
 Given [2,1] return [1,2]
 */
function _sort(edge) {
    return edge[0] < edge[1] ? edge : [edge[1], edge[0]];
}

// out = a + b*s
function _mad(out, a, b, s) {
    out[0] = a[0] + s * b[0]
    out[1] = a[1] + s * b[1]
    out[2] = a[2] + s * b[2]
    return out;
}

function addvec(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
}

function multvec(a, num)
{
    a[0] *= num;
    a[1] *= num;
    a[2] *= num;
}
/*
 Implement Catmull-Clark subvision, as it is described on Wikipedia
 */


function _catmullClark(positions, cells) {

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

        // every face should now its points.
        faces[iCell].points = facePoints;

        var avg = [0, 0, 0];

        // now compute the facepoint(see Wikipedia).
        for (var i = 0; i < faces[iCell].points.length; ++i) {
            var v = faces[iCell].points[i].point;
            //vec3.add(avg, v, avg);
            addvec(avg, v);
        }
        //vec3.scale(avg, avg, 1.0 / faces[iCell].points.length);
        multvec(avg, 1.0 / faces[iCell].points.length);
        faces[iCell].facePoint = avg;

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


    // Compute the edge points and the midpoints of every edge.
    for (key in edges) {

        var edge = edges[key];

        var avg = [0, 0, 0];
        var count = 0;

        // add face points of edge.

        for (var i = 0; i < edge.faces.length; ++i) {
            var facePoint = edge.faces[i].facePoint;
            //vec3.add(avg, facePoint, avg);
            addvec(avg, facePoint);
            ++count;
        }

        // sum together the two endpoints.
        for (var i = 0; i < edge.points.length; ++i) {
            var endPoint = edge.points[i].point;
            //vec3.add(avg, endPoint, avg);
            addvec(avg, endPoint);
            ++count;
        }

        // finally, compute edge point.
        //vec3.scale(avg, avg, 1.0 / count);
        multvec(avg, 1.0 / count);
        edge.edgePoint = avg;

        /*
         Next we compute the midpoint.
         */
        count = 0;
        var avg2 = [0, 0, 0];

        for (var i = 0; i < edge.points.length; ++i) {
            var endPoint = edge.points[i].point;
            //vec3.add(avg2, endPoint, avg2);
            addvec(avg2, endPoint);
            ++count;
        }
        //vec3.scale(avg2, avg2, 1.0 / count);
        multvec(avg2, 1.0 / count);

        edge.midPoint = avg2;

    }


    /*
     Each original point is moved to the position
     (F + 2R + (n-3)P) / n. See the wikipedia article for more details.
     */
    avghole = [0, 0, 0];
    var hc = 0.0;

    for (var i = 0; i < positions.length / 3; ++i) {

        var point = originalPoints[i];
        var n = point.faces.length;
        var newPoint = [0, 0, 0];

        if (n != point.edges.size){
            addvec(newPoint, point.point);
            var cnt = 1;
            for (var edge of point.edges) {
                if (edge.faces.length == 1) {
                    addvec(newPoint, edge.midPoint);
                    edge.edgePoint = edge.midPoint;
                    cnt++;
                }
            }
            multvec(newPoint, 1.0 / cnt);
            addvec(avghole, newPoint);
            hc++;
        }
        else {

            for (var j = 0; j < point.faces.length; ++j) {
                var facePoint = point.faces[j].facePoint;
                //vec3.add(newPoint, newPoint, facePoint);
                addvec(newPoint, facePoint);
            }

            for (var edge of point.edges) {
                _mad(newPoint, newPoint, edge.midPoint, 2);
            }
            //vec3.scale(newPoint, newPoint, 1.0 / n);
            multvec(newPoint, 1.0 / n);
            _mad(newPoint, newPoint, point.point, n - 3);

            //vec3.scale(newPoint, newPoint, 1.0 / n);
            multvec(newPoint, 1.0 / n);
        }
        point.newPoint = newPoint;

    }
    multvec(avghole, 1.0 / hc);

    newCells = [];
    newPoints = [];

    var index = 0;

    /*
     We create indices on the fly by using this method.
     The index of every vertex is stored in the vertex, in a property named `index`.
     */
    function getIndex(p) {
        if (!("index" in p)) {  
            p.index = index++;
            newPoints.push(p[0]);
            newPoints.push(p[1]);
            newPoints.push(p[2]);

        }
        return p.index;

    }

    /*
     We go through all faces.
     Triangle face we subdivide into 3 new quads.
     Quad faces we subdivide into 4 new quads.

     */
    for (var iFace = 0; iFace < faces.length; ++iFace) {

        var face = faces[iFace];

        for (var iPoint = 0; iPoint < face.points.length; ++iPoint) {
            var point = face.points[iPoint];

            var a = point.newPoint;
            var b = face.edges[(iPoint + 0) % face.edges.length].edgePoint;
            var c = face.facePoint;
            var d = face.edges[(iPoint + face.edges.length - 1) % face.edges.length].edgePoint;

            var ia = getIndex(a);
            var ib = getIndex(b);
            var ic = getIndex(c);
            var id = getIndex(d);

            newCells.push([id, ia, ib, ic]);
        }
    }


    return { points: newPoints, cells: newCells, avgh: avghole};

}

function catmullClark(positions, cells, numSubdivisions) {

    if (numSubdivisions < 1) {
        throw new Error("`numSubdivisions` must be a positive number!");
    }


    var obj = {points: positions, cells: cells};
    for (var i = 0; i < numSubdivisions; ++i) {

        obj = _catmullClark(obj.points, obj.cells);

    }

    return obj;
}





