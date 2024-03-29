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
		let flightsDetails = [...config.flightDetails];
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
			for(let flight of flightsDetails){	
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
			for(let flight of flightsDetails){	
				if(params.departure != flight.To){
					response.chips.push({
						title:flight.To,
						type:"",
						postback:flight.To
					})
				}
			}
		} else if(params.filterCriteria.length<=0){
			response = {
				simpleText:[{
					text:"Please choose which type of flights you are looking?",
					speech:"Please choose which type of flights you are looking?"
				}],
				chips:[{
					title:"Cheaper",
					type:"",
					postback:"Cheaper"
				},
				{
					title:"Fastest",
					type:"",
					postback:"Fastest"
				},
				{
					title:"Direct",
					type:"",
					postback:"Direct"
				},
				{
					title:"All",
					type:"",
					postback:"All"
				}
			]}
		}else {

			console.log("getting flights information");
			flightsInfo = [];
			params.dateOfTravel = dateConvert(params.dateOfTravel);
			for(let i in flightsDetails){
				if(params.dateOfTravel == flightsDetails[i].Date&&flightsDetails[i].From  == params.departure&&flightsDetails[i].To == params.destination){
					
					if(flightsDetails[i].Connection == "True"&&params.filterCriteria == 'Cheaper'){
						flightsInfo.push(flightsDetails[i]);
					}else if(flightsDetails[i].Connection == "False"&&["Direct","Fastest"].indexOf(params.filterCriteria)>=0){
						flightsInfo.push(flightsDetails[i]);
					}else{
						flightsInfo.push(flightsDetails[i]);
					}
					
				}
			}
			console.log(flightsInfo.length);
			if(flightsInfo.length>1){
				response.simpleText=[{
					text:"Please select flight to book?",
					speech:"Please select flight to book?"
				}],
				response.list = {
					title:"List of flight available from "+params.departure + " to "+params.destination,
					items:[]
				}
				for(let flight of flightsInfo){
				//	console.log(flight);
					let key = "Flight No : "+flight["Flight No"]+",\r\n  \n"+flight["Airlines"]
					response.list.items.push({								  
						"postback": key ,
						"synonyms": [
							key
						],
						"title": key,					  
						"subTitle": "Connection : "+flight["Connection"]+"\r\n  \nClick to Book",
						//Location : "+body.value[0].location.displayName+" Date : "+startDate.toLocaleDateString()+"  \nStart Time : "+startDate.toLocaleTimeString()+"  \nEnd Time : "+endDate.toLocaleTimeString()+"  \nLocation : " +meeting.location.displayName
					})
				}
			}else if(flightsInfo.length){
				response.simpleText=[{
					text:"Please select flight to book?",
					speech:"Please select flight to book?"
				}],
				response.card ={			
						"title": "flight available from "+params.departure + " to "+params.destination+ ", Flight No : "+flightsInfo[0]["Flight No"],
						"formattedText": "Click below chip to book flight ",
				}
				response.chips=[{
					title:"Book flight no : "+flightsInfo[0]["Flight No"],
					type:"",
					postback:"Book flignt no : "+flightsInfo[0]["Flight No"]
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

mainHandler.flightBookingInformation = function(reqBody){
	return new Promise((resolve, reject)=>{
		//console.log(JSON.stringify(reqBody));
		for(let context of reqBody.queryResult.outputContexts){
			if(context.name.indexOf('flightbooking-followup')>=0){
				reqBody.queryResult.parameters = Object.assign(reqBody.queryResult.parameters,context.parameters);
			}
		}
		console.log(reqBody.queryResult.parameters);
		resolve({
			followupEventInput:{
				name:"flightBookingConfirmation",
				parameters:reqBody.queryResult.parameters
			}
		})
		
	});
}
mainHandler.defaultFallbackIntent = function(reqBody){
	return new Promise((resolve, reject)=>{
		console.log(JSON.stringify(reqBody.outputContexts));
	});
}

mainHandler.FlightBookingConfirmationYes = function(reqBody){
	return new Promise((resolve, reject)=>{
		console.log(JSON.stringify(reqBody.queryResult.outputContexts));
		for(let context of reqBody.queryResult.outputContexts){
			if(context.name.replace(/-/ig,'').match(/(^|\W)flightbookingconfirmation($|\W)/ig)){
				console.log(JSON.stringify(context.parameters));
				let response = {
					simpleText:[{
						text:"Your flight booking confirmed",
						speech:"Your flight booking confirmed"
					}],
					card : {			
						"title": "Booking No : BHP"+Math.floor(Math.random()*90000) + 10000,
						"subTitle":context.parameters.option,
						"formattedText": "**Date** "+context.parameters.dateOfTravel+"\r\n  \n**Departure** : "+context.parameters.departure+"\r\n  \n**Destination** : "+context.parameters.destination+"\r\n  \n**Name** : "+context.parameters.name+"\r\n  \n**Mobile** : "+context.parameters.mobile+"\r\n  \n**Id Number** : "+context.parameters.IdNumber
					},
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
				};
				resolve({src:reqBody.originalDetectIntentRequest.source,resp:response});
				
				break;
			}
		};

	});
}
function dateConvert(cdate) {

    if(cdate.indexOf('/')&&cdate.length<=10){
        return cdate;
    }else{
        if (cdate.indexOf("T") > -1) {
           cdate = cdate.split("T");
           cdate = cdate[0]
         }
        cdate = cdate.split("-");
        var stDate = cdate[2] + "/" + cdate[1] + "/" + cdate[0];
        return stDate;

    }
    
}
module.exports = mainHandler