var https = require('https')
const fs = require('fs')
const path = require('path')
const express = require('express')
const Gpio = require('onoff').Gpio
const router = express.Router()
const bodyParser = require('body-parser')
const fileService = require('./fileServices.js');
const arduinoService = require('./arduinoPort.js')
const cors = require('cors')
let port = 3000

const app = express()

app.use(cors({
    origin: '*'
}));

app.use(router)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const led = new Gpio(26, 'out')

let soilMoisture = .72
let isEmpty = false
let lightLevel = .33
let pumpActive = false
let temperature = 94
let humidity;

//Default values if settings.json not found
let defaultPumpDuration = 5
let defaultPumpInterval = 500
//0=off, 1=auto, 2= timer
let defaultMode = 1

let pumpDuration, pumpInterval, mode

function logMessage(message){
  let date_ob = new Date()
  let currentTime = date_ob.getHours()+":"+date_ob.getMinutes()+":"+date_ob.getSeconds()+" - "
  console.log(currentTime + message)
}

function successGetJSON(data){
  let obj = new Object()
  obj.status = 'ok'
  obj.data = data
  return obj
}

function JSONMessage(status, message){
  let obj = new Object()
  obj.status = status
  obj.message = message
  return obj
}

//file service callback if stored values are found
function setSettings(duration,interval,mode){
  pumpDuration = duration
  pumpInterval = interval
  this.mode = mode
}

//this is a callback function from the arduino to update main data
function setArduinoData(data){
  soilMoisture = data.Moisture / 1024
  lightLevel = data.Light / 1024

  if(data.isWater == 0){
    isEmpty = true
  } else {
    isEmpty = false
  }
  
  if(data.pumpActive == 0){
    pumpActive = false
  } else {
    pumpActive = true
  }
  
  temperature = data.temperature
  humidity = data.Humidity
}

router.get('/', (req,res,next)=>{
  res.send("Raspberry Pi Server")
  logMessage("Attempted connection to " + req.path)
})

router.get('/v1/data', (req,res,next)=>{
  logMessage("GET Request Successful")
  res.json(successGetJSON({
    'soilMoisture': soilMoisture,
    'isEmpty': isEmpty,
    'lightLevel': lightLevel,
    'pumpActive': pumpActive,
    'temperature': temperature,
    'pumpDuration': pumpDuration,
    'pumpInterval': pumpInterval,
    'mode': mode
  }))
})

router.post('/v1/set', (req,res,next)=>{
  let tempPumpDuration = parseInt(req.query.pumpDuration)
  let tempPumpInterval = parseInt(req.query.pumpInterval)
  let tempMode = parseInt(req.query.mode)
  
  if(!req.query.pumpDuration || !req.query.pumpInterval || !req.query.mode){
    logMessage("Received Invalid Post Request, Invalid parameter names")
    res.status = 400
    res.json(JSONMessage('error','Invalid query parameter name(s)'))
  } 

  else if(isNaN(tempPumpDuration) || isNaN(tempPumpInterval) || isNaN(tempMode)){
    logMessage("Received Invalid Post Request, paramater(s) NaN")
    res.status = 400
    res.json(JSONMessage('error', 'pumpDuration, pumpInterval or mode is NaN'))
  } 

  else if (tempMode < 0 || tempMode > 2 || tempPumpDuration < 1 || tempPumpInterval < 5){
    logMessage("Received Invalid Post Request, Invalid data range")
    res.status = 400
    res.json(JSONMessage('error', 'pumpDuration, pumpInterval or mode is out of range'))
  } 

  //If everything is validated write to settings file and set new values
  else {
    let obj = new Object()
    obj.pumpDuration = tempPumpDuration
    obj.pumpInterval = tempPumpInterval
    obj.mode = tempMode
    fileService.writeJsonFile('./settings/settings.json', obj)

    pumpInterval = tempPumpInterval
    pumpDuration = tempPumpDuration
    mode = tempMode

    arduinoService.sendDataJson(mode, pumpDuration, pumpInterval)
    logMessage("Sent set data to arduino")

    res.status = 200
    res.json(JSONMessage('ok', "Set pumpDuration to "+pumpDuration+", pumpInterval to "+pumpInterval+", and mode to "+mode))
  }
})

const options = {
  key: fs.readFileSync(path.join('./https/key.pem')),
  cert: fs.readFileSync(path.join('./https/cert.pem'))
}

https.createServer(options, app).listen(port, () => {
  logMessage("Server initiated, Listening on port "+port)
  //check to see if settings.txt exists, if not create on with default values
  fileService.initialize();
  //set stored settings to the arduino
  arduinoService.sendDataJson(mode, pumpDuration, pumpInterval)
})

//export these values for fileServices to use for default values
exports.pumpDuration = defaultPumpDuration
exports.pumpInterval = defaultPumpInterval
exports.mode = defaultMode


//this export is a callback for arduino set data
exports.setArduinoData = setArduinoData
exports.setSettings = setSettings