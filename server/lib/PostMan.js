/* simplify type check
function hasSameProps( obj1, obj2 ) {
    var obj1Props = Object.keys( obj1 ),
        obj2Props = Object.keys( obj2 );

    if ( obj1Props.length == obj2Props.length ) {
        return obj1Props.every( function( prop ) {
          return obj2Props.indexOf( prop ) >= 0;
        });
    }

    return false;
}
Object.prototype.equals = function(x)
{
    for(p in this)
    {
    	switch(typeof(this[p]))
    	{
    		case 'object':
    			if (!this[p].equals(x[p])) { return false }; break;
    		case 'function':
    			if (typeof(x[p])=='undefined' || (p != 'equals' && this[p].toString() != x[p].toString())) { return false; }; break;
    		default:
    			if (this[p] != x[p]) { return false; }
    	}
    }

    for(p in x)
    {
    	if(typeof(this[p])=='undefined') {return false;}
    }

    return true;
}

*/

var gcm = require('node-gcm');
var	_ = require('underscore')._ ;
var Message	= require('./Message.js');
var crypto = require('jsrsasign');
var forge = require('node-forge')({disableNativeCode: true});
var pg = require('pg');
var when = require('when');
var squel = require("squel");
var config = require('./Config.js');
var workerFarm = require('worker-farm');
var workers = workerFarm(require.resolve('./KeysGenerator'));

function PostMan(_io, _logger) {
	var io = _io; //pointer to io.sockets
	var listOfMessages = []; //array of Message.js (DB)
	var listOfACKs = []; //array of {msgID ,to ,from } (DB)	
	var clientOfDB = null;
	var self = this;
	var lastServerAsigned = 0;
	var logger = _logger;
	var listOfAsimetricKeys = [];
	

	this.createAsymetricKeys = function() {
		
		var options = {};
		options.bits = 2048;
		options.e = 0x10001;
		var keys = forge.pki.rsa.generateKeyPair( options );

		var cn = 'authknetserver';
		var cert = forge.pki.createCertificate();
		cert.serialNumber = '01';
		cert.validity.notBefore = new Date();
		cert.validity.notBefore.setFullYear( cert.validity.notBefore.getFullYear() - 1);
		cert.validity.notAfter = new Date();
		cert.validity.notAfter.setFullYear( cert.validity.notAfter.getFullYear() + 1);
		var attrs = [{
			name: 'commonName',
		    value: cn
		}, {
			name: 'countryName',
			value: 'ES'
		}, {
			shortName: 'ST',
			value: 'Madrid'
		}, {
			name: 'localityName',
			value: 'Madrid'
		}, {
			name: 'organizationName',
		    value: 'instaltic'
		}, {
		    shortName: 'OU',
		    value: 'instaltic'
		}];
		cert.setSubject(attrs);
		cert.setIssuer(attrs);
		cert.setExtensions([{
			name: 'basicConstraints',
		    cA: true
		}, {
			name: 'keyUsage',
		    keyCertSign: true,
		    digitalSignature: true,
		    nonRepudiation: true,
		    keyEncipherment: true,
		    dataEncipherment: true
		}, {
			name: 'subjectAltName',
			altNames: [{
				type: 7, // IP
				ip: '217.127.199.47'
			}]
		}]);

		cert.publicKey = keys.publicKey;

		// self-sign certificate
		cert.sign(keys.privateKey);

		keys.cert = cert;
		//console.info('certificate created for \"' + cn + '\": \n' + forge.pki.certificateToPem( keys.cert) );
		logger.debug('createAsymetricKeys ::: key-pair & certificate created.');

		return keys;
	};
	
	this.createBufferOfKeys = function() {
		logger.info(
			'Postman ::: creating Buffer of Keys, size of buffer: ',
			config.MAX_SIZE_ASIM_KEYS_BUFFER );
		
		for (i = 0; i < config.MAX_SIZE_ASIM_KEYS_BUFFER; i++) {
			workers(function (keys) {
				listOfAsimetricKeys.push( keys );
				logger.debug("callback ::: current number of certs", listOfAsimetricKeys.length );
			});
			/*
			listOfAsimetricKeys.push( self.createAsymetricKeys() );
			logger.debug("callback ::: current number of certs", listOfAsimetricKeys.length );
			*/
		}
	};
	
	this.createTLSConnection = function( options ) {

		var serverTLS = forge.tls.createConnection({
		  server: true,
		  caStore: [options.clientPEMcertificate],
		  sessionCache: {},
		  // supported cipher suites in order of preference
		  cipherSuites: [
		    forge.tls.CipherSuites.TLS_RSA_WITH_AES_128_CBC_SHA,
		    forge.tls.CipherSuites.TLS_RSA_WITH_AES_256_CBC_SHA],
		  connected: function(c) {
		    //logger.debug('Server connected');
		    c.prepareHeartbeatRequest('heartbeat');
		  },
		  verifyClient: true,
		  verify: function(c, verified, depth, certs) {
		    logger.debug(
		      'Server verifying certificate w/CN: \"' +
		      certs[0].subject.getField('CN').value +
		      '\", verified: ' + verified + '...');
		    return verified;
		  },
		  getCertificate: function(c, hint) {
		    //logger.debug('Server getting certificate for \"' + hint[0] + '\"...');
		    return options.keys.certificate;
		  },
		  getPrivateKey: function(c, cert) {
		    return options.keys.privateKey;
		  },
		  // send base64-encoded TLS data to client
		  tlsDataReady:  function(c) {			
			  try{
				  var data2send = c.tlsData.getBytes();
				  io.sockets.to(options.socket.id).emit('data2Client', forge.util.encode64( data2send ) );
			  }catch(e){
				  logger.error("createTLSConnection ::: exception"  + e);
			  }
		  } ,
		 // receive clear base64-encoded data from TLS from client
		  dataReady: function(c) {
			  var data2receive = c.data.getBytes();
			  //logger.debug('Server received \"' + data2receive + '\"');
			  options.onTLSmsg( options.socket, data2receive );
		  } ,
		  heartbeatReceived: function(c, payload) {
		    //logger.debug('Server received heartbeat: ' + payload.getBytes());
		  },
		  closed: function(c) {
		    logger.debug('Server disconnected.');
		    //options.onClose();
		  },
		  error: function(c, error) {
		    logger.error('Server error: ' + error.message);
		    //c.close();		    
		  }
		});
		
		return serverTLS;
	};
	
	this.getAsymetricKeyFromList = function (){
		workers(function (keys) {
			listOfAsimetricKeys.push( keys );
			logger.debug("callback ::: current number of certs", listOfAsimetricKeys.length );
		});
		logger.debug("getAsymetricKeyFromList ::: current number of certs", listOfAsimetricKeys.length );
		return listOfAsimetricKeys.pop();		
	};	

	
    //TODO : what about calling `done()` to release the client back to the pool
    //	done();
    //	client.end();
	this.initDBConnection = function (user, pass, host, name){
		
		self.createBufferOfKeys();
		
		var d = when.defer();
		var conString = "postgres://" +  user + ":" + pass + "@" + host + "/" + name;
		pg.connect(conString, function(err, client, done) {
			if(err) {
				return logger.error('PostMan  ::: ERROR connecting to the Database', err);
			}
			logger.info('PostMan ::: correctly connected to the Database');
			clientOfDB = client;
			return d.resolve(true);
		});	
		return d.promise;	
	};	
	//TODO #4 check if this new message makes the Buffer of sender/receiver become full
	//PostMan verifies if either the buffer of the sender or the buffer of the Receiver is full
	this.isPostBoxFull= function(message) {
		//get from the message the sender and receiver
		//var isPostBoxFull = false;		
		return false;
	
	};
	
	//XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
	this.sendMessageHeaders = function(client) {		
		
	    var query2send = squel.select()
	    						.field("msgid")
							    .from("message")							    
							    .where("receiver = '" + client.publicClientID + "'")							    
							    .toString();
		
		clientOfDB.query(query2send, function(err, result) {
		
			if(err) {
				logger.error('sendMessageHeaders ::: error running query', err);	
			}
			
			try {
			
				if ( typeof result.rows == "undefined" || result.rows.length == 0){					
					return;
				}
				
				var messageHeaders = [];
				result.rows.map(function(r){
					var header2add = {	
						msgID : r.msgid,
						size : 0
					};
					messageHeaders.push(header2add);
				});
				
				var message = { list : messageHeaders };
				io.sockets.to(client.socketid).emit("ServerReplytoDiscoveryHeaders", PostMan.prototype.encrypt( message , client ));
				
			}catch (ex) {
				logger.debug("sendMessageHeaders  :::  exceptrion thrown " + ex  );						
			}
		
		});	 
		
	};
	
	this.setAsymetricKey2List = function ( keys ){
		listOfAsimetricKeys.push(keys);
		logger.debug("setAsymetricKey2List  :::  length: ", listOfAsimetricKeys.length);		
	};	
	
	this.getMessageFromArchive = function(retrievalParameters , client) {
		
		var d = when.defer();
	    
	    var query2send = squel.select()
						    .from("message")
						    .where("msgid = '" + retrievalParameters.msgID + "'")							    
						    .where("receiver = '" + client.publicClientID + "'")							    
						    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('getMessageFromArchive ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"  ){
			    	//logger.debug('getMessageFromArchive ::: publicClientID not registered or socket is set to null --> offline for client:' + publicClientID );
			    	return  d.resolve(null);
			    }
		    		    
			    var message = {};
			    var entry = result.rows[0];
			    
			    message.msgID = entry.msgid;
			    message.to = entry.receiver;
			    message.from = entry.sender;
			    message.messageBody = entry.messagebody ;
			    message.messageBody.encryptedMsg = message.messageBody.encryptedMsg.replace(/##\&#39##/g, "'");
			    message.timestamp = entry.timestamp ;
			    message.chatWith = entry.chatwith ;
			    			   		    
			    
			    return  d.resolve(message);
			    
		    }catch (ex) {
				logger.debug("getMessageFromArchive  :::  exception thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;	  
	  
	};
	
	
	this.archiveMessage = function(msg) {
		
		msg.messageBody.encryptedMsg = msg.messageBody.encryptedMsg.replace(/'/g, "##&#39##");
		
		var query2send = squel.insert()
						    .into("message")
						    .set("msgid", msg.msgID)
						    .set("receiver", msg.to)
						    .set("sender", msg.from)
						    .set("messagebody", JSON.stringify(msg.messageBody) )
						    .set("timestamp", msg.timestamp)
						    .set("chatwith", msg.chatWith)							    
						    .toString() ;
				    
		clientOfDB.query(query2send, function(err, result) {		     
			//clientOfDB.done();		    
			if(err) {
		    	logger.error('archiveMessage :::error running query', err);	
		    	logger.error('archiveMessage ::: query error: ', query2send);
		    }	    
		});
	};


	
	this.archiveACK = function(messageACKparameters) {
		
		var query2send = squel.insert()
			    .into("messageack")
			    .set("msgid", messageACKparameters.msgID)
			    .set("receiver", messageACKparameters.to)
			    .set("sender", messageACKparameters.from)
			    .set("type", messageACKparameters.typeOfACK)			    							    
			    .toString() ;
		
		clientOfDB.query(query2send, function(err, result) {
			
			//clientOfDB.done();
			
			if(err) {
				logger.error('archiveMessage :::error running query', err);	
				logger.error('archiveMessage ::: query error: ', query2send);
			}		    
		
		});
		
	};
	/**
	 var data = {
		from :  user.publicClientID,
		to : contact.publicClientID,
		setOfKeys : {
			masterKeyEncrypted : masterKeyEncrypted,
			symKeysEncrypted : { 
				iv2use : iv2use , 
				keysEncrypted : cipher.output.data 
			}
		}
	};	 
	 */
	this.archiveKeysDelivery = function( keysDelivery ) {
		
		var query2send = squel.insert()
			    .into("keysdelivery")
			    .set("sender", keysDelivery.from)
			    .set("receiver", keysDelivery.to)
			    .set("setofkeys", JSON.stringify(keysDelivery.setOfKeys) )
			    .toString() ;
		
		clientOfDB.query(query2send, function(err, result) {	
			if(err) {
				logger.error('archiveKeysDelivery :::error running query', err);	
				logger.error('archiveKeysDelivery ::: query error: ', query2send);
			}		
		});
				
	};

	this.archiveKeysRequest = function( input ) {
		
		var query2send = squel.insert()
			    .into("keysrequest")
			    .set("sender", input.from)
			    .set("receiver", input.to)
			    .toString() ;
		
		clientOfDB.query(query2send, function(err, result) {	
			if(err) {
				logger.error('archiveKeysRequest :::error running query', err);	
				logger.error('archiveKeysRequest ::: query error: ', query2send);
			}		
		});
		
	};

	this.sendMessageACKs = function(client) {

	    var query2send = squel.select()
								.field("msgid")
								.field("receiver")
								.field("type")
							    .from("messageack")							    
							    .where("sender = '" + client.publicClientID + "'")							    
							    .toString();
							    
		clientOfDB.query(query2send, function(err, result) {
		
			if(err) {
				logger.error('sendMessageACKs ::: error running query', err);	
			}			
			try {			
				if ( typeof result.rows == "undefined" || result.rows.length == 0 )					
					return;
					
				result.rows.map(function(r){
					var deliveryReceipt = { 
						msgID : r.msgid, 
						typeOfACK : r.type,
						to : r.receiver 	
					};

					io.sockets.to(client.socketid).emit(
						"MessageDeliveryReceipt", 
						PostMan.prototype.encrypt(deliveryReceipt, client ) , 
						self.deleteMessageAndACK(deliveryReceipt) 
					);
				});
			}catch (ex) {
				logger.debug("sendMessageACKs  :::  exceptrion thrown " + ex  );						
			}		
		});		
	};
	
	
	this.sendPushNotification = function( msg, pushRegistry ) {

		try {
			var message = new gcm.Message({
				collapseKey: 'do_not_collapse',
			    priority: 'high',
			    delayWhileIdle: false,
			    timeToLive: 2419200,			    
			});
			message.addData('title', 'knet');
			message.addData('message', 'knet');
			message.addData('image', 'icon');
			//message.addNotification('title', 'knet');
			//message.addNotification('body', 'SMS');
			//message.addNotification('icon', 'myicon');
			//message.addNotification('tag', 'knet');
			 
			var regTokens = [];
			regTokens.push( pushRegistry.token );
			 
			// Set up the sender with you API key 
			var sender = new gcm.Sender( config.keyGCM );
			 
			// Now the sender can be used to send messages 
			sender.send(message, { registrationTokens: regTokens }, function (err, response) {
			    if(err) logger.debug("sendPushNotification :::  err " + err  );
			    else    logger.debug("sendPushNotification :::  response " + response );
			});		
			
		}catch (ex) {
			logger.debug("sendPushNotification :::  exception " + ex  );						
		}		
	};
	
	
	this.sendKeysRequests = function(client) {

	    var query2send = squel.select()
							.field("sender")
							.field("receiver")
						    .from("keysrequest")							    
						    .where("receiver = '" + client.publicClientID + "'")							    
						    .toString();
			
		clientOfDB.query(query2send, function(err, result) {
		
			if(err) logger.error('sendKeysRequests ::: error running query', err);
			try {			
				if ( typeof result.rows == "undefined" || result.rows.length == 0 )					
					return;				
				
				result.rows.map(function(r){
					var KeysRequest = { 
						from : r.sender, 
						to : r.receiver 	
					};	
					io.sockets.to(client.socketid).emit(
						"KeysRequest", 
						PostMan.prototype.encrypt( KeysRequest, client ) , 
						self.deleteKeysRequest( KeysRequest )
					);
				});				
			
			}catch (ex) {
				logger.debug("sendMessageACKs  :::  exceptrion thrown " + ex  );						
			}		
		});		
	}; // END sendKeysRequests
	
	this.sendKeysDeliveries = function(client) {

	    var query2send = squel.select()
							.field("sender")
							.field("receiver")
							.field("setofkeys")
						    .from("keysdelivery")							    
						    .where("receiver = '" + client.publicClientID + "'")							    
						    .toString();
			
		clientOfDB.query(query2send, function(err, result) {
			try {
				if(err) logger.error('sendKeysDeliveries ::: error running query', err);						
				if ( typeof result.rows == "undefined" || result.rows.length == 0 )	 return;				
				
				result.rows.map(function(r){
					var keysDelivery = {						
						from : r.sender, 
						to : r.receiver,
						setOfKeys : r.setofkeys 	
					};
										
					keysDelivery.setOfKeys.masterKeyEncrypted = 
 						keysDelivery.setOfKeys.masterKeyEncrypted.replace(/##\&#39##/g, "'");
					keysDelivery.setOfKeys.symKeysEncrypted.keysEncrypted = 
						keysDelivery.setOfKeys.symKeysEncrypted.keysEncrypted.replace(/##\&#39##/g, "'");
					keysDelivery.setOfKeys.symKeysEncrypted.iv2use = 
					 	keysDelivery.setOfKeys.symKeysEncrypted.iv2use.replace(/##\&#39##/g, "'");
					io.sockets.to(client.socketid).emit(
						"KeysDelivery", 
						PostMan.prototype.encrypt( keysDelivery, client ) , 
						self.deleteKeysDelivery( keysDelivery )
					);
				});			
			}catch (ex) {
				logger.debug("sendKeysDeliveries  :::  exceptrion thrown " + ex  );						
			}		
		});		
	}; // END sendKeysDeliveries		
	
	this.sendDetectedLocation = function(client) {

		try{			
			var position = {
				coords : {
					latitude : client.location.lat,
					longitude : client.location.lon,
				}
			}
			
			io.sockets.to(client.socketid).emit("locationFromServer", PostMan.prototype.encrypt( position, client )  );
		
		}catch (ex) {
			logger.debug("sendDetectedLocation  :::  exception thrown " + ex  );						
		}
		
	};
	
	this.deleteMessageAndACK = function(deliveryReceipt) {
	    
		var query2send = squel.delete()
						    .from("message")
						    .where("msgid = '" + deliveryReceipt.msgID + "'")							    
						    .where("receiver = '" + deliveryReceipt.to + "'")							    
						    .toString() + " ; " +
						 squel.delete()
						    .from("messageack")
						    .where("msgid = '" + deliveryReceipt.msgID + "'")							    
						    .where("receiver = '" + deliveryReceipt.to + "'")
						    .where("type = '" + deliveryReceipt.typeOfACK + "'")							    
						    .toString() ;
		   
		clientOfDB.query(query2send, function(err, result) {
			try {
		
				if(err) {
					logger.error('deleteMessageAndACK ::: error running query', err);	
				}						
			
			}catch (ex) {
				logger.debug("deleteMessageAndACK  :::  exception thrown " + ex  );						
			}
		
		});	
	
	};
	
	this.deleteMessage = function(deliveryReceipt) {
	    
		var query2send = squel.delete()
						    .from("message")
						    .where("msgid = '" + deliveryReceipt.msgID + "'")							    
						    .where("receiver = '" + deliveryReceipt.to + "'")							    
						    .toString() 
		   
		clientOfDB.query(query2send, function(err, result) {
			try {		
				if(err) {
					logger.error('deleteMessage ::: error running query', err);	
				}			
			}catch (ex) {
				logger.debug("deleteMessage  :::  exception thrown " + ex  );						
			}		
		});	
	
	};
	
	this.deleteKeysRequest = function( KeysRequest ) {
	    
		var query2send = squel.delete()
						    .from("keysrequest")
						    .where("sender = '" + KeysRequest.from + "'")							    
						    .where("receiver = '" + KeysRequest.to + "'")							    
						    .toString() 
		   
		clientOfDB.query(query2send, function(err, result) {
			try {		
				if(err) {
					logger.error('deleteKeysRequest ::: error running query', err);	
				}		
			}catch (ex) {
				logger.debug("deleteKeysRequest  :::  exception thrown " + ex  );						
			}
		});	
	};
	
	this.deleteKeysDelivery = function( KeysDelivery ) {
	    
		var query2send = squel.delete()
						    .from("keysdelivery")
						    .where("sender = '" + KeysDelivery.from + "'")							    
						    .where("receiver = '" + KeysDelivery.to + "'")							    
						    .toString() 
		   
		clientOfDB.query(query2send, function(err, result) {
			try {		
				if(err) {
					logger.error('deleteKeysDelivery ::: error running query', err);	
				}		
			}catch (ex) {
				logger.debug("deleteKeysDelivery  :::  exception thrown " + ex  );						
			}
		});	
	};	
	
	this.getRightServer2connect = function() {
		
		lastServerAsigned = lastServerAsigned + 1;
		if (lastServerAsigned >= config.listOfServerSockets.length){
			lastServerAsigned = 0;
		}

		return config.listOfServerSockets[lastServerAsigned];		
		
	};
	
	this.send = function(event2trigger, data , client ) {
		
		if (typeof event2trigger !== 'string' ||
			typeof data !== 'object' || data == null || 
			typeof client !== 'object' || client == null || client.socketid == null	) 	{	
			
			logger.debug("postman ::: send ::: can't send " );			
			return null;
		}	
		
		try{		
			io.sockets.to(client.socketid).emit(event2trigger, PostMan.prototype.encrypt( data, client ) );
						
		}catch(e){
			logger.debug("postman ::: send ::: exception"  + e);
		}		
			
	};
	
	this.sendMsg = function( msg , client ) {
		
		try{		
			io.sockets.to(client.socketid).emit("MessageFromClient", msg );
						
		}catch(e){
			logger.debug("postman ::: send ::: exception"  + e);
		}		
			
	};	
	
};	


//verifies if it was signed with the current symmetric key of the client (number of the challenge)
//verifies if it the content of the handshake has the challenge (token of the challenge)

PostMan.prototype.verifyHandshake = function(tokenHandshake, client) {
	var verified = false;
	try {		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];			
		verified = crypto.jws.JWS.verify(tokenHandshake, key);		

		var a = tokenHandshake.split(".");
		var uClaim = crypto.b64utos(a[1]);
		var decodedHandshake = crypto.jws.JWS.readSafeJSONString(uClaim);
		
		var decryptedChallenge = PostMan.prototype.decrypt( decodeURI( decodedHandshake.challenge ) , client );
		
		if (decryptedChallenge == null || client == null){
			console.error("verifyHandshake  :::  decryptedChallenge : " + JSON.stringify(decryptedChallenge) +  " client : " + JSON.stringify(client)  );
			return false; 
		}
		
		if (decryptedChallenge.challengeClear != client.currentChallenge){
			verified = false;
			console.error("verifyHandshake  :::  challenge different than current challenge "  );
		}
	} 
	catch (ex) {	
		console.error("verifyHandshake  :::  exception thrown "  + ex); 
	}

	return verified; 	
};


PostMan.prototype.decodeHandshake = function(sJWS) {
	var decodedHandshake = null;
	try {
		var a = sJWS.split(".");
		//var uHeader = b64utos(a[0]);
		var uClaim = crypto.b64utos(a[1]);

		//var pHeader = KJUR.jws.JWS.readSafeJSONString(uHeader);
		var decodedHandshake = crypto.jws.JWS.readSafeJSONString(uClaim);
	} 
	catch (ex) {	
		console.error("decodeHandshake  :::  exception thrown "  + ex.toString() ); 
	}

	return decodedHandshake; 	
};



PostMan.prototype.getJoinServerParameters = function(joinParameters) {

	try {
				
		if (typeof joinParameters == 'undefined' || 
			joinParameters == null || 
			PostMan.prototype.isUUID(joinParameters.handshakeToken) == false ||
			typeof joinParameters.challenge !== 'string'  ||
			joinParameters.challenge.length > config.MAX_SIZE_CHALLENGE ||
			Object.keys(joinParameters).length != 2 ) {	
				console.error("getJoinServerParameters  ::: didnt pass the typechecking " ); 
				joinParameters = null;				
		}	
	} 
	catch (ex) {	
		console.error("getJoinServerParameters  :::  exceptrion thrown :"  + ex); 
		joinParameters = null;	
	}

	return joinParameters; 	
};

PostMan.prototype.getRequestWhoIsaround = function(encryptedInput, client) {
	var parameters = null;

	try {
		parameters = PostMan.prototype.decrypt(encryptedInput, client );
				
		if (typeof parameters.location.lat  !== 'string' ||
			typeof parameters.location.lon  !== 'string' ||
			Object.keys(parameters).length != 1 ||
			Object.keys(parameters.location).length != 2) {	
				parameters = null;
				console.error("getRequestWhoIsaround  ::: didnt pass the typechecking " + JSON.stringify(parameters) ); 
		}	
	} 
	catch (ex) {	
		console.error("getRequestWhoIsaround  :::  exceptrion thrown :"  + ex); 
		parameters = null;	
	}

	return parameters; 	
};




PostMan.prototype.getMessageRetrieval = function(encryptedInput , client) {
	var retrievalParameters = null;
	try {    	
		retrievalParameters = PostMan.prototype.decrypt(encryptedInput, client );	
	
		if (retrievalParameters == null ||
			PostMan.prototype.isUUID(retrievalParameters.msgID) == false ||
			Object.keys(retrievalParameters).length != 1 ) {
			
			console.error("getMessageRetrieval  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return retrievalParameters;
	} 
	catch (ex) {
		console.error("getMessageRetrieval  :::  exceptrion thrown " + ex  );
		return null;	
	}
};


PostMan.prototype.getPlanParams = function( encryptedInput , client ) {
	var parameters = null;
	try {    	
		parameters = PostMan.prototype.decrypt(encryptedInput, client );	

		if (parameters == null ||
			PostMan.prototype.isUUID(parameters.planId) == false  || 
			PostMan.prototype.isUUID(parameters.organizer) == false  || 
			PostMan.prototype.lengthTest(parameters.imgsrc , config.MAX_SIZE_IMG ) == false ||
			PostMan.prototype.lengthTest(parameters.nickName , config.MAX_SIZE_NICKNAME ) == false ||
			PostMan.prototype.lengthTest(parameters.commentary , config.MAX_SIZE_COMMENTARY ) == false ||
			typeof parameters.location.lat  !== 'string' ||
			typeof parameters.location.lon  !== 'string' ||
			Object.keys(parameters.location).length != 2 ||			
			! (typeof parameters.meetingInitDate == 'number' ||  parameters.meetingInitDate == null ) ||
			typeof parameters.meetingInitTime.hour  !== 'string' ||
			typeof parameters.meetingInitTime.mins  !== 'string' ||
			Object.keys(parameters.meetingInitTime).length != 2 ) {
			
			console.error("getPlanParams  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return parameters;
	} 
	catch (ex) {
		console.error("getPlanParams  :::  exceptrion thrown " + ex  );
		return null;	
	}
};


PostMan.prototype.getReqPlanImg = function( encryptedInput , client ) {
	var parameters = null;
	try {    	
		parameters = PostMan.prototype.decrypt(encryptedInput, client );	

		if (parameters == null ||
			PostMan.prototype.isUUID(parameters.planId) == false  ||
			Object.keys( parameters ).length != 1 ) {
			
			console.error("getReqPlanImg  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return parameters;
	} 
	catch (ex) {
		console.error("getReqPlanImg  :::  exceptrion thrown " + ex  );
		return null;	
	}
};


PostMan.prototype.getProfileResponseParameters = function(encryptedInput , client) {
	var parameters = null;
	try {    	
		parameters = PostMan.prototype.decrypt(encryptedInput, client );	
	
		if (parameters == null ||
			PostMan.prototype.isUUID(parameters.publicClientIDofSender) == false  || 
			PostMan.prototype.lengthTest(parameters.nickName , config.MAX_SIZE_NICKNAME ) == false ||
			PostMan.prototype.lengthTest(parameters.img , config.MAX_SIZE_IMG ) == false ||
			PostMan.prototype.lengthTest(parameters.telephone , config.MAX_SIZE_COMMENTARY ) == false ||
			PostMan.prototype.lengthTest(parameters.email , config.MAX_SIZE_COMMENTARY ) == false ||
			PostMan.prototype.lengthTest(parameters.commentary , config.MAX_SIZE_COMMENTARY ) == false ||
			!(parameters.visibility == "on" || parameters.visibility == "off" )   ) {
			
			console.error("getProfileResponseParameters  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return parameters;
	} 
	catch (ex) {
		console.error("getProfileResponseParameters  :::  exceptrion thrown " + ex  );
		return null;	
	}
};


PostMan.prototype.getProfileRetrievalParameters = function(encryptedInput , client) {
	var parameters = null;
	try {    	
		parameters = PostMan.prototype.decrypt(encryptedInput, client );	
	
		if (parameters == null ||
			PostMan.prototype.isUUID(parameters.publicClientID2getImg) == false  || 
			PostMan.prototype.isUUID(parameters.publicClientIDofRequester) == false  ||
			! (typeof parameters.lastProfileUpdate == 'number' ||  parameters.lastProfileUpdate == null ) || 	 
			Object.keys(parameters).length != 3) {
			
			console.error("getProfileRetrievalParameters  :::  didn't pass the format check "  + JSON.stringify(parameters) );
			retrievalParameters = null; 
		}
		return parameters;
	} 
	catch (ex) {
		console.error("getProfileRetrievalParameters  :::  exceptrion thrown " + ex  );
		return null;	
	}
};


PostMan.prototype.getRequest4Plans = function( encryptedInput , client ) {
	var parameters = null;
	try {    	
		parameters = PostMan.prototype.decrypt(encryptedInput, client );	

		if (parameters == null ||
			typeof parameters.location.lat  !== 'string' ||
			typeof parameters.location.lon  !== 'string' ||
			Object.keys(parameters.location).length != 2 ||			
			Object.keys(parameters).length != 1 ) {
			
			console.error("getRequest4Plans  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return parameters;
	} 
	catch (ex) {
		console.error("getRequest4Plans  :::  exceptrion thrown " + ex  );
		return null;	
	}
};

PostMan.prototype.sanitize = function(html) {
	
	var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
	var tagOrComment = new RegExp(
	    '<(?:'
	    // Comment body.
	    + '!--(?:(?:-*[^->])*--+|-?)'
	    // Special "raw text" elements whose content should be elided.
	    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
	    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
	    // Regular name
	    + '|/?[a-z]'
	    + tagBody
	    + ')>',
	    'gi');	
	var oldHtml;
	do {
		oldHtml = html;
		html = html.replace(tagOrComment, '');
	} while (html !== oldHtml);
	return html.replace(/</g, '&lt;').replace(/\'/g, "&#39");
};





PostMan.prototype.escape = function (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
};



PostMan.prototype.encrypt = function(message , client) {	

	try {
		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];
		var iv = Math.floor((Math.random() * 7) + 0);

		
		var cipher = forge.cipher.createCipher('AES-CBC', key );
		cipher.start({ iv : client.myArrayOfKeys[iv] });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  iv +  cipher.output.data  ;
		
		return envelope ;

	}
	catch (ex) {	
		console.error("encrypt  :::  " + ex);
		return null;
	}	
};

PostMan.prototype.decrypt = function(encrypted, client) {
	
	if (encrypted.length > config.MAX_SIZE_SMS){
		console.error("decrypt :::  size of SMS:" + encrypted.length );
		return null;
	} 
	
	var decipher = forge.cipher.createDecipher('AES-CBC', client.myArrayOfKeys[client.indexOfCurrentKey] );
	
	var iv = parseInt(encrypted.substring(0,1));

	decipher.start({iv: client.myArrayOfKeys[iv] });
	decipher.update(forge.util.createBuffer( encrypted.substring(1) ) );
	decipher.finish();
	
	return crypto.jws.JWS.readSafeJSONString(decipher.output.data);	
	
};

PostMan.prototype.decryptHandshake = function(encrypted, client) {
	
	var decipher = forge.cipher.createDecipher('AES-CBC', client.myArrayOfKeys[client.indexOfCurrentKey] );
	
	var iv = client.myArrayOfKeys[client.indexOfCurrentKey];

	decipher.start({iv: iv });
	decipher.update(forge.util.createBuffer( encrypted ) );
	decipher.finish();
	
	return crypto.jws.JWS.readSafeJSONString(decipher.output.data);	
	
};

PostMan.prototype.encryptHandshake = function(message , client) {	

	try {
		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];
		var iv = key;

		var cipher = forge.cipher.createCipher('AES-CBC', key );
		cipher.start({ iv : iv });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		return cipher.output.data ;

	}
	catch (ex) {	
		console.error("encryptHandshake  :::  " + ex);
		return null;
	}	
};





PostMan.prototype.getMessage = function(encrypted, client) {
	var inputMessage = null;
	try {

		inputMessage = PostMan.prototype.decrypt(encrypted, client);

		if (inputMessage == null ||			
			PostMan.prototype.isUUID(inputMessage.to) == false || 
			PostMan.prototype.isUUID(inputMessage.from) == false ||
			PostMan.prototype.isUUID(inputMessage.msgID) == false ||
			PostMan.prototype.isUUID(inputMessage.chatWith) == false ||
			typeof inputMessage.size !== 'number' ||
			typeof inputMessage.timestamp !== 'number' ||
			typeof inputMessage.markedAsRead !== 'boolean' ||
			typeof inputMessage.ACKfromServer !== 'boolean' ||
			typeof inputMessage.ACKfromAddressee !== 'boolean' ||
			Object.keys(inputMessage).length != 10	) 	{	
			
			console.error("getMessage  ::: didn't pass the format check 1" );
			
			return null;
		}	

		if ( inputMessage.size > config.MAX_SIZE_IMG ||
			PostMan.prototype.lengthTest(inputMessage.messageBody , config.MAX_SIZE_IMG ) == false 	) 	{	
			
			console.error("getMessage  ::: didn't pass the format check 2" );
			return null;
		}
		

		var message = new Message(inputMessage);			 	
		
		return message;
	}
	catch (ex) {	
		console.error("getMessage  ::: didnt pass the format check ex:" + ex  + ex.stack ); 	
		return null;	
	} 	
};

PostMan.prototype.getDeliveryACK = function(encrypted, client) {	
	try {    
		var deliveryACK = PostMan.prototype.decrypt(encrypted, client);
		
		if (deliveryACK == null ||
			PostMan.prototype.isUUID(deliveryACK.msgID) == false  || 
			PostMan.prototype.isUUID(deliveryACK.to) == false  ||
			PostMan.prototype.isUUID(deliveryACK.from) == false  ||
			PostMan.prototype.isACKtype(deliveryACK.typeOfACK) == false ||
			Object.keys(deliveryACK).length != 4  ) {	
				
			console.error("getDeliveryACK ::: didnt pass the format check 1 " + JSON.stringify( deliveryACK )  );
			return null;
		}
		
		return deliveryACK; 
	}
	catch (ex) {
		console.error("getDeliveryACK ::: didnt pass the format check ex:" + ex  + ex.stack );
		return null;
	}	
};


PostMan.prototype.getpublicClientIDOfRequest = function(encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			typeof input.publicClientID !== 'string' ||
			Object.keys(input).length != 1 ) {	
			console.error("getpublicClientIDOfRequest ::: didnt pass the format check 1 :" + input );
			return null;
		}
		
		return input.publicClientID; 
	}
	catch (ex) {
		console.error("getpublicClientIDOfRequest ::: didnt pass the format check ex:" + ex  + ex.stack );
		return null;
	}	
};


PostMan.prototype.getKeysDelivery = function(encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			PostMan.prototype.isUUID(input.to) == false  ||
			PostMan.prototype.isUUID(input.from) == false  ||
			typeof input.setOfKeys != 'object' ||
			Object.keys(input).length != 3 ) {	
			console.error("getKeysDelivery ::: didnt pass the format check 1 :" + input );
			return null;
		}
		
		return input; 
	}
	catch (ex) {
		console.error("getKeysDelivery ::: didnt pass the format check ex:" + ex  + ex.stack );
		return null;
	}	
};


PostMan.prototype.getKeysRequest = function(encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			PostMan.prototype.isUUID(input.to) == false  ||
			PostMan.prototype.isUUID(input.from) == false  ||
			Object.keys(input).length != 2 ) {	
			console.error("getKeysRequest ::: didnt pass the format check 1 :" + input );
			return null;
		}		
		return input; 
	}
	catch (ex) {
		console.error("getKeysRequest ::: didnt pass the format check ex:" + ex  + ex.stack );
		return null;
	}	
};

PostMan.prototype.getPushRegistration = function( encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			PostMan.prototype.isUUID( input.publicClientID ) == false ||
			typeof input.token != 'string' ||
			Object.keys(input).length != 2 ) {	
			console.error("getPushRegistration ::: format check failed: " + input );
			return null;
		}		
		return input; 
	}
	catch (ex) {
		console.error("getPushRegistration ::: format check failed, ex: " + ex );
		return null;
	}	
};


PostMan.prototype.getReconnectNotification = function( encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			PostMan.prototype.isUUID( input.publicClientID ) == false ||
			Object.keys(input).length != 1 ) {	
			console.error("getReconnectNotification ::: format check failed: " + input );
			return null;
		}		
		return input; 
	}
	catch (ex) {
		console.error("getReconnectNotification ::: format check failed, ex: " + ex );
		return null;
	}	
};


PostMan.prototype.getWhoIsOnline = function( encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			PostMan.prototype.isUUID( input.idWhoIsOnline ) == false ||
			Object.keys(input).length != 2 ) {	
			console.error("getWhoIsOnline ::: format check failed: " );
			return null;
		}		
		return input; 
	}
	catch (ex) {
		console.error("getWhoIsOnline ::: format check failed, ex: " + ex );
		return null;
	}	
};


PostMan.prototype.getWhoIsWriting = function( encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			PostMan.prototype.isUUID( input.idWhoIsWriting ) == false ||
			PostMan.prototype.isUUID( input.toWhoIsWriting ) == false ||		
			Object.keys(input).length != 3 ) {	
			console.error("getWhoIsWriting ::: format check failed: " );
			return null;
		}		
		return input; 
	}
	catch (ex) {
		console.error("getWhoIsWriting ::: format check failed, ex: " + ex );
		return null;
	}	
};




PostMan.prototype.isUUID = function(uuid) {	

	if (typeof uuid == 'string')
		return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
	else
		return	false;

};

PostMan.prototype.isInt = function(timeStamp) {	
	return /^[0-9]+$/.test(String(timeStamp)) ;
};
//TODO
PostMan.prototype.isPurchase = function(purchase) {	
	return true;
};
//TODO
PostMan.prototype.isPaypalToken = function(token) {	
	return true;
};
//TODO
PostMan.prototype.isPaypalPayer = function(payerID) {	
	return true;
};




PostMan.prototype.isRSAmodulus = function(modulus) {	

	if (typeof modulus == 'string' && modulus.length < config.MAX_SIZE_MODULUS ){
		return true;	
	}else{		
		console.error("isRSAmodulus ::: didnt pass the format check ...." );
		return false;		
	}

};

PostMan.prototype.isACKtype = function(typeOfACK) {	
	if ( typeof typeOfACK == 'string' &&
		 ( 	typeOfACK == 'ACKfromServer' || 
			typeOfACK == 'ACKfromAddressee' || 
			typeOfACK == 'ReadfromAddressee'	) ) {			
		return true;
	}else{
		console.error("isACKtype ::: didnt pass the format check ");
		return false;		
	}
};

PostMan.prototype.lengthTest = function( obj , sizeLimit ) {
	try { 
		if ( typeof obj == 'string' && obj.length < sizeLimit ){
			return true;
		}else{
			console.error("lengthTest ::: is too big ");
			return false;
		}
	}catch (ex) {
		console.error("lengthTest ::: didnt pass the format check ex:" + ex  + ex.stack );
		return false;
	}
};


module.exports = PostMan;