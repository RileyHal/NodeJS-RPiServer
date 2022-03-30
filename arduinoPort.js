const { SerialPort, ReadlineParser } = require('serialport')
const main = require('./index.js');

const serPort = new SerialPort({ path:'/dev/ttyACM0', baudRate:9600 })
const parser = new ReadlineParser()
serPort.pipe(parser)

serPort.on('open', ()=>{console.log('port opened')})

parser.on('data', (data)=>{
  try{
    var receivedData = JSON.parse(String(data))
    main.setArduinoData(receivedData)
  }
  catch(e){
    console.log("Failed to parse serial data")
  }
})


function sendDataJson(mode, duration, interval){
  let obj = new Object()
  obj.mode = mode
  obj.duration = duration
  obj.interval = interval
  serPort.write(JSON.stringify(obj))
}

exports.sendDataJson = sendDataJson