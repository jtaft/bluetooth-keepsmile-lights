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
//    private static List<String> UUID_MODIFIERS = Arrays.asList("AFD0", "AFD1", "AFD2", "AFD3");
//
//    public static String DEVICE_NAME = "KS03~";
//
//    public static String SERVICE_READ = UUID(UUID_MODIFIERS.get(0));
//    public static String SERVICE_WRITE = UUID(UUID_MODIFIERS.get(0));
//    public static String SERVICE_NOTIFY = UUID(UUID_MODIFIERS.get(0));
//
//    public static String CHARACTERISTIC_READ = UUID(UUID_MODIFIERS.get(3));
//    public static String CHARACTERISTIC_WRITE = UUID(UUID_MODIFIERS.get(1));
//    public static String CHARACTERISTIC_NOTIFY = UUID(UUID_MODIFIERS.get(2));

/*function hexToBytes(hex) {
  let bytes = [];
  for (let c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}*/
function hexToArrayBuffer(string) {
    let bytes = [];
    string.replace(/../g, function (pair) {
        bytes.push(parseInt(pair, 16));
    });
    return new Uint8Array(bytes).buffer;
}

function typedArrayToBuffer(byteArray) {
  var offset = 0;
  var byteLength = byteArray.length;
  var array = Uint8Array.from(byteArray);
  var subarray = array.subarray(0, byteLength);
  return array.buffer.slice(offset, byteLength + offset);
}
function byteToUint8Array(byteArray) {
  var uint8Array = new Uint8Array(byteArray.length);
  for(var i = 0; i < uint8Array.length; i++) {
      uint8Array[i] = byteArray[i];
  }

  return uint8Array;
}

var SERVICE_UUID = "0000afd0-0000-1000-8000-00805f9b34fb";
var CHARACTERISTIC_READ_UUID = "0000afd3-0000-1000-8000-00805f9b34fb";
var CHARACTERISTIC_WRITE_UUID = "0000afd1-0000-1000-8000-00805f9b34fb";
var CHARACTERISTIC_NOTIFY_UUID = "0000afd2-0000-1000-8000-00805f9b34fb";
//
var LIGHTS_ON_STRING = "5BF000B5";
var LIGHTS_OFF_STRING = "5B0F00B5";
var encoder = new TextEncoder('utf-8');
var LIGHTS_ON_COMMAND = encoder.encode(LIGHTS_ON_STRING);

//typedArrayToBuffer(hexStr2Bytes(LIGHTS_ON_STRING));



//Convert this Java code to JavaScript
//public byte[] hexStr2Bytes(String str) {
//        int length = str.length() / 2;
//        char[] charArray = str.toCharArray();
//        String[] strArr = new String[length];
//        byte[] bArr = new byte[length];
//        int i = 0;
//        for (int i2 = 0; i2 < length; i2++) {
//            strArr[i2] = "" + charArray[i] + charArray[i + 1];
//            bArr[i2] = (byte) Integer.parseInt(strArr[i2], 16);
//            i += 2;
//        }
//        return bArr;
//    }
//
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



//TODO: DATA: Lights off INT32 = 66051 Offset 0
//
//data = bytes(LIGHTS_ON_STRING, 'utf-8') # Data to write


//Function to insert log into element with id="log"
function insertLog(msg){
  document.getElementById("log").innerHTML += ("<p>" + msg + "</p>");
}
function onButtonClick() {
  let filters = [];

  let filterService = document.querySelector('#service').value;
  if (filterService.startsWith('0x')) {
    filterService = parseInt(filterService);
  }
  if (filterService) {
    filters.push({services: [filterService]});
  }

  let filterName = document.querySelector('#name').value;
  if (filterName) {
    filters.push({name: filterName});
  }

  let filterNamePrefix = document.querySelector('#namePrefix').value;
  if (filterNamePrefix) {
    filters.push({namePrefix: filterNamePrefix});
  }

  let options = {optionalServices: [SERVICE_UUID]};
  if (document.querySelector('#allDevices').checked) {
    options.acceptAllDevices = true;
  } else {
    options.filters = filters;
  }

  console.log('Requesting Bluetooth Device...');
  insertLog('Requesting Bluetooth Device...');
  console.log('with ' + JSON.stringify(options));
  insertLog('with ' + JSON.stringify(options));
  if (navigator.bluetooth == undefined) {
    console.log('navigator.bluetooth is undefined');
    insertLog('navigator.bluetooth is undefined');
    return;
  }
  navigator.bluetooth.requestDevice(options)
  .then(device => {
    console.log('> Name:             ' + device.name);
    insertLog('> Name:             ' + device.name);
    console.log('> Id:               ' + device.id);
    insertLog('> Id:               ' + device.id);
    return device.gatt.connect();
  }).then(server => {
    console.log('> Connected:        ' + server.connected);
    insertLog('> Connected:        ' + server.connected);
    console.log('Getting Services...');
    insertLog('Getting Services...');
    return server.getPrimaryService(SERVICE_UUID);
  }).then(service => {
    console.log('Getting Characteristics...');
    insertLog('Getting Characteristics...');
    return service.getCharacteristic(CHARACTERISTIC_WRITE_UUID);
  }).then(characteristic => {
    var command = byteToUint8Array(hexStr2Bytes(LIGHTS_ON_STRING));
    //console.log(typeof(LIGHTS_ON_COMMAND));
    //insertLog(typeof(LIGHTS_ON_COMMAND));
    //console.log(typeof(LIGHTS_ON_COMMAND.buffer));
    //insertLog(typeof(LIGHTS_ON_COMMAND.buffer));
    //const encoder = new TextEncoder('utf-8');
    characteristic.writeValueWithResponse(command).then((response) => {
      console.log(response);
      insertLog(response);
    });
    //for(let characteristic of characteristics) {
    //  console.log('Characteristic: ' + characteristic.uuid);
    //  insertLog('Characteristic: ' + characteristic.uuid);
    //  console.log('Characteristic write: ' + characteristic.properties.write);
    //  insertLog('Characteristic write: ' + characteristic.properties.write);
    //  console.log('Characteristic read: ' + characteristic.properties.read);
    //  insertLog('Characteristic read: ' + characteristic.properties.read);
    //  console.log('Characteristic value: ' + characteristic.value);
    //  insertLog('Characteristic value: ' + characteristic.value);
    //}
    //console.log('Characteristic: ' + characteristic.uuid);
    //insertLog('Characteristic: ' + characteristic.uuid);
    //console.log('Characteristic write: ' + characteristic.properties.write);
    //insertLog('Characteristic write: ' + characteristic.properties.write);
    //console.log('Characteristic read: ' + characteristic.properties.read);
    //insertLog('Characteristic read: ' + characteristic.properties.read);
    //characteristic.readValue().then(value => {
    //  console.log('Characteristic offset: ' + (value.byteOffset));
    //  insertLog('Characteristic offset: ' + (value.byteOffset));
    //  console.log('Characteristic value: ' + value.getInt32(value.byteOffset));
    //  insertLog('Characteristic value: ' + value.getInt32(value.byteOffset));
    //});
  }).catch(error => {
    console.log('Argh! ' + error);
    insertLog('Argh! ' + error);
  });
}
var variables = `var CHARACTERISTIC_READ_UUID = "${CHARACTERISTIC_READ_UUID}";var CHARACTERISTIC_WRITE_UUID = "${CHARACTERISTIC_WRITE_UUID}";var CHARACTERISTIC_NOTIFY_UUID = "${CHARACTERISTIC_NOTIFY_UUID}"; var SERVICE_UUID = "${SERVICE_UUID}"; var LIGHTS_ON_STRING = "${LIGHTS_ON_STRING}";var LIGHTS_OFF_STRING = "${LIGHTS_OFF_STRING}";`;


var formHtml = "<form onsubmit=\"return false\">" +
  "<label for=\"allDevices\">All Devices</label>" +
  "<input id=\"allDevices\" type=\"checkbox\">" +
  "<input id=\"service\" type=\"text\" size=\"17\" list=\"services\" placeholder=\"Bluetooth Service\">" +
  "<input id=\"name\" type=\"text\" size=\"17\" placeholder=\"Device Name\">" +
  "<input id=\"namePrefix\" type=\"text\" size=\"17\" placeholder=\"Device Name Prefix\">" +
  "<button onclick=\"onButtonClick()\">Get Bluetooth Device Info</button>" +
"</form>" +
"<script>" + hexStr2Bytes.toString() + typedArrayToBuffer.toString() + byteToUint8Array.toString() + variables + onButtonClick.toString() + "</script>" +
"<script>" + insertLog.toString() + "</script>";


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
