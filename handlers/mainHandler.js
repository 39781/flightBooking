var config		=	require('./../config/ticket.json');
var msgConfig	=	require('./../config/menusMsgConfig.json');

var mainHandler = {};


// function to get user session from redis
mainHandler.process = function(reqBody){
	return new Promise((resolve, reject)=>{
		console.log('action',reqBody.queryResult.action);
		mainHandler[reqBody.queryResult.action](reqBody)
		.then((resp)=>{
			resolve(resp);
		})
		.catch((err)=>{
			reject(err);
		})
	})
}

mainHandler.flightBooking = function(reqBody){
	return new Promise((resolve, reject)=>{
			console.log('inside flight Booking');
		let response = {};
		let flightsInfo = [...config.flightDetails];
		let params = reqBody.queryResult.parameters;
		console.log(params);
		if(params.dateOfTravel.length<=0){
			response = {
				simpleText:[{
					text:"Please provide date of travel?",
					speech:"Please provide date of travel?"
				}]
			}
		}else if(params.departure.length<=0){
			response = {
				simpleText:[{
					text:"Please select departure?",
					speech:"Please select departure?"
				}],
				chips:[]
			}
			for(let flight of flightsInfo){	
				response.chips.push({
					title:flight.From,
					type:"",
					postback:flight.From
				})
			}
		}else if(params.destination.length<=0){
			response = {
				simpleText:[{
					text:"Please select destination?",
					speech:"Please select destination?"
				}],
				chips:[]
			}
			for(let flight of flightsInfo){	
				if(params.departure != flight.To){
					response.chips.push({
						title:flight.To,
						type:"",
						postback:flight.To
					})
				}
			}
		}else {
			console.log("getting flights information");
			for(let i in flightsInfo){
				console.log(flightsInfo[i].From  , params.departure,flightsInfo[i].To ,params.destination)
				if(flightsInfo[i].From  != params.departure&&flightsInfo[i].To != params.destination){
					flightsInfo.splice(i,1);
				}
			}
			console.log(flightsInfo.length);
			if(flightsInfo.length>1){
				response.list = {
					title:"List of flight available from "+params.departure + " to "+params.destination,
					items:[]
				}
				for(let flight of flightsInfo){
					let key = params.departure + " - "+params.destination;
					items.push({								  
						"postback": key,
						"synonyms": [
							key
						],
						"title": key,					  
						"subTitle": "Click to Book",
						//Location : "+body.value[0].location.displayName+" Date : "+startDate.toLocaleDateString()+"  \nStart Time : "+startDate.toLocaleTimeString()+"  \nEnd Time : "+endDate.toLocaleTimeString()+"  \nLocation : " +meeting.location.displayName
					})
				}
			}else if(flightsInfo.length){
				response.card ={			
						"title": "flight available from "+params.departure + " to "+params.destination,
						"formattedText": "Click below chip to book flight ",
				}
				response.chips=[{
					title:"Click to Book",
					type:"",
					postback:"Click to Book"
				}]
			}else{
				response={
					simpleText : [{
						"text":"Sorry Currently flight not available from "+params.departure + " to "+params.destination,
						"speech":"Sorry Currently flight not available from "+params.departure + " to "+params.destination
					}],
					chips:[
						{
							postback:"Booking Flights",
							type:"",
							title:"Booking Flights"
						},
						{
							postback:"Cancel Flights",
							type:"",
							title:"Cancel Flights"
						}
					]
				}
				for(let context of reqBody.queryResult.outputContexts){
					context.lifespanCount = 0;
				}
				response.contextOut = reqBody.queryResult.outputContexts;
			}
		}
		console.log(JSON.stringify(response))
		resolve({src:reqBody.originalDetectIntentRequest.source,resp:response});
	})
}
module.exports = mainHandler