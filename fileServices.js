const fs = require('fs');
const main = require('./index.js');

exports.initialize = initialize
exports.writeFile = writeFile

function logMessage(message){
  let date_ob = new Date()
  let currentTime = date_ob.getHours()+":"+date_ob.getMinutes()+":"+date_ob.getSeconds()+" - "
  console.log(currentTime + message)
}

//writes object to file in JSON String format
function writeFile(filename, obj){
  fs.writeFile(filename, JSON.stringify(obj), (err) => {
    if (err) throw err;
    logMessage('Wrote to file ' + filename + ": " + JSON.stringify(obj))
  });
}

//Checks if settings.txt exists
function initialize(){
  try {
    //if file exists
    if (fs.existsSync('settings.json')) {
      fs.readFile('settings.txt', 'utf8', function(err, data){
        // Display the file content
        const storedSettings = JSON.parse(data)
        pumpDuration = parseInt(storedSettings.pumpDuration)
        pumpInterval = parseInt(storedSettings.pumpInterval)
        mode = parseInt(storedSettings.mode)
        logMessage("Set stored settings " + data);
    });
    //else file doesn't exist, write default values to file
    } else {
      logMessage("Settings file not found, Creating new file")
      let obj = new Object()
      obj.pumpDuration = main.pumpDuration
      obj.pumpInterval = main.pumpInterval
      obj.mode = main.mode
      writeFile('settings.json', obj)
    }
  } catch(err) {
    console.error(err)
  }
}