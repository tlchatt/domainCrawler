
/* dependencies for CSV crawling, and dns*/
const neatCsv = require('neat-csv');
const fs = require('fs');
//const { composer } = require('googleapis/build/src/apis/composer');
const { Resolver } = require('dns').promises;
const resolver = new Resolver();
resolver.setServers([
    '8.8.8.8',
    '208.67.222.222',
    '1.1.1.1',
    '80.80.80.80',
    '64.6.64.6',
    '8.8.4.4',
    '208.67.220.220',
    '1.0.0.1',
    '80.80.81.81',
    '64.6.65.6',
    '9.9.9.9',
    '149.112.112.112'
    
]);
//resolver.setServers(['4.4.4.4']);
/* end dependencies for CSV crawling, and dns*/
var fileDirectory = '/inputFiles/'
var outputDirectory = '/outputFiles/'
var fileList = []
//the flow
async function flowLoop(listofFiles) {
    console.log('flowLoop')
    for (const file of listofFiles) {
        console.log('get CSV Buffer From File')
        var csvBuffer = await csvReadAsync(`${__dirname}${fileDirectory}${file}`)
        console.log('get CSV Object From Buffer')
        var csvObj = await neatCsv(csvBuffer);     
        console.log('parse CSV Object From Buffer')
        var processedData = await parseandDedupeCSVObj(csvObj) //writes processArray global Var
        console.log('Checking Domain List, may take a moment ... ')
        var available = await checkDomainAvailability(processedData)
        console.log('write CSV')
        writeCSV(available) //all domains
        console.log('write Terms CSV')
        writeCSVTerms(available) //search for terms
    }
   // const promisResolves = await Promise.all(promises)
    console.log('all promises complete')
}
//the main business
async function checkDomainAvailability(domainArray) {
    var returnArray = []
    var retryList = []
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
                    console.log(' retry helped ')
                }
                if (returnArray.indexOf(name) == -1) {//dedupe return as well
                    returnArray.push(name) 
                }
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
            const promises = domainArray.map(async item => {
                const checked = await DNSCheck(item)
                return checked
            })
            const domainslist = await Promise.all(promises)
            console.log('domains proccessed - ' + domainslist.length)
            console.log('available domains - ' + returnArray.length)
            return(returnArray)
        }
    await asyncRequestLoop(domainArray)
    return returnArray

}
//csv and fs functions
function enumerateDirectory(directory) {

    fs.readdirSync(`${ __dirname }${directory}`).forEach(file => {
        fileList.push(file)
    });

}
async function csvReadAsync(filePath) {

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    
 
}
async function parseandDedupeCSVObj(csvObj) {
    var processArray = []
    //console.log('CSV Obj Preview - ' + JSON.stringify(csvObj[1]).substring(0, 150))
    console.log('Parse and Dedupe begin Lines in CSV - ' + csvObj.length)
    var csvObjLen = csvObj.length

    while (csvObjLen--) {
        var url = csvObj[csvObjLen]['Link URL'] // Your needed field Title from CSV 
        /*process your csv data here*/
        var domain = await getBaseUrl(url) //get base URl's      
        if (processArray.indexOf(domain) == -1) { //dedupe list
            processArray.push(domain)
        }
    }
    console.log('Parse and Dedupe end items after proccessing - ' + processArray.length)
    return processArray

}
async function writeCSV(available) {
    console.log("writeCSV")
    ws = fs.createWriteStream(`${__dirname}${outputDirectory}all-available-domains.csv`, { flags: 'a' })
    var len = available.length;
    while (len--) {
        ws.write(`${JSON.stringify(available[len])}\n`)
        //console.log('site ' + returnArray[len])
    }

    ws.end()

}
function writeCSVTerms(available) {
    console.log("writeCSVTerms")
    ws = fs.createWriteStream(`${__dirname}${outputDirectory}terms-available-domains.csv`, { flags: 'a' })
    let len = available.length;
    while (len--) {
        let terms = ['dothan','alabama','money','finance']
        let termsLen = terms.length
        while (termsLen--) {
            if (available[len].indexOf(terms[termsLen]) > -1) {
                ws.write(`${JSON.stringify(available[len])}\n`)
                //console.log('site ' + returnArray[len])
            }

        }
    }

    ws.end()
}
/*helper functions*/
async function getBaseUrl(url) {
    var domain = url.replace('http://', '').replace('https://', '').replace('www.', '').replace('.htm', '').replace('.html', '').replace('.php', '').replace('.cfm', '').replace('.js', '').replace('.shtml', '').replace('.aspx', '').replace('.asp', '')

    var domain = domain.split("?").shift();
    var domain = domain.split("#").shift();

    while (domain.split('/').length > 1) {
        domain = domain.split("/").shift(); //always want the first
    }
    while (domain.split('.').length > 2) {
        domain = domain.split(".");// want two parts not just the first
        domain.shift()
        domain = domain.join('.');
    }

    return (domain)
}
console.log('get filenames')
enumerateDirectory(fileDirectory) //writes fileList global Var
console.log('begin large flow')
flowLoop(fileList) //writes fileList global Var
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