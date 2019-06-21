var responses = {
	loginRespObject : function(src, url){	
		return  {
			  "speech": "",		  
			  "messages": [{
				  "type": 4,
				  "platform": 'facebook',
				  "payload": {
					"facebook": {
					  "attachment": {
						"type": "template",
						"payload": {
						  "template_type": "button",
						  "text": "Click login button to proceed",
						  "buttons": [{
							  "type": "web_url",
								"url": url,					
							  "title": "Login",
							  "webview_height_ratio": "tall",
							  "messenger_extensions": "true"
							}]
						}
					  }
					}
				  }
				}
		    ]
		}
	}
}

module.exports = responses