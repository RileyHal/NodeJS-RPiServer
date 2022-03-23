let http = require('http')
const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')

app.use(router)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


let soilMoisture = .72
let isEmpty = false
let lightLevel = .33
let pumpActive = false
let temperature = 94
let pumpDuration = 5
let pumpInterval = 60
let mode = 2

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

  else if (tempMode < 0 || tempMode > 2 || tempPumpDuration < 0 || tempPumpInterval < 0){
    logMessage("Received Invalid Post Request, Invalid data range")
    res.status = 400
    res.json(JSONMessage('error', 'pumpDuration, pumpInterval or mode is out of range'))
  } 

  else {
    pumpInterval = tempPumpInterval
    pumpDuration = tempPumpDuration
    mode = tempMode

    let message = "Set pumpDuration to "+pumpDuration+", pumpInterval to "+pumpInterval+", and mode to "+mode
    logMessage(message)
    res.status = 200
    res.json(JSONMessage('ok', message))
  }
})

http.createServer(app).listen(3030, () => {
  logMessage("Server initiated, Listening on port 3030")
})