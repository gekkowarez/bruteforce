const async = require('async');
const nodemailer = require('nodemailer');
const randomExt = require('random-ext');
const rp = require('request-promise');
const { some } = require('bluebird');
const fs = require('fs-extra');
const flat = require('flat');
const util = require('util');
const humanize = require('humanize');
var replaceall = require("replaceall");

//setup variables
var viableStrategies = [];
var stratKey = "";
var configs =[];
var count=0;
//configuration elements
//starting with paths and the all important gekko config
//where are your gekko strategies?
var strategiesFolder = '../gekko/strategies/';
//where is your config?
var configFile = '../gekko/config-backtester.js';
//where is your api server? (default is port 3000)
//to run the server type node gekko --ui in to the console
var apiUrl= "http://localhost:3000";
const config = require(configFile);

//then we setup the filewriter to store the backtests
//if you don't want to write the output to a file then set this to false, but then why the fuck else would you run this....derp
var writecsv = true;
//by default we throw the results into the folder and file you see below, the results will be appended...again....derp.
var resultCsv = __dirname+"/results/bruteforce.csv";


//then we load up the important shit!

//how many backtests do you want to run parralel, 1928374982734 I bet but unless you're armed with a serious bit of pro, multi cpu kit...how about you keep this lower than the number of cores you have for now?
var parallelqueries = 2;

//this is where it gets interesting right?
//RIGHT!!!!
//setup params for backtesting
//fuck json, this is pure arrays as god intended us pony coders to use
//throw in the candle sizes here
var candleSizes = [240,480,960];
//list different history sizes here
var historySizes = [10,20];
//ooo this looks fun - this is where you set up the trading pairs and back testing exchange data
//you can load up as many sets as you like
var tradingPairs = [["poloniex","btc","eth"],["binance","btc","omg"]];
//so this is the number of configs that will be generated with different strategy settings
//if you multiply this by the number of candle sizes and history sizes and trading pairs you'll get the total number of backtests this sucker will run
//Note: if you wanna test candle sizes, against the same config setup then just set this to 1. Cute right???
var numberofruns = 1000;

let dirCont = fs.readdirSync( strategiesFolder );

//oh wait, there's more....

//so there is another version of this script that will run every single strategy in your strategy file that has an entry in the config but while useful...it was a bit crap when it came to brute forcing shit. So now you have to enter in your strategy name.
//make sure the strategy has a config entry in the config below
let strategies = ["SchaffTrendCycle"];



for (var a = 0, len4 = tradingPairs.length; a < len4; a++) {
	for (var j = 0, len1 = candleSizes.length; j < len1; j++) {
		for (var k = 0, len2 = historySizes.length; k < len2; k++) {	
	//check which strategies have equivalent config entries for in the config 
			for (var i = 0, len = numberofruns; i < len; i++) {
				stratKey = strategies[0];
				config.tradingAdvisor.method = stratKey;
				config.tradingAdvisor.candleSize = candleSizes[j];
				config.tradingAdvisor.historySize = historySizes[k];
				config.watch.exchange = tradingPairs[a][0];
				config.watch.currency = tradingPairs[a][1];
				config.watch.asset = tradingPairs[a][2];				
				
					this.baseConfig = {
						  gekkoConfig: {
							debug: config.debug,
							watch: {
							  exchange: config.watch.exchange,
							  currency: config.watch.currency,
							  asset: config.watch.asset,									
							},
							SchaffTrendCycle: {
							  "stcLength": randomExt.integer(12,1),
							  "fastLength": randomExt.integer(20,1),
							  "slowLength": randomExt.integer(80,20),
							  "factor": 0.5,
							  "threshold_high": 80,
							  "threshold_low": 20,
							  "enable_stop_loss": true,
							  "stoploss_threshold": 5,
							  "adjust_false_signal": true,
							  "threshold_adjustment": 5
							},							
							paperTrader: {
							  slippage: config.paperTrader.slippage,
							  feeTaker: config.paperTrader.feeTaker,
							  feeMaker: config.paperTrader.feeMaker,
							  feeUsing: config.paperTrader.feeUsing,
							  simulationBalance: config.paperTrader.simulationBalance,
							  reportRoundtrips: true,
							  enabled: true
							},
							tradingAdvisor: {
							  enabled: true,
							  method: config.tradingAdvisor.method,
							  candleSize: config.tradingAdvisor.candleSize ,
							  historySize: config.tradingAdvisor.historySize ,					  
							},
							trader: {
							  enabled: false,
							},
							backtest: {
							  daterange: config.backtest.daterange
							},
							performanceAnalyzer: {
							  'riskFreeReturn': 5,
							  'enabled': true
							},
							valid: true,
						  },
						  data: {
							candleProps: ['close', 'start', 'open', 'high', 'volume','vwp'],
							indicatorResults: false,
							report: true,
							roundtrips: false,
							trades: false
						  }
						};
						configs.push(this.baseConfig);
			}
		}
	}	
}	

//by this point you have an array of all the configs you're gonna run. 

//run the backtests against all the stored configs. 
hitApi(configs);


//this might look familiar...that's cos it's ripped from Gekkoga <3
async function hitApi(configs){
    const results = await queue(configs, parallelqueries, async (data) => {

	console.log("Running strategy - "+data.gekkoConfig.tradingAdvisor.method +" on "+data.gekkoConfig.tradingAdvisor.candleSize +" minute(s) candle size on "+ data.gekkoConfig.watch.exchange +" for "+ data.gekkoConfig.watch.currency + data.gekkoConfig.watch.asset);
      const body = await rp.post({
        url: `${apiUrl}/api/backtest`,
        json: true,
        body: data,
        headers: { 'Content-Type': 'application/json' },
        timeout: 1200000
      });

      // These properties will be outputted every epoch, remove property if not needed
      const properties = ['balance', 'profit', 'sharpe', 'market', 'relativeProfit', 'yearlyProfit', 'relativeYearlyProfit', 'startPrice', 'endPrice', 'trades'];
	  

      const report = body.report;
      let result = { profit: 0, metrics: false };

      if (report) {

        let picked = properties.reduce((o, k) => {

          o[k] = report[k];

          return o;

        }, {});

        result = { strat: data.gekkoConfig.tradingAdvisor.method, startdate: data.gekkoConfig.backtest.daterange.from, todate: data.gekkoConfig.backtest.daterange.to, profit: body.report.profit, sharpe: body.report.sharpe, metrics: picked };
      }

//now we write the backtest results to file:
		if(writecsv===true){  
			let runDate = humanize.date('d-m-Y');
			let runTime = humanize.date('H:i:s');		
			var sharpe = 0;
			if(report.sharpe){
				sharpe = report.sharpe;
			}
			let currencyPair = report.currency+report.asset;
			let configCsvTmp1 = JSON.stringify(data.gekkoConfig[data.gekkoConfig.tradingAdvisor.method]);
			let configCsv = replaceall(",", "|", configCsvTmp1)
			headertxt = "Strategy, Market performance(%),Strat performance (%),Profit,Run date, Run time, Start date, End date,Currency pair, Candle size, History size,Currency, Asset, Timespan,Yearly profit, Yearly profit (%), Start price, End price, Trades, Start balance, Sharpe, Alpha, Config\n";
			outtxt = data.gekkoConfig.tradingAdvisor.method+","+ report.market+","+ report.relativeProfit+","+ report.profit+","+runDate+","+runTime+","+ data.gekkoConfig.backtest.daterange.from+","+ data.gekkoConfig.backtest.daterange.to+","+ currencyPair+","+ data.gekkoConfig.tradingAdvisor.candleSize+","+ data.gekkoConfig.tradingAdvisor.historySize+","+ report.currency+","+ report.asset+","+ report.timespan+","+ report.yearlyProfit+","+ report.relativeYearlyProfit+","+ report.startPrice+","+ report.endPrice+","+ report.trades+","+ report.startBalance+","+ sharpe+","+ report.alpha+","+ configCsv+"\n";	

			if (fs.existsSync(resultCsv)){
				fs.appendFileSync(resultCsv, outtxt, encoding = 'utf8');		
			}else{
				fs.appendFileSync(resultCsv, headertxt, encoding = 'utf8');	
				fs.appendFileSync(resultCsv, outtxt, encoding = 'utf8');				
			}
//to do
//write strategy file to a new file with a key
//ensure the config it appended to the strategy file			
			
			
		} 

  
		return result;

    })
	.catch((err)=>{
		//console.log(err)
		throw err
	});
	return results;
}


function queue(items, parallel, ftc) {

	const queued = [];

	return Promise.all(items.map((item) => {

	  const mustComplete = Math.max(0, queued.length - parallel + 1);
	  const exec = some(queued, mustComplete).then(() => ftc(item));
	  queued.push(exec);

	  return exec;

	}))
		.catch((err)=>{
		console.log(err)
		throw err
	});

}


 

function getConfig(data, stratName) {
	const conf = Object.assign({}, this.baseConfig);

	conf.gekkoConfig[stratName] = Object.keys(data).reduce((acc, key) => {
	  acc[key] = data[key];
	  return acc;
	}, {});


	
return conf;

}


