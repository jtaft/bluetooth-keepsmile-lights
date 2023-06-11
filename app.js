const express = require('express')
var bodyParser = require('body-parser')
const https = require('https');
const fs = require('fs');

 var jsonParser = bodyParser.json()

require('chromedriver');
const webdriver = require('selenium-webdriver');
var chrome = require("selenium-webdriver/chrome");


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
  var timeout = false;
  try {
    timeout = document.getElementById("timeout").innerHTML == "true"
  } catch (error) {
    timeout = false;
  }

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
        resolve(device);
      }, reject).catch(reject);
      if (timeout) {
        setTimeout(function(){
          insertLog('Timeout');
          return resolve();
        }, 5000)
      }
    });
  }
  function connectDevice(d){
    return d.gatt.connect().then(server => {
      if (server != undefined) {
        write(server);
      } else {
        insertLog('No device found');
        insertLog(d)
      }
    }).catch(error => {
      if (error.toString().includes('NetworkError: Bluetooth Device is no longer in range')) {
        if (retry == false) {
          retry = true;
          setTimeout(function(){
            insertLog('Device permission failed, retrying...');

            if (command == LIGHTS_ON_STRING) {
              document.getElementById("lightsON").click();
            } else if (command == LIGHTS_OFF_STRING) {
              document.getElementById("lightsOFF").click();
            }

            return Promise.reject(error);
          }, 2000);
        } else {
          insertLog('Device permission failed, no retry.');
          return promptForDevice().then(function(d) {
            return connectDevice(d);
          });
        }
      } else {
        return Promise.reject(error);
      }
    });
  }

  var device;
  if (navigator.bluetooth.getDevices != undefined) {
    insertLog('getDevices found');
    device = navigator.bluetooth.getDevices().then(devices => {
      for(let device of devices) {
        if (device.name == 'KS03~791C47') {
          insertLog('Device: ' + device.name);
          insertLog('Device id: ' + device.id);
          return Promise.resolve(device);
        }
      }
      insertLog('No saved device found, prompting for new device...');
      timeout = false;
      return promptForDevice();
    });
    device.then(function(d) {
      //if getDevices returned the device promptForDevice shouldn't be needed, but it seems it is for some reason so we're calling it with a timeout just to scan devices so it doesn't error out
      if (timeout) {
        promptForDevice().then(function() {
          connectDevice(d);
        });
      } else {
        connectDevice(d);
      }
    })
  } else {
    insertLog('getDevices not found');
    //device = promptForDevice();
  }

  function write(server) {
    var onError = function(error) {
      insertLog('Internal! ' + error);
      server.disconnect();
    }
    insertLog(server);
    insertLog('> Connected:        ' + server.connected);
    insertLog('Getting Services...');
    server.getPrimaryService(SERVICE_UUID).then(service => {
      insertLog('Getting Characteristics...');
      return service.getCharacteristic(CHARACTERISTIC_WRITE_UUID);
    }, onError).then(characteristic => {
      var bytecommand = byteToUint8Array(hexStr2Bytes(command));
      characteristic.writeValueWithoutResponse(bytecommand).then(() => {
        if (command == LIGHTS_ON_STRING) {
          insertLog('lightsON');
        } else if (command == LIGHTS_OFF_STRING) {
          insertLog('lightsOFF');
        }
        server.disconnect();
      }, onError);
    }, onError);
  }
}
function lightsOnClick() {
  onButtonClick(LIGHTS_ON_STRING);
}
function lightsOffClick() {
  onButtonClick(LIGHTS_OFF_STRING);
}


function eventListener() {
  console.log('Adding event listener...');
  window.document.addEventListener('onadvertisementreceived', console.log);/* function(event, deviceList, callback) {
    console.log('select-bluetooth-device called');
  });*/
  window.addEventListener('storage', console.log);
  window.addEventListener('load', console.log);
  window.addEventListener('open', console.log);
}
var variables = `var retry = false; var CHARACTERISTIC_READ_UUID = "${CHARACTERISTIC_READ_UUID}";var CHARACTERISTIC_WRITE_UUID = "${CHARACTERISTIC_WRITE_UUID}";var CHARACTERISTIC_NOTIFY_UUID = "${CHARACTERISTIC_NOTIFY_UUID}"; var SERVICE_UUID = "${SERVICE_UUID}"; var LIGHTS_ON_STRING = "${LIGHTS_ON_STRING}";var LIGHTS_OFF_STRING = "${LIGHTS_OFF_STRING}";`;


var formHtml = "<form onsubmit=\"return false\">" +
  "<button id=\"lightsON\" style=\"width:50vw;height:5vh;margin-bottom:5vh;\" onclick=\"lightsOnClick()\">Lights ON</button>" +
  "<button id=\"lightsOFF\" style=\"width:50vw;height:5vh;\" onclick=\"lightsOffClick()\">Lights OFF</button>" +
"</form>" +
"<script>" + hexStr2Bytes.toString() + byteToUint8Array.toString() + variables + lightsOffClick.toString() + lightsOnClick.toString() + onButtonClick.toString() + insertLog.toString() + ";" + eventListener.toString() + ";eventListener();</script>";


var outputHtml = "<div id=\"output\" class=\"output\">" +
  "<div id=\"content\"></div>" +
  "<div id=\"status\"></div>" +
  "<pre id=\"log\"></pre>" +
"</div>";


//javascript function to use chromedriver to open localhost in chrome and click the lights on button
function openChrome(command) {
  var options = new chrome.Options();

  //var chromeCapabilities = webdriver.Capabilities.chrome();
  ////setting chrome options to start the browser fully maximized
  //var chromeOptions = {
  //    'args': ['--ignore-ssl-errors=yes','--ignore-certificate-errors']
  //};
  //chromeCapabilities.set('chromeOptions', chromeOptions);

  options.addArguments('--ignore-ssl-errors=yes');
  options.addArguments('--ignore-certificate-errors');

  //options.addArguments('--flag-switches-begin --enable-experimental-web-platform-features --enable-features=WebBluetoothNewPermissionsBackend --flag-switches-end');
  /*
  options.addArguments('enable-experimental-web-platform-features@1')
  options.addArguments('enable-web-bluetooth-new-permissions-backend@1')
  */

  //chrome://version/
  //C:\Users\Jay\AppData\Local\Google\Chrome\User Data\Default
  options.addArguments("user-data-dir=C:\\Users\\Jay\\AppData\\Local\\Google\\Chrome\\User Data\\Default");





  //options.addArguments(['--ignore-ssl-errors=yes','--ignore-certificate-errors']);
  //driver = webdriver.Chrome(options=options)
  var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();



 // driver.get('chrome://flags')
 // driver.executeScript("chrome.send('enableExperimentalFeature', ['enable-experimental-web-platform-features', 'true'])")
 // driver.executeScript("chrome.send('enableExperimentalFeature', ['enable-web-bluetooth-new-permissions-backend', 'true'])")


  driver.get('https://localhost:3000');
  //wait for page to load


  var query = driver.wait(webdriver.until.elementLocated(webdriver.By.id(command)));

  driver.executeScript("var timeout = document.createElement('div'); timeout.id = 'timeout'; timeout.innerHTML = 'true'; document.body.append(timeout);");

  query.click().then(function() {

    setTimeout(function() {
      driver.findElement(webdriver.By.id('log')).then(function(element) {
        element.getAttribute('innerHTML').then(function(text) {
          if(text.includes(command)) {
            driver.quit();
          }
        });
      });
    }, 10000);
    //Convert java wait command to javascript
    //driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
    //driver.sleep(4000).then(function() {

      //driver.switchTo().alert().then(function(alert) {
        //driver.executeScript('console.log(window);')
        //query.sendKeys(webdriver.Key.TAB).then(function() {
        //  query.sendKeys(webdriver.Key.TAB);
        //});
      //});
    //driver.keys(Keys.TAB);
    //driver.keys(Keys.ENTER);
    //});
  });

  //driver.wait(function() {
  //  return driver.executeScript('return document.readyState').then(function(readyState) {
  //    return readyState === 'complete';
  //  });
  //});
  //console.log(driver.findElement(webdriver.By.id('details-button')));
  //driver.findElement(webdriver.By.id('details-button')).click();
  //driver.findElement(webdriver.By.id('proceed-link')).click();

  //driver.findElement(webdriver.By.id('lightsOn')).click();

  //driver.quit();
}




app.get('/', (req, res) => {
  res.send(formHtml + outputHtml);
});

app.post('/', jsonParser, (req, res) => {
  console.log('POST request received');
  console.log(req.body);
  openChrome(req.body.command);

  res.send("OK");
});

var server = https.createServer(options, app);
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
