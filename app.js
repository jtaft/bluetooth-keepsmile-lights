const express = require('express')
const https = require('https');
const fs = require('fs');
const app = express()
const port = 3000

var key = fs.readFileSync(__dirname + '\\selfsigned.key');
var cert = fs.readFileSync(__dirname + '\\selfsigned.crt');
var options = {
  key: key,
  cert: cert
};

var SERVICE_UUID = "0000afd0-0000-1000-8000-00805f9b34fb";

var CHARACTERISTIC_READ_UUID = "0000afd3-0000-1000-8000-00805f9b34fb";
var CHARACTERISTIC_WRITE_UUID = "0000afd1-0000-1000-8000-00805f9b34fb";
var CHARACTERISTIC_NOTIFY_UUID = "0000afd2-0000-1000-8000-00805f9b34fb";

var LIGHTS_ON_STRING = "5BF000B5";
var LIGHTS_OFF_STRING = "5B0F00B5";

function byteToUint8Array(byteArray) {
  var uint8Array = new Uint8Array(byteArray.length);
  for(var i = 0; i < uint8Array.length; i++) {
      uint8Array[i] = byteArray[i];
  }

  return uint8Array;
}

function hexStr2Bytes(str) {
  var length = str.length / 2;
  var charArray = str.split('');
  var strArr = [];
  var bArr = [];
  var i = 0;
  for (var i2 = 0; i2 < length; i2++) {
    strArr[i2] = "" + charArray[i] + charArray[i + 1];
    bArr[i2] = parseInt(strArr[i2], 16);
    i += 2;
  }
  return bArr;
}

function insertLog(msg){
  console.log(msg);
  document.getElementById("log").innerHTML += ("<p>" + msg + "</p>");
}
function onButtonClick(command) {
  let filters = [];
  document.getElementById("log").innerHTML = "";

  function promptForDevice(){
    return new Promise(function (resolve, reject){
      let options = {
        filters: [
          {namePrefix: 'KS03'},
          {name: 'KS03~791C47'},
          {services: [SERVICE_UUID]}
        ],
        acceptAllDevices: false,
        optionalServices: [SERVICE_UUID]
      };
      console.log(navigator.bluetooth);
      navigator.bluetooth.requestDevice(options)
      .then(device => {
        insertLog('> Name:             ' + device.name);
        insertLog('> Id:               ' + device.id);
        device.gatt.connect().then(resolve, reject);
      }, reject);
    });
  }

  var device = navigator.bluetooth.getDevices().then(devices => {
    // Filter on saved devices
    for(let device of devices) {
      if (device.name == 'KS03~791C47') {
        insertLog('Device: ' + device.name);
        insertLog('Device id: ' + device.id);
        return device.gatt.connect();
      }
    }
    insertLog('No saved device found, prompting for new device...');
    // If no saved device found, prompt for new device
    return promptForDevice();
  }).catch(error => {
    if (error.toString().includes('NetworkError: Bluetooth Device is no longer in range')) {
      insertLog('Device permission failed, prompting for new device...');
      return promptForDevice();
    } else {
      return Promise.reject(error);
    }
  });

  device.then(function(server) {
    var onError = function(error) {
      insertLog('Internal! ' + error);
      server.disconnect();
    }
    insertLog('> Connected:        ' + server.connected);
    insertLog('Getting Services...');
    server.getPrimaryService(SERVICE_UUID).then(service => {
      insertLog('Getting Characteristics...');
      return service.getCharacteristic(CHARACTERISTIC_WRITE_UUID);
    }, onError).then(characteristic => {
      var bytecommand = byteToUint8Array(hexStr2Bytes(command));
      characteristic.writeValueWithoutResponse(bytecommand).then(() => {
        if (command == LIGHTS_ON_STRING) {
          insertLog('Lights ON');
        } else if (command == LIGHTS_OFF_STRING) {
          insertLog('Lights OFF');
        }
        server.disconnect();
      }, onError);
    }, onError);
  }).catch(error => {
    insertLog('Argh! ' + error);
  });
}
function lightsOnClick() {
  onButtonClick(LIGHTS_ON_STRING);
}
function lightsOffClick() {
  onButtonClick(LIGHTS_OFF_STRING);
}
var variables = `var CHARACTERISTIC_READ_UUID = "${CHARACTERISTIC_READ_UUID}";var CHARACTERISTIC_WRITE_UUID = "${CHARACTERISTIC_WRITE_UUID}";var CHARACTERISTIC_NOTIFY_UUID = "${CHARACTERISTIC_NOTIFY_UUID}"; var SERVICE_UUID = "${SERVICE_UUID}"; var LIGHTS_ON_STRING = "${LIGHTS_ON_STRING}";var LIGHTS_OFF_STRING = "${LIGHTS_OFF_STRING}";`;


var formHtml = "<form onsubmit=\"return false\">" +
  "<button style=\"width:50vw;height:5vh;margin-bottom:5vh;\" onclick=\"lightsOnClick()\">Lights ON</button>" +
  "<button style=\"width:50vw;height:5vh;\" onclick=\"lightsOffClick()\">Lights OFF</button>" +
"</form>" +
"<script>" + hexStr2Bytes.toString() + byteToUint8Array.toString() + variables + lightsOffClick.toString() + lightsOnClick.toString() + onButtonClick.toString() + insertLog.toString() + "</script>";


var outputHtml = "<div id=\"output\" class=\"output\">" +
  "<div id=\"content\"></div>" +
  "<div id=\"status\"></div>" +
  "<pre id=\"log\"></pre>" +
"</div>";


app.get('/', (req, res) => {
  res.send(formHtml + outputHtml);
})

var server = https.createServer(options, app);
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
