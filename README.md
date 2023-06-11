
## Install packages
```
npm install
```
## Generate ssl cert to enable https

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt
```
## Run with
```
node app.js
```

Mobile devices can go to localhost:3000 or \<machine ip\>:3000 to view the webpage with buttons to control device.

Post commands can be sent in the form:
```json
{"command":"lightsON"}
```
or
```
{"command":"lightsOFF"}
```
