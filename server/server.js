/*
*/

//$ sudo node server.js --instanceNumber=[number] &
var fs = require('fs');
var log4js = require('log4js');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var	uuid = require('node-uuid');
var when = require('when');
var redis = require('socket.io-redis');
var argv = require('minimist')(process.argv.slice(2));
var http = require('http');
var https = require('https');
var _ = require('underscore')._ ;
var	forge = require('node-forge')({disableNativeCode: true});
var serveStatic = require('serve-static');  // serve static files
var easyrtc = require('easyrtc');

var config 			= require('./lib/Config.js');
var Broker			= require('./lib/BrokerOfVisibles.js');
var PostMan			= require('./lib/PostMan.js');
var Message			= require('./lib/Message.js');
var paypal 			= require('./lib/Paypal.js');

var conf = config.instance[ parseInt(argv.instanceNumber) ];
log4js.configure({
  appenders: [
	  {
	      type: 'file',
	      filename:  __dirname + "/log/instance_" + argv.instanceNumber + ".log" ,
	      maxLogSize: 1024*40,
	      backups: 10,
	      category: 'LOG',
	      reloadSecs: 86400
	  }
  ]
});
var logger = log4js.getLogger('LOG');
logger.setLevel('DEBUG');
logger.info('starting instance: ' + argv.instanceNumber);

var app = express();
var webServer;

webServer = http.createServer(app);

var	io = require("socket.io")(webServer);
var	broker = new Broker(io, logger);
var	postMan = new PostMan(io, logger, parseInt(argv.instanceNumber) );


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static( __dirname + '../client'));
app.use(serveStatic('static', {'index': ['index.html']}));

app.post('/payment', function (req, res) {

	try {
		if ( ! postMan.isPurchase (req.body.purchase) ) return;
		if ( ! postMan.isUUID(req.body.handshakeToken) ) return;

		var purchase = req.body.purchase;
		var amount = 0;

		if(purchase.isCoffeeChecked == "true") amount = amount + 1;
		if(purchase.isBeerChecked == "true") amount = amount + 3;
		if(purchase.isHamburgerChecked == "true") amount = amount + 6;
		if(purchase.isBillChecked == "true") amount = amount + 40;

		var answer = {
			OK : true,
			URL : ""
		};

		var payment = paypal.init(
			config.paypal.username,
			config.paypal.password,
			config.paypal.signature,
			config.paypal.returnURL,
			config.paypal.cancelURL,
			false // debug = true
		);
		var timestamp = new Date().getTime();
		var invoiceNumber = req.body.handshakeToken + "_" + timestamp;

		payment.pay( invoiceNumber ,  amount, 'Knet', 'EUR', function(err, url) {

		    if (err) {
		        logger.error(err);
		        answer.OK = false;
		        res.json( answer );
		    }else{
		    	answer.URL = url;
		    	res.json( answer );
		    }
		});

	}catch (ex) {
		logger.error("post/payment  :::  exceptrion thrown " + ex  );
	}
});

app.get('/successPayment', function (req, res) {

	if ( ! postMan.isPaypalToken (req.query.token) ) return;
	if ( ! postMan.isPaypalPayer(req.query.PayerID) ) return;

	var options = {
		root: __dirname + '/../client/htm/',
		dotfiles: 'deny',
		headers: {
        	'x-timestamp': Date.now(),
        	'x-sent': true
		}
	};

	var fileName = 'successPayment.html';

	res.sendFile(fileName, options, function (err) {
	    if (err) {
	      logger.error(err);
	      res.status(err.status).end();
	    }
	});

	var payment = paypal.init(
		config.paypal.username,
		config.paypal.password,
		config.paypal.signature,
		config.paypal.returnURL,
		config.paypal.cancelURL,
		false // debug = true
	);

	payment.detail(req.query.token, req.query.PayerID, function(err, data, invoiceNumber, price) {

	    if (err) {
	        logger.error(err);
	        return;
	    }

	});
});

app.get('/cancelPayment', function (req, res) {

	var options = {
		root: __dirname + '/../client/htm/'
	};

	var fileName = 'cancelPayment.html';

	res.sendFile(fileName, options, function (err) {
	    if (err) {
	      logger.error(err);
	      res.status(err.status).end();
	    }
	});
});

app.get('/privacyPolicy', function (req, res) {

	var options = {
		root: __dirname + '/../client/htm/'
	};

	var fileName = 'privacyPolicy.html';

	res.sendFile(fileName, options, function (err) {
	    if (err) {
	      logger.error(err);
	      res.status(err.status).end();
	    }
	});
});

app.locals.notifyNeighbours = function (client, online){

	broker.getListOfPeopleAround(client, online).then(function(listOfPeople){

		postMan.send("notificationOfNewContact", { list : listOfPeople }, client);

		if (client.visibility == 'off'){
			logger.info("notifyNeighbours  ::: client.visibility == 'off' ");
			return;
		}

		if (online){
			var visible = {
				publicClientID : client.publicClientID,
				location : client.location,
				nickName : client.nickName,
	  			commentary : client.commentary,
	  			pubKeyPEM : client.pubKeyPEM
			};
			var list2send = [];
			list2send.push(visible);

			listOfPeople.map(function (c){
				broker.getClientById(c.publicClientID).then(function( client2BeNotified ){
					postMan.send("notificationOfNewContact",  { list : list2send } , client2BeNotified);
				});
			});
		}
	});

};

app.locals.onClientAlive = function ( publicClientID , socket ){

	broker.getClientById( publicClientID ).then(function(client){

		if (client == null ||
			publicClientID != socket.myClient.publicClientID ){
	  		logger.info('onClientAlive ::: publicClientID != publicClientID');
			return;
		}

		//XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers
		postMan.sendKeysDeliveries( client );
		postMan.sendMessageACKs( client );
		postMan.sendMessageHeaders( client );
		postMan.sendKeysRequests( client );

	});

};

app.locals.onConnection = function ( client ){

	//XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers
	postMan.sendKeysDeliveries( client );
	postMan.sendMessageACKs( client );
	postMan.sendMessageHeaders( client );
	postMan.sendKeysRequests( client );

	//XEP-0080: User Location
	postMan.sendDetectedLocation(client);

	//XEP-0084: User Avatar
	postMan.send("RequestForProfile",  { lastProfileUpdate : parseInt(client.lastProfileUpdate) } , client);

};

app.locals.onDisconnect = function(socket) {
	logger.info("onDisconnect ::: client: " + socket.myClient.publicClientID + " socket: " + socket.socketid );
};

app.locals.onRequestOfListOfPeopleAround = function (input, socket) {

	var client = socket.myClient;

	if (client.nickName == null){
		logger.info("onRequestOfListOfPeopleAround  ::: slowly....");
		return;
	}

	var parameters = postMan.getRequestWhoIsaround(input, client);
	if (parameters == null) {
		logger.info("onRequestOfListOfPeopleAround  ::: upsss let's send the people around ... anyway");
	}

	if ( broker.isLocationWellFormatted( parameters.location ) ) {
		client.location.lat = parameters.location.lat.toString() ;
		client.location.lon = parameters.location.lon.toString() ;
		// update DB
		broker.updateClientsProfile(client);
	}

	if (client == null ) logger.error("onRequestOfListOfPeopleAround  ::: upsss client es null");
	var online = true;
	app.locals.notifyNeighbours(client, online);
	online = false;
	app.locals.notifyNeighbours(client, online);
};

app.locals.onPlanCreation = function (input, socket) {

	var client = socket.myClient;

	var params = postMan.getPlanParams( input, client );
	if ( params == null) {
		logger.info("onPlanCreation  ::: upsss parameters == null ");
		return;
	}
	broker.createNewPlan( client, params );

};

app.locals.onPlanModification = function (input, socket) {

	var client = socket.myClient;

	var params = postMan.getPlanParams( input, client );
	if ( params == null) {
		logger.info("onPlanModification  ::: upsss parameters == null ");
		return;
	}
	broker.updatePlan( client, params );

};


app.locals.onProfileRetrieval = function(input , socket) {

	var client = socket.myClient;

	var parameters = postMan.getProfileRetrievalParameters(input, client);
	if (parameters == null) return;

	broker.getProfileByID( parameters.publicClientID2getImg ).then(function(profile){

		if ( profile == null) return;

		if ( parameters.lastProfileUpdate == null ||
			 parameters.lastProfileUpdate < profile.lastProfileUpdate ){

			postMan.send("ProfileFromServer",  profile , client);
		}

	});

};

app.locals.onProfileUpdate = function(input , socket) {

	var client = socket.myClient;

	var parameters = postMan.getProfileResponseParameters(input, client);
	if (parameters == null) return;

	client.nickName = parameters.nickName;
	client.commentary = parameters.commentary;
	client.telephone = parameters.telephone;
	client.email = parameters.email;
	client.lastProfileUpdate = new Date().getTime();
	client.visibility = parameters.visibility;

	logger.debug("onProfileUpdate  ::: parameters.visibility", parameters.visibility);
	logger.debug("onProfileUpdate  ::: client.visibility", client.visibility);
	logger.debug("onProfileUpdate  ::: client.version", client.version);


	broker.updateClientsProfile( client );
	broker.updateClientsPhoto( client, parameters.img );

	if (client == null ) logger.error("onProfileUpdate  ::: upsss client es null");
	var online = true;
	app.locals.notifyNeighbours(client, online);
	online = false;
	app.locals.notifyNeighbours(client, online);

};

app.locals.onPushRegistration = function( input , socket) {

	var client = socket.myClient;
	logger.info("onPushRegistration ::: client: " + client.publicClientID + " socket: " + socket.socketid );
	//TODO
	var registration = postMan.getPushRegistration( input , client);
	if ( registration == null ){
		logger.error('onPushRegistration ::: upss');
		return;
	}

	broker.getClientById( registration.publicClientID ).then(function(client){

		if (client == null ||
			registration.publicClientID != socket.myClient.publicClientID ){
	  		logger.error('onPushRegistration ::: publicClientID != publicClientID');
			return;
		}

		client.pushToken = registration.token;
		socket.myClient = client;
		broker.updatePushRegistry( client );
	});

};

app.locals.onRequest4Plans = function(input , socket) {

	var client = socket.myClient;
	var params = postMan.getRequest4Plans(input, client);
	if (params == null) return;

	broker.getListOfPlansAround( params ).then(function(listOfPlans){
		postMan.send("PlansAround", { list : listOfPlans }, client);
	});

};

app.locals.onReqPlanImg = function(input , socket) {

	var client = socket.myClient;
	var params = postMan.getReqPlanImg(input, client);
	if (params == null) return;

	broker.getImgOfPlan( params ).then(function( res ){
		postMan.send("ImgOfPlanFromServer", res , client);
	});

};

app.locals.onWhoIsOnline = function( input , socket) {

	logger.debug('WhoIsonline ::: init ' );

	var client = socket.myClient;
	var ping = postMan.getWhoIsOnline( input, client);
	if (ping == null) return;

	var pong = { idWhoIsOnline: ping.idWhoIsOnline };
	logger.debug('WhoIsonline ::: ', pong );

	ping.listOfReceivers.map(function( receiver ){
		broker.getClientById( receiver ).then(function( clientReceiver ){
			if ( clientReceiver != null ){
				postMan.send("WhoIsOnline",  pong, clientReceiver );
				logger.debug('WhoIsonline ::: ', pong );
			}
		});
	});
};

app.locals.onWhoIsWriting = function( input , socket) {

	var client = socket.myClient;
	var ping = postMan.getWhoIsWriting( input, client);
	if (ping == null) return;

	var pong = {
		idWhoIsWriting: ping.idWhoIsWriting,
		toWhoIsWriting : ping.toWhoIsWriting
	};

	ping.listOfReceivers.map(function( receiver ){
		broker.getClientById( receiver ).then(function( clientReceiver ){
			if ( clientReceiver != null ){
				postMan.send("WhoIsWriting",  pong, clientReceiver );
				logger.debug('WhoIsWriting ::: ',pong );
	 		}
		});
	});
};

app.locals.onMessageDeliveryACK = function(input, socket) {

	var client = socket.myClient;

	var messageACKparameters = postMan.getDeliveryACK(input, client);
	if (messageACKparameters == null) return;

	//check if sender of MessageDeliveryACK is actually the receiver
	if (messageACKparameters.to != client.publicClientID) {
		logger.info('onMessageDeliveryACK ::: something went wrong on onMessageDeliveryACK ' );
		return;
	}

	broker.getClientById(messageACKparameters.from).then(function(clientSender){

		var deliveryReceipt = {
			msgID : messageACKparameters.msgID,
			typeOfACK : (messageACKparameters.typeOfACK == "ACKfromAddressee") ? "ACKfromAddressee" : "ReadfromAddressee",
			to : messageACKparameters.to
		};

		postMan.send("MessageDeliveryReceipt",  deliveryReceipt , clientSender );

		if ( postMan.isMainDeviceOnline( clientSender ) ){
			postMan.deleteMessageAndACK(deliveryReceipt);
		}else{
			postMan.archiveACK( messageACKparameters );
		}

	});

};

app.locals.onMessageRetrieval = function( input, socket) {

	var client = socket.myClient;

	var retrievalParameters = postMan.getMessageRetrieval( input , client);
	if (retrievalParameters == null) return;

	postMan.getMessageFromArchive(retrievalParameters, client).then(function(message){
		if (message != null){
			postMan.forwardMsg( message , client);
		}
	});

};

//XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers
app.locals.onReconnectNotification = function( input, socket ) {

	var client = socket.myClient;
	logger.info("onReconnectNotification ::: client: " + client.publicClientID + " socket: " + socket.socketid );

	var notification = postMan.getReconnectNotification( input , client);
	if ( notification == null ){
		logger.info('onReconnectNotification::: upss');
		return;
	}

	app.locals.onClientAlive( notification.publicClientID, socket);

};

app.locals.onKeysDelivery = function( input, socket){

	var client = socket.myClient;

	var keysDelivery = postMan.getKeysDelivery(input , client);
	if ( keysDelivery == null ) return;
	//logger.debug('onKeysDelivery ::: input ' + JSON.stringify(keysDelivery) );

	broker.getClientById( keysDelivery.to ).then(function(clientReceiver){
		if ( clientReceiver == null ) return;
		postMan.send("KeysDelivery",  keysDelivery , clientReceiver );
		if ( ! postMan.isMainDeviceOnline( clientReceiver ) ){
			postMan.archiveKeysDelivery(keysDelivery);
		}
	});

};

app.locals.onKeysRequest = function( input, socket){

	var client = socket.myClient;

	var KeysRequest = postMan.getKeysRequest( input , client);
	if ( KeysRequest == null ) return;

	logger.info('onKeysRequest ::: KeysRequest: ' + JSON.stringify(KeysRequest) );

	broker.getClientById( KeysRequest.to ).then(function( clientReceiver ){
		if ( clientReceiver == null ) return;
		postMan.send( "KeysRequest",  KeysRequest , clientReceiver );
		if ( ! postMan.isMainDeviceOnline( clientReceiver ) ){
			postMan.archiveKeysRequest(KeysRequest);
		}
	});

};

app.locals.onMessage2client = function( msg , socket){

	var client = socket.myClient;
	if ( postMan.isUUID( msg.to ) == false  ||
		 postMan.isUUID( msg.from ) == false ||
		 postMan.isUUID( msg.msgID ) == false ||
		 postMan.isInt( msg.timestamp ) == false ||
		 postMan.isInt( msg.messageBody.index4Key ) == false ||
		 postMan.isInt( msg.messageBody.index4iv ) == false ||
		 postMan.lengthTest(msg.messageBody.encryptedMsg , config.MAX_SIZE_SMS ) == false ||
		 msg.from != client.publicClientID ||
		 postMan.isPostBoxFull(msg) == true  ){
		logger.info('onMessage2client ::: something went wrong' + JSON.stringify(msg) );
		return;
	}
	var deliveryReceipt = {
		msgID : msg.msgID,
		typeOfACK : "ACKfromServer",
		to : msg.to
	};
	postMan.send("MessageDeliveryReceipt",  deliveryReceipt , client);

	broker.getClientById( msg.to ).then(function( clientReceiver ){
		if ( clientReceiver == null ) return;
		postMan.forwardMsg( msg , clientReceiver );
		if ( ! postMan.isMainDeviceOnline( clientReceiver ) ){
			postMan.archiveMessage( msg );
 			broker.getPushRegistryByID( msg.to ).then(function( pushRegistry ){
 				if ( pushRegistry != null ){
 					postMan.sendPushNotification( msg, pushRegistry );
 		 		}
 			});
		}
	});
};

app.locals.onLoginRequest = function (socket , input) {

	if ( ! postMan.isUUID( input.handshakeToken ) ) {
  		logger.error('login ::: ! postMan.isUUID(req.body.handshakeToken)');
		return;
	}

	broker.getClientByHandshakeToken(input.handshakeToken).then(function(client){

		if (client == null ){
	  		logger.error('login ::: unknown client with this handshakeToken' + input.handshakeToken );
			return;
		}

		client.indexOfCurrentKey = Math.floor((Math.random() * 7) + 0);
		client.currentChallenge = uuid.v4();
		var sHeaders = socket.handshake.headers;
		var ip = sHeaders['x-forwarded-for'];
		logger.info('onLoginRequest ::: client ' + client.publicClientID + ' ip ' + ip );

		var clientUpdate = [
             broker.updateClientsLocation( client, ip ) ,
		     broker.updateClientsHandshake( client )
		];

		var server2connect = postMan.getRightServer2connect();

		// challenge forwarding to the Client
		when.all ( clientUpdate ).then(function(){

			logger.info('clientUpdate sequence::: client ' + client.publicClientID  );

			var answer = {
				event : "LoginResponse",
				data : {
					index: client.indexOfCurrentKey ,
					challenge :  postMan.encrypt( { challenge : client.currentChallenge} , client ),
					server2connect : postMan.encrypt( server2connect , client )
				}
			};
			socket.TLS.prepare( JSON.stringify(answer) );

		});

	});	//END getClientByHandshakeToken

};//END onLoginRequest

app.locals.onRegistryRequest = function (socket , input) {
	logger.debug("app.locals.onRegistryRequest ::: do something...", input);

	broker.createNewClient( input.clientPEMpublicKey ).then(function (newClient){
		var answer = {
			event : "registration",
			data : {
				publicClientID : newClient.publicClientID ,
				myArrayOfKeys : newClient.myArrayOfKeys,
				handshakeToken : newClient.handshakeToken,
        myDevice : newClient.mainDevice
			}
		};
		socket.TLS.prepare( JSON.stringify(answer) );

	});
};//END onRegistryRequest

app.locals.onRequestTLSConnection = function( input , socket){

	var keys = postMan.getAsymetricKeyFromList();
	var options = {
		keys : keys,
		clientPEMcertificate : input.clientPEMcertificate,
		socket : socket,
		onTLSmsg : app.locals.onTLSmsg,
		onClose : function(){ socket.disconnect(); }
  	};
	socket.TLS = postMan.createTLSConnection( options );
	// send serversPEM for the client to establish TLS connection
	var answer = { serversPEM : keys.certificate };
	try{
		io.sockets.to(socket.id).emit('ResponseTLSConnection', answer );
	}catch(e){
		logger.info("onRequestTLSConnection ::: send ::: exception"  + e);
	}
};// END onRequestTLSConnection

app.locals.onTLSmsg = function (socket , input) {
	//TODO to use parseNotEval.....
	var obj = JSON.parse( input );
	var event = obj.event;
	switch (event) {
		case "register":
			app.locals.onRegistryRequest( socket , obj.data);
			break;
		case "login":
			app.locals.onLoginRequest( socket , obj.data);
			break;
		default:
			break;
	}
};// END onTLSmsg

if ( conf.useTLS ){
	io.sockets.on("connection", function (socket) {

		socket.on("RequestTLSConnection", function (msg){
			app.locals.onRequestTLSConnection ( msg , socket)
		});

		// base64-decode data received from client and process it
		socket.on("data2Server", function (data){
			socket.TLS.process( forge.util.decode64( data ) );
		});

		socket.on('disconnect',  function (msg){ } );

	});
}else{
	io.adapter(redis({ host: config.redis.host , port: config.redis.port }));

	io.use(function(socket, next){

		var token = socket.handshake.query.token;
		var version = socket.handshake.query.version;
		var device = socket.handshake.query.device;

		var decodedToken = postMan.decodeHandshake(token);
		var joinServerParameters = postMan.getJoinServerParameters(decodedToken);
		if ( joinServerParameters == null ){ return;}

		broker.getClientByHandshakeToken ( joinServerParameters.handshakeToken ).then(function(client){

			client.version = version;
			logger.debug('io.use ::: client.version : ', client.version);
			logger.info('io.use ::: client.visibility : ', client.visibility);
			logger.info('io.use ::: device : ', device);
			logger.info('io.use ::: main device : ', client.mainDevice);

			if (client == null){
				logger.info('io.use ::: I dont find this freaking client in the DB');
				return null;
			}
			var verified = postMan.verifyHandshake ( token , client );
		  	if (client && verified == true){
		  		//client.socketid = socket.id ;
		  		// update DB
		  		broker.updateClientsProfile(client);
		  		//attaches the client to the socket
		  		socket.myClient = client;
		  		socket.device = device;

				next();
		  	}else{
		  		logger.error('io.use ::: Got disconnect in auth..! wrong handshake');
		  	}
		  	return;

		});
	});

	io.sockets.on("connection", function (socket) {

		if ( typeof socket.myClient == 'undefined'){
			logger.info("ERROR ::: 404 " );
			socket.disconnect();
		}
		var client = socket.myClient;
		socket.join( client.publicClientID );
		logger.info("connection ::: client: " + client.publicClientID + " socket.device: " + socket.device );

		//XEP-0305: XMPP Quickstart
		app.locals.onConnection( client );

		//XEP-0077: In-Band Registration
		socket.on('disconnect',  function (msg){ app.locals.onDisconnect( socket) } );

		//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
		socket.on("messageRetrieval", function (msg){ app.locals.onMessageRetrieval ( msg , socket) } );

		//XEP-0184: Message Delivery Receipts
		socket.on("MessageDeliveryACK", function (msg){ app.locals.onMessageDeliveryACK ( msg , socket) } );

		//XEP-0163: Personal Eventing Protocol
		socket.on("ProfileRetrieval", function (msg){ app.locals.onProfileRetrieval ( msg , socket) } );

		//XEP-0084: User Avatar, XEP-0077: In-Band Registration
		socket.on("profileUpdate", function (msg){ app.locals.onProfileUpdate ( msg , socket) } );

		//XEP-0080: User Location
		socket.on('RequestOfListOfPeopleAround', function (msg){ app.locals.onRequestOfListOfPeopleAround( msg , socket) } );

		//XEP-0305: XMPP Quickstart
		socket.on("reconnectNotification", function (msg){ app.locals.onReconnectNotification ( msg, socket) } );

		//XEP-0189: Public Key Publishing
		socket.on("KeysDelivery", function (msg){ app.locals.onKeysDelivery ( msg , socket) } );

		//XEP-0189: Public Key Publishing
		socket.on("KeysRequest", function (msg){ app.locals.onKeysRequest ( msg , socket) } );

		//XEP-0184: Message Delivery Receipts
		socket.on("message2client", function (msg){ app.locals.onMessage2client ( msg , socket) } );

		//XEP-0357: Push Notifications
		socket.on("PushRegistration", function (msg){ app.locals.onPushRegistration ( msg , socket) } );

		//XEP-XXXX: currently writing
		socket.on("WhoIsWriting", function (msg){ app.locals.onWhoIsWriting ( msg , socket) } );

		//XEP-XXXX: currently online
		socket.on("WhoIsOnline", function (msg){ app.locals.onWhoIsOnline ( msg , socket) } );

		//XEP-XXXX: plan creation
		socket.on("PlanCreation", function (msg){ app.locals.onPlanCreation ( msg , socket) } );

		//XEP-XXXX: plan modification
		socket.on("PlanModification", function (msg){ app.locals.onPlanModification ( msg , socket) } );

		//XEP-XXXX: plan retreival
		socket.on("Request4Plans", function (msg){ app.locals.onRequest4Plans ( msg , socket) } );

		//XEP-XXXX: plan img retreival
		socket.on("ReqPlanImg", function (msg){ app.locals.onReqPlanImg ( msg , socket) } );

	});
}

easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }
        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});
        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));
        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

var DBConnectionEstablished = [
	postMan.initDBConnection( conf.db.user, conf.db.pass, conf.db.host, conf.db.name ),
	broker.initDBConnection( conf.db.user, conf.db.pass, conf.db.host, conf.db.name )
];

when.all ( DBConnectionEstablished ).then(function(){

	app.set('port', conf.portNumber);
  	app.set('ipaddr', conf.ipAddress );

  	webServer.listen(
		app.get('port'),
		app.get('ipaddr'),
		function(){
			logger.info('Server ::: listening on IP ' + app.get('ipaddr') + ' & port ' + app.get('port'));
		}
	);

  	if ( conf.useTLS == false ){
  		easyrtc.listen(app, io, null, function(err, rtcRef) {});
  	}


});
