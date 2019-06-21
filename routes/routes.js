var express 		= require('express');
var router			= express.Router();	 
var fs 				= require("fs");	
var request			= require('request');
var path			= require("path");	
var processRequest	= require('./../handlers/mainHandler.js');	
var responses		= require('./../responses/response.js');	






// middleware function for check request came from authorized source(dialogflow) or not.
var checkAuthorization = function(req, res, next){
	//console.log(req.headers,req.body);
	if(req.headers.authorization){
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

router.post('/webhook',  checkAuthorization, function (req, res) {		
	console.log(JSON.stringify(req.body));
	processRequest.flightBookOrCancel(req.body)				
	.then(function(result){															
		return responses[result.src].generateResponse(result.resp);				 																					// from generic response
	})
	.then(function(result){														
		res.status(200);
		res.json(result).end();
	})
	.catch(function(err){														
		if(err.src){				
			return responses[err.src].generateResponse(err.resp)
				.then(function(resp){	
				res.status(200);	
				res.json(resp).end();
			})	
		}else{
			res.json({}).end();	
		}	
	})
	
});





module.exports = router;




