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
router.get('/oauth/authorize',function(req, res){
	let url = `${config.authorizeEndpoint}?client_id=${process.env.AZCLIENT_ID.replace('\r','')}&response_type=code&redirect_uri=${encodeURIComponent(req.query.redirect_uri)}&prompt=consent&scope=${req.query.scope}&state=${req.query.state}`;
	if(req.query.client_id == process.env.AZCLIENT_ID){
		req.body.client_id = process.env.AZCLIENT_SECRET;
		req.body.client_secret = process.env.AZCLIENT_ID;
		///var url = config.authorizeEndpoint;		
		res.redirect(307,url);
	}
});
router.post('/oauth/token',function(req, res){
	//console.log(req.body);
	if(req.body.client_id == process.env.AZCLIENT_ID&&req.body.client_secret == process.env.AZCLIENT_SECRET){
		req.body.client_id = process.env.AZCLIENT_SECRET;
		req.body.client_secret = process.env.AZCLIENT_ID;
                req.body.scope='https://hexaware.com/V1';
		var url = config.tokenEndpoint;
		//console.log(url);
		res.redirect(307,url);
	}
});
router.get('/art/resetpassword', function (req, res) {
	////console.log(req.params,req.query);
	if(req.query.redirect_uri){
		let url = `${config.authorizeEndpoint}?client_id=${process.env.AZCLIENT_ID.replace('\r','')}&response_type=code&redirect_uri=${encodeURIComponent(req.query.redirect_uri)}&prompt=consent&scope=${req.query.scope}&state=${req.query.state}`;
		if(req.query.client_id == process.env.AZCLIENT_ID){
			req.body.client_id = process.env.AZCLIENT_SECRET;
			req.body.client_secret = process.env.AZCLIENT_ID;
			///var url = config.authorizeEndpoint;		
			res.redirect(307,url);
		}
	}else{
		let template		= require('./../art/resetpassword.js').template;		
		res.send(template);
		res.end();
	}
});

router.get('/art/changepassword', function (req, res) {	
	let template		= require('./../art/changepassword.js').template;		
	res.send(template);
	res.end();	
});

router.post('/', function (req, res) {
//	//console.log(JSON.stringify(req.body));
	return processRequest.loginCheck(JSON.parse(JSON.stringify(req.body)))
	.then(function(respObj){
		return processRequest.getUserSession(respObj)	
	})	
	.then(function(result){
		return processRequest.constructApiData(result)
	})
	.then(function(result){
		logger.consoleLog.info('after constructApiData result ',result)
		if(result.returnStatus){
			return result;
		}else{			
			return processRequest.process(result.body, result.token, result.api);
		}
	})
	.then(function(result){
		////console.log('final resp in route js before generate response ',JSON.stringify(result));
		if(result.resp.source){
			return result.resp;
		}else if(result.resp.followupEventInput){
			return result.resp
		}else{
			return responses[result.src].generateResponse(result.resp);
		}
	})
	.then(function(result){
		////console.log('final resp in route js',JSON.stringify(result));
		res.status(200);
		res.json(result).end();
	})
	.catch(function(err){
		//console.log('error ' ,err);	
		if(err.src){	
		return responses[err.src].generateResponse(err.resp)
		.then(function(resp){
			//console.log(JSON.stringify(resp));			
			res.status(200);	
			res.json(resp).end();			
		
		})
		}else{
			res.json({}).end();	
		}		
		logger.errorLogs.info('error captured in routes.js catch')
		logger.errorLogs.info(err);
		if(err.src){		
		    return responses[err.src].generateResponse(err.resp)
				.then(function(resp){
				////console.log(JSON.stringify(resp));
				res.status(200);	
				res.json(resp).end();
		   })	
		}else{

			res.json({}).end();	
		}	
	})
		
});





module.exports = router;




