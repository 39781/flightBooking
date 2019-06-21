var logger			= require('./../config/winston.js');
var menuConfig = require('./../config/menusMsgConfig.json');


var responseObj = {	  	  
	  "payload": {
		"google": {			
		  "expectUserResponse": true,
		  "richResponse": {
			"items": [],
			"suggestions":[]
		  }		 
		}
	  }
	}
	
var responses = {
	
	unAuthorizedPerson:function(){
		var resp = JSON.parse(JSON.stringify(responseObj));
		resp.payload.google.expectUserResponse=false;
		resp.payload.google.richResponse.items = [
				  {
					"simpleResponse": {
					  "displayText": menuConfig[unauthorizeMsg],
					  "textToSpeech":menuConfig[intentName]
					}
				  }				  						
			];
		return resp; 
	},
	simpleResponseWithPromise : function(intentName,type){
		return new Promise(function(resolve, reject){
			var resp = JSON.parse(JSON.stringify(responseObj));			
			resp.payload.google.richResponse.items = [
				  {
					"simpleResponse": {
					  "displayText": menuConfig[intentName][type],
					  "textToSpeech":menuConfig[intentName][type]
					}
				  }				  						
			];
			resp.payload.google.richResponse.suggestions =	menuConfig[intentName].chips;			
			logger.consoleLog.info(resp);
			resolve(resp);
		});
	},
	simpleResponse : function(intentName,type){
			var resp = JSON.parse(JSON.stringify(responseObj));			
			resp.payload.google.richResponse.items = [
				  {
					"simpleResponse": {
					  "displayText": menuConfig[intentName][type],
					  "textToSpeech":menuConfig[intentName][type]
					}
				  }				  						
			];
			menuConfig.mainMenuChips.forEach(function(chip){
				resp.payload.google.richResponse.suggestions.push({"title":chip.title});
			})
			 
		logger.consoleLog.info(resp);
		return resp;
	},
	generateResponse:function(res){
		logger.consoleLog.info(res);
		return new Promise(function(resolve, reject){			
			var resp = JSON.parse(JSON.stringify(responseObj));
			if(res.signIn){
				simpleResp(resp, res)
				.then(function(result){
					logger.consoleLog.info(' resp from simple resp ',result.resp);
					result.resp.outputContexts = [
						{
						  "name": res.contextName,
						  "lifespanCount": 99,
						  "parameters": {
							"data": "{}"
						  }
						}
					];
					result.resp.payload.google.userStorage= "{\"data\":{}}";
					result.resp.payload.google.systemIntent = {
						"intent": "actions.intent.SIGN_IN",
						"data": {
						  "@type": "type.googleapis.com/google.actions.v2.SignInValueSpec",
						  "optContext":res.optContext
						}
					  }
					resolve(result.resp);					
				})				  
			}else{
				if(typeof(res.contextOut)!='undefined'&&res.contextOut.length>0){
					resp.outputContexts = res.contextOut;
				}
				simpleResp(resp, res)
				.then(function(result){
					logger.consoleLog.info(' resp from simple resp ',result.resp);
					return basicCardResp(result.resp, result.res);	
				})
				.then(function(result){
					logger.consoleLog.info('resp from basicCars',result.resp);				
					return listResp(result.resp, result.res)
				})
				.then(function(result){
					if(result.res.chips){
						logger.consoleLog.info(' chips ',result.res.chips)
						result.res.chips.forEach(function(chip){
							////console.log(chip.title);
							result.resp.payload.google.richResponse.suggestions.push({"title":chip.title});
						})					
					}
					if(result.res.exit){
						result.resp.payload.google.expectUserResponse = false;
					}					
					logger.consoleLog.info('resp from list',result.resp);				
					resolve(result.resp);
				})
				.catch(function(err){
					logger.errorLogs.info('error in generate response');
					logger.errorLogs.info(err);
					resp = JSON.parse(JSON.stringify(responseObj));			
					resp.payload.google.richResponse.items = [
						  {
							"simpleResponse": {
							  "displayText": menuConfig["technicalIssue"],
							  "textToSpeech":menuConfig["technicalIssue"]
							}
						  }				  						
					];
					menuConfig.mainMenuChips.forEach(function(chip){
						resp.payload.google.richResponse.suggestions.push({"title":chip.title});
					})
					resolve(resp);
				})
			}
		})
	}
}

var simpleResp = function(responseObj, res){
	return new Promise(function(resolve, reject){
		logger.consoleLog.info('res.simpleText',res.simpleText);
		if(res.simpleText){
			logger.consoleLog.info('inside if',res.simpleText);
			res.simpleText.forEach(function(simResp){
				let simpTxt = {
					"simpleResponse": {
					  "displayText": "",
					  "textToSpeech":""
					}
				  };					
				  logger.consoleLog.info('inside if',res.simResp);
				if(simResp.text&&simResp.speech){
					simpTxt.simpleResponse.displayText = simResp.text;
					simpTxt.simpleResponse.textToSpeech = simResp.speech;
				}else if(simResp.speech){
					simpTxt.simpleResponse.displayText = simResp.speech;					
					simpTxt.simpleResponse.textToSpeech = simResp.speech;
				}else{
					simpTxt.simpleResponse.displayText = simResp.text;
					simpTxt.simpleResponse.textToSpeech = simResp.text;
				}
				if(simResp.ssml){
					simpTxt.simpleResponse.ssml = simResp.ssml;
				}
				//logger.consoleLog.info('res.simpleText',simpTxt);
				responseObj.payload.google.richResponse.items.push(simpTxt);				
			});
			resolve({"resp":responseObj,"res":res});	
		}else{
			resolve({"resp":responseObj,"res":res});
		}	
	})
}

var listResp = function(responseObj, res){
	return new Promise(function(resolve, reject){
		logger.consoleLog.info('list resp list ', res.list);		
		if(res.list){
			responseObj.payload.google.systemIntent = {
				"intent": "actions.intent.OPTION",
				"data": {
					"@type": "type.googleapis.com/google.actions.v2.OptionValueSpec",
					"listSelect": {
					  "title": res.list.title,
					  "items": []
					}
				}
			}			
			res.list.items.forEach(function(item){
				responseObj.payload.google.systemIntent.data.listSelect.items.push({
				  "optionInfo": {
					"key": (item.postback&&item.postback.length>0)?item.postback:item.title,
					"synonyms": item.synonyms
				  },
				  "title": item.title,					  
				  "description": item.subTitle,
				});
			})
			logger.consoleLog.info('list resp obj',responseObj);
			resolve({"resp":responseObj,"res":res});
		}else{
			logger.consoleLog.info('list resp obj',responseObj);
			resolve({"resp":responseObj,"res":res});
		}	
	});
}

var basicCardResp = function(responseObj, res){
	return new Promise(function(resolve, reject){
		logger.consoleLog.info('res.card',res.card);
		if(res.card){
			logger.consoleLog.info('inside card');
			var bCard = {"basicCard": {}};
			if(res.card.title){
				bCard.basicCard.title = res.card.title;
				if(res.card.formattedText&&res.card.formattedText.length>0){
					bCard.basicCard.formattedText = res.card.formattedText;
				}
				if(res.card.subTitle&&res.card.subTitle.length>0){
					bCard.basicCard.subtitle = res.card.subTitle;
				}					
					
				logger.consoleLog.info('card 1');
				if(res.card.image&&res.card.image.url.length>0){
					bCard.basicCard.image = {};
					bCard.basicCard.image = {};	
					bCard.basicCard.image.url = res.card.image.url;
					bCard.basicCard.image.imageDisplayOptions = "CROPPED";
					bCard.basicCard.image.accessibilityText = res.card.image.altText;
				}
				logger.consoleLog.info('card 2');
				if(res.card.buttons){
					bCard.basicCard.buttons=[];
					res.card.buttons.forEach(function(button){
						let btn={};
						if(button.title.length>0){
							btn.title = button.title;
						}
						if(button.url.length>0){
							btn.openUrlAction ={url: button.url};							
						}
						bCard.basicCard.buttons.push(btn);		
					})
				}
				logger.consoleLog.info('card 3');
				logger.consoleLog.info(bCard);
				responseObj.payload.google.richResponse.items.push(bCard);
				resolve({"resp":responseObj,"res":res});
			}else{
				resolve({"resp":responseObj,"res":res});
			}				
		}else{
			resolve({"resp":responseObj,"res":res});
		}
	});
}

	
module.exports = responses