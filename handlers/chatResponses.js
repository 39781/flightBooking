var logger 		=	require('./../config/winston.js');
var config = require('./../config/config_'+process.env.NODE_ENV.replace('\r','')+'.json');
var menuConfig = require('./../config/menusMsgConfig.json');

var responses = {
	signIn:function(msgs,optContxt,contxtName){
		return new Promise(function(resolve, reject){
			//console.log(msgs);
			//console.log(optContxt);
			//console.log(contxtName);
			let genericeResponse = {
				simpleText:[],
				signIn:true,
				contextName:contxtName,
				optContext:optContxt
			}
			msgs.forEach(function(msg){			
				genericeResponse.simpleText.push(msg);			
			})
			//console.log(JSON.stringify(genericeResponse));
			resolve(genericeResponse);
		});
	},
	thankYou:function(msgs, yesNo, contexts){
		let genericeResponse = {
			simpleText:[],
			chips:[],
			returnStatus:true
		};
		msgs.forEach(function(msg){			
			genericeResponse.simpleText.push(msg);			
		})				
		if(yesNo == 'yes'){
			genericeResponse.chips =	menuConfig.logoutChips;
		}else if(yesNo == 'no'){
			genericeResponse.exit = true;
		}else if(yesNo != 'no'){
			genericeResponse.chips =	menuConfig.thankYouChips;
		}
		if(contexts){
			genericeResponse.contextOut = contexts;
		}
		//console.log('thankYou',JSON.stringify(genericeResponse));
		return genericeResponse;
	},
	botCapabilities:function(capType, contexts){
		var resp = JSON.parse(JSON.stringify(config.responseObj));
		let genericeResponse = {
			simpleText:[],
			chips:[],
			returnStatus:true
		};
		logger.consoleLog.info('\nbotCapabilites response generating');			
		genericeResponse.simpleText = [
			{
				"text": menuConfig.botCapabilities.general.mainMsg,
				"speech":menuConfig.botCapabilities.general.mainMsg
				
			},
			{
				"text": menuConfig.botCapabilities.general.Description+"\r\n  \n"+menuConfig.botCapabilities.general.tipNote,
				"speech": menuConfig.botCapabilities.general.Description+"\r\n  \n"+menuConfig.botCapabilities.general.tipNote
			}
		];
		genericeResponse.chips =	menuConfig.mainMenuChips;
		genericeResponse.contextOut = contexts;
		return genericeResponse;
	},
	loginObject : function(msgs,contexts){
		let genericeResponse = {
			simpleText:[],
			chips:[],
			returnStatus:true,
			exit:true
		};		
		msgs.forEach(function(msg){			
			genericeResponse.simpleText.push(msg);			
		});
		logger.consoleLog.info(JSON.stringify(genericeResponse));
		genericeResponse.contextOut = contexts;
		return genericeResponse;
	},
	mainMenu : function(msgs, contexts){		
		return new Promise(function(resolve, reject){
			let genericeResponse = {
				simpleText:[],
				chips:[],
				returnStatus:true
			};		
			msgs.forEach(function(msg){			
				genericeResponse.simpleText.push(msg);			
			});
			genericeResponse.chips =	menuConfig.logoutChips;			
			logger.consoleLog.info(JSON.stringify(genericeResponse));
			if(contexts.length>0){
				genericeResponse.contextOut = contexts;
			}			
			resolve(genericeResponse);
		})			
	},
	mainMenu2 : function(msgs, contexts){		
		return new Promise(function(resolve, reject){
			let genericeResponse = {
				simpleText:[],
                chips:[],
                card : {
                    "title":"Please click the logout button"
                     ,"subTitle": ""
                     ,"formattedText": "After clicking logout button scroll down till you find Unlink button and click it."
                     ,"image": {
                      "url":  ""
                      ,"altText":""
                    },
                    "buttons": [
                      {
                        "title": "Logout"
                      , "url": "https://assistant.google.com/services/a/uid/000000f6d6ae81e8?hl=en"
                      , "postback":""
                      }
                    ]
                  },
                
				returnStatus:true
			};		
			msgs.forEach(function(msg){			
				genericeResponse.simpleText.push(msg);			
			});
			genericeResponse.chips =	menuConfig.logoutChips;			
			logger.consoleLog.info(JSON.stringify(genericeResponse));
			if(contexts.length>0){
				genericeResponse.contextOut = contexts;
			}			
			resolve(genericeResponse);
		})			
	},

	/*mainMenu : function(msgs, contexts){
		
			let genericeResponse = {
				simpleText:[],
				chips:[],
				returnStatus:true
			};		
		msgs.forEach(function(msg){			
			genericeResponse.simpleText.push(msg);			
		});
		genericeResponse.chips =	menuConfig.logoutChips;			
		logger.consoleLog.info(JSON.stringify(genericeResponse));
		genericeResponse.contextOut = contexts;
		return genericeResponse;
	},*/
	feedback : function(body, msgs, contexts){
		let genericeResponse = {
			simpleText:[],
			chips:[],
			returnStatus:true
		};
		msgs.forEach(function(msg){			
			genericeResponse.simpleText.push(msg);			
		});
		genericeResponse.chips =	menuConfig.mainMenuChips;			
		logger.consoleLog.info("logging feedback");
		logger.feedbk.info("EmpID : "+body.userSession.employeeId+" name : "+body.displayName+" mail : "+body.mail+" feedback : "+body.entityName.feedback);
		genericeResponse.contextOut = contexts;
		return genericeResponse;
	},
	reportIssue : function(body, msgs, contexts){
		let genericeResponse = {
			simpleText:[],
			chips:[],
			returnStatus:true
		};
		msgs.forEach(function(msg){			
			genericeResponse.simpleText.push(msg);			
		});
		genericeResponse.chips =	menuConfig.mainMenuChips;			
		logger.consoleLog.info("logging report issue");
		logger.reportIssue.info("EmpID : "+body.userSession.employeeId+" name : "+body.displayName+" mail : "+body.mail+" issue : "+body.entityName.issue);
		genericeResponse.contextOut = contexts;
		return genericeResponse;
	}	
}
	
module.exports = responses