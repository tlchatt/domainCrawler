
/* dependencies for CSV crawling, and dns*/
const neatCsv = require('neat-csv');
const fs = require('fs');
const { composer } = require('googleapis/build/src/apis/composer');
const { Resolver } = require('dns').promises;
const resolver = new Resolver();
resolver.setServers([
    '8.8.8.8',
    '8.8.4.4',
    '208.67.222.222',
    '208.67.220.220',
    '1.1.1.1',
    '1.0.0.1',
    '80.80.80.80',
    '80.80.81.81',
    '64.6.64.6',
    '64.6.65.6',
    '9.9.9.9',
    '149.112.112.112'
]);
//resolver.setServers(['4.4.4.4']);
/* end dependencies for CSV crawling, and dns*/





async function readCSVCheckDomains (){
  var domainArray = []
  var returnArray = []
    const readFile = async () =>{
        console.log('Start')
        fs.readFile('./lawinfo.com-brokenlinks-subdomains-live-10-Dec-2020_18-46-46-5ce14de828b0d77a3b77e6292c290d96.csv', async (err, data) => {
        if (err) {
            console.error(err)
            return
        }
            const res = await neatCsv(data);
            parseCSVObj(res)
        })
        console.log('End')
        
    }
await readFile()
//secondary functions
    async function parseCSVObj(res){
    console.log('csv obj  - ' + JSON.stringify(res[1]).substring(0,250))
    console.log(res.length)
        for (var i=0; i<res.length; i++) {

            var url = res[i]['Link URL'] // URL from Ahrefs broken outbound links. 
            var domain = url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/)[0];
            if (domain.split('.').length - 1 > 1) {
                //console.log("domain split length greater than")
                // console.log(domain)
                    var domainTLD = domain.split('.').reverse()[0]
                    var domainBase = domain.split('.').reverse()[1]
                    domain = domainBase + '.' + domainTLD
                }    
            if (domainArray.indexOf(domain) == -1) {
                domainArray.push(domain)
            }
        }
        console.log('end of dedupe and get base domain')
        console.log(domainArray.length)
        checkDomainList2(domainArray)
    } 
    async function checkDomainList2(domainArray){
        var counter = 1
        console.log('Check Domain List 2 Begin')
        console.log(domainArray.length)
        async function Checker(name) {
            try {
                var returnguy = await resolver.resolve4(name)
            }
            catch (err) {
                var error = JSON.stringify(err.code)

                if (error.indexOf('ETIMEOUT') == -1) {
                        console.log(name + '  ' +  error)
                    returnArray.push(name)
                    if (!error.indexOf('ENOTFOUND') == -1) {
                        console.log(name + 'Probably Werid Errr')
                        console.log(error)
                    }
                }
                else {
                    console.log(name + 'Probably Timeout')
                    console.log(error)
                }

            }

        }
        async function wait(ms) {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        }
        async function doRequests(domainArray) {
            for (const item of domainArray) {
                counter ++
                await Checker(item)
                await wait(3 * counter);
            }
        }
       await doRequests(domainArray)
        console.log("done")
        writeCSV()

    }
   async function writeCSV(){
       console.log("write")
       ws = fs.createWriteStream(`${__dirname}/output.csv`)
       for (let record in returnArray) {
           ws.write(`${JSON.stringify(record)}\n`)
       }
       ws.end()
   }
}

readCSVCheckDomains()
/* old stuff that was usefull in creating this app.
// Parse the csv content
const records = csv.parse(content)
// Print records to the console
for(let record in records){
  console.info(record)
}
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