var config		=	require('./../config/ticket.json');
var msgConfig	=	require('./../config/menusMsgConfig.json');

var mainHandler = {};


// function to get user session from redis
mainHandler.process = function(reqBody){
	return new Promise((resolve, reject)=>{
		mainHanler[reqBody.queryResult.action](reqBody)
		.then((resp)=>{

		})
		.catch((err)=>{

		})
	})
}

mainHandler.flightBooking = function(reqBody){
	return new Promise((resolve, reject)=>{
		let response = {
			simpleText:[{
				text:"Please select flight to book?",
				speech:"Please select flight to book?"
			}]
		}
		let flightsInfo = [...config.flightDetails];
		let params = reqBody.queryResult.parameters;
		for(let i in flightsInfo){
			
			if(flightsInfo[i].From  == params.departure&&flightsInfo[i].To == params.destination){
				flightsInfo.splice(i,1);
			}
		}
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
		resolve(response);
	})
}
module.exports = mainHandler