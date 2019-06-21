var config = require('./../config/config_'+process.env.NODE_ENV.replace('\r','')+'.json');
var logger 		=	require('./../config/winston.js');
var request		=	require('request');
var utilities = {
	currentTime : function(){
		var currentDate = new Date();
		var hours = (currentDate.getHours() < 10) ? '0' + currentDate.getHours() : currentDate.getHours();
		var minutes = (currentDate.getMinutes() < 10) ? '0' + currentDate.getMinutes() : currentDate.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';

		return `${hours}:${minutes} ${ampm}`;
	},
	loginStatus : function(payloadText,uname,src, agent){	
			logger.consoleLog.info(payloadText+' '+uname+' '+src);
			let html = '<li class="list-group-item background-color-custom"><div class="media-body bot-txt-space animated fadeInLeft">             <p class="list-group-item-text-bot">'+payloadText+'</p><p class="bot-res-timestamp"><small> <img style="border-radius:50%;border:2px solid white;" width="20" height="20" src="'+config.botAvatar+'"/>'+utilities.currentTime()+'</small></p></div></li>';		
			let scriptcode = "";
			logger.consoleLog.info("agent "+agent);			
			if(agent&&agent.toLowerCase() == 'safari'){
				logger.consoleLog.info("agent safari true");								
				//scriptCode = "<div style='color:red;'><h2>"+payloadText+"</h2></div><span style='color:blue'><h5>Please close the browser and tap menu to use</h5></span>";
				scriptCode ="<style>div.card {box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); text-align: center;}div.header {background-color: #4CAF50;color: white;padding: 10px;font-size: 40px;}div.container {padding: 10px;}</style><div class='card'><div class='header' id='header'>"+payloadText+"</div> <div class='container' id='container'>There is some technical issue, Please close the browser and tap menu to use </div> </div>";
				scriptCode += "<script>window.opener.postMessage({'msg':'"+html+"' , 'uname': '"+uname+"' , 'browser':'"+agent.toLowerCase()+"'}, '"+config.domain+"');	window.location='myapp://?stuff';window.close();</script>";
				logger.consoleLog.info("script code "+scriptCode);
			}else{
				scriptCode = "<script>window.opener.postMessage({'msg':'"+html+"' , 'uname': '"+uname+"' , 'browser':'"+((agent)?agent.toLowerCase():'')+"'}, '"+config.domain+"');	window.close();</script>";
			}
						
		return scriptCode;
	},
	//function for find request related to microservice 
	getMicroService : function (intentName, query){
		return new Promise(function(resolve, reject){
			keys = Object.keys(config.intents);
			var microService;
			logger.consoleLog.info("get MicroService"+query+'  '+intentName);
			let microServiceApi = '';
			for(l=0;l<keys.length;l++){
				logger.consoleLog.info(keys[l]);
				if(typeof(config.intents[keys[l]]) =='object'){
					logger.consoleLog.info("\ntypeof is object"+config.intents[keys[l]]);
					if(config.intents[keys[l]].indexOf(intentName)>=0){
						microServiceApi = keys[l];						
						break;
					}
				}else{
					logger.consoleLog.info("\n not chat Server "+keys[l]);
					if(intentName.match(new RegExp(keys[l],"ig"))){
						microServiceApi = config.intents[keys[l]];
						intentName = intentName.replace(new RegExp(keys[l],"ig"),'');
						break;
					}
				}								
			};
			logger.consoleLog.info(microServiceApi);
			if(microServiceApi.length>0){
				logger.consoleLog.info(JSON.stringify({api:microServiceApi,"intentName":intentName}));
				resolve({api:microServiceApi,"intentName":intentName});
			}else{
				logger.consoleLog.info("rejected "+intentName);
				reject(intentName);
			}						
		});	
	},	
	writeFailedUtterance:function(obj){
		var failedUtterance = obj.resolvedQuery;
		if(obj.resolvedQuery == 'actions_intent_OPTION'){
			obj.contexts.forEach(function(context){
				if(context.name == 'actions_intent_option'){
					failedUtterance = context.parameters.OPTION;
				}
			})
		}
		var logObj = {
			dateTime:new Date().toJSON(),
			utterance:failedUtterance,
			status:'failed'
		}
		logger.chatLogs.info(JSON.stringify(logObj));
	},
	//function for call hit ps api to get user information 
	getUserSessionFromPSApi:function(key, token){		
		return new Promise(function(resolve, reject){
			logger.consoleLog.info('inside getUserSessionFromPSApi');		
			//console.log('token',token);
			if(key.toLowerCase() == 'jedoxuser1'){
				var apiURL = config.apiServer.microServices.getEmpDetails_Jedox;
			}else{
				var apiURL = config.apiServer.microServices.getEmpDetails;
			}				
			logger.consoleLog.info('Getting employee details for '+key.toLowerCase() +' From :'+apiURL);
			logger.consoleLog.info('ps token '+token);
			request.post(apiURL,{auth:{bearer:token},json:true,body:{"empId":key}},function(error, response, bodyres){
				if(error){
					//console.log(error);
					reject('Sorry there is some techinical issue please try later');
				}else{
						/*body.UserData = {
							  "employeeId": 22541,
							  "EFFDT": "2018-09-11",
							  "ACTION": "CSI",
							  "EMPL_NAME": "Rajesh Federer",
							  "BIRTHDATE": "2018-09-11",
							  "MAR_STATUS": "S",
							  "MAR_STATUS_DATE": "2018-09-11",
							  "ACTION_REASON": "",
							  "IDENTIFIER": "Rajeshwaran P"
							} */
					var userSesControl = require('./../utilities/'+config.userSesControl+'.js');		
					logger.consoleLog.info('\n emp details api '+JSON.stringify(bodyres.UserData));
					if(response.statusCode == 200){							
						resolve(bodyres.UserData);
					}else{
						//console.log('response status code',response.statusCode,bodyres);
						reject('Sorry there is some techinical issue please try later');
					}
				}					
			});
		});
	}	
	
}

module.exports = utilities;