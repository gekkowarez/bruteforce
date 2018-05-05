const nodemailer = require('nodemailer');
const randomExt = require('random-ext');
const fs = require('fs-extra');
const flat = require('flat');
const util = require('util');
const humanize = require('humanize');
var replaceall = require("replaceall");
var toml = require('toml');
const _ = require('lodash');

//setup variables
var viableStrategies = [];
var stratKey = "";
var stratFileName = "";
var contents = "";
var stratFileContents = "";
var baseConfig = "";
var count=0;
var outtxt = "";
//configuration elements
//starting with paths and the all important gekko config
var strategiesFolder = '../gekko/config/strategies/';
var configFile = '../gekko/config-new.js';
var outputConfigFile = '../gekko/config-ready-to-use.js';

const config = require(configFile);


let dirCont = fs.readdirSync( strategiesFolder );

let strategies = dirCont.filter( function( elm ) {return elm.match(/.*\.(toml)/ig);});
	baseConfig = fs.readFileSync(configFile, 'utf8');
	baseConfig = replaceall("module.exports = config;", "", baseConfig);
	if (fs.existsSync(outputConfigFile)){
		fs.unlinkSync(outputConfigFile);	
	}
	fs.appendFileSync(outputConfigFile, baseConfig, encoding = 'utf8');		
	
for (var i = 0, len = strategies.length; i < len; i++) {
	stratFileName = strategies[i];
	if(stratFileName.indexOf("-")>-1){
		
	}else{
		stratKey = strategies[i].slice(0, -5);
		contents = fs.readFileSync(strategiesFolder+"/"+stratFileName, 'utf8');
		stratFileContents = toml.parse(contents);
		outtxt = "config."+stratKey+"="+JSON.stringify(stratFileContents);
		config[stratKey] = stratFileContents;
		fs.appendFileSync(outputConfigFile, outtxt+"\r\n\r\n", encoding = 'utf8');	 
	}
}
//config is the json formatted strategy configs.
//stratFileContents is the Gekko config format configs


	fs.appendFileSync(outputConfigFile, "module.exports = config;", encoding = 'utf8');	 
  console.log("Config - "+ outputConfigFile +" is ready to go.");
