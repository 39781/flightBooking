var winston = require('winston');
  require('winston-daily-rotate-file');

var transport = new (winston.transports.DailyRotateFile)({
	filename: './logs/chatServer-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});
var errorLogs = new (winston.transports.DailyRotateFile)({
	filename: './logs/chatServer-errorLogs-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});
var requestTimes = new (winston.transports.DailyRotateFile)({
	filename: './logs/chatServer-requestTimes-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});

var chatLogTransport = new (winston.transports.DailyRotateFile)({
	filename: './logs/chatServer-chatLogs-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});

var feedbackLog = new (winston.transports.DailyRotateFile)({
	filename: './logs/chatServer-feedback-%DATE%.log',
	datePattern: 'YYYY',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});

var reportIssue = new (winston.transports.DailyRotateFile)({
	filename: './logs/chatServer-issue-%DATE%.log',
	datePattern: 'YYYY',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});

requestTimes.on('rotate', function(oldFilename, newFilename) {
	
});
errorLogs.on('rotate', function(oldFilename, newFilename) {
	
});
chatLogTransport.on('rotate', function(oldFilename, newFilename) {
	
});

feedbackLog.on('rotate', function(oldFilename, newFilename) {
	
});

reportIssue.on('rotate', function(oldFilename, newFilename) {
	
});


transport.on('rotate', function(oldFilename, newFilename) {
	
});

module.exports = {
	errorLogs:winston.createLogger({
		format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json(),
				winston.format.prettyPrint(),
			),
		transports: [
		  errorLogs
		]
	}),
	consoleLog:winston.createLogger({
					format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
							winston.format.prettyPrint(),
						),
					transports: [
					  transport
					]
				}),
	requestTimes:winston.createLogger({
					format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
							winston.format.prettyPrint(),
						),
					transports: [
					  requestTimes
					]
				}),

	chatLogs:winston.createLogger({
					format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
							winston.format.prettyPrint(),
						),
					transports: [
					  chatLogTransport
					]
				}),
	feedbk:winston.createLogger({
					format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
							winston.format.prettyPrint(),
						),
					transports: [
					  feedbackLog
					]
				}),

	reportIssue:winston.createLogger({
					format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
							winston.format.prettyPrint(),
						),
					transports: [
					  reportIssue
					]
				})

}