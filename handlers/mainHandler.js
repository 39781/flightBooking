var config 		=	require('./../config/config_'+process.env.NODE_ENV.replace('\r','')+'.json');
var msgConfig	=	require('./../config/menusMsgConfig.json');
var utilities 	=	require('./../utilities/utilities.js');
var request		=	require('request');
var logger 		=	require('./../config/winston.js');
var chatResp 	=	require('./chatResponses.js');
var tokenOpts 	= require('./../utilities/azureTokenUtil.js');
var jwtDecode	= require('jwt-decode');
var userSesControl = require('./../utilities/'+config.userSesControl+'.js');
var mainHandler = {};
var genieIncident		= require('./../config/genieIncident.json');

// function to get user session from redis

mainHandler.checkMicroServiceStatus = function(req){
	return new Promise(function(resolve, reject){
		try{
			console.log('inside check microservice status = ',req.service);
			return userSesControl.getUserSession("healthStatus")
			.then(function(microServicesHealths){
				//console.log('testing intent name',config.excludeHealthChk.intents,req.queryResult.intent.displayName,config.excludeHealthChk.intents.indexOf(req.queryResult.intent.displayName));
				let flag = microServicesHealths[req.service]||config.excludeHealthChk.services.indexOf(req.service)>=0||config.excludeHealthChk.intents.indexOf(req.queryResult.intent.displayName)>=0;
				if(flag){
					resolve({body:req});
				}else{
					for(i=0;i<req.queryResult.outputContexts;i++){
						req.queryResult.outputContexts[i].lifespanCount = 0;
					}
					chatResp.mainMenu([{text:msgConfig["serviceDown"].replace("serviceName",config.healthCheck[req.service])}],req.queryResult.outputContexts)
					.then(function(result){
						reject({resp:result,src:req.src});	
					});	
				}
			})
			.catch(function(err){
				console.log(err);
				for(i=0;i<req.queryResult.outputContexts;i++){
					req.queryResult.outputContexts[i].lifespanCount = 0;
				}
				chatResp.mainMenu([{text:msgConfig["mainMenuMsg"]}],req.queryResult.outputContexts)
				.then(function(result){
					reject({resp:result,src:req.src});	
				});
			})
		}catch(err){
			for(i=0;i<req.queryResult.outputContexts;i++){
				req.queryResult.outputContexts[i].lifespanCount = 0;
			}
			chatResp.mainMenu([{text:msgConfig["mainMenuMsg"]}],req.queryResult.outputContexts)
			.then(function(result){
				reject({resp:result,src:req.src});	
			});
		}
	});
}


mainHandler.checkUserAuthorization = function(req){
	return new Promise(function(resolve, reject){		
		try{
			console.log('inside check user authorization');
			logger.consoleLog.info("inside getUserSession");
			// getting channel information from source field
			if(['artwebview','spark'].indexOf(req.source)>=0){
				resolve(req);
			}else{
				var token = req.originalDetectIntentRequest.payload.user.accessToken;
				logger.consoleLog.info('token inside getUserSession',token);						
				if(typeof(req.originalDetectIntentRequest)!='undefined'&&req.originalDetectIntentRequest.source == 'google'){
					req.src  = 'google';								
				}else if(req.source == 'artwebview'){				
					req.src  = req.source;
				}else{
					req.src  = 'facebook';
					userId= req.session
				}				
				// Condition check for whether request came from authorized user. 	
				let microservice;
				if (token){
					let decodeJson = jwtDecode(token);
					let userId = (decodeJson.unique_name.indexOf('@')>0)?decodeJson.unique_name.split('@')[0]:decodeJson.unique_name;			
					req.key = userId
					logger.consoleLog.info('user id ',userId);
					// function call for find request related to which microservice 
					return userSesControl.getUserSession(userId)
					.then(function(resp){
						req.empid = resp.empid;
						req.dispName  = resp.displayName;						
						req.mail = resp.mail;
						req.userSession = 	resp.userSession;	
						resolve({body:req,tokens:resp.tokens});
					})
					.catch(function(err){
						logger.errorLogs.info('usersession not found '+JSON.stringify(err));
						chatResp.signIn([{text:"please login to help you"}],"Dear Hexawarian",(req.queryResult.outputContexts[0])?req.queryResult.outputContexts[0].name:"")
						.then(function(result){
							reject({resp:result,"src":req.src,logout:true});					
						})
					})	
					
				}else{
					logger.errorLogs.info('token not found');
					chatResp.signIn([{text:"please login to help you"}],"Dear Hexawarian",(req.queryResult.outputContexts[0])?req.queryResult.outputContexts[0].name:"")
					.then(function(result){
						result.userId = req.originalDetectIntentRequest.payload.user.userId
						reject({resp:result,"src":req.src});					
					})
				}
			}
			
		}catch(err){
			logger.errorLogs.info('issue in user authorization check '+JSON.stringify(err));
			chatResp.signIn([{text:"please login to help you"}],"Dear Hexawarian",(req.queryResult.outputContexts[0])?req.queryResult.outputContexts[0].name:"")
			.then(function(result){
				reject({resp:result,"src":req.src,logout:true});					
			})
		}
	})
}

mainHandler.getMicroserviceDetails = function(req, tokens){
	return new Promise(function(resolve, reject){
		try{
			console.log('inside get Microservice details');
			utilities.getMicroService(req.queryResult.intent.displayName, req.queryResult.queryText)
			.then(function(result){
				req.service = result.api;
				req.queryResult.intent.displayName = result.intentName;
				microservice = result.api;
				console.log(microservice);
				/* condition check for whether the request if related to art or other microservice
					if it is related to art, then returning request back to next step,
					else getting user information from redis.							
				*/
				if(['art'].indexOf(result.api)>=0){	
					logger.consoleLog.info({body:req,api:result.api});						
					resolve({body:req,api:result.api});																								
				}else{				
					if(microservice!='chatServer'){								
						req.originalDetectIntentRequest.payload.user.accessToken = tokens[microservice];															
					}
					console.log('deleting tokens')
					delete tokens;							
					resolve({body:req});																	
				}
			})
			.catch(function(err){
				logger.errorLogs.info('get microservice details error'+JSON.stringify(err));
				chatResp.mainMenu([{text:msgConfig["technicalErr"]}],req.queryResult.outputContexts)
				.then(function(result){
					resolve({resp:result,src:req.src});	
				});					
			})
		}catch(err){
			console.log(err);
			logger.errorLogs.info('get microservice details error'+JSON.stringify(err));
			for(i=0;i<req.queryResult.outputContexts;i++){
				req.queryResult.outputContexts[i].lifespanCount = 0;
			}
			chatResp.mainMenu([{text:msgConfig["technicalErr"]}],req.queryResult.outputContexts)
			.then(function(result){
				reject({resp:result,src:body.src});	
			});	
		}
	})
}

// function for constrcut request body for resources
mainHandler.buildApiInputObject = function(result){
	return new Promise(function(resolve, reject){
		console.log('inside build api input oject');
		logger.consoleLog.info('constructApiData ',result)
		switch(result.body.service){
			case 'art':case 'ART':result.body.intentName = result.body.queryResult.action;resolve({body:result.body, token:process.env.ART_AUTHORIZATIONTOKEN.replace('\r',''), api:result.body.service});break;			
			default:var userObject= {
						"key":result.body.key,
						"src":result.body.src,
						"mail":result.body.mail,
						"displayName":result.body.dispName,
						"intentName": result.body.queryResult.intent.displayName,
						"userSession": result.body.userSession,
						"entityName": result.body.queryResult.parameters,
						"fulfillment": result.body.queryResult.fulfillmentMessages,
						"contexts": result.body.queryResult.outputContexts,
						"action" : result.body.queryResult.action,
						"resolvedQuery": result.body.queryResult.queryText,
						"conversationId": result.body.originalDetectIntentRequest.payload.conversation.conversationId
					}						
					resolve({body:userObject , token:result.body.originalDetectIntentRequest.payload.user.accessToken, api:result.body.service});break;
		}
	})
}
// function for call resouces with request body, passing token as bearer
mainHandler.process = function(body , token, api){
	return new Promise(function(resolve, reject){		
		try{
			console.log('inside calling microservice api for process');
			logger.consoleLog.info("\nreq object in process "+JSON.stringify(body));	
			logger.consoleLog.info("\napi "+api);	
			logger.consoleLog.info("\n req.src "+body.src);
			logger.consoleLog.info("\n req.key "+body.key);
			let msgs;
			// block for handle chat server related functionalities
			if(api == 'chatServer'||api == body.intentName){			
				welcomeMsg	= 	msgConfig['welcomeMsg'].replace('username',body.userSession.EMPL_NAME);
				logger.consoleLog.info(welcomeMsg);
				logger.consoleLog.info("\napi related to chat server process staretd "+body.intentName);	
				var contextLen = body.contexts.length;
				for(i=0;i<contextLen;i++){
					body.contexts[i].lifespanCount = 0;
				}
				switch(body.intentName){
					case 'mainMenu':chatResp.mainMenu([{text:msgConfig["mainMenuMsg"]}],body.contexts)
									.then(function(result){
										resolve({resp:result,src:body.src});	
									});break;
					case 'sign_In': textMsg = msgConfig["subMsg2"], speechMsg = msgConfig["subMsg4"];
									if(body.userSession.SEX.match(/F/ig)){
										textMsg = textMsg.replace('genderMsg','madam') , speechMsg = speechMsg.replace('genderMsg','madam');
									}
									if(body.userSession.SEX.match(/m/ig)){
										textMsg = textMsg.replace('genderMsg','sir') , speechMsg = speechMsg.replace('genderMsg','sir');
									}
									msgs = [
										{text:welcomeMsg},
										{text:textMsg,speech:speechMsg}
									];
								console.log(' inside sign in '+body.key);
								chatResp.mainMenu(msgs,body.contexts)
									.then(function(result){
										resolve({resp:result,src:body.src});
									})								
								break;										
					case 'logout':	logger.consoleLog.info('calling logout '+body.key);
									logout(body.key)
									.then(function(resp){
										msgs = [												
												{text:msgConfig['logout']},
												{text:msgConfig['subLogout']}
											];
										chatResp.mainMenu2(msgs,body.contexts)
										.then(function(result){
											result.statusCode = 401;
											resolve({resp:result,src:body.src});
										})										
									})
									.catch(function(err){
										logger.errorLogs.info(JSON.stringify(err));
										msgs = [
													{text:msgConfig['logoutFail']},
													{text:msgConfig['sublogoutFail']}												
												];
												chatResp.mainMenu2(msgs,body.contexts)
												.then(function(result){
													result.statusCode = 401;
													resolve({resp:result,src:body.src});
												})
									});break;
					case 'Default Welcome Intent': 
								textMsg = msgConfig["subMsg2"], speechMsg = msgConfig["subMsg4"];
								if(body.userSession.SEX.match(/F/ig)){
									textMsg = textMsg.replace('genderMsg','madam') , speechMsg = speechMsg.replace('genderMsg','madam');
								}
								if(body.userSession.SEX.match(/m/ig)){
									textMsg = textMsg.replace('genderMsg','sir') , speechMsg = speechMsg.replace('genderMsg','sir');
								}
								msgs = [
									{text:welcomeMsg},
									{text:textMsg,speech:speechMsg}
								];								
								chatResp.mainMenu(msgs,body.contexts)
								.then(function(result){
									resolve({resp:result,src:body.src});
								});break;							  
					case 'BotCapabilities':logger.consoleLog.info("\n BotCapabilities process starting");
											resolve({resp:chatResp.botCapabilities(body.entityName.capType,body.contexts),src:body.src});break;
					case 'ThankYou': msgs = [
												{text:msgConfig["thankYouMsg"].replace('username',body.userSession.EMPL_NAME).replace('smile',msgConfig['smile']),speech:msgConfig["thankYouMsg"].replace('username',body.userSession.EMPL_NAME).replace('smile','')},
												{text:msgConfig["thankYouSubMsg"]}
											];
									logger.consoleLog.info('inside thankyou');
									resolve({resp:chatResp.thankYou(msgs,null,null),src:body.src});break;
					case 'ThankYouYes':msgs = [
											{text:msgConfig["subMsg3"]}
										];logger.consoleLog.info('inside yes thankyou');
										resolve({resp:chatResp.thankYou(msgs,'yes',body.contexts),src:body.src});break;
					case 'ThankYouNo':msgs = [
											{text:msgConfig["thankYouNoMsg"].replace('smile',msgConfig['smile']),speech:msgConfig["thankYouNoMsg"].replace('smile','')}
										];logger.consoleLog.info('inside no thankyou');
										resolve({resp:chatResp.thankYou(msgs,'no',body.contexts),src:body.src});break;
					case 'Feedback':resolve({resp:chatResp.feedback(body,[{text:msgConfig["feedback"],speech:msgConfig["feedback"]}],body.contexts),src:body.src});break;
					//case 'ReportIssue':resolve({resp:chatResp.reportIssue(body,[{text:msgConfig["reportIssue"],speech:msgConfig["reportIssue"]}],body.contexts),src:body.src});break;
					case 'ReportIssue':resolve({resp:reportIssueToGenie(body,body.key,[{text:msgConfig["reportIssue"],speech:msgConfig["reportIssue"]}],body.contexts),src:body.src});break;
					case 'Default Fallback Intent':default:
						
							utilities.writeFailedUtterance(JSON.parse(JSON.stringify(body)));
							chatResp.mainMenu([{text:msgConfig['wrongUtterance']},{text:msgConfig["subMsg3"]}],body.contexts)
							.then(function(result){
								resolve({resp:result,src:body.src});
							})							
							break;			
				}
			}else{ // block for call other micro services			
				logger.consoleLog.info('before calling API '+token);
				if(body.displayName=='jedoxUser1' && api=='ps'){
					api=api+'_jedox';
				}
				logger.consoleLog.info('before calling API for :'+body.displayName +' &' +api+' Is :'+config.apiServer.microServices[api]+body.intentName);
				logger.consoleLog.info('UserSession is '+JSON.stringify(body.userSession));
				callAPI(config.apiServer.microServices[api]+body.intentName, JSON.parse(JSON.stringify(body)), token)
				.then(function(resp){
					logger.consoleLog.info('\nfinal resp '+JSON.stringify(resp));
					resolve({"resp":resp,src:body.src});
				}).catch(function(err){
					logger.errorLogs.info('\nerror at call API '+JSON.stringify(err));	
					let msgs= [];
					msgs = [
						{text:msgConfig[err]},
						{text:msgConfig["subMsg3"]}							
					];			
					for(i=0;i<contextLen;i++){
						body.contexts[i].lifespanCount = 0;
					}
					chatResp.mainMenu(msgs,body.contexts)
					.then(function(result){
						reject({resp:result,src:body.src});
					})
				})
			}
		}
		catch(error){						
			logger.errorLogs.info('\nerror at call API '+JSON.stringify(error));			
			utilities.writeFailedUtterance(JSON.parse(JSON.stringify(body)));
			var contextLen = body.contexts.length;
			for(i=0;i<contextLen;i++){
				body.contexts[i].lifespanCount = 0;
			}
			chatResp.mainMenu([{text:msgConfig['wrongUtterance']},{text:msgConfig["subMsg3"]}],body.contexts)
			.then(function(result){
				reject({resp:result,src:body.src});
			})			
		}
	})			
}

// function for logout functionalities

var logout = function(key){
	return new Promise(function(resolve, reject){
		console.log('inside logout');
		logger.consoleLog.info('inside logout'+key);
		userSesControl.deleteUserSession(key)
		.then(function(resp){
			logger.consoleLog.info("\n deleted user Session : "+JSON.stringify(resp));
			resolve(true);
		})
		.catch(function(err){			
			logger.consoleLog.info("\n error at deleted user Session : "+JSON.stringify(err));
			reject(false);
		})
		
	});
}

// function for call api
var callAPI = function(api, userData, token){
	return new Promise(function(resolve, reject){
        logger.consoleLog.info('calling api '+api+JSON.stringify(userData)+token);	
		request.post(api,{auth:{bearer:token},body:userData,json:true,time:true},function(err, response, body){
			logger.consoleLog.info('TEST Error : '+JSON.stringify(err)+", Body : "+JSON.stringify(body)+", Response : "+JSON.stringify(response));		
			if(response&&response!=null&&response.timingStart&&response.responseStartTime&&response.elapsedTime){
				logger.requestTimes.info('Request Start Time : '+response.timingStart+', Response Start Time : '+response.responseStartTime+', Request Elapsed Time : '+response.elapsedTime+", Body : "+JSON.stringify(body));  
			}			
			if(err){
				logger.errorLogs.info('error in api call');
				logger.errorLogs.info(JSON.stringify(err));	
				if(err.code === 'ETIMEDOUT'&&err.connect === true){
					reject('serviceDown');
				}else if(err.code === 'ESOCKETTIMEDOUT'){
					reject('responseTimeout');
				} else {
					reject('technicalIssue');
				}				
			}else{			
				if(body.statusCode&&body.statusCode >=500){
					reject("serviceDown");	
				}else{
					resolve(body);	
				}
						
			}		
		})
	})	
}

var reportIssueToGenie = function(body,userId, msgs, contexts){
	return new Promise(function(resolve,reject){
		let resp;
		userSesControl.getUserSession(userId)
		.then((resp) => {
			if (typeof (resp) == 'string') {
				resp = JSON.parse(resp);
			}
			let token = resp.tokens['itsm'];
			return token;
		}).then((result) =>{
			logger.consoleLog.info("Token in reportIssueToGenie "+result);
			var requestObject = genieIncident.incidentCreateRequest;
			var URL = genieIncident.createIncident + body.mail;
			requestObject = requestObject.replace('calleremail',body.userSession.EMAIL);
			requestObject = requestObject.replace('description',body.entityName.issue);
			logger.consoleLog.info("Params in reportIssueToGenie "+URL+'||'+result+'||'+requestObject);
			resolve(chatResp.reportIssue(body,msgs,contexts));
			//return true;
		})/*.then({
			resp = chatResp.reportIssue(body,msgs,contexts),		
			resolve(resp)
		});*/
	})
	
}


module.exports = mainHandler