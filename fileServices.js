const fs = require('fs');
const main = require('./index.js');

exports.initialize = initialize
exports.writeFile = writeFile

function logMessage(message){
  let date_ob = new Date()
  let currentTime = date_ob.getHours()+":"+date_ob.getMinutes()+":"+date_ob.getSeconds()+" - "
  console.log(currentTime + message)
}

//writes to file in JSON String format
function writeFile(filename, pumpD, pumpI, rpiMode){
  let testObj = new Object()
    testObj.pumpDuration = pumpD
    testObj.pumpInterval = pumpI
    testObj.mode = rpiMode
    fs.writeFile(filename, JSON.stringify(testObj), (err) => {
      if (err) throw err;
      logMessage('Wrote to file ' + filename + ": " + JSON.stringify(testObj))
    });
}

function initialize(){
  try {
    if (fs.existsSync('settings.txt')) {
      //file exists
      fs.readFile('settings.txt', 'utf8', function(err, data){
        // Display the file content
        const storedSettings = JSON.parse(data)
        pumpDuration = parseInt(storedSettings.pumpDuration)
        pumpInterval = parseInt(storedSettings.pumpInterval)
        mode = parseInt(storedSettings.mode)
        logMessage("Set stored settings " + data);
    });
    } else {
      //file doesn't exist, write default values to file
      logMessage("Settings file not found, Creating new file")
      writeFile('settings.txt',main.pumpDuration, main.pumpInterval, main.mode)
    }
  } catch(err) {
    console.error(err)
  }
}