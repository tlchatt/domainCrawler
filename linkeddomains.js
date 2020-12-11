const neatCsv = require('neat-csv');
const fs = require('fs')
var dns = require("dns");
async function readCSVCheckDomains (){
  var csvObject = []
  const readFile = async () =>{
    console.log('Start')
    fs.readFile('./justia.com-linkeddomains-subdomains-live-25-Apr-2020_16-20-30-52f2c43cdacfe5610d04711efb1b0b98.csv', async (err, data) => {
      if (err) {
        console.error(err)
        return
      }
      //console.log(await neatCsv(data))
      
   
        const res = await neatCsv(data);
        console.log('csv obj  - ' + JSON.stringify(res).substring(0,1650))
          /*
        parseObj(res)
  
    */
    })
    console.log('End')
    
  }
await readFile()
//secondary functions
function parseObj(res){
  console.log('csv obj  - ' + JSON.stringify(res[1]).substring(0,650))
  //console.log('type Of - ' + typeof(res[1]))
  for (var i=0; i<res.length; i++) {
    var url = res[i]['Linked Domains'] // here is full url
    var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
    //console.log(domain)
    checkAvailable(domain)
    function checkAvailable(name) {
        dns.resolve4( name, function (err, addresses) {
            if (err) {
                var error = JSON.stringify(err)
                if(error.indexOf('ETIMEOUT') == -1)
                console.log (name + " is possibly available : " + err)
              
              
              
            }
          })
  }
  }
  

  /*
  for (var i=0; i<prefixes.length; i++) {
    for (var j=0; j<units.length; j++) {
      checkAvailable(prefixes[i] + units[j] + ".com",console.log);
    }
  }
  
  function checkAvailable(name, callback) {
    dns.resolve4(name).addErrback(function(e) {
      if (e.errno == dns.NXDOMAIN) callback(name);
    })
  }*/
  
} 
 
}
readCSVCheckDomains()
  
  /*
// Parse the csv content
const records = csv.parse(content)
// Print records to the console
for(let record in records){
  console.info(record)
}*/

/*
// Write a file with one JSON per line for each record
ws = fs.createWriteStream(`${__dirname}/output.csv`)
for(let record in records){
  ws.write(`${JSON.stringify(record)}\n`)
}
ws.end()
*/
/*
var dns = require("dns"), sys = require('sys');

var prefixes = ["yotta", "zetta", "exa", "peta", "tera", "giga", "mega",
  "kilo", "hecto", "deka", "deci", "centi", "milli", "micro", "nano",
  "pico", "femto", "atto", "zepto", "yocto"];

var units = ["meter", "gram", "second", "ampere", "kelvin", "mole",
  "candela", "radian", "steradian", "hertz", "newton", "pascal", "joule",
  "watt", "colomb", "volt", "farad", "ohm", "siemens", "weber", "henry",
  "lumen", "lux", "becquerel", "gray", "sievert", "katal"];

for (var i=0; i<prefixes.length; i++) {
  for (var j=0; j<units.length; j++) {
    checkAvailable(prefixes[i] + units[j] + ".com",console.log);
  }
}

function checkAvailable(name, callback) {
  dns.resolve4(name).addErrback(function(e) {
    if (e.errno == dns.NXDOMAIN) callback(name);
  })
}*/