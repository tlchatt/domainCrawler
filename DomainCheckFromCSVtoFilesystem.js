
/* dependencies for CSV crawling, and dns*/
const neatCsv = require('neat-csv');
const fs = require('fs');
//const { composer } = require('googleapis/build/src/apis/composer');
const { Resolver } = require('dns').promises;
const resolver = new Resolver();
resolver.setServers([
    '208.67.222.222',
    '208.67.220.220',
    '1.1.1.1',
    '1.0.0.1',
    '80.80.80.80',
    '80.80.81.81',
    '64.6.64.6',
    '64.6.65.6',
    '9.9.9.9',
    '149.112.112.112',
    '8.8.8.8',
    '8.8.4.4',
]);
//resolver.setServers(['4.4.4.4']);
/* end dependencies for CSV crawling, and dns*/

var filePath = './findlaw.com-brokenlinks-subdomains-live-21-Apr-2020_16-57-01-107e8d0e3a1543ca43238ac3ae38c725.csv'
var processArray = []
var returnArray = []


async function csvToObj(filePath) {
    const readFile = async () => {
        console.log('Start')
        fs.readFile(filePath, async (err, data) => {
            if (err) {
                console.error(err)
                return
            }
            const res = await neatCsv(data);
            parseCSVObj(res) //Call next function
        })
        console.log('End')
    }
    await readFile()
}
async function parseCSVObj(csvObj) {
    console.log('CSV Obj Preview - ' + JSON.stringify(csvObj[1]).substring(0, 150))
    console.log('Lines in CSV - ' + csvObj.length)
    var csvObjLen = csvObj.length

    while (csvObjLen--) {
        var url = csvObj[csvObjLen]['Link URL'] // Your needed field Title from CSV 
        /*process your csv data here*/
        var domain = await getBaseUrl(url) //get base URl's      
        if (processArray.indexOf(domain) == -1) { //dedupe list
            processArray.push(domain)
        }
    }
    console.log('end of parseCSV')
    console.log('items after proccessing - ' + processArray.length)
    //process your process array
    checkDomainAvailability(processArray)
}
async function checkDomainAvailability(domainArray) {
    var retryList = []
    console.log('Checking Domain List, may take a moment ... ')
    async function DNSCheck(name) {
        try {
            var returnguy = await resolver.resolve4(name)
            //console.log(returnguy)
        }
        catch (err) {
            var error = JSON.stringify(err.code)
            if (error.indexOf('ENOTFOUND') > -1) {
                //console.log(name + '  NotFound Error ' + error)
                if (retryList.indexOf(name) > -1) {
                    console.log('first retry helped')
                }
                returnArray.push(name)
            }
            else {
                if (retryList.indexOf(name) == -1) {
                    retryList.push(name)
                    DNSCheck(name)
                }
            }
        }
    }
    async function asyncRequestLoop(domainArray) {
        const mapLoop = async _ => {
            const promises = domainArray.map(async item => {
                const checked = await DNSCheck(item)
                return checked
            })
            const domainslist = await Promise.all(promises)
            console.log('domains proccessed - ' + domainslist.length)
            console.log('available domains - ' + returnArray.length)
            writeCSV() //all domains
            writeCSVTerms() //search for terms
        }
        mapLoop()
    }
    await asyncRequestLoop(domainArray)
}
async function writeCSV() {
    console.log("writeCSV")
    ws = fs.createWriteStream(`${__dirname}/output.csv`)
    var len = returnArray.length;
    while (len--) {
        ws.write(`${JSON.stringify(returnArray[len])}\n`)
        //console.log('site ' + returnArray[len])
    }

    ws.end()

}
function writeCSVTerms() {
    console.log("writeCSVTerms")
    ws = fs.createWriteStream(`${__dirname}/outputTerms.csv`)
    let len = returnArray.length;
    while (len--) {
        let terms = ['bank', 'walker', 'debt', 'chapter',]
        let termsLen = terms.length
        while (termsLen--) {
            if (returnArray[len].indexOf(terms[termsLen]) > -1) {
                ws.write(`${JSON.stringify(returnArray[len])}\n`)
                //console.log('site ' + returnArray[len])
            }

        }
    }

    ws.end()
}
/*helper functions*/
async function getBaseUrl(url) {
    var domain = url.replace('http://', '').replace('https://', '').replace('www.', '')
    var domain = domain.split("?").shift();
    var domain = domain.split("#").shift();
    while (domain.split('/').length > 2) {
        domain = domain.split("/").shift();
    }
    while (domain.split('.').length > 3) {
        domain = domain.split(".").shift();
    }
    return (domain)
}


csvToObj(filePath)
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