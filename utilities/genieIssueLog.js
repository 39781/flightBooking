var request		=	require('request');
var genieSRRequest = require('./../config/genieSR.json');
var logger 		=	require('./../config/winston.js');
var genieIssueLogger = {};

var api = "https://geniev54-uat.hexaware.com/RestAPIUAT2/REST/Summit_RESTWCF.svc/RESTService/CommonWS_JsonObjCall";

genieIssueLogger.LogSR = function (issue){
    return new Promise(function(resolve, reject){
		genieSRRequest.objCommonParameters.objSRServiceTicket.JustificationRemarks = issue;
        
        request.post(api,
            {body:genieSRRequest,json:true,time:true},function(error, response, body){
			if(response.timingStart&&response.responseStartTime&&response.elapsedTime){
				logger.requestTimes.info('Request Start Time : '+response.timingStart+', Response Start Time : '+response.responseStartTime+', Request Elapsed Time : '+response.elapsedTime+", Body : "+JSON.stringify(body));  
			}
			
			if(error){
					logger.errorLogs.info('error in create Genie ticket api call');
					logger.errorLogs.info(JSON.stringify(error));					
					reject(error);
				}else{			
					resolve(body);			
				}		
		})
	})
}

module.exports = genieIssueLogger