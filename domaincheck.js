/* Tool for iterating over an ahrefs broken outbound links report, and checking for unregistered domains. Part of the Marketers Toolkit*/



'use strict'

/* dependencies for sheets API*/
const { google } = require('googleapis')
const util = require('util')
const key = require('./auth.json')
const scopes = 'https://www.googleapis.com/auth/spreadsheets'
const jwt = new google.auth.JWT(key.client_email, null, key.private_key, scopes)
process.env.GOOGLE_APPLICATION_CREDENTIALS = './auth.json'
/* end dependencies for sheets API*/

/* dependencies for CSV crawling, and dns*/
const neatCsv = require('neat-csv');
const fs = require('fs')
const { Resolver } = require('dns').promises;
const resolver = new Resolver();
//resolver.setServers(['4.4.4.4']);
/* end dependencies for CSV crawling, and dns*/

/* Pull data from sheets, waterfall from the first fetch*/
/*share sheet with technologicserver1@technologictools.iam.gserviceaccount.com */
var sheetID = '1uz6ihkS2FWvuggwPvGovlARiuxAidiFDjXnrx04FQR8'
var ranges = 'Sheet1'
var writeRanges = 'Sheet2'
jwt.authorize((err, response) => {
  const sheets = google.sheets('v4');
  var numRows = 0
    sheets.spreadsheets.get(
        {
          auth: jwt,
          spreadsheetId:sheetID,
          ranges: ranges,      
        },
        (err, res) => {
          if (err) {
            console.error('The API returned an error.');
            throw err;
          }
          const numRows = res.data.sheets[0].properties.gridProperties.rowCount;
        //{ rowCount: 101547, columnCount: 26, frozenRowCount: 1 }
        buildGetAllRowsRequest(numRows)        
        }
    );
     function buildGetAllRowsRequest(numRows){
      var counterRows = 0 //counts to 99(100 rows)('LargeList!A100:199',)
      var counterSets = 0  //also counts to 99 (100 sets * 100 rows )
                         /**'LargeList!A29300:29399',
                     'LargeList!A29200:29299',...
                     'LargeList!A19800:19899' ] */
         var setsRows = Math.ceil(numRows / 100)
         console.log(`total number of rows to request ${numRows}`)
         console.log(`totals sets of Rows to request ${setsRows}`)
         var rangesObject =[]
         rangesObject[counterSets] = new Array();
         for(var i = setsRows -1; i >= 0 ; i--){ 
             //runs once for each set of rows
             //297 sets of 100 because of 29680 rows at time of first build
             if (i != 0){
                 var rowSetRangeBottom = i * 100 
                 var rowSetRangeTop = rowSetRangeBottom + 99
             }
             else{
                 var rowSetRangeBottom = 1 
                 var rowSetRangeTop = rowSetRangeBottom + 99
             }
             var string = ranges + '!A' + rowSetRangeBottom + ":" + rowSetRangeTop
          //   console.log(string)
             //builds one piece of request string each itteration
             //next piece ensures string gets built into object correctly for request limit purposes. 
             if (counterRows >= 99 ){ //checks to see if 100 rows have been reached 
                 counterRows = 0 
                 counterSets ++ //if so starts the next set of rows
                 rangesObject[counterSets] = new Array();
                 counterRows ++
                } 
                else{
                 counterRows ++
                }
             rangesObject[counterSets].push(string)
                //appends string of rows to set of object          
         }
         console.log(`sets sets of Rows ${rangesObject.length}`)
         getAllRowsData(rangesObject)    
      }
     async function getAllRowsData(rangesObject){

      var oneSet = [] //object to store requested data
      var allSets = []
      const forLoop = async () => {
          console.log('Start getAllRowsData request')
                  for (const range of rangesObject) {
                      //loops once for each set of sets 3 in this case.
                      const params = {
                      auth: jwt,
                      spreadsheetId: sheetID,
                      ranges: [range],
                      };
                      async function runSample() {                           
                          const res = await sheets.spreadsheets.values.batchGet(params);
                          /** { range: 'LargeList!A29400:AK29499',
                                  majorDimension: 'ROWS',
                                  values: 
                                  [ [Array],...
                                  ] },
                              { range: 'LargeList!A29300:AK29399',
                                  majorDimension: 'ROWS',
                                  values:
                                  [ [Array],
                              */
                             var oneSet = res.data.valueRanges
                         //fullSet.push(res.data.valueRanges);                         
                         allSets = allSets.concat(oneSet);    
                      }   
                      await runSample().catch(console.error);
                  }
                  console.log('End getAllRowsData request')
              }
       await forLoop()
       findDomains(allSets)
      }
      
     async function findDomains(complexObject){

      var returnArray = []
        console.log(JSON.stringify(complexObject).substring(0,250))
        console.log("Step 1 loop through returned allRowsData")

          const forLoop = async () => {
              for (const object of complexObject) { 
                const forLoop2 = async () => {
                  console.log(JSON.stringify(object).substring(0,250))
                  try{ 
                  for (let p = 0; p < object.values.length; p++) {
                            var url = object.values[p][0]
                            var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
                          
                            
                            if ( domain.split('.').length-1 > 1)
                            {
                               // console.log(domain)
                                var domainTLD = domain.split('.').reverse()[0]
                                var domainBase = domain.split('.').reverse()[1]
                                domain = domainBase + '.' +  domainTLD
                             //   console.log(domain)
                                try{
                                  var returnguy = await resolver.resolve4(domain)
                                  }
                        catch(err){
                          var error = JSON.stringify(err)

                                if(error.indexOf('ETIMEOUT') == -1){

                                    if (returnArray.indexOf(domain) == -1){
                                      returnArray.push(domain)
                                    }
                                  } 
                                  else{
                                    console.log(err)
                                  }

                               }
                            }
                            else{
                              
                              try{
                                var returnguy = await resolver.resolve4(domain)
                                }
                                catch(err){
                                  var error = JSON.stringify(err)
                                        if(error.indexOf('ETIMEOUT') == -1){
                                            if (returnArray.indexOf(domain) == -1){
                                              returnArray.push(domain)
                                            }
                                          } 
                                          else{
                                            console.log(err)
                                          }
                                  }
                            }
                          
                            
                      }       
                  }
                  catch(err){
                    console.log(err)
                  }
                    
                  }        
               await forLoop2()      
              }              
            }        
         await forLoop()
          console.log("end checking available Domains " + JSON.stringify(returnArray).substring(0,250))
          pushRows(returnArray)
      }


     async function pushRows(rows){
      
      console.log("end checking available Domains " + JSON.stringify(rows).substring(0,250))
          //console.log(hundredRows)
               // var  valuesString = JSON.stringify(hundredRows)
               
                const params = {
                    auth: jwt,
                    spreadsheetId: sheetID,
                    resource: {
                        valueInputOption:'USER_ENTERED',
                        data:[
                              {
                                  majorDimension: "COLUMNS",
                                  range: writeRanges,
                                  values:[rows]
                              }                                                      
                            ]  
                        }

                    };
                  // console.log(params)
                    async function runSample() {                           
                        const res = await sheets.spreadsheets.values.batchUpdate(params);
              
                        console.log(res)
                    }   
                  await runSample().catch(console.error);
            
      }
  })

function toDO(data)
{
  console.log(message)
}
async function readCSVCheckDomains (){
  var csvObject = []
  const readFile = async () =>{
    console.log('Start')
    fs.readFile('./www.americanbar.org-brokenlinks-subdomains-live-25-Apr-2020_17-32-04.csv', async (err, data) => {
      if (err) {
        console.error(err)
        return
      }
        const res = await neatCsv(data);
        parseObj(res)
    })
    console.log('End')
    
  }
await readFile()
//secondary functions
function parseObj(res){
  //console.log('csv obj  - ' + JSON.stringify(res[1]).substring(0,250))
  //console.log('type Of - ' + typeof(res[1]))
  for (var i=0; i<res.length; i++) {
    var url = res[i]['Link URL'] // URL from Ahrefs broken outbound links. 
    var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
    //console.log(domain)
    checkAvailable(domain)
    function checkAvailable(name) {
      dns.resolve4( name, function (err, addresses) {
          if (err) {
              var error = JSON.stringify(err)
              if(error.indexOf('ETIMEOUT') == -1){
                console.log (name + " is possibly available : " + err) 
              }
              else {
                checkAvailable(name)
              }
              
            }
          sle
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
//readCSVCheckDomains()
  
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