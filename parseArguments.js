/**
 * Created by Мария on 10.12.2016.
 */

var text = ""; //'{"systole": [1.128, 1.63, 2.506, 3.18, 3.876, 4.602, 5.282, 5.856, 6.412, 7.238, 7.884], "diastole": [1.54, 2.172, 2.948, 3.648, 4.39, 5.108, 5.762, 6.32, 6.978, 7.678, 8.284], "rr_intervals": [0.81, 1.368, 1.874, 2.67, 3.35, 4.096, 4.796, 5.474, 6.094, 6.688, 7.384, 8.054, 8.754]}';
var heartData;
//var obj = JSON.parse(text);

var socket = new WebSocket("ws://192.168.0.2:8081");
socket.onmessage = function(event) {
    text = event.data;
    heartDataRecieved = true;
    console.log(text);
    heartData = parseArgs(JSON.parse(text));
};


function parseArgs(obj) {
    
    var data = [];
    for (var i = 0; i < obj.systole.length - 1; ++i) {
        //var segment = new Array(2);
        data.push([obj.systole[i], obj.diastole[i], 1]);
        if (i + 1 < obj.systole.length) {
            data.push([obj.diastole[i], obj.systole[i + 1], -1]);
        }
    }
    return data;
}

