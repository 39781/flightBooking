var config 	= require(`./../config/config_${process.env.NODE_ENV}.json`);	
var logger		=	require('./../config/winston.js');

var userSessionController = function(client){
    this.cacheClient = client;
};



userSessionController.prototype.createUserSession = function(key, userSession){
	return new Promise((resolve, reject)=>{
		logger.consoleLog.info("\inside redis createUserSession")
		logger.consoleLog.info(userSession);
		logger.consoleLog.info("\n redis port "+parseInt(process.env.REDIS_PORT)+' ');			
		logger.consoleLog.info('userSession');
		logger.consoleLog.info(userSession);
		if(typeof(userSession)!="string"){
			userSession = JSON.stringify(userSession)
		}
        this.cacheClient.set(key, userSession)
        .then((cacheResp)=>{
            logger.consoleLog.info('create usersession response')
            logger.consoleLog.info(cacheResp);
            resolve(cacheResp);
        })
        .catch((err)=>{
            logger.errorLogs.info('create usersession error')
            logger.errorLogs.info(err);
            reject({statusCode:404,errMsg:err});
        })	
	});
}
userSessionController.prototype.updateTokensIntoRedis = function(newTokens, empId){
	return new Promise((resolve, reject)=>{
        this.cacheClient.get(key)
        .then((cacheResp)=>{
            //console.log('cacheResp',cacheResp);
            //console.log('newtokens',newTokens);
            if(cacheResp == null){
                cacheResp = "{empId:{}}";
            }
            cacheResp = JSON.parse(cacheResp);				
            keys = Object.keys(newTokens);
            keys.forEach((rsc)=>{
                cacheResp[rsc]=newTokens[rsc];
            });
            //console.log('new resp',cacheResp);
            return this.cacheClient.set(empId, JSON.stringify(cacheResp));
        })
        .then((userSession)=>{
            resolve(userSession);
        })
        .catch((err)=>{
            reject({statusCode:404,errMsg:err});
        });
	});
}

userSessionController.prototype.updateUserSession=function(key, userSession){
	return new Promise((resolve, reject)=>{
        this.cacheClient.get(key)
        .then((cacheResp)=>{
            cacheResp = JSON.parse(cacheResp);
            cacheResp = Object.assign(cacheResp, userSession);
            return this.cacheClient.set(key, JSON.stringify(cacheResp));
        })
        .then((userSession)=>{
            resolve(userSession);
        })
        .catch((err)=>{
            reject({statusCode:404,errMsg:err});
        })			
	});
}

userSessionController.prototype.getUserSession=function(key){	
	return new Promise((resolve, reject)=>{
        logger.consoleLog.info('key in getUserSession '+key);
        this.cacheClient.get(key)
        .then((cacheResp)=>{
            logger.consoleLog.info('getUserSession response')
            logger.consoleLog.info(cacheResp);
            resolve(JSON.parse(cacheResp));
        })
        .catch((err)=>{
            logger.errorLogs.info('getUserSession error')
            logger.errorLogs.info(err);
            reject({statusCode:404,errMsg:err});
        })
	});
}

userSessionController.prototype.deleteUserSession = function(key){
	return new Promise((resolve, reject)=>{
        this.cacheClient.remove(key)
        .then((cacheResp)=>{
            logger.consoleLog.info('deleteUserSession response')
            logger.consoleLog.info(cacheResp);
            resolve(JSON.parse(cacheResp));
        })
        .catch((err)=>{
            logger.errorLogs.info('deleteUserSession error')
            logger.errorLogs.info(err);
            reject({statusCode:404,errMsg:err});
        })
	})
}
module.exports = userSessionController;
