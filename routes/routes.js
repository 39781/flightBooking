var express 		= require('express');
var router			= express.Router();	 
var fs 				= require("fs");	
var request			= require('request');
var path			= require("path");	
var processRequest	= require('./../handlers/mainHandler.js');
var tokenOpts 		= require('./../utilities/azureTokenUtil.js');
var msgConfig		= require('./../config/menusMsgConfig.json');
var utilities		= require('./../utilities/utilities.js');
var config			= require('./../config/config_'+process.env.NODE_ENV.replace('\r','')+'.json');	
var MobileDetect	= require('mobile-detect');
var logger			= require('./../config/winston.js');
var jwtDecode 		= require('jwt-decode');
var chatResp		= require('./../handlers/chatResponses.js');		
var responses		= require('./../responses/response.js');	





router.get('/', function (req, res) {	
	res.send('testing');
	res.end();
});

router.get('/art/unlockaccount', function (req, res) {
	//console.log(req.params,req.query);

})
router.get('/art/resetpassword', function (req, res) {	
	let template		= require('./../art/resetpassword.js').template;		
	res.send(template);
	res.end();
});

router.get('/art/changepassword', function (req, res) {		
	let template		= require('./../art/changepassword.js').template;		
	res.send(template);
	res.end();	
});

router.get('/art/resetpassword1', function (req, res) {
	////console.log(req.params,req.query);
	let template		= require('./../art/resetpassword1.js').template;		
	res.send(template);
	res.end();	
});

router.get('/art/enroll', function (req, res) {
	let template		= require('./../art/enrollment.js').template;		
	res.send(template);
	res.end();		
});

router.get('/employeedetails/phonecall', function(req,res){	
	let mobileNo=req.query.mobileNo;
		//////console.log("Call MobNo: ",mobileNo,req.params);
	logger.consoleLog.info("Call MobNo: ",mobileNo,req.query);
	res.redirect("tel:"+mobileNo);	
}); 

router.get('/art/:redirectPageName/:sessionId',function(req, res){
	////console.log('get page');
	let page;
	switch(req.params.redirectPageName){
		case 'chagePassword':page='changePassword.html';break;
		case 'enrollment':page='enrollment.html?sessionId='+req.params.sessionId;break;
		case 'resetPassword':page='resetAccount.html?sessionId='+req.params.sessionId;break;
		case 'resetMobileOtp':page='resetAccount1.html?sessionId='+req.params.sessionId;break;
	}	
})

router.post('/authorize/generatetoken',function(req, res){	
	//console.log("req.body",req.body);
})

//oauth authorize endpoint 
router.get('/oauth/authorize',function(req, res){
	//console.log('auth point');
	//contructing microsoft /authorize end point
	let url = `${config.authorizeEndpoint}?client_id=${process.env.AZCLIENT_ID.replace('\r','')}&response_type=code&redirect_uri=${encodeURIComponent(req.query.redirect_uri)}&prompt=consent&scope=${req.query.scope}&state=${req.query.state}`;
	logger.consoleLog.info(req.query.client_id+' '+process.env.AZCLIENT_ID+' '+req.query.client_id == process.env.AZCLIENT_ID);			
		res.redirect(307,url);	
});

//oauth token endpoint : generates access token as well as refresh tokens 
router.post('/oauth/token',function(req, res){
	try{
		logger.consoleLog.info('body in /token');
		logger.consoleLog.info(req.body);
		let tokenFunc;
		// condition check for generate access token or refresh token
		if(req.body.code){
			logger.consoleLog.info('resource tokens generating');
			tokenFunc = tokenOpts.createUserSession; // function for generate access token
		}else{
			logger.consoleLog.info('resource tokens refreshing');
			tokenFunc = tokenOpts.refreshAllTokens; // function for refresh tokens
		}
		req.body.client_id = process.env.AZCLIENT_ID.replace('\r','');
		req.body.client_secret = process.env.AZCLIENT_SECRET.replace('\r','');
		tokenFunc(req.body)
		.then(function(result){
			logger.consoleLog.info('token response to google');
			logger.consoleLog.info(result);
			res.status(result.code);
			res.send(result.resp).end();
		})
		.catch(function(err){
			//console.log('token response to google',err);
			res.status(err.code);
			res.send(err.resp).end();
		})
	}catch(err){
		//console.log(err);
	}
});


router.get('/art/changepassword', function (req, res) {	
	let template		= require('./../art/changepassword.js').template;		
	res.send(template);
	res.end();	
});


// middleware function for check request came from authorized source(dialogflow) or not.
var checkAuthorization = function(req, res, next){
	//console.log(req.headers,req.body);
	if(req.body.source == 'artwebview'){
		next();
	}else if(req.headers.authorization){
			var authCode = req.headers.authorization.replace("Bearer ","");			
			if(authCode == process.env.dialogFlowKey){
				//console.log("Authorized");
				next();
			}else{
				const err = new Error('not Authorized');
				err.status = 401;
				next(err);
			}
	}else{
		const err = new Error('not Authorized');
			err.status = 401;
			next(err);
	}
}


// webhook fulfillment end point for dialogflow

router.post('/', checkAuthorization, function (req, res) {		
	console.log(JSON.stringify(req.body));
		processRequest.checkUserAuthorization(req.body)
		.then(function(result){
			return processRequest.getMicroserviceDetails(result.body, result.tokens)
		})					
		.then(function(result){
			return processRequest.checkMicroServiceStatus(result.body);
		})
		.then(function(result){		
			return processRequest.buildApiInputObject(result)								// construting data object from resource
		})
		.then(function(result){							
			logger.consoleLog.info('after constructApiData result ')
			logger.consoleLog.info(result)
			if(result.returnStatus){			
				return result;
			}else{			
				return processRequest.process(result.body, result.token, result.api);	// calling resource 
			}
		})
		.then(function(result){															// final generic response
			if(result.resp.statusCode&&result.resp.statusCode == 401){
				console.log(result);
				res.status(401);
				res.json(result.resp).end();
			}else if(result.resp.source){
				return result.resp;
			}else if(result.resp.followupEventInput){
				return result.resp
			}else{
				return responses[result.src].generateResponse(result.resp);				// generating channel specific response 		
			}																			// from generic response
		})
		.then(function(result){															// sending response back to dialogflow
			res.status(200);
			res.json(result).end();
		})
		.catch(function(err){															// exception handler
			logger.errorLogs.info('error captured in routes.js catch')
			logger.errorLogs.info(err);
			if(err.src){		
					if(err.logout){
						res.status(401);						
					}else{
						res.status(200);	
					}			
				return responses[err.src].generateResponse(err.resp)
					.then(function(resp){
					////console.log(JSON.stringify(resp));				
					res.json(resp).end();
			})	
			}else{
				res.json({}).end();	
			}	
		})

	
	
		
});





module.exports = router;




