const express 		= require('express');
let app 			= express();
const request 		= require('request');
const bodyParser 	= require('body-parser');
//console.log('./config/config_'+process.env.NODE_ENV+'.json');
const config	 	= require('./config/config_'+process.env.NODE_ENV.replace('\r','')+'.json')
var fs 				= require('fs');	
var path 			= require('path');	
var routes			= require('./routes/routes.js');
const cron			= require('node-cron');

global.userSessions = {};
global.loggedUsers = {};
var options = {flag: 'a',mode: 0o777};
//console.log(__dirname);


global.logStream = "";
global.consoleStream = "";

function createLogs(fileName){
	//console.log('chat logs created');
	logStream = fs.createWriteStream(path.join(__dirname,"logs",fileName+"_chatLogger.json"), options);
	consoleStream= fs.createWriteStream(path.join(__dirname,"logs",fileName+"_consolelog.log"), options);
	logStream.on('error', function(err){
		//console.log(err);
		logStream.close();	
	});

	consoleStream.on('error',function(err){
		//console.log(err);
		consoleStream.close();
	})
}

/*cron.schedule("59 23 * * *",function(){
	createLogs(new Date().toJSON());
})*/

/*setInterval(function(){
	
},5000);*/

const port = process.env.PORT || 3000;
app.use(express.static(__dirname + '/public'));

app.use(function (err, req, res, next) {
	console.error(err.stack)
	res.status(401).json({error:"Authorization error",error_description:"It seems you are not aurthorized resource",});
  })

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.use(routes);

let server = app.listen(port, function () {	
		console.log("\nApplication started listening port test " + port);		
});

process.on('unhandledRejection', function(err, promise) {
	console.log('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
});



process.on('unCaughtException', function(err){
	//console.log(err);
	process.exit(1);
});




