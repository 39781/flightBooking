var config	 	= require('./../config/config_'+process.env.NODE_ENV.replace('\r','')+'.json');	
var request		= require('request');	
var logger 		=	require('./../config/winston.js');
var Q			=	require('q');
var userSesControl = require('./../utilities/'+config.userSesControl+'.js');
var util = require('./../utilities/utilities.js');
var jwtDecode = require('jwt-decode');
var tokenOperations = {
	/*function for create user session in redis
		This function generate access_token, refresh_token for google and also generates resource specific tokens
		once tokens are generated, calling getEmployeeDetails ps api.
		Once employee details got, creates userInfo object and call redis createSession function 
		to store user info in redis
	*/
	createUserSession:function(params){
		return new Promise(function(resolve, reject){
			try{
				//console.log(params);
				// calling microsofts token endpoint for generate tokens for google
				logger.consoleLog.info('inside create user session');			
				let tokenUrlParams =  `client_id=${params.client_id}&grant_type=${params.grant_type}&redirect_uri=${params.redirect_uri}&code=${params.code}&client_secret=${encodeURIComponent(params.client_secret)}&scope=${encodeURIComponent(config.masterScope)}`;
				request.post(config.tokenEndpoint,{body:tokenUrlParams},function(error,response,body){
						if(error){
							reject(error)
						}else{
							logger.consoleLog.info('typeof'+typeof(body));		
							if(typeof(body)=='string'){
								tokensBody = JSON.parse(body);															
							}	
							console.log('parent token status code '+response.statusCode);							
							if(response.statusCode == 200){
								let decodeJson = jwtDecode(tokensBody.access_token);
								let userInfo = {};
								let empId = (decodeJson.unique_name.indexOf('@')>0)?decodeJson.unique_name.split('@')[0]:decodeJson.unique_name;
								// constrcuting user info object
								userInfo.displayName = decodeJson.name;
								userInfo.empid = empId;
								userInfo.mail = decodeJson.upn;
								userInfo.user_name = decodeJson.upn;
								userInfo.displayName = decodeJson.name
								logger.consoleLog.info(decodeJson);
								userInfo.tokens = {};
								logger.consoleLog.info('Employee id '+empId)
								// function call for generate resource specific tokens														
								tokenOperations.generateTokens(tokensBody.refresh_token)																				
								.then(function(result){								
									result.forEach(function(token){
										userInfo.tokens = Object.assign(userInfo.tokens,token);	
									});
									logger.consoleLog.info('need to get user info for session');
									//console.log('get user session from PS Api calling');
									// function call for get user information from ps 
									return util.getUserSessionFromPSApi(empId,userInfo.tokens.ps)								
								})
								.then(function(result){								
										logger.consoleLog.info('user session needs to create');
										userInfo.userSession = result;
										//function call to create user session in redis
										return userSesControl.createUserSession(userInfo, empId)																															
								})
								.then(function(result){								
									if(params["teamsKey"]){
										return userSesControl.createUserSession(params["teamsKey"], empId)
									}else{
										return true;
									}
								})
								.then(function(resp){
									// sending google's token generate respose to back.
									logger.consoleLog.info('final response');
									logger.consoleLog.info(resp)
									resolve({code:response.statusCode,resp:body});
								})
								.catch(function(err){
									//console.log('error : ',err)
									reject({code:401,resp:body});
								})
							}else{
								console.log('status code not 200 because',body);
								reject({code:response.statusCode,resp:body});
							}														
						}
				});
			}catch(err){
				//console.log(err);
			}
			
		});
	},
	/*
		function call for refresh all tokens 
		this function refresh all expired tokens and update tokens and user infomation in redis.
	*/
	refreshAllTokens:function(params){
		return new Promise(function(resolve, reject){
			//console.log(params);
			let tokenUrlParams =  `client_id=${params.client_id}&grant_type=${params.grant_type}&refresh_token=${params.refresh_token}&client_secret=${encodeURIComponent(params.client_secret)}`;
			// hitting microsofts token endpoint to refresh google's token
			request.post(config.tokenEndpoint, {body:tokenUrlParams}, function(error,response,body){
				if(error){
					reject(error)
				}else{
					logger.consoleLog.info('typeof'+typeof(body));		
					if(typeof(body)=='string'){
						tokensBody = JSON.parse(body);															
					}	
					//console.log('status code '+response.statusCode,body);							
					if(response.statusCode == 200){
						let decodeJson = jwtDecode(tokensBody.access_token);
						let empId = (decodeJson.unique_name.indexOf('@')>0)?decodeJson.unique_name.split('@')[0]:decodeJson.unique_name;
						logger.consoleLog.info(decodeJson);
						logger.consoleLog.info('Employee id '+empId)
						userInfo = {};
						// function call to get user infomation from redis
						tokenOperations.getUserSession(empId)
						.then(function(result){
							//console.log(result)								
							if(result != false&&result!=null){
								userInfo = result;									
							}
							// function call to refresh resource specific tokens 
							return tokenOperations.generateTokens(tokensBody.refresh_token)																																														
						})				
						.then(function(result){
							userInfo.tokens = {};				
							result.forEach(function(token){
								userInfo.tokens = Object.assign(userInfo.tokens,token);	
							});		
							//console.log('userinfo',userInfo);
							/* if user session not available from redis, getting user information by
								hitting ps getEmployeeDetails api */
							if(typeof(userInfo.userSession)=='undefined'){
								return util.getUserSessionFromPSApi(empId,userInfo.tokens.ps)								
							}else{
								return userInfo.userSession;
							}														
						})							
						.then(function(result){				
							// calling function to overwrite user session in redis
							logger.consoleLog.info('user session needs to create');
							userInfo.userSession = result;																
							return userSesControl.createUserSession(userInfo, empId);																															
						})														
						.then(function(resp){
							// sending google's refreshed access token to google
							logger.consoleLog.info('final response');
							logger.consoleLog.info(resp)
							resolve({code:response.statusCode,resp:body});
						})
						.catch(function(err){
							//console.log(err)
							reject({code:401,resp:body});
						})							
					}else{
						reject({code:response.statusCode,resp:body});
					}														
				}
			});
		});
	},
	// function for refresh token
	refreshToken:function(refresh_token,scope){
		logger.consoleLog.info('\nrefreshToken');
		return new Promise(function(resolve, reject){
			//console.log('scope',scope,config.resourceScope[scope]);
			let tokenUrlParams =  `client_id=${process.env.AZCLIENT_ID.replace('\r','')}&grant_type=refresh_token&refresh_token=${refresh_token}&client_secret=${encodeURIComponent(process.env.AZCLIENT_SECRET.replace('\r',''))}&scope=${encodeURIComponent(config.resourceScope[scope])}`;
			//console.log(tokenUrlParams);
			//console.log(config.tokenEndpoint)
			request.post(config.tokenEndpoint,{body:tokenUrlParams},function(error,response,body){
				logger.consoleLog.info('\nrefresh token '+JSON.stringify(error)+' '+JSON.stringify(body));
				if(error){
					logger.consoleLog.info('\nerror at refresh token '+JSON.stringify(error));
					reject(error);
				}else{
					logger.consoleLog.info('\nstatus code at refreshToken '+response.statusCode);
					if(response.statusCode==200){
						body = JSON.parse(body)						
						let tokenResp = {};
						tokenResp[scope]=body.access_token;
						resolve(tokenResp);																	
					}else{						
						reject(false);
					}					
				}
			})
		})
	},
	// function for generate all resource specific token
	generateTokens : function(refreshToken){
		try{
			return new Promise(function(resolve, reject){	
				logger.consoleLog.info('inside generateTokens');		
				let microServices = Object.keys(config.resourceScope);
				let tokensGenerateFuncCalls=[];
				//console.log(config.resourceScope);
				// constructing function calls for generate resource specific tokens 
				microServices.forEach(function(service){				
					tokensGenerateFuncCalls.push(tokenOperations.refreshToken(refreshToken, service));
				});
				// calling all tokens gererate function calls asynchronously
				Q.allSettled(tokensGenerateFuncCalls)
				.then(function (results) {
					let c = 0;
					let tokensJson = [];
					results.forEach(function (result) {
						if (result.state === "fulfilled") {						
							c++;
							logger.consoleLog.info(result.value);
							tokensJson.push(result.value)
						} 
					});
					// once all tokens generated returning tokens to destination
					if(microServices.length == c){
						//console.log('all tokens generated');
						resolve(tokensJson);
					}else{
						reject({statusCode:401,errMsg:'Some tokens missed'});
					}	
				})
				.catch(function(err){
					//console.log(err);
				})
			});
		}catch(err){
			//console.log(err);
		}
		
	},
	//function to get user session from redis
	getUserSession:function(empId){
		return new Promise(function(resolve, reject){
			logger.consoleLog.info('inside checkResourceTokensExist');
			userSesControl.getUserSession(empId)
			.then(function(resp){
				resolve(resp)
			})
			.catch(function(err){
				resolve(false)
			})
		});
	}
}

module.exports = tokenOperations
