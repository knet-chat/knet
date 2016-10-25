//MVP

//TODO translations in stores & images

//non MVP
//TODO FIX  m.youtube url for videos 
//TODO push notifications (plugin configuration on client iOS & windows)
//TODO optimization: lazy rendering of images
//TODO develop web
//TODO have our own emoticons
//TODO Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO try to save img as files in mobile version(save to file as they're received)
//TODO chineese,arab, japaneese
//TODO viralization via email, SMS from the user's contacts

	
function UserSettings( myUser ){
	this.index = (typeof myUser.index == "undefined" ) ? 0 : myUser.index;
	this.publicClientID = (typeof myUser.publicClientID == "undefined" ) ? null :myUser.publicClientID;
	this.myCurrentNick = (typeof myUser.myCurrentNick == "undefined" ) ? "" : myUser.myCurrentNick;
	this.myCommentary = (typeof myUser.myCommentary == "undefined" ) ? "" : myUser.myCommentary;	     		
	this.myPhotoPath = (typeof myUser.myPhotoPath == "undefined" ) ? "" : myUser.myPhotoPath; 
	this.myArrayOfKeys = (typeof myUser.myArrayOfKeys == "undefined" ) ? null : myUser.myArrayOfKeys; 
	this.lastProfileUpdate = (typeof myUser.lastProfileUpdate == "undefined" ) ? null : parseInt(myUser.lastProfileUpdate);
	this.handshakeToken = (typeof myUser.handshakeToken == "undefined" ) ? null : myUser.handshakeToken;
	this.myTelephone = (typeof myUser.myTelephone == "undefined" ) ? "" :myUser.myTelephone;
	this.myEmail = (typeof myUser.myEmail == "undefined" ) ? "" : myUser.myEmail;
	this.visibility = (typeof myUser.visibility == "undefined" ) ? "on" : myUser.visibility;
//	this.privateKey = (typeof myUser.privateKey == "undefined" ) ? {} : myUser.privateKey;
	this.keys = (typeof myUser.keys == "undefined" ) ? {} : myUser.keys;
};
UserSettings.prototype.updateUserSettings = function() {
	var transaction = db.transaction(["usersettings"],"readwrite");	
	var store = transaction.objectStore("usersettings");	
	var request = store.put(user);	
};
/*
 * @param messageBody.messageType := "multimedia" | "text" | "groupUpdate"
 */
function Message( input ){
	this.to = input.to;
	this.from = input.from;
	this.msgID = (input.msgID) ? input.msgID : this.assignId();
	this.messageBody = input.messageBody;
	this.size = (input.size) ? input.size : this.calculateSize();
	this.timestamp = (input.timestamp) ? parseInt(input.timestamp) : new Date().getTime();
	this.markedAsRead = (typeof input.markedAsRead != 'undefined') ? input.markedAsRead : false; 
	this.chatWith = (input.chatWith) ? input.chatWith : this.to;
	this.ACKfromServer = (typeof input.ACKfromServer != 'undefined') ? input.ACKfromServer : false; 
	this.ACKfromAddressee = (typeof input.ACKfromAddressee != 'undefined') ? input.ACKfromAddressee : false; 

};
// http://www.ietf.org/rfc/rfc4122.txt
Message.prototype.assignId = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
};
Message.prototype.calculateSize = function(){
	var size = 0;
 	if ( this.messageBody.messageType == "text" ){
		size = this.messageBody.text.length;
	}else if ( this.messageBody.messageType == "multimedia" ){
		size = this.messageBody.src.length;
	}
	return size;
};
Message.prototype.convertToUTF = function(){
	this.messageBody.text = encodeURI(this.messageBody.text);
};
Message.prototype.getMsgID = function(){
	return this.msgID;
};

/**
 * @param msg := Message
 * @return truncated := String
 */
Message.prototype.getTruncatedMsg = function() {

	var truncated = "";
	if ( this.messageBody.messageType == "multimedia"){
		//truncated = "\uD83D";		
		truncated = "&#x1f4f7;";		
	} else if ( this.messageBody.messageType == "text"){
		truncated =	decodeURI(gui._sanitize( this.messageBody.text) ).substring(0, config.MAX_LENGTH_TRUNCATED_SMS);
	}
	return truncated; 
};

Message.prototype.setChatWith = function( publicClientID ){
	this.chatWith = publicClientID;
};
Message.prototype.setACKfromServer = function( bool ){
	this.ACKfromServer = bool;
};
Message.prototype.setACKfromAddressee = function ( bool ){
	this.ACKfromAddressee = bool;
};

//END Class Message

function Postman() {
};

Postman.prototype._isUUID = function(uuid) {	

	if (typeof uuid == 'string')
		return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
	else
		return	false;

};


Postman.prototype.createCertificate = function( keys ) {
	
	var cn = 'client';
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

	log.debug('createcertificate created for \"' + cn + '\": \n' + forge.pki.certificateToPem( cert) );
	
	return cert;
	
};

Postman.prototype.generateKeyPair = function() {
	
	var deferred = $.Deferred();

	var options = {};
	options.bits = 2048;
	options.e = 0x10001;
	
	if ( $.browser.chrome ){
	    var base_url = window.location.href.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
	    var array = ['var base_url = "' + base_url + '";' + $('#worker_1').html()];
	    var blob = new Blob(array, {type: "text/javascript"});
	    options.workerScript  = window.URL.createObjectURL(blob);
	}else{
		options.workerScript = "js/prime.worker.js";
	}
		
	if( typeof Worker !== "undefined" ){		
		forge.pki.rsa.generateKeyPair( options , function ( err, keyPair){
			deferred.resolve( keyPair );
		});
	}else{
		var keyPair = forge.pki.rsa.generateKeyPair( options );
		deferred.resolve( keyPair );
	}
	return deferred.promise(); 
};

Postman.prototype.createTLSConnection = function( options  ) {

	var clientTLS = forge.tls.createConnection({
	  server: false,
	  caStore: [ options.serversPEMcertificate ],
	  sessionCache: {},
	  // supported cipher suites in order of preference
	  cipherSuites: [
	    forge.tls.CipherSuites.TLS_RSA_WITH_AES_128_CBC_SHA,
	    forge.tls.CipherSuites.TLS_RSA_WITH_AES_256_CBC_SHA],
	  virtualHost: 'authknetserver',
	  verify: function(c, verified, depth, certs) {
	    log.debug(
	      'TLS Client verifying certificate w/CN: \"' +
	      certs[0].subject.getField('CN').value +
	      '\", verified: ' + verified + '...');
	    return verified;
	  },
	  connected: function(c) {
	    log.info('TLS Client connected...');
	    // send message to server
	    setTimeout(function() {
	      c.prepareHeartbeatRequest('heartbeat');
	    }, 1);
	    options.onConnected();
	  },
	  getCertificate: function(c, hint) {
	    log.info('TLS Client getting certificate ...');
	    return app.keys.certificate;
	  },
	  getPrivateKey: function(c, cert) {
	    return forge.pki.privateKeyToPem( app.keys.privateKey );
	  },
	// send base64-encoded TLS data to server
	  tlsDataReady: function(c) {	
		  try{
			  var data2send =  c.tlsData.getBytes();
			  app.authSocket.emit('data2Server', forge.util.encode64( data2send ) );			
		  }catch(e){
			  log.debug("TLS Client data2Server ::: exception"  + e);
		  }
	  },
	  // receive clear base64-encoded data from TLS from server
	  dataReady: function(c) {
		  var data2receive = c.data.getBytes();
		  log.info('TLS Client received', data2receive );
		  options.onTLSmsg( data2receive );
	  },
	  heartbeatReceived: function(c, payload) {
	    log.debug('TLS Client received heartbeat: ' + payload.getBytes());
	  },
	  closed: function(c) {
	    log.debug('TLS Client connection closed.');
	    options.onClosed();
	  },
	  error: function(c, error) {
	    log.error('TLS Client error: ' + error.message);
	    options.onError();
	  }
	});
	
	return clientTLS;	
};


Postman.prototype.encrypt = function(message) {
	try {    

		var cipher = forge.cipher.createCipher('AES-CBC', app.symetricKey2use );
		var iv = Math.floor((Math.random() * 7) + 0);		
		
		cipher.start({iv: user.myArrayOfKeys[iv] });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  iv +  cipher.output.data  ;
		
		return envelope ;

	}
	catch (ex) {	
		log.debug("Postman.prototype.encrypt", ex);
		return null;
	}	
};
Postman.prototype.encryptHandshake = function(message) {
	try {    

		var cipher = forge.cipher.createCipher('AES-CBC', app.symetricKey2use );		

		cipher.start({iv: app.symetricKey2use });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  cipher.output.data  ;
					
		return envelope ;

	}
	catch (ex) {	
		log.debug("Postman.prototype.encryptHandshake", ex);
		return null;
	}	
};
Postman.prototype.encryptMsgBody = function( message ) {
	try {
		var toContact = contactsHandler.getContactById( message.to );
				
		if ( toContact.encryptionKeys == null){
			contactsHandler.setEncryptionKeys(toContact);		
		}

		var index4Key = Math.floor((Math.random() * 7) + 0);
		var index4iv = Math.floor((Math.random() * 7) + 0);		
		
		var symetricKey2use = toContact.encryptionKeys[index4Key];
		var iv2use = toContact.encryptionKeys[index4iv];
		
		var cipher = forge.cipher.createCipher( 'AES-CBC', symetricKey2use );
		cipher.start( { iv: iv2use } );
		cipher.update( forge.util.createBuffer( JSON.stringify( message.messageBody ) ) );
		cipher.finish();		
		
		var messageBody =  { 
			index4Key : index4Key , 
			index4iv : index4iv , 
			encryptedMsg : cipher.output.data 
		};		
		return messageBody;
	}
	catch (ex) {	
		log.debug("Postman.prototype.encryptMsgBody",ex);
		return null;
	}	
};


Postman.prototype.decrypt = function(encrypted) {	
	try {    

		var decipher = forge.cipher.createDecipher('AES-CBC', app.symetricKey2use);

		var iv = parseInt(encrypted.substring(0,1));

		decipher.start({iv: user.myArrayOfKeys[iv] });
		decipher.update(forge.util.createBuffer( encrypted.substring( 1 ) ) );
		decipher.finish();

		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);

	}
	catch (ex) {	
		log.debug("Postman.prototype.decrypt", ex);
		return null;
	}	
};




Postman.prototype.decryptHandshake = function(encrypted) {	
	try {    

		var decipher = forge.cipher.createDecipher('AES-CBC', app.symetricKey2use);

		var iv = app.symetricKey2use

		decipher.start({iv: iv });
		decipher.update(forge.util.createBuffer( encrypted ) );
		decipher.finish();		
		
		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);

	}
	catch (ex) {	
		log.debug("Postman.prototype.decryptHandshake", ex);
		return null;
	}	
};


/**
 * Postman.prototype.decryptMsgBody
 *
 * @param message the "Message" Object.
 * 
 * @return the decrypted "Message.messageBody" Object.
 */
Postman.prototype.decryptMsgBody = function( message ) {	
	try {		
		var fromContact = contactsHandler.getContactById( message.from );
		if (typeof fromContact == "undefined" || fromContact.decryptionKeys == null){
			postman.send("KeysRequest", { from : user.publicClientID , to : fromContact.publicClientID } );
			mailBox.storeMessage( message );
			return null;			
		}
		
		var iv = fromContact.decryptionKeys[parseInt(message.messageBody.index4iv)];
		var symetricKey2use = fromContact.decryptionKeys[parseInt(message.messageBody.index4Key)];
		
		var decipher = forge.cipher.createDecipher('AES-CBC', symetricKey2use);
		decipher.start({ iv: iv });
		decipher.update(forge.util.createBuffer( message.messageBody.encryptedMsg ) );
		decipher.finish();
		
		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);
	}
	catch (ex) {	
		log.debug("Postman.prototype.decryptMsgBody", ex);
		return null;
	}	
};

Postman.prototype.getParameterByName = function ( name, href ){
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( href );
  if( results == null )
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
};

Postman.prototype.getListOfHeaders = function(encryptedList) {	
	try {    
		
		var listOfHeaders =	Postman.prototype.decrypt(encryptedList).list;
		if (Array.isArray(listOfHeaders) == false) { return null;}

		for (var i = 0; i < listOfHeaders.length; i++){
			if (typeof listOfHeaders[i].msgID !== 'string' || 
				typeof listOfHeaders[i].size !== 'number'||
				Object.keys(listOfHeaders[i]).length != 2  ) {	
				return null;
			}
		}
		
		return listOfHeaders; 
	}
	catch (ex) {	
		return null;
	}	
};

Postman.prototype.getPlanImgFromServer = function(input) {	
	try {    

		var parameters = Postman.prototype.decrypt(input);
		
		if (parameters == null ||
			Postman.prototype._isUUID( parameters.planId) == false	|| 
			typeof parameters.imgsrc !== 'string' ||			
			Object.keys(parameters).length != 2  ) {
			log.debug("getPlanImgFromServer - type check", parameters); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		log.debug("getPlanImgFromServer - type check", ex); 
		return null;
	}
};



Postman.prototype.getPlansAround = function(encryptedList) {	
	try {		
		var listOfPlans = Postman.prototype.decrypt(encryptedList).list;
		if (Array.isArray(listOfPlans) == false) { return null;}

		for (var i = 0; i < listOfPlans.length; i++){
			if (
				Postman.prototype._isUUID(listOfPlans[i].planId) == false  || 
				Postman.prototype._isUUID(listOfPlans[i].organizer) == false  || 
				typeof listOfPlans[i].nickName !== 'string' || 
				typeof listOfPlans[i].commentary !== 'string' || 				
				typeof listOfPlans[i].location.lat  !== 'string' ||
				typeof listOfPlans[i].location.lon  !== 'string' ||
				Object.keys(listOfPlans[i].location).length != 2 ||		
				//! (typeof listOfPlans[i].meetingInitDate == 'number' ||  listOfPlans[i].meetingInitDate == null ) 
				typeof listOfPlans[i].meetingInitDate  !== 'string' ||
				typeof listOfPlans[i].meetingInitTime.hour  !== 'string' ||
				typeof listOfPlans[i].meetingInitTime.mins  !== 'string' ||
				Object.keys( listOfPlans[i].meetingInitTime).length != 2 ) {	
				log.debug( listOfPlans[i] );
				return null;				
			}
		}		
		return listOfPlans; 
	}
	catch (ex) {	
		return null;
	}	
};


Postman.prototype.getProcessNewContacts = function(encryptedList) {	
	try {    
		
		var listOfNewContacts = Postman.prototype.decrypt(encryptedList).list;
		if (Array.isArray(listOfNewContacts) == false) { 
			log.debug("Postman.prototype.getProcessNewContacts - type check 1", listOfNewContacts); 
			return null;
		}

		for (var i = 0; i < listOfNewContacts.length; i++){
			if (typeof listOfNewContacts[i].publicClientID !== 'string' || 
				!(typeof listOfNewContacts[i].nickName == 'string' ||  listOfNewContacts[i].nickName == null ) ||				
				!(typeof listOfNewContacts[i].commentary == 'string' || listOfNewContacts[i].commentary == null ) ||
				typeof listOfNewContacts[i].location !== 'object'||
				typeof listOfNewContacts[i].pubKeyPEM !== 'string' ||
				Object.keys(listOfNewContacts[i]).length != 5  ) {	
				log.debug("Postman.prototype.getProcessNewContacts - type check 2", listOfNewContacts);  
				return null;
			}
		}		
			
		return listOfNewContacts; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getProcessNewContacts - type check 3", listOfNewContacts); 
		return null;
	}	
};

Postman.prototype.getDeliveryReceipt = function(inputDeliveryReceipt) {	
	try {    

		var deliveryReceipt = Postman.prototype.decrypt(inputDeliveryReceipt);
		
		if (deliveryReceipt == null ||
			typeof deliveryReceipt.msgID !== 'string' 	|| 
			typeof deliveryReceipt.typeOfACK !== 'string'||
			typeof deliveryReceipt.to !== 'string'		||
			Object.keys(deliveryReceipt).length != 3  ) {	
			return null;
		}
		
		return deliveryReceipt; 
	}
	catch (ex) {	
		log.debug("Postman.prototype.getDeliveryReceipt", ex); 
		return null;
	}	
};

Postman.prototype.getProfileRequest = function(input) {	
	try {    

		var parameters = Postman.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.lastProfileUpdate !== 'number' 	|| 
			Object.keys(parameters).length != 1  ) {
			log.debug("Postman.prototype.getProfileRequest - type check", parameters); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		log.debug("Postman.prototype.getProfileRequest - type check", ex); 
		return null;
	}	
};


Postman.prototype.getProfileFromServer = function(input) {	
	try {    

		var parameters = Postman.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.publicClientID !== 'string' || parameters.publicClientID == null ||
			typeof parameters.nickName !== 'string' || parameters.nickName == null ||
			typeof parameters.commentary !== 'string' || parameters.commentary == null ||	
			typeof parameters.imgsrc !== 'string' || parameters.imgsrc == null ||
			typeof parameters.telephone !== 'string' || parameters.telephone == null ||	
			typeof parameters.email !== 'string' || parameters.email == null) {
			
			log.debug("Postman.prototype.getProfileFromServer - type check", parameters); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		log.debug("Postman.prototype.getProfileFromServer - type check", ex); 
		return null;
	}	
};


Postman.prototype.getLocationFromServer = function(input) {	
	try {    

		var position = Postman.prototype.decrypt(input);
		
		if (position == null ||
			typeof position !== 'object' 	|| 
			typeof position.coords !== 'object'  ) {
							
			log.debug("Postman.prototype.getLocationFromServer - type check", position); 
			return null;
		}
		
		return position; 
	}
	catch (ex) {	
		log.debug("Postman.prototype.getLocationFromServer - type check", ex); 
		return null;
	}	
};

Postman.prototype.getKeysDelivery = function(encrypted) {	
	try {    
		var input = Postman.prototype.decrypt(encrypted);
		
		if (input == null ||
			Postman.prototype._isUUID(input.to) == false  ||
			Postman.prototype._isUUID(input.from) == false  ||
			typeof input.setOfKeys != 'object' ||
			Object.keys(input).length != 3 ) {	
			log.debug("Postman.prototype.getKeysDelivery - type check", input); 
			return null;
		}
		
		return input; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getKeysDelivery - type check", ex); 
		return null;
	}	
};

Postman.prototype.getKeysRequest = function(encrypted) {	
	try {    
		var input = Postman.prototype.decrypt(encrypted);
		
		if (input == null ||
			Postman.prototype._isUUID(input.to) == false  ||
			Postman.prototype._isUUID(input.from) == false  ||
			Object.keys(input).length != 2 ) {	
			log.debug("Postman.prototype.getKeysRequest - type check", input); 
			return null;
		}		
		return input; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getKeysRequest - type check", ex); 
		return null;
	}	
};

Postman.prototype.getMessageFromClient = function( input ) {	
	try {
		
		input.messageBody = Postman.prototype.decryptMsgBody( input );
		
		if ( input.messageBody == null ||
			Postman.prototype._isUUID( input.to ) == false  ||
			Postman.prototype._isUUID( input.from ) == false  ||
			Postman.prototype._isUUID( input.msgID ) == false ){
				
		log.error("Postman.prototype.getMessageFromClient - type check", input); 
			return null;
		}
		
		var message = new Message( input );	
		message.setACKfromServer(true);
		message.setACKfromAddressee(true);		
		
		return message; 	
	} 
	catch (ex) {	
		log.error("Postman.prototype.getMessageFromClient - type check", ex);
		return null;
	}
};

Postman.prototype.getWhoIsOnline = function(encrypted) {	
	try {    
		var input = Postman.prototype.decrypt(encrypted);
		
		if (input == null ||
			Postman.prototype._isUUID(input.idWhoIsOnline) == false  ||
			Object.keys(input).length != 1 ) {	
			log.debug("Postman.prototype.getWhoIsOnline - type check", input); 
			return null;
		}		
		return input; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getWhoIsOnline - type check", ex); 
		return null;
	}	
};

Postman.prototype.getWhoIsWriting = function(encrypted) {	
	try {    
		var input = Postman.prototype.decrypt(encrypted);
		
		if (input == null ||
			Postman.prototype._isUUID(input.idWhoIsWriting) == false  ||
			Postman.prototype._isUUID(input.toWhoIsWriting) == false  ||
			Object.keys(input).length != 2 ) {	
			log.debug("Postman.prototype.getWhoIsWriting - type check", input); 
			return null;
		}		
		return input; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getWhoIsWriting - type check", ex); 
		return null;
	}	
};

Postman.prototype.onMsgFromClient = function ( input ){
	
	var msg = postman.getMessageFromClient( input ); 
	if (msg == null) { return;	}		
		
	var messageACK = {	
		to : msg.to, 
		from : msg.from,
		msgID : msg.msgID, 
		typeOfACK : "ACKfromAddressee"
	};
	postman.send("MessageDeliveryACK", messageACK );	
	
	if (msg.messageBody.messageType == "multimedia" || 
		msg.messageBody.messageType == "text" ||
		msg.messageBody.messageType == "inclusionRequest" ){
			
		var publicClientID;
		if ( msg.to != msg.chatWith ){
			publicClientID = msg.chatWith;
		}else{
			publicClientID = msg.from;
		}
		
		var obj = abstractHandler.getObjById( publicClientID ); 
		if (typeof obj == "undefined") return;
		
		if( obj.isBlocked ) return; 
		
		msg.setChatWith( publicClientID );
		mailBox.storeMessage( msg );
				 		 		
		if ( app.currentChatWith == publicClientID ){
			gui.showMsgInConversation( msg, { isReverse : false, withFX : true } );
		}else{
			obj.counterOfUnreadSMS++ ;
			gui.refreshCounterOfChat( obj );  		  			
		}  		  		
		obj.timeLastSMS = msg.timestamp;
		obj.lastMsgTruncated = msg.getTruncatedMsg();
		gui.setTimeLastSMS( obj );
		
		
		abstractHandler.setOnList( obj );
		abstractHandler.setOnDB( obj );
		
		gui.showEntryOnMainPage( obj ,false);
				  				
		gui.showLocalNotification( msg );
		gui.showLastMsgTruncated( obj );
	
	}else if( msg.messageBody.messageType == "groupUpdate" ) {
	  
		var group = new Group( msg.messageBody.group );
		groupsHandler.setGroupOnList( group );
		groupsHandler.setGroupOnDB( group );
		
		gui.showGroupsOnGroupMenu();
		gui.showEntryOnMainPage( group ,false);
				
		group.listOfMembers.map( function( publicClientID ){
			if ( user.publicClientID == publicClientID ) return;
			var contact = contactsHandler.getContactById( publicClientID ); 
	  		if ( typeof contact == 'undefined' || contact == null ){
				contact = new ContactOnKnet({ publicClientID : publicClientID });
				contactsHandler.setContactOnList( contact );												
				contactsHandler.setContactOnDB( contact );
				contactsHandler.sendProfileRequest( contact );
	  		} 
		});
		
	}else if ( msg.messageBody.messageType == "req4EasyRTCid"){
		
	    $('body').pagecontainer('change', '#conference-page', { transition : "none" });
	    app.currentChatWith = msg.from;
		var contact = contactsHandler.getContactById( app.currentChatWith); 
		if (typeof contact == "undefined" || contact == null) return;		
		$('#imgConferenceCaller').remove();
		$('.ui-height-70percent').prepend($('<img>',{id:'imgConferenceCaller',src: contact.imgsrc, class: 'vertical-center' }));
		
		$('#callRejectButton').show().unbind("click").on("click", function(){ 
			$('body').pagecontainer('change', '#chat-page', { transition : "none" });
	   		easyrtc.disconnect();			  
	   		easyrtc.closeLocalMediaStream();
	   		easyrtc.setRoomOccupantListener( function(){});	
		});
		$('#callAcceptButton').show().unbind("click").on("click", function(){
			$('#callAcceptButton').hide();
		    easyrtc.initMediaSource(
	  	      function(){        // success callback
	  	          easyrtc.connect("easyrtc.audioOnly", app.easyRTC_getReady4Call, app.easyRTC_connectFailure );
	  	      },
	  	      function(errorCode, errmesg){
	  	          easyrtc.showError(errorCode, errmesg);
	  	      }  // failure callback
	  	    );			
		});	
		
	}else if ( msg.messageBody.messageType == "res4EasyRTCid"){
				
		app.otherEasyrtcid = msg.messageBody.easyRTCid;			
		easyrtc.hangupAll();		
	    easyrtc.initMediaSource(
	      function(){        // success callback
	          easyrtc.connect("easyrtc.audioOnly", app.easyRTC_PerformCall, app.easyRTC_connectFailure );
	      },
	      function(errorCode, errmesg){
	          easyrtc.showError(errorCode, errmesg);
	      }  // failure callback
	    );
	}
};



Postman.prototype.send = function(event2trigger, data  ) {
	
	if (typeof event2trigger !== 'string' ||
		typeof data !== 'object' || data == null ) 	{	
		
		log.debug("Postman.prototype.send - type check", data);
		return null;
	}	
	
	try{
		if (typeof socket != "undefined" && socket.connected == true){
			socket.emit(event2trigger, Postman.prototype.encrypt( data ) );
		}	
					
	}catch(e){
		log.debug("Postman.prototype.send - type check", e);
	}		
		
};

Postman.prototype.sendMsg = function( msg ) {	
	try{
		if (msg.messageBody == null){
			log.debug("Postman.prototype.sendMsg ::: type check failed");
			mailBox.removeMessage( msg );
			return;
		}
		var obj = abstractHandler.getObjById( msg.chatWith );
		obj.timeLastSMS = msg.timestamp;
		obj.lastMsgTruncated = msg.getTruncatedMsg();
		gui.setTimeLastSMS( obj );		
		abstractHandler.setOnList( obj );
		abstractHandler.setOnDB( obj );				  				
		gui.showEntryOnMainPage( obj ,false);
		gui.showLastMsgTruncated( obj );
		
		
		var listOfMsg2send = [];		
		var membersOfGroup = groupsHandler.getMembersOfGroup( msg.chatWith );
		
		if ( membersOfGroup.length > 0 ){			
		    membersOfGroup.map(function( memberPublicId ){
		    	if ( user.publicClientID == memberPublicId ) return;
		    	var copyOfMsg = new Message( msg );
		    	copyOfMsg.to = memberPublicId; 
		    	listOfMsg2send.push( copyOfMsg );		    	
		    });
		}else{
			listOfMsg2send.push( msg );
		}
			
		listOfMsg2send.map(function (m){
			m.messageBody = postman.encryptMsgBody( m );	
			if (typeof socket != "undefined" && socket.connected == true){
				socket.emit("message2client", m );
			}			
		});
				
	}catch(e){
		log.debug("Postman.prototype.sendMsg", e);
	}	
};

Postman.prototype.signToken = function(message) {	
	try {    
		var stringMessage = JSON.stringify(message);
		var pHeader = {'alg': 'HS512', 'typ': 'JWT'};
		var sHeader = JSON.stringify(pHeader);		
		var stringJWS = '';
		stringJWS  = KJUR.jws.JWS.sign('HS512', sHeader, stringMessage, app.symetricKey2use);		
		return stringJWS; 
	}
	catch (ex) {	return null;	}	
};
//END Class Postman

function GUI() {
	this.listOfImages4Gallery = [] ;
	this.indexOfImages4Gallery = 0;
	this.inAppBrowser = null;
	this.photoGallery = null;
	this.photoGalleryClosed = true;
	this.groupOnMenu = null;
	this.formatter = function(){};
	this.searchMap = null; 
	this.listOfPlans = null;
	this.isPlanDisplayed = false;
};

GUI.prototype._parseLinks = function(htmlOfContent) {
	var result = {};
	result.mediaLinks = [];
	var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
	
	result.htmlOfContent = htmlOfContent.replace(urlRegEx, function (match){
		var link2media = gui._testUrlForMedia(match);		
		if (link2media){
			result.mediaLinks.push(link2media);
		}else { 
			if ( match.substring(1,4) != "http") match = "http://" + match;
		}		
	    return "<a href='" + match + "'>" + match + "</a>";
	});
	
	return result;
};

GUI.prototype._sanitize = function(html) {
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
	return html.replace(/</g, '&lt;');
};

GUI.prototype._sortChats = function() {	
	var ul = $('ul#listOfContactsInMainPage'),
	    li = ul.children('li');
	    
	    li.detach().sort(function(a,b) {
	        return ( parseInt($(a).data('sortby')) < parseInt($(b).data('sortby')) ) ;  
	    });
	    ul.empty();	    
	    ul.append(li);
	    $('#listOfContactsInMainPage').listview().listview('refresh');
};


GUI.prototype._testUrlForMedia = function(url) {
	var success = false;
	var media   = {};
	var youtube_Reg = /https?:\/\/(?:www\.)?(?:(?:youtu\.be\/)|(?:(?:(?:youtube-nocookie\.com\/|youtube\.com\/|youtu\.be\/).*)(?:(?:v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))))([^#\&\?]*).*/;
	var match = url.match(youtube_Reg);
	if (match){
		media.type  = "youtube";
	    media.id    = match[1].split(" ")[0];
	    media.url 	= url;
	    success = true;
	}else{
		var vimeo_Reg = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
		var match = url.match(vimeo_Reg);
		if (match) {
		    media.type  = "vimeo";
		    media.id    = match[3];
		    media.url 	= url;
		    success = true;
		}			
	} 
	if (success) return media; else return false;
	
};

GUI.prototype.bindButtonsOnMainPage = function() {
	
	if ( app.isMobile && app.devicePlatform.indexOf('iOS') > -1 || 
		$.browser.ipad || $.browser.iphone || $.browser.ipod || 
		app.isMobile && (app.devicePlatform == "WinCE" || app.devicePlatform == "Win32NT") ){
		$('#link2activateAccount').remove().trigger( "updatelayout" );
		//$('#link2searchPage').remove().trigger( "updatelayout" );		
		$('#mypanel-list').listview().listview('refresh');
		$( "#mypanel" ).trigger( "updatelayout" );
	}
	$("#link2panel").on("click",function() {
		$( "#mypanel" ).panel( "open" );
	});
	$(".button2mainPage").on("click",function() {
		$('body').pagecontainer('change', '#MainPage', { transition : "none" });
	});
	$("#mapButtonInMainPage").on("click",function() {
		if ( app.myPosition.coords.latitude != "" ){
			$('body').pagecontainer('change', '#map-page', { transition : "none" });
		}
	});
};

/* $( "body" ).on( "pagecontainershow", function( event, ui ) { does not work on Android ... */
/* $(document).on("click","#chat-input-button", gui.onChatInput );  (removed) */

GUI.prototype.bindDOMevents = function(){
	
	$("body").on('pagecontainertransition', function( event, ui ) {
	    if (ui.options.target == "#MainPage"){	    	
	    	$("#chat-page-content").empty();
	    	$("#ProfileOfContact-page").empty();
			app.currentChatWith = null;
			gui.listOfImages4Gallery = null;
			gui.listOfImages4Gallery = [];
			gui.indexOfImages4Gallery = 0;			
			gui.onProfileUpdate();
			$.mobile.silentScroll(0);
			if (app.devicePlatform == "WinCE" || app.devicePlatform == "Win32NT") {
				document.removeEventListener('backbutton',  gui.onBackButton , false);
			}else{
		        document.addEventListener('backbutton',  gui.onBackButton , false);
		    }
		}else{
			document.addEventListener('backbutton',  gui.onBackButton , false);
		}
	    if (ui.options.target == "#map-page"){		
			gui.loadMaps();				 
	    }
	    if (ui.options.target == "#ProfileOfContact-page"){		
						 
	    }
	    if (ui.options.target == "#chat-page"){	
			$("#ProfileOfContact-page").remove();			
	    }	    
	    if (ui.options.target == "#profile"){		
			gui.loadProfile(); 					 
	    }	
	    if (ui.options.target == "#createGroup"){		
			gui.loadGroupMenu();
	    }
	    if (ui.options.target == "#forwardMenu"){		
			gui.loadTargetsOnForwardMenu();
	    }
	    if (ui.options.target == "#searchPage"){
			gui.loadMapSearch();				 
	    }
	    if (ui.options.target == "#searchResultsPage"){
	    	$("#listInResultsPage").empty();
	    	var previousMaker = gui.searchMap.currentMarker;
	    	var latlng = previousMaker.getLatLng();
	    	app.sendRequest4Neighbours( latlng );
	    	app.sendRequest4Plans( latlng )
			gui.loadMapPlanPage('mapResultPage');
	    }
	    if (ui.options.target == "#createPlanPage"){

	    	gui.loadGroupInPlanPage();
			gui.loadImgPkrInPlanPage();
			gui.loadMapPlanPage('mapPlanPage');
			gui.loadDatePkrInPlanPage();
			
	    }
	    gui.hideLoadingSpinner();
	    
	});	
	$(document).on("pageshow","#emoticons",function(event){
		$('#chat-input').emojiPicker("toggle");
	});
	$(document).on("pageshow","#chat-page",function(event, ui){				
		$.mobile.silentScroll($(document).height());	
		$('#chat-input').emojiPicker("hide");
		if ( ui.prevPage.attr('id') == "emoticons"){ 
			$('#chat-input').focus();
		}
	});	
	$(document).on("pageshow","#profile",function(event){		
		if(user.myCurrentNick == ""){
			$("#nickNameInProfile").html(user.publicClientID);
		} else{
			$("#nickNameInProfile").html(user.myCurrentNick);
		}		
		$("#profileNameField").val(user.myCurrentNick);
		$("#commentaryInProfile").html(user.myCommentary);
		$("#profileCommentary").val(user.myCommentary);
		$("#profileTelephone").val(user.myTelephone);
		$("#profileEmail").val(user.myEmail);
		$("#flip-visible").val(user.visibility).slider("refresh");
		$("#label_id_profile").html("&#x1F511; " + user.publicClientID);
		
	});

	$("#chat-input")
	    .css( { "width": $(window).width() * 0.70 , "height" : 54 } )
	    .emojiPicker({
		    width: $(window).width(),
		    height: $(window).height(),
		    button: false
		})
		.on("input", function() {
			var textMessage = $("#chat-input").val();
			if (textMessage == '') {
				$('#chat-multimedia-image').attr("src", "res/multimedia_50x37.png");
				$("#chat-multimedia-button").unbind().bind( "click", gui.showImagePic );		
			}else{
				$('#chat-multimedia-image').attr("src", "res/smile_50x37.png");
				$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
			}
		})
		.keyup(function( event ) {
			if (event.keyCode == 13){
				gui.onChatInput();
			}
			var currentTime = new Date().getTime();
			var lastkeyup = parseInt( $( event.target ).data("lastkeyup") );

			if ( (currentTime - config.TIME_FADE_WRITING * 5 ) > lastkeyup ){
				$( event.target ).data("lastkeyup", currentTime);

				var list = [];		
				var membersOfGroup = groupsHandler.getMembersOfGroup( app.currentChatWith );
				
				if ( membersOfGroup.length > 0 ){			
				    membersOfGroup.map(function( memberPublicId ){
				    	if ( user.publicClientID == memberPublicId ) return; 
				    	list.push( memberPublicId );		    	
				    });
				}else{
					list.push( app.currentChatWith );
				}
					
				var ping = {	
		  			idWhoIsWriting: user.publicClientID, 
		  			toWhoIsWriting : app.currentChatWith,
		  			listOfReceivers : list	  			
			  	};					
				postman.send("WhoIsWriting", ping );
			}
		})
		.focus(function() {
			$('#chat-multimedia-image').attr("src", "res/smile_50x37.png");
			$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
		})
		.click(function() {
			$('#chat-multimedia-image').attr("src", "res/smile_50x37.png");
			$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
		});	
	
	$("#chat-multimedia-button").bind("click", gui.showImagePic );	

	$(".backButton").on("click",function() {
		gui.onBackButton();
	});

	
	$("#nickNameInProfile").on("click",function() {
		$("#profileNameField").focus();
	});	
	
	$("#profileNameField")
		.on("input", function() {
			user.myCurrentNick = $("#profileNameField").val();	
			$("#nickNameInProfile").text(user.myCurrentNick);
			app.profileIsChanged = true;
		})
		.on("focus", function() {
			if (user.myCurrentNick == user.publicClientID){
				$("#nickNameInProfile").html("");
				$("#profileNameField").val("");
			}		
		});
	$("#commentaryInProfile").on("click",function() {
		$("#profileCommentary").focus();
	});	
	
	$("#profileCommentary").on("input", function() {
		user.myCommentary = $("#profileCommentary").val();
		$("#commentaryInProfile").text(user.myCommentary);	
		app.profileIsChanged = true;
	});
	
	
	$("#nickNameGroup").on("click",function() {
		$("#nickNameGroupField").focus();
	});	
	$("#nickNameGroupField")
		.on("input", function() {
			gui.groupOnMenu.nickName = $("#nickNameGroupField").val();
			$("#nickNameGroup").text( gui.groupOnMenu.nickName );	
		})
		.on("focus", function() {
			if (dictionary.Literals.label_23 == $("#nickNameGroupField").val() ){
				$("#nickNameGroup").html("");
				$("#nickNameGroupField").val("");
			}		
		});
	$("#commentaryGroup").on("click",function() {
		$("#commentaryGroupField").focus();
	});	
	$("#commentaryGroupField")
		.on("input", function() {
		gui.groupOnMenu.commentary = $("#commentaryGroupField").val();
		$("#commentaryGroup").text( gui.groupOnMenu.commentary );	
		})
		.on("focus", function() {
			if (dictionary.Literals.label_12 == $("#commentaryGroupField").val() ){
				$("#commentaryGroup").html("");
				$("#commentaryGroupField").val("");
			}		
		});	
	
	
	$("#nickNamePlan").on("click",function() {
		$("#nickNamePlanField").focus();
	});	
	$("#nickNamePlanField")
		.on("input", function() {
			gui.groupOnMenu.nickName = $("#nickNamePlanField").val();
			$("#nickNamePlan").text( gui.groupOnMenu.nickName );	
		})
		.on("focus", function() {
			if (dictionary.Literals.label_23 == $("#nickNamePlanField").val() ){
				$("#nickNamePlan").html("");
				$("#nickNamePlanField").val("");
			}		
		});
	$("#commentaryPlan").on("click",function() {
		$("#commentaryPlanField").focus();
	});	
	$("#commentaryPlanField")
		.on("input", function() {
		gui.groupOnMenu.commentary = $("#commentaryPlanField").val();
		$("#commentaryPlan").text( gui.groupOnMenu.commentary );	
		})
		.on("focus", function() {
			if (dictionary.Literals.label_12 == $("#commentaryPlanField").val() ){
				$("#commentaryPlan").html("");
				$("#commentaryPlanField").val("");
			}		
		});	
	
		
	$("#profileTelephone").on("input", function() {
		user.myTelephone = $("#profileTelephone").val();	
		app.profileIsChanged = true;
	});
	$("#profileEmail").on("input", function() {
		user.myEmail = $("#profileEmail").val();
		app.profileIsChanged = true;
	});
	$("#flip-visible").on("change", function() {
		user.visibility = $("#flip-visible").val();
		app.profileIsChanged = true;
	});
	
	$("#mapButtonInChatPage").on("click" ,function() {
		if ( app.myPosition.coords.latitude != "" && gui.photoGalleryClosed ){
			$('body').pagecontainer('change', '#map-page', { transition : "none" });
		}
	});
	
	$("#buyButton").on("click", app.onProcessPayment );	
	$("input[name='license-choice']").on("change", gui.refreshPurchasePrice );
	$("#NGOdonation").on("change", gui.refreshPurchasePrice );
	$("#FSIdonation").on("change", gui.refreshPurchasePrice );
//	$("#Backup").on("change", gui.refreshPurchasePrice );
	
	$("#groupsButton")
	 .on("click", gui.onGroupsButton )
	 .text( dictionary.Literals.label_38 )
	 .data( 'action', 'create' );
	 
	//$(document).on("click","#firstLoginInputButton", gui.firstLogin );
	
	$(window).on("debouncedresize", function( event ) {
		$('#chat-input')
			.css( { "width": $(window).width() * 0.70 , "height" : 54 } ) 
			.emojiPicker("reset"); 
	});	
	$("#link2profileOfContact").bind("click", function(){ gui.showProfile(); } );	

	app.events.documentReady.resolve();
		
	//$('.lazy').lazy();
	$('input, textarea').off('touchstart mousedown').on('touchstart mousedown', function(e) {
	    e.stopPropagation();
	});
	
	$("#label_60").on("click",function() {
		gui.showTermsAndConditions();
	});
	$("#label_65").unbind( "click" ).bind("click", function(){			 
		$('body').pagecontainer('change', '#createPlanPage', { transition : "none" });
	});
	$("#label_66").unbind( "click" ).bind("click", function(){			 
		$('body').pagecontainer('change', '#searchResultsPage', { transition : "none" });
	});
		
/*	$("#label_70").on("change", function() {
		gui.groupOnMenu.meetingInitDate = $("#label_70").val();	
	});
	$("#label_71").on("change", function() {
		gui.groupOnMenu.meetingInitTime = $("#label_71").val();	
	});
*/	
	$("#planSubmitButton")
	 .on("click", gui.onPlanSubmit )
	 .text( dictionary.Literals.label_38 )
	 .data( 'action', 'create' );


	history.pushState(null, null, null);
	window.addEventListener('popstate', function (event) {
	    history.pushState(null, null, null);
	});
	
	$("#performCall").on("click", function(){		
		
		app.requestPeerEasyRTCid();
	});

};

GUI.prototype.bindPagination = function( newerDate ){
	
	var str = '<button id=\"paginationButton\">' + dictionary.Literals.label_41 + '<\/button>';
	$("#chat-page-content").prepend( str ).trigger("create");
	
	$("#paginationButton").unbind( "click" ).bind("click", function(){
		gui.showLoadingSpinner();
		$("#paginationButton").remove();
		mailBox.retrieveMessages( app.currentChatWith, newerDate ).done(function(list){
			list.map(function( message ){			
				gui.showMsgInConversation( message, { isReverse : true, withFX : false });
			});	
			gui.hideLoadingSpinner();
			var size = list.length;
			if ( size  == config.MAX_SMS_RETRIEVAL ){
				gui.bindPagination( list[size - 1].timestamp );	
			}
		});		
		gui.hideLoadingSpinner();
	});
};

/**
 * @param contact := ContactOnKnet | Group
 */
GUI.prototype.forwardMsg = function( contact ){
	
  	mailBox.getMessageByID( app.msg2forward ).done(function ( msg ){
  		if (typeof msg == "undefined" || msg == null){
  			logger.debug("GUI.prototype.forwardMsg - ", msg);
  			return;
  		}  		
  		app.forwardMsg( msg , contact);  		
  	});
	$('body').pagecontainer('change', '#chat-page', { transition : "none" });

};


GUI.prototype.getPurchaseDetails = function() {
	var purchase = {};
	purchase.licenseDurationChoosen = $("input[name='license-choice']:checked").val();
	purchase.isNGOdonationChecked = $("#NGOdonation").is(':checked');
	purchase.isFSIdonationChecked = $("#FSIdonation").is(':checked');

	return purchase;
};

GUI.prototype.hideLoadingSpinner = function(){		
	$('.mask-color').fadeOut('fast');
};

GUI.prototype.hideLocalNotifications = function() {
	if ( app.isMobile && app.devicePlatform == "Android"){
		cordova.plugins.notification.local.clearAll(function() {
			log.info("GUI.prototype.hideLocalNotifications - notification cleared");
		}, this);
	}
};
GUI.prototype.loadAsideMenuMainPage = function() {

	var strVar="";
	strVar += "<div data-role=\"panel\" id=\"mypanel\" data-display=\"overlay\">";
	strVar += "  <ul id=\"mypanel-list\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "		<li id=\"link2profile\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"res\/profile_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_1\">Profile<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "		<li id=\"link2createGroup\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"res\/group_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_2\" >Groups<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>"; 
	strVar += "		<li id=\"link2searchPage\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"res\/visibles_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_3\">Search<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "		<li id=\"link2activateAccount\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"res\/account_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_4\">Account<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";		
	strVar += "  <\/ul>";
	strVar += "<\/div><!-- \/panel -->"; 
		
	$("#MainPage").append(strVar);
	
	$("#link2profile").click(function(){ 
		$('body').pagecontainer('change', '#profile', { transition : "none" });
	});
	$("#link2createGroup").click(function(){ 
		$('body').pagecontainer('change', '#createGroup', { transition : "none" });
	});
	$("#link2searchPage").click(function(){		
		if ( app.myPosition.coords.latitude != "" ){
			$('body').pagecontainer('change', '#searchPage', { transition : "none" });
		}		
	});
	$("#link2activateAccount").click(function(){ 
		$('body').pagecontainer('change', '#activateAccount', { transition : "none" });
	});

	$('#MainPage').trigger('create'); 
};


GUI.prototype.loadBody = function() { 
	
	var strVar="";
	strVar += " 	<div data-role=\"page\" data-theme=\"a\" id=\"searchPage\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div role=\"main\" id=\"searchMap\" >";
	strVar += "		        	<!-- map loads here...  -->";
	strVar += "		  	<\/div>";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">";	
	strVar += ' 			<a id="label_65" class="ui-btn ui-corner-all ui-shadow ui-btn-b" > create a plan</a>';
	strVar += ' 			<a id="label_66" class="ui-btn ui-corner-all ui-shadow ui-btn-b" > find people or join a plan </a>';	
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page searchPage-->";
	
	strVar += " 	<div data-role=\"page\" data-theme=\"a\" id=\"createPlanPage\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "		    	<\/div>";	
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\"> ";
	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "									<div id=\"imagePlanContainer\" class=\"text-center\" data-role=\"none\" >";
	strVar += "										<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"image4Plan\" class=\"picedit_box\">";
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1  id=\"nickNamePlan\" ><\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "										<h5 id=\"commentaryPlan\" ><\/h5>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<h1 id=\"label_72\"> Plan <\/h1>";
	strVar += "										<div class=\"hr-left\"><\/div>";
	strVar += "										<p><\/p>";
	strVar += "										<div class=\"row\">";
	strVar += "											<div class=\"form-group\">";
	strVar += "												<input id=\"nickNamePlanField\" class=\"form-control input-lg\" placeholder=\"Name...\"> ";
	strVar += "											<\/div>";
	strVar += "											<div class=\"form-group\">";
	strVar += "												<textarea id=\"commentaryPlanField\" class=\"form-control input-lg\" placeholder=\"Description...\"> <\/textarea>";
	strVar += "											<\/div>";
	strVar += "					          				<div id=\"mapPlanPage\" class=\"mapPlanPage\">";
	strVar += "					          				<\/div>";
	strVar += "											<p><\/p>";
	strVar += "										<\/div>";	
	strVar += "										<div class=\"row\">";
	strVar += "											<div class=\"form-group\">";
	strVar += "												<input id=\"label_70\" data-role=\"none\"  class=\"myDatePicker form-control input-lg \" placeholder=\"\"> ";
	strVar += "												<input id=\"label_71\" data-role=\"none\"  class=\"form-control input-lg myTimePicker\" placeholder=\"\"> ";
	strVar += "											<\/div>";
	strVar += "										<\/div>";
	strVar += "										<div class=\"row\">";
	strVar += "											<button id=\"planSubmitButton\">create<\/button>";
	strVar += "										<\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";	
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page createPlanPage-->";	
	
	
	strVar += " 	<div data-role=\"page\" data-theme=\"a\" id=\"searchResultsPage\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "		    	<\/div>";	
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\"> ";
	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "					          		<div id=\"mapResultPage\" class=\"mapPlanPage\">";
	strVar += "					          		<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<ul id=\"listInResultsPage\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "										<\/ul>";	
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";	
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page searchResultsPage-->";	
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"createGroup\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "		    	<\/div>";	
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\"> ";
	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "									<div id=\"imageGroupContainer\" class=\"text-center\" data-role=\"none\" >";
	strVar += "										<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"imageGroup\" class=\"picedit_box\">";
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1  id=\"nickNameGroup\" ><\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "										<h5 id=\"commentaryGroup\" ><\/h5>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<h1 id=\"label_21\">New Group<\/h1>";
	strVar += "										<div class=\"hr-left\"><\/div>";
	strVar += "										<p><\/p>";
	strVar += "										<div class=\"row\">";
	strVar += "											<div class=\"form-group\">";
	strVar += "												<input id=\"nickNameGroupField\" class=\"form-control input-lg\" placeholder=\"Name...\"> ";
	strVar += "											<\/div>";
	strVar += "											<div class=\"form-group\">";
	strVar += "												<input id=\"commentaryGroupField\" class=\"form-control input-lg\" placeholder=\"Commentary...\">";
	strVar += "											<\/div>";
	strVar += "											<button id=\"groupsButton\">create<\/button>";
	strVar += "										<\/div>";
	strVar += "										<div class=\"row\">";
	strVar += "											<ul id=\"contacts4Group\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"><\/ul>";
	strVar += "											<h1 id=\"label_37\">My Groups<\/h1>";
	strVar += "											<ul id=\"listOfGroups\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"><\/ul>";	
	strVar += "											<h1 id=\"label_52\">Blocked people<\/h1>";
	strVar += "											<ul id=\"listOfBlocked\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"><\/ul>";
	strVar += "										<\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";	
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page createGroup-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"profile\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">";
	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "									<div class=\"text-center\" data-role=\"none\" >";
	strVar += "										<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"imageProfile\" class=\"picedit_box\">";
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1  id=\"nickNameInProfile\" ><\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "										<h5 id=\"commentaryInProfile\" ><\/h5>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<h1 id=\"label_22\">Profile<\/h1>";
	strVar += "										<div class=\"hr-left\"><\/div>";
	strVar += "										<p><\/p>";
	strVar += "											<div class=\"row\">";
	strVar += "												<div class=\"form-group\">";
	strVar += "													<input id=\"profileNameField\" class=\"form-control input-lg\" placeholder=\"Name...\"> ";
	strVar += "												<\/div>";
	strVar += "												<div class=\"form-group\">";
	strVar += "													<input id=\"profileCommentary\" class=\"form-control input-lg\" placeholder=\"Commentary...\">";
	strVar += "												<\/div>";
	strVar += "												<div class=\"form-group\">";
	strVar += "													<input id=\"profileTelephone\" class=\"form-control input-lg\" placeholder=\"telephone...\">";
	strVar += "												<\/div>";
	strVar += "												<div class=\"form-group\">";
	strVar += "													<input id=\"profileEmail\" class=\"form-control input-lg\" placeholder=\"e-mail...\">";
	strVar += "												<\/div>";
	strVar += "											<\/div>";
	strVar += "											<div class=\"row\">";
	strVar += "												<h2 id=\"label_8\"> you visible for...<\/h2>";	
	strVar += "												<h3 id=\"label_9\">Anybody<\/h3>";
	strVar += "												<p id=\"label_10\">should you switch this off, then only your contacts would see you online, is not that boring?<\/p>	";
	strVar += "												<select name=\"flip-visible\" id=\"flip-visible\" data-role=\"slider\" >";
	strVar += "													<option value=\"on\">on<\/option>";
	strVar += "													<option value=\"off\">off<\/option>";
	strVar += "												<\/select>";	
	strVar += "											<\/div>";	
	strVar += "											<div class=\"row\">";
	strVar += "												<a><h2 id=\"label_60\"> Privacy Policy<\/h2><\/a>";	
	strVar += "											<\/div>";
	strVar += "						          			<div class=\"col-md-12\">";
	strVar += "					    	      				<abbr title=\"id\" id=\"label_id_profile\">  <\/abbr> ";
	strVar += "					        	  			<\/div>";	
	strVar += "										<\/div>";		
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";	
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page profile-->";

	strVar += "		<div data-role=\"page\" data-cache=\"false\" id=\"map-page\" data-url=\"map-page\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a> ";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><a data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"res\/bubble_36x36.png\" class=\"button2mainPage button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><a id=\"mapButtonInmap-page\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"res\/mundo_36x36.png\" class=\"ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div role=\"main\" id=\"map-canvas\" >";
	strVar += "		        	<!-- map loads here...  -->";
	strVar += "		  	<\/div>";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">";
	strVar += "				<ul id=\"listOfContactsInMapPage\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "				<\/ul>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page map-page-->";

	strVar += "		<div data-role=\"page\" id=\"chat-page\" data-url=\"chat-page\" >";
	strVar += "			<div id=\"chat-page-header\" data-role=\"header\" data-position=\"fixed\">";
	strVar += "				<div class=\"ui-grid-d\">";
	strVar += "					<div class=\"ui-block-a\"><a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\"><img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-b\">";
	strVar += "					   	<a id=\"link2profileOfContact\" data-role=\"button\" class=\"imgOfChat-page\" data-inline=\"false\">";
	strVar += "				       		<img id=\"imgOfChat-page-header\" src=\"\" class=\"imgOfChat-page-header\">";
	strVar += "				   		<\/a>";
	strVar += "			       	<\/div>";
	strVar += "				    <div class=\"ui-block-c\"><\/div>";
	strVar += "				    <div id=\"performCall\" class=\"ui-block-d\"><a data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"res\/conference.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none max-nav-button\"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-e\"><a id=\"mapButtonInChatPage\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"res\/mundo_36x36.png\" alt=\"lists\" class=\"ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			  	<\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div id=\"chat-page-content\" role=\"main\" class=\"ui-content\">";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "			<div data-role=\"footer\" data-position=\"fixed\">				";
	strVar += "				<div id=\"chat-multimedia-button\" class=\"ui-block-20percent\" >					";
	strVar += "					<a data-role=\"button\" ><img id=\"chat-multimedia-image\" src=\"res\/multimedia_50x37.png\"> <\/a>";
	strVar += "				 <\/div>";
	strVar += "				<div class=\"ui-block-80percent\">							";
	strVar += "					<textarea data-role=\"none\" id=\"chat-input\" data-lastkeyup=\"0\" class=\"textarea-chat ui-input-text ui-body-inherit ui-textinput-autogrow\"> <\/textarea> 				   								";
	strVar += "				<\/div>";
	//strVar += "			   <button id=\"chat-input-button\" type=\"submit\" data-theme=\"a\">send<\/button>			";
	strVar += "			<\/div><!-- \/footer -->";
	strVar += "		<\/div><!-- \/page chat-page-->		";
	
	strVar += "		<div data-role=\"page\" id=\"activateAccount\" data-url=\"activateAccount\" >";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "				<div class=\"ui-grid-d\">";
	strVar += "					<div class=\"ui-block-a\"><a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\"><img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-b\"><\/div>";
	strVar += "				    <div class=\"ui-block-c\"><\/div>";
	strVar += "				    <div class=\"ui-block-d\"><\/div>";
	strVar += "				    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  	<\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div id=\"activateAccount-content\" role=\"main\" class=\"ui-content\">";
	strVar += "				<h1 id=\"label_27\" class=\"darkink\"> User account Activation  <\/h1>          "   ;
	strVar += "				<div class=\"ui-field-contain\">";
	strVar += "    				<fieldset data-role=\"controlgroup\">";
	strVar += "        				<input type=\"radio\" name=\"license-choice\" id=\"radio-choice-v-1a\" value=\"oneYear\" checked=\"checked\">";
	strVar += "        				<label id=\"label_28\" for=\"radio-choice-v-1a\">License valid for a year<\/label>";
	strVar += "        				<input type=\"radio\" name=\"license-choice\" id=\"radio-choice-v-1b\" value=\"fourYears\">";
	strVar += "        				<label id=\"label_29\" for=\"radio-choice-v-1b\">License valid for 4 years<\/label>";
//	strVar += "       				<input type=\"checkbox\" name=\"Backup\" id=\"Backup\">";
//	strVar += "        				<label id=\"label_30\" for=\"Backup\">Back-up functionality<\/label>";
	strVar += "        				<input type=\"checkbox\" name=\"NGOdonation\" id=\"NGOdonation\">";
	strVar += "        				<label id=\"label_31\" for=\"NGOdonation\">Donation for associated NGOs<\/label>";
	strVar += "        				<input type=\"checkbox\" name=\"FSIdonation\" id=\"FSIdonation\">";
	strVar += "        				<label id=\"label_32\" for=\"FSIdonation\">Donation for our Open Source Initiative<\/label>";
	strVar += "    				<\/fieldset>";
	strVar += "				<\/div>";
	strVar += "				<h3 class=\"darkink\"> <spam id=\"label_33\"> Total :<\/spam> <spam id=\"price\"> 1 &euro;<\/spam><\/h3>";
	strVar += "				<button id=\"buyButton\">Buy<\/button>";
	strVar += "				<div class=\"paypalButton\"><img id=\"paypal\" src=\"res\/AM_mc_vs_dc_ae.jpg\" width=\"100%\"><\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/activateAccount page-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"emoticons\">";
	strVar += "			<div role=\"main\" class=\"ui-content\">";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page emoticons-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"multimedia\">";
	strVar += "			<div id=\"multimedia-content\" role=\"main\" class=\"ui-content\">";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page emoticons-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"forwardMenu\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header --> 	";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">";
	strVar += "				<div class=\"container\" id=\"forwardMenuContainer\">";
	strVar += "				<\/div><!-- \/container-->";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page forwardMenu-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"conference-page\" > ";
	strVar += "			<div  data-theme=\"a\"  class=\"ui-height-100percent\">";	
	strVar += "				<div class=\"ui-height-70percent\">";	
	strVar += "					<video id=\"conferenceTag\"><\/video>";
	strVar += "				 <\/div>";
	strVar += "				<div class=\"conferenceCallBox\">";
	strVar += "			    	<a id=\"callAcceptButton\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/conference_play.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none max-nav-button\">";
	strVar += "		    		<\/a>";	
	strVar += "			    	<a id=\"callRejectButton\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"res\/conference_stop.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none max-nav-button\">";
	strVar += "		    		<\/a>";	
	strVar += "				<\/div>";	
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page forwardMenu-->";	
			
	$("body").append(strVar); 
	
};



GUI.prototype.loadContactsOnMapPage = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) { 
        	gui.showContactOnMapPage(cursor.value);
         	cursor.continue(); 
     	}
	};	
};

GUI.prototype.loadDatePkrInPlanPage = function() {
	
    var countryKey = Object.keys(dictionary.Literals.CLDR.main)[0];

    var monthsWide = dictionary.Literals.CLDR.main[countryKey].dates.calendars.gregorian.months.format.wide;
	var monthsShort = dictionary.Literals.CLDR.main[countryKey].dates.calendars.gregorian.months.format.abbreviated;
	var weekWide = dictionary.Literals.CLDR.main[countryKey].dates.calendars.gregorian.days.format.wide;
	var weekShort = dictionary.Literals.CLDR.main[countryKey].dates.calendars.gregorian.days.format.abbreviated;
	
	var pickDataSettings = {
	    monthsFull: [ monthsWide["1"], monthsWide["2"],monthsWide["3"],monthsWide["4"],monthsWide["5"],monthsWide["6"],monthsWide["7"],monthsWide["8"],monthsWide["9"],monthsWide["10"],monthsWide["11"],monthsWide["12"] ],
	    monthsShort: [ monthsShort["1"], monthsShort["2"],monthsShort["3"],monthsShort["4"],monthsShort["5"],monthsShort["6"],monthsShort["7"],monthsShort["8"],monthsShort["9"],monthsShort["10"],monthsShort["11"],monthsShort["12"] ],
	    weekdaysFull: [ weekWide["sun"], weekWide["mon"], weekWide["tue"], weekWide["wed"], weekWide["thu"], weekWide["fri"], weekWide["sat"] ],
	    weekdaysShort: [ weekShort["sun"], weekShort["mon"], weekShort["tue"], weekShort["wed"], weekShort["thu"], weekShort["fri"], weekShort["sat"]  ],		    
	    today: dictionary.Literals.label_67 ,
	    clear: dictionary.Literals.label_68 ,
	    close: dictionary.Literals.label_69 ,
	    firstDay: 1,
	    //format: 'dddd d !de mmmm !de yyyy',
	    formatSubmit: 'yyyy/mm/dd',
	    onOpen: function() {
	    	$("#imagePlanContainer").css('visibility','hidden');
	    	$("#planSubmitButton").css('visibility','hidden');
	    	
	    },
	    onClose: function() {
	    	$("#imagePlanContainer").css('visibility','visible');
	    	$("#planSubmitButton").css('visibility','visible');
	    }
	};

	var $dateInput = $(".myDatePicker").pickadate( pickDataSettings );
	var picker = $dateInput.pickadate('picker');
	picker.set('select', new Date());
	
	var $dateInput2 = $("#label_71").pickatime({
		clear: dictionary.Literals.label_68,
	    onOpen: function() {
	    	$("#imagePlanContainer").css('visibility','hidden');
	    	$("#planSubmitButton").css('visibility','hidden');
	    	
	    },
	    onClose: function() {
	    	$("#imagePlanContainer").css('visibility','visible');
	    	$("#planSubmitButton").css('visibility','visible');
	    }
    });		
	
	var picker = $dateInput2.pickatime('picker');
	picker.set('select', new Date());
	
};

GUI.prototype.loadGalleryInDOM = function() {

    if (app.devicePlatform == "WinCE" || app.devicePlatform == "Win32NT") {
        return;
    }
    $("#gallery").remove();
    var strVar = "";	
	strVar += "<div id=\"gallery\" data-role=\"none\" class=\"pswp\" tabindex=\"-1\" role=\"dialog\" hidden>";
	strVar += "		<div  data-role=\"none\" class=\"pswp__bg\"><\/div>";
	strVar += "		<div data-role=\"none\" class=\"pswp__scroll-wrap\">";
	strVar += "			<div data-role=\"none\" class=\"pswp__container\">";
	strVar += "				<div data-role=\"none\" class=\"pswp__item\"><\/div>";
	strVar += "				<div data-role=\"none\" class=\"pswp__item\"><\/div>";
	strVar += "				<div data-role=\"none\" class=\"pswp__item\"><\/div>";
	strVar += "          <\/div>";
	strVar += "          <div data-role=\"none\" class=\"pswp__ui pswp__ui--hidden\">";
	strVar += "				<div data-role=\"none\" class=\"pswp__top-bar\">";
	strVar += "					<div data-role=\"none\" class=\"pswp__counter\"><\/div>";
	strVar += "				<button data-role=\"none\" class=\"pswp__button pswp__button--close\" title=\"Close (Esc)\"><\/button>";
//	strVar += "				<button id=\"button--share\" data-role=\"none\" class=\"pswp__button pswp__button--share\" title=\"Share\"><\/button>";
	strVar += "				<button data-role=\"none\" class=\"pswp__button pswp__button--fs\" title=\"Toggle fullscreen\"><\/button>";
	strVar += "				<button data-role=\"none\" class=\"pswp__button pswp__button--zoom\" title=\"Zoom in\/out\"><\/button>";
	strVar += "				<div class=\"pswp__preloader\">";
	strVar += "					<div class=\"pswp__preloader__icn\">";
	strVar += "					  <div class=\"pswp__preloader__cut\">";
	strVar += "					    <div class=\"pswp__preloader__donut\"><\/div>";
	strVar += "					  <\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "            <\/div>	<div class=\"pswp__loading-indicator\"><div class=\"pswp__loading-indicator__line\"><\/div><\/div> ";
//	strVar += "            <div class=\"pswp__share-modal pswp__share-modal--hidden pswp__single-tap\">";
//	strVar += "	            <div class=\"pswp__share-tooltip\">";
//	strVar += "				<!--<a href=\"#\" class=\"pswp__share--facebook\"><\/a>";
//	strVar += "					<a href=\"#\" class=\"pswp__share--twitter\"><\/a>";
//	strVar += "					<a href=\"#\" class=\"pswp__share--pinterest\"><\/a>";
//	strVar += "					<a href=\"#\" download class=\"pswp__share--download\"><\/a> -->";
//	strVar += "	            <\/div>";
	strVar += "	        <\/div>";
	strVar += "            <button data-role=\"none\" class=\"pswp__button pswp__button--arrow--left\" title=\"Previous (arrow left)\"><\/button>";
	strVar += "            <button data-role=\"none\" class=\"pswp__button pswp__button--arrow--right\" title=\"Next (arrow right)\"><\/button>";
	strVar += "            <div class=\"pswp__caption\">";
	strVar += "              <div class=\"pswp__caption__center\">";
	strVar += "              <\/div>";
	strVar += "            <\/div>";
	strVar += "          <\/div>";
	strVar += "        <\/div>";
	strVar += "    <\/div>";
	
	var activePage = $.mobile.activePage.attr("id");
	$("#"+activePage).append(strVar);	

/*	$('#button--share').on("click",  function(e) {
		
		app.msg2forward = gui.photoGallery.currItem.msgId;
		
		gui.photoGallery.listen('destroy', function() { 			
			setTimeout( function() { 
				gui.photoGalleryClosed = true;
				$('body').pagecontainer( 'change', '#forwardMenu', { transition : "none" });
			} , config.TIME_SILENT_SCROLL );
		});	
		gui.photoGallery.close();
	
	});
*/
};

GUI.prototype.loadGroupInPlanPage = function() {
	
	if ( gui.groupOnMenu == null ){
		gui.groupOnMenu = new Group({});
		gui.groupOnMenu.addMember( user );
	}	
	var previousMaker = gui.searchMap.currentMarker;
	var latlng = previousMaker.getLatLng();
	gui.groupOnMenu.location.lat = latlng.lat.toString();
	gui.groupOnMenu.location.lon = latlng.lng.toString();
	
	$("#commentaryPlanField").val( gui.groupOnMenu.commentary );
	$("#commentaryPlan").text( gui.groupOnMenu.commentary );
	$("#nickNamePlanField").val(gui.groupOnMenu.nickName);
	$("#nickNamePlan").text( gui.groupOnMenu.nickName );
	
	$("#planSubmitButton")
	 .on("click", gui.onPlanSubmit )
	 .text( dictionary.Literals.label_38 )
	 .data( 'action', 'create' );
	
};


GUI.prototype.loadImgPkrInPlanPage = function() {
	
	var html = 
	"<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"image4Plan\" class=\"picedit_box\">";
	$('#imagePlanContainer').empty().append(html);
		
	$('#image4Plan').picEdit({
 		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
		maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
		minWidth: config.MIN_WIDTH_IMG_PROFILE ,
		minHeight: config.MIN_HEIGHT_IMG_PROFILE ,
		navToolsEnabled : true,
		isMobile : app.isMobile,
		defaultImage: gui.groupOnMenu.imgsrc,
		imageUpdated: function(img){			
			gui.groupOnMenu.imgsrc = img.src;
		},
		onNativeCameraInit : app.onNativeCameraInit
	});	
};



GUI.prototype.loadProfile = function() {

	var defaultImage = user.myPhotoPath;
	$('#imageProfile').picEdit({
 		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
		maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
		minWidth: config.MIN_WIDTH_IMG_PROFILE ,
		minHeight: config.MIN_HEIGHT_IMG_PROFILE ,
		navToolsEnabled : true,
		defaultImage: defaultImage ,
		isMobile : app.isMobile,
		imageUpdated: function(img){
			
			user.myPhotoPath = img.src;
			user.lastProfileUpdate = new Date().getTime();
			app.profileIsChanged = true;

		},
		onNativeCameraInit : app.onNativeCameraInit
	});

};

GUI.prototype.loadGroupMenu = function( group ) {
	
	if ( group ){
		gui.groupOnMenu = group ;
		$("#groupsButton")
		 .text( dictionary.Literals.label_39 )
		 .data( 'action', 'modify' );
		$("#label_21").text( dictionary.Literals.label_40 );
	}else{
		gui.groupOnMenu = new Group({});
		gui.groupOnMenu.addMember( user );
		
		$("#label_21").text( dictionary.Literals.label_36 );
		$("#groupsButton")
		 .text( dictionary.Literals.label_38 )
		 .data( 'action', 'create' );						
	}
	
	$("#commentaryGroupField").val( gui.groupOnMenu.commentary );
	$("#commentaryGroup").text( gui.groupOnMenu.commentary );
	$("#nickNameGroupField").val(gui.groupOnMenu.nickName);
	$("#nickNameGroup").text( gui.groupOnMenu.nickName );
	
	gui.showContactsOnGroupMenu();		
	gui.showGroupsOnGroupMenu();
	gui.showListOfBlocked();
	
	var html = 
	"<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"imageGroup\" class=\"picedit_box\">";
	$('#imageGroupContainer').empty().append(html);
	
	$('#imageGroup').picEdit({
 		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
		maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
		minWidth: config.MIN_WIDTH_IMG_PROFILE ,
		minHeight: config.MIN_HEIGHT_IMG_PROFILE ,
		navToolsEnabled : true,
		isMobile : app.isMobile,
		defaultImage: gui.groupOnMenu.imgsrc,
		imageUpdated: function(img){			
			gui.groupOnMenu.imgsrc = img.src;
		},
		onNativeCameraInit : app.onNativeCameraInit
	});
};

GUI.prototype.loadLoadingSpinner = function(){
	var html="";
	html += "<div class=\"mask-color\">";
	html += "    <div id=\"preview-area\">";
	html += "    <div class=\"spinner\">";
	html += "      <div class=\"dot1\"><\/div>";
	html += "      <div class=\"dot2\"><\/div>";
	html += "    <\/div>";
	html += "<\/div>";
	html += "<\/div>"; 	    
	$('body').prepend(html);
	$('.mask-color').fadeOut('fast');
};
GUI.prototype.loadMaps = function(){
	
	if ( app.map != null ) {
		app.map.remove();
		$("#listOfContactsInMapPage").empty();
	}
	app.map = L.map('map-canvas');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		maxZoom: 18,
		attribution: 	'&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
						' &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'instaltic.lbgoad0c',
		accessToken : 'pk.eyJ1IjoiaW5zdGFsdGljIiwiYSI6IlJVZDVjMU0ifQ.8UXq-7cwuk4i7-Ri2HI3xg',
		trackResize : true
	}).addTo(app.map);

	app.map.setView([app.myPosition.coords.latitude.toString(), app.myPosition.coords.longitude.toString()], 14);  
	var latlng = L.latLng(app.myPosition.coords.latitude, app.myPosition.coords.longitude);
	L.marker(latlng).addTo(app.map).bindPopup(dictionary.Literals.label_11).openPopup();
	L.circle(latlng, 200).addTo(app.map); 

	app.map.addEventListener("load",gui.loadContactsOnMapPage());
	
};

GUI.prototype.loadMapOnProfile = function( input){
	
	var obj;
	if ( input ){
		obj = input;
	}else{
		obj = contactsHandler.getContactById(app.currentChatWith); 
	}
	if (typeof obj == "undefined") {
		$('#mapProfile').remove();
		return;
	}
	
	gui.mapOfContact = null ;
	gui.mapOfContact = L.map('mapProfile');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		maxZoom: 18,
		attribution: 	'&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
						' &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'instaltic.lbgoad0c',
		accessToken : 'pk.eyJ1IjoiaW5zdGFsdGljIiwiYSI6IlJVZDVjMU0ifQ.8UXq-7cwuk4i7-Ri2HI3xg',
		trackResize : true
	}).addTo(gui.mapOfContact);
	
	gui.mapOfContact.setView([obj.location.lat, obj.location.lon], 14);  
	var latlng = L.latLng(obj.location.lat, obj.location.lon);
	L.marker(latlng).addTo(gui.mapOfContact).bindPopup(obj.nickName);	
	L.circle(latlng, 200).addTo(gui.mapOfContact); 	
		
};

GUI.prototype.loadMapPlanPage = function( tagId ) {
	
	var previousMaker = gui.searchMap.currentMarker;
	var latlng = previousMaker.getLatLng();
	
	if ( gui.searchMap != null ) {
		gui.searchMap.remove();
	}
	gui.searchMap = null;
	gui.searchMap = L.map( tagId );
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		maxZoom: 18,
		attribution: 	'&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
						' &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'instaltic.lbgoad0c',
		accessToken : 'pk.eyJ1IjoiaW5zdGFsdGljIiwiYSI6IlJVZDVjMU0ifQ.8UXq-7cwuk4i7-Ri2HI3xg',
		trackResize : true
	}).addTo(gui.searchMap);

	gui.searchMap.setView( latlng , 14);	
	gui.searchMap.currentMarker = new L.marker(latlng).addTo(gui.searchMap).bindPopup(dictionary.Literals.label_64).openPopup();
	gui.searchMap.currentCircle = new L.circle(latlng, 1000).addTo(gui.searchMap);	
	
};


GUI.prototype.loadMapSearch = function(){
	
	if ( gui.searchMap != null ) {
		gui.searchMap.remove();
	}
	gui.searchMap = null;
	gui.searchMap = L.map('searchMap');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		maxZoom: 18,
		attribution: 	'&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
						' &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'instaltic.lbgoad0c',
		accessToken : 'pk.eyJ1IjoiaW5zdGFsdGljIiwiYSI6IlJVZDVjMU0ifQ.8UXq-7cwuk4i7-Ri2HI3xg',
		trackResize : true
	}).addTo(gui.searchMap);

	gui.searchMap.setView([app.myPosition.coords.latitude.toString(), app.myPosition.coords.longitude.toString()], 11);  
	var latlng = L.latLng(app.myPosition.coords.latitude, app.myPosition.coords.longitude);
	
	
	gui.searchMap.currentMarker = new L.marker(latlng).addTo(gui.searchMap).bindPopup(dictionary.Literals.label_64).openPopup();
	gui.searchMap.currentCircle = new L.circle(latlng, 5000).addTo(gui.searchMap); 

	
	gui.searchMap.on('click', function(e){
		gui.searchMap.removeLayer( gui.searchMap.currentMarker);
		gui.searchMap.removeLayer( gui.searchMap.currentCircle);
		gui.searchMap.currentMarker = new L.marker(e.latlng).addTo(gui.searchMap).bindPopup(dictionary.Literals.label_64).openPopup();
		gui.searchMap.currentCircle = new L.circle(e.latlng, 5000).addTo(gui.searchMap);
	});
	
};

GUI.prototype.loadTargetsOnForwardMenu = function() {
	
	$("#forwardMenuContainer").empty();
	var html = "<ul id=\"listOfContactsInForwardMenu\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"> </ul>";	
	$("#forwardMenuContainer").append( html );
	$("#forwardMenuContainer").trigger("create");
	
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) { 
        	gui.showTargetOnForwardMenu(cursor.value);
         	cursor.continue(); 
     	}
	};
	
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["groups"], "readonly").objectStore("groups").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {
     		var group = new Group( cursor.value );
     		gui.showTargetOnForwardMenu( group );
     		cursor.continue(); 
     	}
	};	
	
};

GUI.prototype.onAddContact2Group = function( contact ) {
	
	gui.showAddContact2Group( contact );	
	gui.groupOnMenu.addMember( contact );

};


GUI.prototype.onAppBrowserLoad = function(event) {
	
	log.info("GUI.prototype.onAppBrowserLoad - begin");
	
    if (event.url.match("successPayment") !== null) {
    	gui.inAppBrowser.removeEventListener('exit', gui.onAppBrowserExit );
    	gui.inAppBrowser.removeEventListener('loadstop', gui.onAppBrowserLoad );
		
		app.transactionID = decodeURI(postman.getParameterByName("transactionID",event.url));
		app.licenseDurationChoosen = decodeURI(postman.getParameterByName("licenseDurationChoosen",event.url));
		app.isNGOdonationChecked = decodeURI(postman.getParameterByName("isNGOdonationChecked",event.url));
		app.isFSIdonationChecked = decodeURI(postman.getParameterByName("isFSIdonationChecked",event.url));
		                
		setTimeout( function(){ gui.inAppBrowser.close } , config.TIME_WAIT_HTTP_POST );
    }    
    if (event.url.match("cancelPayment") !== null) {
    	
    	gui.inAppBrowser.removeEventListener('navigator.notification.alert("Are', gui.onAppBrowserExit );
    	gui.inAppBrowser.removeEventListener('loadstop', gui.onAppBrowserLoad);
    	
    	navigator.notification.alert("the Payment was cancelled :-(", null, 'Uh oh!');	
    	
		setTimeout( function(){  gui.inAppBrowser.close } , config.TIME_WAIT_HTTP_POST );

    }        
};

GUI.prototype.onAppBrowserExit = function (event)	{
	gui.inAppBrowser.removeEventListener('loadstop', gui.onAppBrowserLoad );																		         
	gui.inAppBrowser.removeEventListener('exit', gui.onAppBrowserExit );	
};

GUI.prototype.onBackButton = function() {
	
	var page = $.mobile.activePage.attr( "id" );
	switch (true){
		case /MainPage/.test(page):
			if ( $(".ui-popup-active").length > 0){
		     	$("#popupDiv").popup( "close" );
			}else{
				if (typeof cordova != "undefined" && cordova != null ){	
					$.when( app.events.deviceReady , app.events.documentReady).done(function(){
						function onConfirmQuit(button){
					       if(button == 2){
					    	 cordova.plugins.notification.local.cancelAll(function(){}, this);
					    	 navigator.app.exitApp();
					       }
						}
						navigator.notification.confirm(
							dictionary.Literals.label_18,// 'Do you want to quit?'
							onConfirmQuit,
							dictionary.Literals.label_19, // exit
							dictionary.Literals.label_20 //'Yes, No' 
						);
					});		
				}					
			}
			break;
		case /chat-page/.test(page):
			if ( gui.photoGallery != null ){
				gui.photoGallery.close();
			}
			if ( $(".ui-popup-active").length > 0){
		     	$("#popupDivMultimedia").popup( "close" );
			}else {				
				$('body').pagecontainer('change', '#MainPage', { transition : "none" });
			}						
			break;
		case /emoticons/.test(page):
			$('body').pagecontainer('change', '#chat-page', { transition : "none" });
			break;
		case /ProfileOfContact/.test(page):	

			if ( gui.isPlanDisplayed ){
				$('body').pagecontainer('change', '#searchResultsPage', { transition : "none" });
				gui.isPlanDisplayed = false;
			}else{
				$('body').pagecontainer('change', '#chat-page', { transition : "none" });
			}
			gui.removeImgFromGallery( gui.indexOfImages4Gallery );
			break;
		case /forwardMenu/.test(page):
			$('body').pagecontainer('change', '#chat-page', { transition : "none" });
			break;
		case /createPlanPage/.test(page):
			$('body').pagecontainer('change', '#searchPage', { transition : "none" });
			break;
		case /searchResultsPage/.test(page):
			$('body').pagecontainer('change', '#searchPage', { transition : "none" });
			break;
		default:
			$('body').pagecontainer('change', '#MainPage', { transition : "none" });
			break;	
	}
		
};

GUI.prototype.onChatInput = function() {

	var textMessage = $("#chat-input").val();	
	textMessage = textMessage.replace(/\n/g, "");

	document.getElementById('chat-input').value='';
	//$("#chat-input").blur();
	if ( textMessage == '' ){ 	return;	}
	
	var message2send = new Message(	{ 	
		to : app.currentChatWith, 
		from : user.publicClientID , 
		messageBody : { messageType : "text", text : gui._sanitize( textMessage ) }
	});
	message2send.convertToUTF();	

	var msg2store = new Message( message2send );
	mailBox.storeMessage( msg2store ); 
	
	gui.showMsgInConversation( msg2store, { isReverse : false, withFX : true });

	postman.sendMsg( message2send );	
	
	$('#chat-multimedia-image').attr("src", "res/multimedia_50x37.png");
	$("#chat-multimedia-button").unbind( "click",  gui.showEmojis);
	$("#chat-multimedia-button").bind( "click", gui.showImagePic );
	
	var obj = abstractHandler.getObjById( app.currentChatWith ); 
	if ( ! obj.isAccepted ) gui.onConsentButton();
};


GUI.prototype.onConsentButton = function() {
	$('#consent-menu').remove();
	var obj = abstractHandler.getObjById( app.currentChatWith ); 
	if (typeof obj == "undefined") return;
	obj.isAccepted = true;
	obj.isBlocked = false;
	abstractHandler.setOnList( obj );
	abstractHandler.setOnDB( obj );
};



GUI.prototype.onGroupsButton = function() {

	var group = gui.groupOnMenu;
	var action = $("#groupsButton").data( 'action' );
	var inputNickName = $("#nickNameGroupField").val();
	if ( inputNickName == "" || inputNickName == dictionary.Literals.label_23 ){
		var html = '';
		html += '<div role="main" class="ui-content">';
		html += ' <h1 class="ui-title" role="heading" aria-level="1"> oops!</h1><p> </p>';	
		html += '	<h1> </h1><h2> remember to set a name for the Group</h2><h1> </h1>';
		html += '</div>';
		
		gui.showDialog( html );
		gui.loadGroupMenu();
		return;
	} 
	if ( action == "create" ){
		
		$("#groupsButton")
		 .data( 'action', 'modify' )
		 .text( dictionary.Literals.label_39 );
			
		groupsHandler.setGroupOnList( group );
		groupsHandler.setGroupOnDB( group );
		groupsHandler.sendGroupUpdate( group );
		
		gui.showGroupsOnGroupMenu();
		gui.showEntryOnMainPage( group ,false);
		
	}else{		 
		groupsHandler.setGroupOnList( group );
		groupsHandler.setGroupOnDB ( group );
		groupsHandler.sendGroupUpdate( group);
	}
};

GUI.prototype.onPlanSubmit = function() {
	
    gui.showLoadingSpinner();			

	var action = $("#planSubmitButton").data( 'action' );
	var inputNickName = $("#nickNamePlanField").val();
	if ( inputNickName == "" || inputNickName == dictionary.Literals.label_23 ){
		var html = '';
		html += '<div role="main" class="ui-content">';
		html += ' <h1 class="ui-title" role="heading" aria-level="1"> oops!</h1><p> </p>';	
		html += '	<h1> </h1><h2> remember to set a name for the Plan</h2><h1> </h1>';
		html += '</div>';
		
		gui.showDialog( html );
		gui.hideLoadingSpinner();
		return;
	}
	
	var $dateInput = $(".myDatePicker");
	var pickerDate = $dateInput.pickadate('picker');
	
	var $dateInput2 = $("#label_71");	
	var pickerTime = $dateInput2.pickatime('picker');
	
	var dateInMiliseconds = pickerDate.get('select').pick;	
	var timeObj = {
		hour : pickerTime.get('select').hour.toString(),
		mins : pickerTime.get('select').mins.toString()
	};
	
	gui.groupOnMenu.meetingInitDate = dateInMiliseconds;
	gui.groupOnMenu.meetingInitTime = timeObj;
	
	var group = gui.groupOnMenu;
	
	var plan = {
		planId : group.publicClientID ,		
		organizer : user.publicClientID ,
		imgsrc : ( group.imgsrc == "./res/group_black_195x195.png" )? "" : group.imgsrc ,
		nickName : group.nickName ,
		commentary : group.commentary ,
		location : group.location, 
		meetingInitDate : group.meetingInitDate , 
		meetingInitTime : group.meetingInitTime,
		organizerObj : {
			publicClientID : user.publicClientID,
			nickName : user.myCurrentNick ,
			commentary : user.myCommentary ,
			location : { 
				lat : app.myPosition.coords.latitude.toString(),
				lon : app.myPosition.coords.longitude
			},
			pubKeyPEM : user.keys.publicKey
		}
	};
	
	var html = '';
	html += '<div role="main" class="ui-content">';
	html += ' <h1 class="ui-title" role="heading" aria-level="1"> done yeah!</h1><p> </p>';	
	html += '</div>';
	
	if ( action == "create" ){
		
		postman.send("PlanCreation", plan );
		
		$("#planSubmitButton")
		 .data( 'action', 'modify' )
		 .text( dictionary.Literals.label_39 );		

	}else{	
		postman.send("PlanModification", plan );
	}
	
	groupsHandler.setGroupOnList( group );
	groupsHandler.setGroupOnDB ( group );
	
	gui.showDialog( html );
	gui.hideLoadingSpinner();
	
	gui.showEntryOnMainPage( group ,false);
	
};

GUI.prototype.onProfileUpdate = function() {
	
	if (app.profileIsChanged){
		user.lastProfileUpdate = new Date().getTime();
		app.profileIsChanged = false;			
		app.sendProfileUpdate();
		user.updateUserSettings();					
	}
};

GUI.prototype.onRemoveContactFromGroup = function( contact ) {

	gui.showRemoveContactFromGroup( contact );
	gui.groupOnMenu.removeMember( contact );
	
};

GUI.prototype.onReportAbuse = function() {
	$('#consent-menu').remove();
	var obj = abstractHandler.getObjById( app.currentChatWith ); 
	if (typeof obj == "undefined") return;
	obj.isAccepted = false;
	obj.isBlocked = true;
	abstractHandler.setOnList( obj );
	abstractHandler.setOnDB( obj );
	gui.showReportAbuse();
	
};

GUI.prototype.onReportBlock = function() {
	$('#consent-menu').remove();
	var obj = abstractHandler.getObjById( app.currentChatWith ); 
	if (typeof obj == "undefined") return;
	obj.isAccepted = false;
	obj.isBlocked = true;
	abstractHandler.setOnList( obj );
	abstractHandler.setOnDB( obj );	
	
	$('#'+obj.publicClientID).remove();
	
};

GUI.prototype.orderEntriesOnMainPage = function() {

/*	$("#listOfContactsInMainPage").find("li").each(function(){
		var i = $(this);		
		
		$("#listOfContactsInMainPage").find("li").each(function(){
			var j = $(this);
			if ( parseInt( j.data('sortby') ) < parseInt( i.data('sortby') ) ){
			    var other = j;
			    i.after(other.clone());
			    other.after(i).remove();	
			}
			
		});		
		
	});
*/
    $('#listOfContactsInMainPage').listview().listview('refresh');

	
/*
	list.map(function(i){
	
		var exchangeWith = new ContactOnKnet (i);		
		list.map(function(j){		
			if ( j.timeLastSMS > exchangeWith.timeLastSMS ){
				exchangeWith = new ContactOnKnet (j);
			}			
		});
		
		if ( exchangeWith.timeLastSMS != i.timeLastSMS ){
			
		    var other = $("#"+exchangeWith.publicClientID);
		    $("#"+i.publicClientID).after(other.clone());
		    other.after($("#"+i.publicClientID)).remove();	    
		    
		}	
		
	});
	 $('#listOfContactsInMainPage').listview().listview('refresh');
	
	

	 * 	var ul = $('ul#listOfContactsInMainPage'),
	    li = ul.children('li');
	    
	    li.detach().sort(function(a,b) {
	        return ( parseInt($(a).data('sortby')) < parseInt($(b).data('sortby')) ) ;  
	    });
	    ul.empty();	    
	    ul.append(li);
	 * 
	 * 
	 */
	

};

//stop when there is more than config.limitBackwardMessages SMS in the list and searching for newer than 2015
GUI.prototype.printMessagesOf = function(publicClientID, olderDate, newerDate, listOfMessages) {

	mailBox.getAllMessagesOf(publicClientID, olderDate, newerDate).done(function(list){
		
		var newList = listOfMessages.concat( list );
		
		if (newList.length > 0 || olderDate < config.TIME_UNIX_2015 ){
							
			newList.map(function(message){			
				gui.showMsgInConversation( message, { isReverse : false, withFX : true });
			});			
			gui.printOldMessagesOf(publicClientID, olderDate - config.TIME_UNIX_MONTH, olderDate);
			
		}else {	
			olderDate = olderDate - config.TIME_UNIX_MONTH;
			newerDate = newerDate - config.TIME_UNIX_MONTH;
			gui.printMessagesOf(publicClientID, olderDate, newerDate, newList);
		}
	});
	
};

GUI.prototype.printOldMessagesOf = function(publicClientID, olderDate, newerDate ) {
	
	mailBox.getAllMessagesOf(publicClientID, olderDate, newerDate).done(function(list){

		list.reverse().map(function(message){	
			gui.showMsgInConversation(message, { isReverse : true, withFX : false });			
		});
		
		if ( olderDate > config.TIME_UNIX_2015 ){
			olderDate = olderDate - config.TIME_UNIX_MONTH;
			newerDate = newerDate - config.TIME_UNIX_MONTH;
			gui.printOldMessagesOf(publicClientID, olderDate, newerDate);
		}else {
			gui.hideLoadingSpinner();
			$('.blue-r-by-end').delay(config.TIME_FADE_ACK).fadeTo(config.TIME_FADE_ACK, 0);		
		}
	});	
};

GUI.prototype.removeImgFromGallery = function( index ) {		
	gui.listOfImages4Gallery.splice(  parseInt(index) - 1 , 1);
	gui.indexOfImages4Gallery = gui.indexOfImages4Gallery - 1;	
};

GUI.prototype.setImgIntoGallery = function(index, src, msgId) {

	var img = new Image();
	img.src = src;
	img.onload = function() {
	    var height = img.height; 
		var width =  img.width; 
		gui.listOfImages4Gallery[index] = {
			src: src,
		    w: width,
		    h: height,
		    msgId : msgId
		};
	}
	
	gui.indexOfImages4Gallery = gui.indexOfImages4Gallery + 1;
	
};

GUI.prototype.setLocalLabels = function() {
	document.getElementById("label_1").innerHTML = dictionary.Literals.label_1;
	document.getElementById("label_2").innerHTML = dictionary.Literals.label_2;
	document.getElementById("label_3").innerHTML = dictionary.Literals.label_3;
	document.getElementById("label_4").innerHTML = dictionary.Literals.label_4;
	//document.getElementById("label_5").innerHTML = dictionary.Literals.label_5;
	//document.getElementById("label_6").innerHTML = dictionary.Literals.label_6;
	//document.getElementById("chat-input-button").innerHTML = dictionary.Literals.label_7;
	document.getElementById("label_8").innerHTML = dictionary.Literals.label_8;
	document.getElementById("label_9").innerHTML = dictionary.Literals.label_9;
	document.getElementById("label_10").innerHTML = dictionary.Literals.label_10;
	/*dictionary.Literals.label_11; ( dinamically inserted into the DOM , the maps...)
	dictionary.Literals.label_12; ( dinamically inserted into the DOM , the commentary...)
	dictionary.Literals.label_13; ( dinamically inserted into the DOM , the commentary bis...),
	dictionary.Literals.label_14; ( dinamically inserted into the DOM , "drag & drop" in picEdit...),
	label_15 saved contact, label_16 notification title
	document.getElementById("label_17").innerHTML = dictionary.Literals.label_17;	
	dictionary.Literals.label_18,// 'Do you want to quit'
	dictionary.Literals.label_19, // exit
	dictionary.Literals.label_20 //'Yes, No
	*/
	document.getElementById("label_21").innerHTML = dictionary.Literals.label_36;
	document.getElementById("label_22").innerHTML = dictionary.Literals.label_1;
	document.getElementById("profileNameField").placeholder = dictionary.Literals.label_23;
	document.getElementById("profileCommentary").placeholder = dictionary.Literals.label_24;
	document.getElementById("profileTelephone").placeholder = dictionary.Literals.label_25;
	document.getElementById("profileEmail").placeholder = dictionary.Literals.label_26;
	document.getElementById("label_27").innerHTML = dictionary.Literals.label_27;
	document.getElementById("label_28").innerHTML = dictionary.Literals.label_28;
	document.getElementById("label_29").innerHTML = dictionary.Literals.label_29;
//	document.getElementById("label_30").innerHTML = dictionary.Literals.label_30;
	document.getElementById("label_31").innerHTML = dictionary.Literals.label_31;
	document.getElementById("label_32").innerHTML = dictionary.Literals.label_32;
	document.getElementById("label_33").innerHTML = dictionary.Literals.label_33;
	document.getElementById("buyButton").innerHTML = dictionary.Literals.label_34;
	document.getElementById("label_37").innerHTML = dictionary.Literals.label_37;
	document.getElementById("groupsButton").innerHTML = dictionary.Literals.label_38;
	document.getElementById("label_52").innerHTML = dictionary.Literals.label_52;
	document.getElementById("label_60").innerHTML = dictionary.Literals.label_60;
	
	document.getElementById("label_65").innerHTML = dictionary.Literals.label_65;
	document.getElementById("label_66").innerHTML = dictionary.Literals.label_66;

	document.getElementById("label_72").innerHTML = dictionary.Literals.label_72;

};

/**
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.setTimeLastSMS = function( obj ) {	
	$("#"+obj.publicClientID).data('sortby', obj.timeLastSMS) ;
};


GUI.prototype.showAddContact2Group = function( contact ) {

	$('#buttonAddContact2Group' + contact.publicClientID)
		.attr({	'class': 'icon-list ui-btn ui-btn-icon-notext ui-icon-check' });
	
	$("#contacts4Group")
		.find("#divAddContact2Group"+ contact.publicClientID)
		.unbind("click")
		.on("click", function(){ gui.onRemoveContactFromGroup( contact );  } );
	
	$('#contacts4Group').listview().listview('refresh');			
};

GUI.prototype.showBlockSomebodyPrompt = function() {
	
	var obj = abstractHandler.getObjById( app.currentChatWith ); 

	var html = '';
	html += '<div id="block-confirm" role="main" class="ui-content">';
	html += ' <h1 id="label_51" class="ui-title" role="heading" aria-level="1">'+dictionary.Literals.label_51+'</h1><p> </p>';	
	html += ' <ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\">' + 	
			'  <li>'+
			' 	<a data-role=\"none\" class="ui-btn">'+ 
			'  	 <img src="' + obj.imgsrc + '" class="imgInMainPage"/>'+
			'  	 <h2>'+ obj.nickName   + '</h2> '+
			'  	 <p>'+ obj.commentary   + '</p> '+
			'   </a>'+
			'  </li>';
	html += ' <a id="label_56" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_46+'</a>';
	html += ' <a id="label_57" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_47+'</a>';
	html += '</div>';
	gui.showDialog( html );
	
	$("#label_56").unbind("click").on("click", function(){ 
		gui.onReportBlock();
		$("#popupDiv").remove();
	});
	$("#label_57").unbind("click").on("click", function(){ 
		$("#popupDiv").remove();
	});
	
};

GUI.prototype.showConsentMenu = function() {

	var prompt2show="";
	prompt2show += "<div data-role=\"none\" id=\"consent-menu\" class=\"ui-dialog-contain\" > ";
	prompt2show += " <h3><\/h3>";
	prompt2show += " <a id=\"label_43\" class=\"ui-btn ui-shadow ui-corner-all ui-btn-b\">"+dictionary.Literals.label_43+"<\/a>";
	prompt2show += " <a id=\"label_44\" class=\"ui-btn ui-shadow ui-corner-all ui-btn-b\">"+dictionary.Literals.label_44+"<\/a>";
	prompt2show += " <a id=\"label_45\" class=\"ui-btn ui-shadow ui-corner-all ui-btn-a\">"+dictionary.Literals.label_45+"<\/a>";
	prompt2show += "<\/div>";
	
	
	$("#chat-page-content").append( prompt2show );
	
	$("#label_43").unbind( "click" ).bind("click", function(){	
		gui.showBlockSomebodyPrompt();
	});
	$("#label_44").unbind( "click" ).bind("click", function(){			 
		gui.onReportAbuse();
	});
	$("#label_45").unbind( "click" ).bind("click", function(){			 
		gui.onConsentButton();
	});
	
};

/**
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.showConversation = function( obj , callback ) {

	gui.listOfImages4Gallery = null;
	gui.listOfImages4Gallery = [];
	gui.indexOfImages4Gallery = 0;
	app.currentChatWith = obj.publicClientID;
    $("body").pagecontainer("change", "#chat-page");
    gui.showLoadingSpinner();			
    
	$("#imgOfChat-page-header").attr("src", obj.imgsrc );
	
	mailBox.retrieveMessages( obj.publicClientID ).done(function(list){
		if ( list.length == config.MAX_SMS_RETRIEVAL ){
			gui.bindPagination( list[0].timestamp );	
		}
		list.reverse().map(function( message ){			
			gui.showMsgInConversation( message, { isReverse : false, withFX : true } );
		});	
		gui.hideLoadingSpinner();
		
		if( ! obj.isAccepted ){
			gui.showConsentMenu();	
		}
		if ( callback ){ callback(); }
	});
	
	if ( obj.counterOfUnreadSMS > 0 ){
		obj.counterOfUnreadSMS = 0;
		abstractHandler.setOnList( obj );
		abstractHandler.setOnDB( obj );	
		gui.refreshCounterOfChat( obj );
	}

	if ( obj instanceof ContactOnKnet ){
		contactsHandler.sendProfileRequest( obj );	
	}	
		
};

GUI.prototype.showContactsOnGroupMenu = function() {
	
	$('#contacts4Group').empty();
	
	contactsHandler.listOfContacts.map( function( obj ){
		var html2insert = 	
		'<li id="divAddContact2Group'+obj.publicClientID + '">'+
		' <a>'+ 
		'  <img src="' + obj.imgsrc + '" class="imgInMainPage"/>'+
		'  <h2>'+ obj.nickName   + '</h2> '+
		'  <p>' + obj.commentary + '</p>'+
		' </a>'+
		' <a id="buttonAddContact2Group'+obj.publicClientID + '" data-role="button" class="icon-list" data-inline="true">'+
		' </a>' +
		'</li>';
					
		$("#contacts4Group").append( html2insert );
			
		if ( gui.groupOnMenu.listOfMembers.indexOf( obj.publicClientID ) != -1){
			gui.showAddContact2Group( obj );
		}else{
			gui.showRemoveContactFromGroup( obj );
		}		
	});	
};

GUI.prototype.showContactOnMapPage = function( contact ) {
	
	var html2insert = 	
		'<li id="' + contact.publicClientID + '-inMap">'+
		' <a>  '+
		'  <img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.imgsrc + '" class="imgInMainPage"/>'+
		'  <h2>'+ contact.nickName   + '</h2> '+
		'  <p>' + contact.commentary + '</p></a>'+
		' <a></a>'+
		'</li>';
		
	$("#listOfContactsInMapPage")
		.append(html2insert)
		.listview().listview('refresh')
		.find('#' + contact.publicClientID + "-inMap").first().on("click", function(){			 
			gui.showConversation( contact );
		});
	 
	var latlng = L.latLng(contact.location.lat, contact.location.lon);
	marker = new L.marker(latlng).bindPopup(contact.nickName).addTo(app.map);
	
};

GUI.prototype.showDialog = function( html ) {	
	$("#popupDiv").remove();
	var prompt2show = '<div id="popupDiv" data-role="popup"> '+ html + '</div>';
	
	var activePage = $.mobile.activePage.attr("id");
	$("#"+activePage).append( prompt2show );
	$("#"+activePage).trigger("create");
	
	$(".backButton").unbind( "click" ).bind("click", function(){			 
		gui.onBackButton();
	});
	$("#popupDiv").popup("open");
};

GUI.prototype.showEmojis = function() {	
    $('body').pagecontainer('change', '#emoticons', { transition : "none" } );
};

/** 
 * @param obj := ContactOnKnet | Group
 * @param isNewContact := true | false , ( obj == Group) --> isNewContact := false)
 */
GUI.prototype.showEntryOnMainPage = function( obj, isNewContact) {

	if ( $('#'+obj.publicClientID).length ){
		$('#listOfContactsInMainPage').prepend( $('#'+obj.publicClientID) );
		$('#listOfContactsInMainPage').listview().listview('refresh');
		gui.refreshProfileInfo(obj);
		return;
	} 
	
	if( obj.isBlocked ) return;	
	
	var attributesOfLink = "" ;		
	if (isNewContact){
		attributesOfLink += ' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}	
	var htmlOfCounter = "";
	if ( obj.counterOfUnreadSMS > 0 ){
		htmlOfCounter = '<span id="counterOf_'+ obj.publicClientID + '" class="ui-li-count" style="border-color: #FF9720;">'+
		                   obj.counterOfUnreadSMS +
		                '</span>';
	}else{
		htmlOfCounter = '<span id="counterOf_'+ obj.publicClientID + '" class="" style="border-color: #FF9720;"></span>';
	}
		
	var html2insert = 	
		'<li id="' + obj.publicClientID + '" data-sortby=' + obj.timeLastSMS + ' >'+
		'	<a id="link2go2ChatWith_'+ obj.publicClientID  + '">'+ 
		'		<img id="profilePhoto' + obj.publicClientID +'" src="'+ obj.imgsrc + '" class="imgInMainPage"/>'+
		'		<h2>'+ obj.nickName   + '</h2> '+
		'		<p>' + obj.commentary + '</p>'+
				htmlOfCounter	+   
		' 	</a>'+
		'	<a id="linkAddNewContact' + obj.publicClientID + '" ' + attributesOfLink   + ' ></a>'+
		'</li>';
				
	$("#listOfContactsInMainPage")
		.prepend(html2insert)
		.find("#link2go2ChatWith_"+ obj.publicClientID).on("click", function(){ gui.showConversation( obj ); } );
	
	if (isNewContact){
		$("#linkAddNewContact"+ obj.publicClientID).on("click", function(){ contactsHandler.addNewContactOnDB( obj ); } );
	}else{
		$("#linkAddNewContact"+ obj.publicClientID).on("click", function(){ gui.showConversation( obj ); } );
	}	

	$('#listOfContactsInMainPage').listview().listview('refresh');
	gui.showLastMsgTruncated( obj );
};

/** 
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.showEntryOnResultsPage = function( obj, isNewContact ) {

	var a = $("#listInResultsPage").find('#results_'+obj.publicClientID);
    if (a.length != 0) {
    	return;
    }
	
	if( obj.isBlocked ) return;	
	
	var attributesOfLink = "" ;		
	if (isNewContact){
		attributesOfLink += ' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}	
		
	var html2insert = 	
		'<li id="results_' + obj.publicClientID + '" >'+
		'	<a id="resultGo2Chat_'+ obj.publicClientID  + '">'+ 
		'		<img id="profilePhoto' + obj.publicClientID +'" src="'+ obj.imgsrc + '" class="imgInMainPage"/>'+
		'		<h2>'+ obj.nickName   + '</h2> '+
		'		<p>' + obj.commentary + '</p>'+
		' 	</a>'+
		'	<a id="linkAddNewContact' + obj.publicClientID + '" ' + attributesOfLink   + ' ></a>'+
		'</li>';
				
	$("#listInResultsPage")
		.prepend(html2insert)
		.find("#resultGo2Chat_"+ obj.publicClientID).on("click", function(){ gui.showConversation( obj ); } );
	
	if (isNewContact){
		$("#linkAddNewContact"+ obj.publicClientID).on("click", function(){ contactsHandler.addNewContactOnDB( obj ); } );
	}else{
		$("#linkAddNewContact"+ obj.publicClientID).on("click", function(){ gui.showConversation( obj ); } );
	}
	
	$('#listInResultsPage').listview().listview('refresh');
	
};



GUI.prototype.showGallery = function(index) {	
	
    if (app.devicePlatform == "WinCE" || app.devicePlatform == "Win32NT") {
        return;
    }
	gui.loadGalleryInDOM();
	var pswpElement = document.querySelectorAll('.pswp')[0];	
	var options = {};
	options.index = parseInt(index);
	options.mainClass = 'pswp--minimal--dark';
	options.barsSize = {top:0,bottom:0};
	options.captionEl = false;
	options.fullscreenEl = false;
	options.shareEl = true;
	options.bgOpacity = 0.85;
	options.tapToClose = false;
	options.tapToToggleControls = false;

	options.shareButtons= [];
	
	gui.photoGalleryClosed = false;
	gui.photoGallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, gui.listOfImages4Gallery, options);
	gui.photoGallery.init();
	gui.photoGallery.listen('destroy', function() { 
		setTimeout( function() { gui.photoGalleryClosed = true; } , config.TIME_SILENT_SCROLL );
	});	
};

GUI.prototype.showGroupsOnGroupMenu = function() {
	
	$('#listOfGroups').empty();
	
	groupsHandler.list.map( function( group ){
		var html2insert = 	
		'<li id="divGroupOnMenu'+group.publicClientID + '">'+
		' <a>'+ 
		'  <img src="' + group.imgsrc + '" class="imgInMainPage"/>'+
		'  <h2>'+ group.nickName   + '</h2> '+
		'  <p>' + group.commentary + '</p>'+
		' </a>'+
		'</li>';
					
		$("#listOfGroups")
		 .append( html2insert)
		 .listview().listview('refresh')
		 .find("#divGroupOnMenu"+group.publicClientID)		 
		 .unbind("click")		 
		 .on("click", function(){ 
		 	gui.loadGroupMenu( group );		 		 	
		 });
	});
};


GUI.prototype.showJoinPlanPrompt = function( plan ) {
	
	var obj = abstractHandler.getObjById( plan.organizerObj.publicClientID ); 
	if (typeof obj == "undefined" || obj == null) return;  		

	var html = '';
	html += '<div id="block-confirm" role="main" class="ui-content">';
	html += ' <h1 id="label_76" class="ui-title" role="heading" aria-level="1">'+dictionary.Literals.label_76+'</h1><p> </p>';	
	html += ' <ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\">' + 	
			'  <li>'+
			' 	<a data-role=\"none\" class="ui-btn">'+ 
			'  	 <img src="' + obj.imgsrc + '" class="imgInMainPage"/>'+
			'  	 <h2>'+ obj.nickName   + '</h2> '+
			'  	 <p>'+ obj.commentary   + '</p> '+
			'   </a>'+
			'  </li>';
	html += ' <a id="label_56" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_46+'</a>';
	html += ' <a id="label_57" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_47+'</a>';
	html += '</div>';
	gui.showDialog( html );
	
	$("#label_56").unbind("click").on("click", function(){		
		gui.showConversation( obj , function(){
			
			var message2send = new Message({ 	
				to : obj.publicClientID, 
				from : user.publicClientID , 
				messageBody : { messageType : "inclusionRequest", planId : plan.planId }
			});	
			log.debug("forwardMsg " , message2send , plan );
			app.forwardMsg ( message2send, obj );			
		});			
		$("#popupDiv").remove();
	});
	$("#label_57").unbind("click").on("click", function(){ 
		$("#popupDiv").remove();
	});
	
};



GUI.prototype.showImagePic = function() {	
	
	var prompt2show = 	
	'<div id="popupDivMultimedia" data-role="popup" data-overlay-theme="a"> '+
	'	<a class="backButton ui-btn-right" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" ></a>'+
	'	<input data-role="none" hidden type="file" name="image" id="picPopupDivMultimedia" class="picedit_box">		 '+
	'</div>';
	$("#multimedia-content").append(prompt2show);
	$("#multimedia-content").trigger("create");
	$(".backButton").unbind( "click" ).bind("click", function(){			 
		gui.onBackButton();
	});	
	$( "#popupDivMultimedia" ).bind({
	  popupafterclose: function(event, ui) {
		  $("#popupDivMultimedia").remove();
	  }
	});
		
	$('#picPopupDivMultimedia').picEdit({
		maxWidth : ( config.MAX_WIDTH_IMG > $(window).width() * 0.70  ) ? $(window).width() * 0.70 : config.MAX_WIDTH_IMG ,
		maxHeight : ( config.MAX_HEIGHT_IMG > $(window).height() * 0.60 ) ? $(window).height() * 0.60 :  config.MAX_HEIGHT_IMG  ,
		displayWidth: $(window).width() * 0.70 ,
		displayHeight: $(window).height() * 0.60 , 
		navToolsEnabled : false,
		isMobile : app.isMobile,
		onImageCreation : function(){
			$("#popupDivMultimedia").popup( "close" );						
		},
		onNativeCameraInit : app.onNativeCameraInit,		
 		imageUpdated: function(img){ 
 			app.sendMultimediaMsg({ receiver : app.currentChatWith, src : img.src });
 		}
 	});// END picEdit construct	
		
	$("#popupDivMultimedia").popup("open");
	
};

/**
 * @param obj := ContactOnKnet | Group
 */

GUI.prototype.showLastMsgTruncated = function( obj ){

	var tag = $( "#link2go2ChatWith_" + obj.publicClientID).children().closest("p");
	
	if ( obj.lastMsgTruncated != ""){
		var ellipsis = "";
		if ( config.MAX_LENGTH_TRUNCATED_SMS - 4 < obj.lastMsgTruncated.length ){
			ellipsis = " ...";
		}
		tag.html( decodeURIComponent( obj.lastMsgTruncated ) + ellipsis);	
	}else{
		tag.html( decodeURIComponent( obj.commentary ) );
	}	
};

GUI.prototype.showListOfBlocked = function() {
	
	$('#listOfBlocked').empty();
	var listOfBlocked = [];
	
	groupsHandler.list.map( function( group ){
		if ( group.isBlocked ){	listOfBlocked.push(group); }		
	});	
	contactsHandler.listOfContacts.map( function( obj ){
		if ( obj.isBlocked ){ listOfBlocked.push(obj); }
	});	
	
	listOfBlocked.map( function( obj ){
		var html2insert = 	
			'<li id="divBlockedPeople'+obj.publicClientID + '">'+
			' <a>'+ 
			'  <img src="' + obj.imgsrc + '" class="imgInMainPage"/>'+
			'  <h2>'+ obj.nickName   + '</h2> '+
			'  <p>' + obj.commentary + '</p>'+
			' </a>'+
			' <a id="buttonUnblock'+obj.publicClientID + '" data-role="button" class="icon-list ui-icon-forbidden" data-inline="true">'+
			' </a>' +
			'</li>';
						
		$("#listOfBlocked")
		 .append( html2insert)
		 .listview().listview('refresh')
		 .find("#divBlockedPeople"+obj.publicClientID)		 
		 .unbind("click")		 
		 .on("click", function(){ 
		 	gui.showUnblockSomebodyPrompt( obj );		 		 	
		 });
	});
};




GUI.prototype.showLoadingSpinner = function(text2show){

	$('.mask-color').fadeIn('fast');
};

GUI.prototype.showLocalNotification = function(msg) {	
	
	if ( app.isMobile && 
		(app.inBackground || msg.from != app.currentChatWith) &&
		 app.devicePlatform == "Android"){

		var contact = contactsHandler.getContactById( msg.from );
		var sendersName = ( contact ) ? contact.nickName : dictionary.Literals.label_16;
		var text2show = "";	
		if ( msg.messageBody.messageType == "multimedia" ){
			text2show = "multimedia";
		}else if ( msg.messageBody.messageType == "text" ){
			text2show = decodeURI(gui._sanitize( msg.messageBody.text )).substring(0, config.MAX_LENGTH_TRUNCATED_SMS);
		}
		
		var options = {
    	    id: 0,
    	    title: sendersName,
    	    text: text2show     	    	
    	};
		if ( app.devicePlatform == "Android"){
			options.smallIcon = "res://icon.png"  
		}		
		
		cordova.plugins.notification.local.isPresent( 0 , function (present) {			
			if ( present ){				
		    	cordova.plugins.notification.local.update( options );		    	
		    }else{		    	
				cordova.plugins.notification.local.schedule( options );	
		    }		    
		});				
	}	
};

/**
 * @param message := Message
 * @param options := { isReverse := boolean , withFX := boolean }
 */
GUI.prototype.showMsgInConversation = function( message, options ) {

	var authorOfMessage;
	var classOfmessageStateColor = "";
		
	if ( message.from == user.publicClientID ){
		authorOfMessage = " ";

		classOfmessageStateColor = "red-no-rx-by-srv";		
		if (message.markedAsRead == true){
			classOfmessageStateColor = "blue-r-by-end";
		} else if (message.ACKfromAddressee == true){
			classOfmessageStateColor = 	"green-rx-by-end";
		} else if (message.ACKfromServer == true){
			classOfmessageStateColor = "amber-rx-by-srv";
		}
	}else {		
		
		var contact = contactsHandler.getContactById( message.from ); 		
		if (typeof contact == 'undefined' || contact == null) 
			return;
			
		authorOfMessage = contact.nickName;
				
		if (message.markedAsRead == false) {		  	
			var messageACK = {	
	  			to : message.to, 
	  			from : message.from,
	  			msgID : message.msgID, 
	  			typeOfACK : "ReadfromAddressee"
		  	};					
			postman.send("MessageDeliveryACK", messageACK );
			message.markedAsRead = true;
			mailBox.storeMessage(message);						
		}		
	}
	var htmlOfContent = "";
	var htmlOfVideoPreview ="";
	if ( message.messageBody.messageType == "text")	{
		htmlOfContent = this._sanitize( message.messageBody.text );
		htmlOfContent = decodeURI( htmlOfContent );
		var parsedLinks = this._parseLinks( htmlOfContent );
		htmlOfContent = parsedLinks.htmlOfContent;
		htmlOfContent = twemoji.parse( htmlOfContent,function(icon, options, variant) {
			return './js/' + options.size + '/' + icon + '.png';
		});

		parsedLinks.mediaLinks.map(function(link){			
			var srcPath = null;
			if (link.type == "youtube"){
				srcPath = "http://www.youtube.com/embed/" + link.id ;		
			}else{
				srcPath = "https://player.vimeo.com/video/" + link.id ;
			}
			if (srcPath != null){
				htmlOfVideoPreview += 
				'<div class="youtube-preview">'+
			     	'<iframe width="100%" height="100%" src=' + srcPath + ' frameborder="0" allowfullscreen=""></iframe>'+
			     	'<div class="tool-bar"> <div data-role="none" class="pswp__button pswp__button--share" ></div> </div>'+
		  		'</div>';				
			}
		});
		
	}else if (message.messageBody.messageType == "multimedia"){
					
		htmlOfContent = 
		'<div class="image-preview"> ' + 
		' <a>' + 
		'  <img class="image-embed" src="' + message.messageBody.src +'" data-index="'+gui.indexOfImages4Gallery+'">' +
//		'  <img class="lazy"  data-src="' + message.messageBody.src +'">' +		
		' </a>' +			 
		' <div class="tool-bar"> <div data-role="none" class="pswp__button pswp__button--share" ></div> </div>' +
		'</div>' ;		
		gui.setImgIntoGallery(gui.indexOfImages4Gallery , message.messageBody.src, message.msgID);
		
	}else if ( message.messageBody.messageType == "inclusionRequest"){		
		
		var group = groupsHandler.getGroupById( message.messageBody.planId ); 		
		var groupName = (typeof group == 'undefined' || group == null ) ? message.messageBody.planId : group.nickName;
		var groupPhoto = (typeof group == 'undefined' || group == null ) ? "./res/new_contact_added_195x195.png" : group.imgsrc;
		
		var photo = "";
		var name = "";
		var contact = null;
		var header = "";
		var requestChecked = false;
			
		if ( message.from == user.publicClientID ){
			
			photo = groupPhoto;
			header = dictionary.Literals.label_78;
		}else{
			
			var contact = contactsHandler.getContactById( message.from ); 		
			name = (typeof contact == 'undefined' || contact == null ) ? message.from : contact.nickName;
			photo = (typeof contact == 'undefined' || contact == null ) ? "./res/new_contact_added_195x195.png" : contact.imgsrc;
			header = dictionary.Literals.label_77;
			
			group.listOfMembers.map(function(id){
				if ( id == contact.publicClientID){
					requestChecked = true;
				}
			});
			
		}
		
		htmlOfContent = '';
		htmlOfContent += '<div id="block-confirm" role="main" class="ui-content">';
		htmlOfContent += ' <h1 id="label_77" class="ui-title" role="heading" aria-level="1">'+header+'</h1><p> </p>';	
		htmlOfContent += ' <ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\">' + 	
				'  <li>'+
				' 	<a data-role=\"none\" class="ui-btn">'+ 
				'  	 <img src="' + photo + '" class="imgInMainPage"/>'+
				'  	 <h2>'+name+ '</h2> '+
				'  	 <h2>'+dictionary.Literals.label_40+groupName+ '</h2> '+
				'   </a>'+
				'  </li>';
		
		if ( message.from != user.publicClientID && requestChecked == false ){
			htmlOfContent += ' <a id="label_56" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_46+'</a>';
			htmlOfContent += ' <a id="label_57" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_47+'</a>';
			htmlOfContent += '</div>';	
		}
		
	}	
	
	var timeStampOfMessage = new Date(message.timestamp);
	
	var html2insert = 	
		'<div class="activity">'+
		//'	<div class="avatar"></div>'+
		'	<span class="posted_at">'+
		'  		<div id="messageStateColor_' + message.msgID + '" class="' + classOfmessageStateColor + '"></div>'+	
				gui.formatter.formatDate ( timeStampOfMessage , { datetime: "medium" } ) +
		'	</span>'+
		'	<div class="readable">'+
		'		<span class="user">'+ authorOfMessage   +'</span>'+
		'		<span class="content">'+ htmlOfContent + htmlOfVideoPreview +'</span>'+
		'	</div>' +
		'</div>' ;
	
	var $newMsg = $(html2insert);
	
	if (message.messageBody.messageType == "multimedia"){
		
		$newMsg.find(".pswp__button").unbind("click").on("click", function(){ 
			app.msg2forward = message.msgID;
			$('body').pagecontainer( 'change', '#forwardMenu', { transition : "none" });
		});
		$newMsg.find(".image-embed").unbind("click").on("click", function(evt){
			gui.showGallery( $(evt.target).data('index') );
		});
	 
	}else if ( message.messageBody.messageType == "inclusionRequest"){
	
		$newMsg.find("#label_56").unbind("click").on("click", function(evt){
			
			var contact = contactsHandler.getContactById( message.from ); 
			var group = groupsHandler.getGroupById( message.messageBody.planId ); 
			group.addMember( contact );
			groupsHandler.setGroupOnList( group );
			groupsHandler.setGroupOnDB( group );
			groupsHandler.sendGroupUpdate( group );
			
			var html = '';
			html += '<div role="main" class="ui-content">';
			html += ' <h1 class="ui-title" role="heading" aria-level="1"> done yeah!</h1><p> </p>';	
			html += '</div>';
			gui.showDialog( html );

		});	
	}	
	
	if (message.from != user.publicClientID){
		$newMsg.css("background", "#FFFFE0"); 
	}
	if ( options.isReverse ){
		$("#chat-page-content").prepend($newMsg);
	}else{
		$("#chat-page-content").append($newMsg);
		$("#chat-page-content").trigger("create");
	}
	if ( options.withFX ){
		$('.blue-r-by-end').delay(config.TIME_FADE_ACK).fadeTo(config.TIME_FADE_ACK, 0);		
		setTimeout( function() { 
			$.mobile.silentScroll($(document).height());
		} , 
		config.TIME_SILENT_SCROLL );	
	}

};

GUI.prototype.showPlanImgInResultsPage = function( params ) {
	if ( params.imgsrc != ""){
		$("#profilePhotoResults_"+ params.planId).attr( "src", params.imgsrc );	
	}
};


GUI.prototype.showPlansInResultsPage = function( list ) {
	
	list.map( function( obj ){
		
		var a = $("#listInResultsPage").find('#results_'+obj.planId);
	    if (a.length != 0) {
	    	return;
	    }
		var attributesOfLink = ' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
			
		var html2insert = 	
			'<li id="results_' + obj.planId + '" >'+
			'	<a id="resultsGo2Chat_'+ obj.planId  + '">'+ 
			'		<img id="profilePhotoResults_' + obj.planId +'" src="./res/group_black_195x195.png" class="imgInMainPage"/>'+
			'		<h2>'+ obj.nickName   + '</h2> '+
			'		<p>' + obj.commentary + '</p>'+
			' 	</a>'+
			'	<a id="linkAddNewContact' + obj.planId + '" ' + attributesOfLink   + ' ></a>'+
			'</li>';
					
		$("#listInResultsPage")
			.prepend(html2insert)
			.find("#resultsGo2Chat_"+ obj.planId).on("click", function(){ gui.showProfile( obj ) } )
			.find("#linkAddNewContact"+ obj.planId).on("click", function(){ gui.showProfile( obj ) } );
	
		$('#listInResultsPage').listview().listview('refresh');	
		
  		postman.send("ReqPlanImg", {  planId : obj.planId } );

	});	
	
	list.map( function( obj ){
		
		if ( obj.organizerObj.publicClientID == user.publicClientID ) return;
		
		var contact = contactsHandler.getContactById( obj.organizerObj.publicClientID ); 		
		if (typeof contact == 'undefined' || contact == null){
			contact = new ContactOnKnet( obj.organizerObj );
			contactsHandler.setContactOnList( contact );												
			contactsHandler.sendProfileRequest( contact );
  		} 
		
	});

	
};



/**
 * @param obj := ContactOnKnet | Group | Plan
 */
GUI.prototype.showProfile = function( input ) {
	
	var isGroup = false;
	var isContact = false;
	var isPlan = false;
	var obj;
	if ( input ){
		obj = input;
		isPlan = true;
		gui.isPlanDisplayed = true;
	}else{
		obj = abstractHandler.getObjById( app.currentChatWith ); 
		if (typeof obj == "undefined") return;
		if ( obj instanceof ContactOnKnet ){
			isContact = true;
		}else{
			isGroup = true;
		}
	}
	
	$("#ProfileOfContact-page").remove();
	
	var strVar = "";
	strVar += "		<div data-role=\"page\" data-cache=\"false\" id=\"ProfileOfContact-page\" >";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "					<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "					 <img src=\"res\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "					<\/a>";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\"> ";

	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "									<div class=\"text-center\">";
	
	
	if ( obj.imgsrc == "" && isPlan){
		obj.imgsrc = "./res/group_black_195x195.png"
	}	
	
	strVar += "										<img src=\"" + obj.imgsrc + "\" class=\"img-circle\" data-index='" + gui.indexOfImages4Gallery + "'>";	
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1>" + obj.nickName  + "<\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	if ( isGroup || isContact ){
	strVar += "										<h5>" + obj.commentary  + "<\/h5>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	}
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\"> ";	
	strVar += "					          		<div class=\"timeline-panel\">";
	
	if (isContact){
		strVar += "					        		<h1>" + dictionary.Literals.label_63 + "<\/h1>";	
	}else{	
		strVar += "					        		<h1>" + dictionary.Literals.label_62 + "<\/h1>";
	}
	
	strVar += "					    	      		<div class=\"hr-left\"><\/div>";
	strVar += "					        	  		<div class=\"row\" id=\"contact\">";
	strVar += "					          				<div class=\"col-md-12\">";
	strVar += "												<strong>" + obj.nickName  + "<\/strong><br>";
	
	if ( isPlan){
		strVar += "											<p>" + obj.commentary  + "<\/p>";		
		strVar += "											<div class=\"form-group\">";
		strVar += "												<input id=\"label_73\" data-role=\"none\"  class=\"myDatePicker form-control input-lg \" placeholder=\"\" readonly> ";
		strVar += "												<input id=\"label_74\" data-role=\"none\"  class=\"form-control input-lg myTimePicker\" placeholder=\"\" readonly> ";
		strVar += "											<\/div>";
	}
	if ( isContact ){
	strVar += "					          					<address>";
	strVar += "											  		<abbr title=\"Phone\"> &#9742 &nbsp;"  + obj.telephone + "<\/abbr>";
	strVar += "												<\/address>";
	strVar += "												<email>";
	strVar += "												  	<abbr title=\"email\"> &#9993; &nbsp;" + obj.email + "<\/abbr>";
	strVar += "												<\/email>";
	}
	if ( isGroup || isContact ){
	strVar += "												<address>";
	strVar += "												  	<abbr title=\"id\"> &#x1f511; &nbsp;" + obj.publicClientID + "<\/abbr>";
	strVar += "												<\/address>";
	strVar += "						          			<\/div>";
	strVar += "						          			<div class=\"col-md-12\"><br>";	
	}
	if (isGroup){
		strVar += '<ul id="contacts4Profile">';
		var list = [];
		obj.listOfMembers.map(function( id ){
			var contact2list = contactsHandler.getContactById( id );
			if ( typeof contact2list != "undefined" || contact2list != null && contact2list.publicClientID != user.publicClientID ){
				list.push( contact2list );	
			}			
		});
		list.map( function( e ){
			strVar += '<li id="contact4Profile_'+ e.publicClientID + '">';
			strVar += ' <a>';
			strVar += '  <img src="' + e.imgsrc + '" class="imgInMainPage"/>';
			strVar += '  <h2>'+ e.nickName   + '</h2> ';
			strVar += '  <p>' + e.commentary + '</p>';
			strVar += ' </a>';
			strVar += ' <a id="buttonAddContact2Group'+e.publicClientID + '" data-role="button" class="icon-list" data-inline="true">';
			strVar += ' </a>';
			strVar += '</li>';			
		});
		strVar += '</ul>';
	}
	
	
	strVar += "					        	  			<\/div>";
	strVar += "					          			<\/div>";
	strVar += "					          			<div id=\"mapProfile\" class=\"mapPlanPage\">";
	strVar += "					          			<\/div>";
	
	if ( isGroup || isContact ){
	strVar += "										<div class=\"col-md-12\">";
	strVar += "					          				<h1 id=\"label_49\">"+dictionary.Literals.label_49+"<\/h1>";
	strVar += "					          				<h1><\/h1>";
	strVar += "											<button id=\"label_54\">"+dictionary.Literals.label_43+"<\/button>";
	strVar += "											<button id=\"label_55\">"+dictionary.Literals.label_48+"<\/button>";
	strVar += "					          			<\/div>";
	}
	if ( isPlan ){
		if ( obj.organizerObj.publicClientID != user.publicClientID ){
			strVar += "					          	<h1><\/h1>";
			strVar += "								<button id=\"label_75\">"+dictionary.Literals.label_75+"<\/button>";
		}else{
			gui.groupOnMenu = new Group(obj);
			gui.groupOnMenu.publicClientID = obj.planId;
			
			$('body').pagecontainer('change', '#createPlanPage', { transition : "none" });
			
			$("#planSubmitButton")
			 .delay( config.TIME_SILENT_SCROLL )
			 .data( 'action', 'modify' )
			 .text( dictionary.Literals.label_39 );
			return;
		}
	}
	
	strVar += "					    	      	<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";	
	strVar += "					<\/div>";
	strVar += "				<\/div>";	
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/ ProfileOfContact-page-->";
	
	$("body")
	  .append(strVar)
	  .find(".img-circle").unbind("click").on("click", function(evt){
			gui.showGallery( $(evt.target).data('index') );
	  });
	$('#contacts4Profile')
		.listview().listview('refresh')
		.find('[id^="contact4Profile_"]').on("click", function( e ){
			var id = $(this).attr('id');
			var idTruncated = id.substring(16, id.length);
			var contact2show = contactsHandler.getContactById( idTruncated );
			if ( typeof contact2show == "undefined" || contact2show == null ) return;
			gui.showConversation( contact2show );
		});
	
	$('body').pagecontainer('change', '#ProfileOfContact-page', { transition : "none" });
	
	gui.setImgIntoGallery(gui.indexOfImages4Gallery , obj.imgsrc, "");
	
	$(".backButton").unbind("click").bind("click",function() {
		gui.onBackButton();
	});	
	$("#label_54").unbind( "click" ).bind("click", function(){			 
		gui.showBlockSomebodyPrompt();
	});
	$("#label_55").unbind( "click" ).bind("click", function(){			 
		gui.onReportAbuse();
	});
	if (isPlan){
		gui.loadMapOnProfile(obj);
		
		var date2display = new Date( parseInt(obj.meetingInitDate) );
		date2display = gui.formatter.formatDate (  date2display , { datetime: "medium" } );
		date2display = date2display.substring( 0, date2display.length-5 );
		$('#label_73').val( date2display );
		
		var time2display = gui.formatter.formatDate (  
			new Date(2000,10,10,obj.meetingInitTime.hour, obj.meetingInitTime.mins) , 
			{ time: "medium" } 
		);		
		$('#label_74').val( time2display );
		
		$("#label_75").unbind( "click" ).bind("click", function(){	
			gui.showJoinPlanPrompt( obj );
		});
	}else{
		gui.loadMapOnProfile();
	}
	
};

GUI.prototype.showRemoveContactFromGroup = function( contact ) {

	$('#buttonAddContact2Group' + contact.publicClientID)
		.attr({	'class': 'icon-list ui-btn ui-btn-icon-notext ui-icon-plus' });
	
	$("#contacts4Group")
		.find("#divAddContact2Group"+ contact.publicClientID)
		.unbind("click")
		.on("click", function(){ gui.onAddContact2Group( contact );  } );
	
	$('#contacts4Group').listview().listview('refresh');			
};

GUI.prototype.showReportAbuse = function() {
	
	var html = '';
	html += '<div id="block-confirm" role="main" class="ui-content">';
	html += ' <h1 id="label_58" class="ui-title" role="heading" aria-level="1">'+dictionary.Literals.label_58+'</h1><p> </p>';	
	html += '</div>';
	gui.showDialog( html );
	
};

/** 
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.showTargetOnForwardMenu = function( obj ) {
	
	var html2insert = 	
		'<li id="' + obj.publicClientID + '-inForwardMenu">'+
		' <a>  '+
		'  <img id="profilePhoto' + obj.publicClientID +'" src="'+ obj.imgsrc + '" class="imgInMainPage"/>'+
		'  <h2>'+ obj.nickName + '</h2> '+
		'  <p>' + obj.commentary + '</p></a>'+
		' <a></a>'+
		'</li>';
		
	$("#listOfContactsInForwardMenu")
		.append(html2insert)
		.listview().listview('refresh')
		.find('#' + obj.publicClientID + "-inForwardMenu").first().on("click", function(){
			gui.forwardMsg( obj );
		});
	
};

GUI.prototype.showTermsAndConditions = function() {	
	var html = '';	
	html += "<h1>Terms and Conditions (\"Terms\")<\/h1>";
	html += "<p>Please read these Terms and Conditions carefully before using either the knet mobile app or the http:\/\/www.instaltic.com\/knet website (the \"Service\") operated by InstalTIC S.L. (\"us\", \"we\", or \"our\").<\/p>";
	html += "<p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.<\/p>";
	html += "<p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.<\/p>";
	html += "<p><strong> privacy policy <\/strong><\/p>";
	html += "<p>We do not request any personal data from you. Your identity is just a random number for us. However you can always set your details in your profile if you want to share them with other users. <\/p>";
	html += "<p>We do not collect your messages. The only message data stored on our servers is the data that is currently in transit, and even this data is encrypted with end-to-end encryption, we can not read it. <\/p>";
	html += "<p>We do not any financial data of yours. <\/p>";
	html += "<p>There are some data knet uses in order to provide the service: <\/p>";
	html += "<p>your IP-address, or the IP-Address of a router when you are in a network using NAT,<\/p>";
	html += "<p>your public keys, <\/p>";
	html += "<p>your client identifier, which is a random number, <\/p>";
	html += "<p>your chosen nickname, avatar, telephone and email, if and only is you decided to put it into your profile. <\/p>";
	html += "<p><strong>Accounts<\/strong><\/p>";
	html += "<p>We may terminate your account, without previous warning if you breach the Terms. We will immediately block your account if we detect an inappropriate use of the service. <\/p>";
	html += "<p><strong>Links To Other Web Sites<\/strong><\/p>";
	html += "<p>Our Service may contain links to third-party web sites or services that are not owned or controlled by knet.<\/p>";
	html += "<p>knet has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that knet shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.<\/p>";
	html += "<p>We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.<\/p>";
	html += "<p><strong>Termination<\/strong><\/p>";
	html += "<p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.<\/p>";
	html += "<p>All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.<\/p>";
	html += "<p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.<\/p>";
	html += "<p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.<\/p>";
	html += "<p>All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.<\/p>";
	html += "<p><strong>Governing Law<\/strong><\/p>";
	html += "<p>These Terms shall be governed and construed in accordance with the laws of Spain, without regard to its conflict of law provisions.<\/p>";
	html += "<p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have between us regarding the Service.<\/p>";
	html += "<p><strong>Changes<\/strong><\/p>";
	html += "<p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 15 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.<\/p>";
	html += "<p>By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.<\/p>";
	html += "<p><strong>Contact Us<\/strong><\/p>";
	html += "<p>If you have any questions about these Terms, please contact us. The easiest way to contact us is to email us to support@instaltic.com<\/p>";	
	html += "<p><strong><\/strong><\/p>";
	html += "<p><strong><br><\/strong><\/p>";
	html += '<a id="label_59" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_59+'</a>';
	html += "<p><strong><br><\/strong><\/p>";
	
	gui.showDialog( html );
	$("#label_59").click(function(){
		$("#popupDiv").popup( "close" );
		$("#popupDiv").remove();
	});
};

GUI.prototype.showUnblockSomebodyPrompt = function( obj) {
	
	var html = '';
	html += '<div role="main" class="ui-content">';
	html += ' <h1 id="label_50" class="ui-title" role="heading" aria-level="1">'+dictionary.Literals.label_50+'</h1><p> </p>';	
	html += ' <ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\">' + 	
			'  <li>'+
			' 	<a data-role=\"none\" class="ui-btn">'+ 
			'  	 <img src="' + obj.imgsrc + '" class="imgInMainPage"/>'+
			'  	 <h2>'+ obj.nickName   + '</h2> '+
			'  	 <p>'+ obj.commentary   + '</p> '+
			'   </a>'+
			'  </li>';
	html += '  <a id="label_46" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_46+'</a>';
	html += '  <a id="label_47" class="ui-btn ui-corner-all ui-shadow ui-btn-b" >'+dictionary.Literals.label_47+'</a>';
	html += ' </ul>';
	html += '</div>';
	gui.showDialog( html );
	gui.loadGroupMenu();
	
	$("#label_46").unbind("click").on("click", function(){ 
		obj.isBlocked = false;		
		abstractHandler.setOnList( obj );
		abstractHandler.setOnDB( obj );
				
		$("#popupDiv").remove();
		
		gui.loadGroupMenu();
		gui.showEntryOnMainPage( obj );
	});
	$("#label_47").unbind("click").on("click", function(){ 
		$("#popupDiv").remove();
	});
	
};


GUI.prototype.showWelcomeMessage = function(text2show){

	if (text2show){
		$.mobile.loading( 'show', {
			text: text2show,
			textVisible: true,
			theme: $.mobile.loader.prototype.options.theme,
			textonly: true,
			html: ""
		});
	}
	
};


/**
 * @param ping := { idWhoIsOnline := uuid } 
 */
GUI.prototype.showPeerIsOnline = function ( ping )	{

	var obj = abstractHandler.getObjById( ping.idWhoIsOnline ); 
	if (typeof obj == "undefined" || obj == null) return;  		

	var tag = $( "#link2go2ChatWith_" + obj.publicClientID).children().closest("p"); 		
	
	if ( tag.data("typing") != "on" ){
		
		tag.html( '<font color="orange"><b> ' + 'online' + '</b></font>' );
		tag.delay(config.TIME_FADE_ONLINE_NOTICE)
			.fadeOut(config.TIME_FADE_ONLINE_NOTICE)
			.fadeIn(config.TIME_FADE_ONLINE_NOTICE)
			.fadeOut(config.TIME_FADE_ONLINE_NOTICE)
			.fadeIn(config.TIME_FADE_ONLINE_NOTICE, function(){
									
			var newObj = abstractHandler.getObjById( ping.idWhoIsOnline ); 
			gui.showLastMsgTruncated( newObj );
		});		
	}	
};

/**
 * @param ping := { idWhoIsWriting := uuid, toWhoIsWriting := uuid} 
 */
GUI.prototype.showPeerIsTyping = function ( ping )	{

	var obj = abstractHandler.getObjById( ping.idWhoIsWriting ); 
	if (typeof obj == "undefined" || obj == null) return;  		

	var tag = $( "#link2go2ChatWith_" + obj.publicClientID).children().closest("p"); 		
	
	if ( tag.data("typing") != "on" ){
		
		tag.html( '<font color="orange"><b> ' + dictionary.Literals.label_61 + ' ... </b></font>' );
		tag.data("typing","on");
		tag.delay(config.TIME_FADE_WRITING)
			.fadeOut(config.TIME_FADE_WRITING)
			.fadeIn(config.TIME_FADE_WRITING)
			.fadeOut(config.TIME_FADE_WRITING)
			.fadeIn(config.TIME_FADE_WRITING, function(){
			
			tag.data("typing","off");			
			var newObj = abstractHandler.getObjById( ping.idWhoIsWriting ); 
			gui.showLastMsgTruncated( newObj );
		});		
	}	
};


/**
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.refreshCounterOfChat = function( obj ) {
	
	if ( obj.counterOfUnreadSMS > 0 ){
		$("#counterOf_"+obj.publicClientID).text( obj.counterOfUnreadSMS );		
		$("#counterOf_"+obj.publicClientID).attr("class", "ui-li-count");
	} else{
		$("#counterOf_"+obj.publicClientID).text("");
		$("#counterOf_"+obj.publicClientID).attr("class", "");
	}

	$('#listOfContactsInMainPage').listview().listview('refresh');	
};

/**
 * @param obj := ContactOnKnet | Group 
 */
GUI.prototype.refreshProfileInfo = function ( profileUpdate )	{

	var obj = abstractHandler.getObjById( profileUpdate.publicClientID ); 
	if (typeof obj == "undefined" || obj == null) return;  		
	obj.lastProfileUpdate = new Date().getTime();

	abstractHandler.setOnList( obj );
	abstractHandler.setOnDB( obj );

	$("#profilePhoto"+obj.publicClientID ).attr("src", obj.imgsrc);		
	if (app.currentChatWith == obj.publicClientID) $("#imgOfChat-page-header").attr("src", obj.imgsrc);
	
	var kids = $( "#link2go2ChatWith_" + obj.publicClientID).children(); 		
	
	if ( obj.imgsrc != "" ) kids.find("img").attr("src", obj.imgsrc );		
	if ( obj.nickName != "" ) kids.closest("h2").html( obj.nickName );		
	if ( obj.commentary != "" ) kids.closest("p").html( obj.commentary );
	
};

GUI.prototype.refreshPurchasePrice = function() {
	var purchase = gui.getPurchaseDetails();
	var price = 0;
	
	if(purchase.licenseDurationChoosen == "fourYears") price = price + 3;
	if(purchase.licenseDurationChoosen == "oneYear") price = price + 1;
	if(purchase.isNGOdonationChecked) price = price + 1;
	if(purchase.isFSIdonationChecked) price = price + 1;
	
	$("#price").html(price + "\u20AC");
	
};


function MailBox() {
};

/**
 * @param id := uuid
 * @param olderDate := Date().getTime()
 * @param newerDate := Date().getTime()
 * @returns listOfMessages := [ Message ]
 */
MailBox.prototype.getAllMessagesOf = function( id , olderDate, newerDate) {

	var range = IDBKeyRange.bound( olderDate, newerDate );		
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messages"], "readonly").objectStore("messages").index("timestamp").openCursor(range).onsuccess = function(e) {		
		var cursor = e.target.result;
     	if (cursor) {
     		if ( cursor.value.chatWith == id ){
     			var newMsg = new Message( cursor.value );
     			listOfMessages.push( newMsg );	
     		}        	
         	cursor.continue(); 
     	}else{			
     		deferred.resolve( listOfMessages );     			
     	}
	};
	
	return deferred.promise();
};

/**
 * @param msgID := uuid
 * @returns newMsg := Message | "undefined"
 */
MailBox.prototype.getMessageByID = function(msgID) {
	var singleKeyRange = IDBKeyRange.only(msgID);  
	var deferredGetMessageByID = $.Deferred();
	
	db.transaction(["messages"], "readonly").objectStore("messages").openCursor(singleKeyRange).onsuccess = function(e) {
		var cursor = e.target.result;
		var message;
     	if (cursor) {
     		message = cursor.value;
         	var newMsg = new Message(message);
         	deferredGetMessageByID.resolve(newMsg); 
     	}
	};
	
	return deferredGetMessageByID.promise();
};

/**
 * @param olderDate := Date().getTime()
 * @param newerDate := Date().getTime()
 * @returns listOfMessages := [ Message ]
 */
MailBox.prototype.getMessagesSentOffline = function(olderDate, newerDate) {

	var range = IDBKeyRange.bound(olderDate,newerDate);		
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messages"], "readonly").objectStore("messages").index("timestamp").openCursor(range).onsuccess = function(e) {		
		var cursor = e.target.result;
     	if (cursor) {
     		if (cursor.value.ACKfromServer == false ){
     			var newMsg = new Message( cursor.value );
     			listOfMessages.push( newMsg );	
     		}        	
         	cursor.continue(); 
     	}else{			
     		deferred.resolve(listOfMessages);     			
     	}
	};
	
	return deferred.promise();
};

/**
 * @param id := uuid
 * @param newerDate := Date().getTime()
 * @returns listOfMessages := [ Message ]
 */
MailBox.prototype.retrieveMessages = function( id , newerDate) {
	
	if ( typeof newerDate == "undefined"){
		newerDate = new Date().getTime();	
	}
	var olderDate = config.TIME_UNIX_2015;
	var range = IDBKeyRange.bound( olderDate , newerDate );		
	var deferred = $.Deferred();
	var listOfMessages = [];
	var counter = 0;
	
	db.transaction(["messages"], "readonly").objectStore("messages").index("timestamp").openCursor(range, "prev").onsuccess = function(e) {		
		var cursor = e.target.result;
     	if (cursor && counter < config.MAX_SMS_RETRIEVAL) {
     		if ( cursor.value.chatWith == id ){
     			var newMsg = new Message( cursor.value );
     			listOfMessages.push( newMsg );
     			counter = counter + 1;
     		}        	
         	cursor.continue(); 
     	}else{			
     		deferred.resolve( listOfMessages );     			
     	}
	};
	
	return deferred.promise();
};

/**
 * @param olderDate := Date().getTime()
 * @param newerDate := Date().getTime()
 * @param listOfMessages := [ Message ]
 */
MailBox.prototype.sendOfflineMessages = function( olderDate, newerDate, listOfMessages) {
	
	mailBox.getMessagesSentOffline(olderDate, newerDate).done(function(list){

		if (listOfMessages.length > config.MAX_SEND_OFFLINE_SMS || 
			olderDate < config.TIME_UNIX_2015 ){
							
			listOfMessages.map(function(message){
				postman.sendMsg( message );											
			});
			
		}else {			
			olderDate = olderDate - config.TIME_UNIX_MONTH;
			newerDate = newerDate - config.TIME_UNIX_MONTH;
			mailBox.sendOfflineMessages( olderDate, newerDate, listOfMessages.concat(list));
		}
	});
	
};

/**
 * @param msg2Store := Message
 */
MailBox.prototype.storeMessage = function( msg2Store ) {

	try {
		var singleKeyRange = IDBKeyRange.only( msg2Store.msgID ); 			
		var transaction = db.transaction(["messages"],"readwrite");	
		var store = transaction.objectStore("messages");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		cursor.update( msg2Store );     		
	     	}else{
	     		store.add( msg2Store );
	     	}     	 
		};	
	}
	catch(e){
		log.debug("MailBox.prototype.storeMessage", e);
	}
 		
};

/**
 * @param msg2Store := Message
 */
MailBox.prototype.removeMessage = function( msg2remove ) {

	try {
		var transaction = db.transaction(["messages"],"readwrite");	
		var store = transaction.objectStore("messages");
		store.delete( msg2remove.msgID ).onsuccess = function(e) {
			log.debug("removeMessage ::: succesfully removed");
		};	
	}
	catch(e){
		log.debug("MailBox.prototype.storeMessage", e);
	}
 		
};

MailBox.prototype.unwrapMessagesOf = function( contact ) {

	try {
		var singleKeyRange = IDBKeyRange.only( contact.publicClientID ); 			
		var transaction = db.transaction(["messages"],"readonly");	
		var store = transaction.objectStore("messages");
		store.index("publicclientid").openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		if ( cursor.value.messageBody.hasOwnProperty('index4Key') ){
					postman.onMsgFromClient(cursor.value); 
					log.info("MailBox.prototype.unwrapMessagesOf");			
	     		}
			}    	 
		};	
	}
	catch(e){
		log.debug("MailBox.prototype.unwrapMessagesOf",e);	
	}

};

function Application() {
	this.currentChatWith = null;
	this.myPosition = { coords : { latitude : "",  longitude : ""} };  
	this.symetricKey2use = null;
	this.profileIsChanged = false;
	this.map = null;
	this.connecting = false;
	this.inBackground = false;
	this.initialized = false;
	this.tokenSigned = null;
	this.devicePlatform = "";
	this.indexedDBHandler = null;
	this.deviceVersion = "";
	this.events = {};
	this.events.documentReady = new $.Deferred();
	this.events.contactsLoaded = new $.Deferred();
	this.events.userSettingsLoaded = new $.Deferred();
//	this.events.positionLoaded = new $.Deferred();
	this.events.deviceReady  = new $.Deferred();
	this.isMobile = true;
	this.msg2forward = null;
	this.authSocket = null;
	this.keys = {};
	this.easyrtcid = "";
	this.otherEasyrtcid = "";
};

// Bind Event Listeners
Application.prototype.bindDeviceEvents = function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    document.addEventListener('backbutton',  gui.onBackButton , false);
    document.addEventListener('menubutton', function(){}, false);
    document.addEventListener('searchbutton', function(){}, false);
    document.addEventListener('startcallbutton', function(){}, false);
    document.addEventListener('endcallbutton', function(){}, false);
    document.addEventListener("pause", function(){ app.inBackground = true; }, false);
    document.addEventListener("resume", this.onResumeCustom  , false);   
    document.addEventListener("online", this.onOnlineCustom, false);    
};

Application.prototype.bindPushEvents = function() {

	var push = PushNotification.init( config.pushOptions );
	
	push.on('registration', function(data) {
       app.sendPushRegistrationId( data.registrationId );
	});
	push.on('notification', function(data){
	   // data.message, 
	   // data.title, 
	   // data.count, 
	   // data.sound, 
	   // data.image, 
	   // data.additionalData 
	});
	push.on('error', function(e) {
		console.log("Application.prototype.bindPushEvents - error");
	});
	  
};

Application.prototype.connect2paypal = function(myPurchase) {
	
	$.ajax({
		url: 'http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/payment',
		method : "POST",
		data: {	
			handshakeToken: user.handshakeToken  , 
			purchase : myPurchase
		},
		dataType: "json",
		crossDomain: true,
		xhrFields: {
			withCredentials: false
		}
	})
	.done(function(response) {
		if ( response.OK == true){
			gui.inAppBrowser = window.open( response.URL, '_blank', 'location=yes');
			gui.inAppBrowser.addEventListener('loadstop', gui.onAppBrowserLoad );
			gui.inAppBrowser.addEventListener('exit', gui.onAppBrowserExit );			
		}
	})
	.fail(function() {
		log.info("Application.prototype.connect2paypal - failed");
		//navigator.notification.alert("Are you connected to Internet?", null, 'Uh oh!');
	})
	.always(function() { gui.hideLoadingSpinner(); });		
};	

Application.prototype.connect2server = function(result){
	
	app.symetricKey2use = user.myArrayOfKeys[result.index];
	
	var challengeClear = postman.decrypt(result.challenge).challenge;	
	var token2sign = { 			
		handshakeToken : user.handshakeToken  ,
		challenge :  encodeURI( postman.encrypt( { challengeClear : challengeClear } ) )
  	};
  	app.tokenSigned = postman.signToken(token2sign);
  	
  	var remoteServer = postman.decrypt(result.server2connect);
  	if (remoteServer != null) {
  		config.ipServerSockets = remoteServer.ipServerSockets;
  		config.portServerSockets = remoteServer.portServerSockets;
  	} 
  	
  	if ( typeof socket != "undefined"){
  		socket.disconnect();  		
  	}

  	var url = 'http://' + config.ipServerSockets +  ":" + config.portServerSockets ;
  	var options = { 
		forceNew : true,
		secure : true, 
		reconnection : true,
		query : 'token=' + app.tokenSigned + '&version=' + config.SW_VERSION	
	};
  	socket = io.connect( url, options );
	
	socket.on('connect', function () {
		
		app.connecting = false;	
		log.info("socket.on.connect");
		
		var newerDate = new Date().getTime();	
		var olderDate = new Date(newerDate - config.TIME_UNIX_MONTH).getTime();

		mailBox.sendOfflineMessages(olderDate,newerDate,[]);
		
		if( app.isMobile ){
			app.bindPushEvents();
		}
		
		var awarenessList = [];
		contactsHandler.listOfContacts.map( function( e ){
			awarenessList.push( e.publicClientID ); 
		});
		var ping = { 
			idWhoIsOnline : user.publicClientID,
			listOfReceivers : awarenessList
		};
  		postman.send("WhoIsOnline",  ping );
  		
  		app.initEasyRTC();
  		
	});
	
	socket.on('disconnect', function () {
		log.info("socket.on.disconnect, sendLogin in ", config.TIME_WAIT_WAKEUP); 		
		setTimeout( function(){ app.sendLogin(); } , config.TIME_WAIT_WAKEUP); 
	});
	
	socket.on('reconnect_attempt', function () {
		log.info("socket.on.reconnect_attempt"); 
		app.connecting = true;					
	});
	
	socket.on('reconnect_failed', function () {
		log.info("socket.on.reconnect_failed"); 
		app.connecting = false;
		app.sendLogin();					
	});
	
	socket.on('reconnect', function () {
		log.info("socket.on.reconnect"); 
		app.connecting = false;		
  		postman.send("reconnectNotification", {	publicClientID : user.publicClientID } );
  		var newerDate = new Date().getTime();	
		var olderDate = new Date(newerDate - config.TIME_UNIX_MONTH).getTime();
  		mailBox.sendOfflineMessages(olderDate,newerDate,[]);
	});

	socket.on("MessageDeliveryReceipt", function(inputDeliveryReceipt) {

  		var deliveryReceipt = postman.getDeliveryReceipt(inputDeliveryReceipt);
  		if ( deliveryReceipt == null) { return; }	
  		
  		setTimeout(function (){
	  	  	mailBox.getMessageByID(deliveryReceipt.msgID).done(function (message){
	  	  		if (typeof message == "undefined" || message == null){
	  	  			//it could perfectly be a Message.messageBody.type == groupUpdate
	  	  			return;
	  	  		}
	  	  		if (deliveryReceipt.typeOfACK == "ACKfromServer" && message.ACKfromServer == false) {
	  	  			message.ACKfromServer = true;
	  	  			$('#messageStateColor_' + deliveryReceipt.msgID ).toggleClass( "amber-rx-by-srv" ); 
	  	  		}
	  	  		if (deliveryReceipt.typeOfACK == "ACKfromAddressee" && message.ACKfromAddressee == false) {
	  	  			message.ACKfromServer = true;
	  	  			message.ACKfromAddressee = true;	
	  	  			$('#messageStateColor_' + deliveryReceipt.msgID ).toggleClass( "green-rx-by-end" );
	  	  		}
	  	  		if (deliveryReceipt.typeOfACK == "ReadfromAddressee") {
	  	  			message.ACKfromServer = true;
	  	  			message.ACKfromAddressee = true;	
	  	  			message.markedAsRead = true;
	  	  			$('#messageStateColor_' + deliveryReceipt.msgID ).toggleClass( "blue-r-by-end" );
	  	  			$('.blue-r-by-end').delay(config.TIME_FADE_ACK).fadeTo(config.TIME_FADE_ACK, 0);
	  			}
	  			mailBox.storeMessage(message);	  			
	  		});  			
  		}, config.TIME_WAIT_DB);   		
	});  

	//XEP-0013: Flexible Off-line Message Retrieval :: 2.4 Retrieving Specific Messages
	socket.on("ServerReplytoDiscoveryHeaders", function(inputListOfHeaders) {

		var listOfHeaders = postman.getListOfHeaders(inputListOfHeaders);
		if (listOfHeaders == null) { return; }
		
		log.info("socket.on.ServerReplytoDiscoveryHeaders", listOfHeaders); 

		var loopRequestingMessages = setInterval(function(){
			if (listOfHeaders.length > 0){
				var message2request = listOfHeaders.pop();				
				var requestOfMessage =  {	
					msgID :  message2request.msgID
				};				
				postman.send("messageRetrieval", requestOfMessage );
			}else {				
				clearInterval(loopRequestingMessages);				
			}							
		}, config.TIME_WAIT_MAILBOX_POLLING); 
	   
	  });//END ServerReplytoDiscoveryHeaders	
	  

	socket.on("RequestForProfile", function(input) {
		
		var request = postman.getProfileRequest(input);
	
		if ( request != null && 
			 request.lastProfileUpdate < user.lastProfileUpdate  ){
	
			app.sendProfileUpdate();			 			
		}	
			   
	});//END RequestForProfile	
	
	socket.on("ProfileFromServer", function(input) {
				
		var contactUpdate = postman.getProfileFromServer(input); 
		if (contactUpdate == null) { return;	}
		
		var contact = contactsHandler.getContactById( contactUpdate.publicClientID); 
		if (typeof contact == "undefined" || contact == null) return;  		
		contact.lastProfileUpdate = new Date().getTime();
		
		contactsHandler.setContactOnList( contactUpdate );
		contactsHandler.updateContactOnDB (contact );
		
		$("#profilePhoto" + contact.publicClientID ).attr("src", contact.imgsrc);		
		if (app.currentChatWith == contact.publicClientID)
			$("#imgOfChat-page-header").attr("src", contact.imgsrc);
		
		var kids = $( "#link2go2ChatWith_" + contact.publicClientID).children(); 		

		if ( contact.imgsrc != "" ) kids.find("img").attr("src", contact.imgsrc);		
		if ( contact.nickName != "" ) kids.closest("h2").html(contact.nickName);		
		if ( contact.commentary != "" ) kids.closest("p").html(contact.commentary);
			
		//DOES NOT WORK gui.refreshProfileInfo( contactUpdate );
				
	});//END ProfileFromServer
	
	
	socket.on("locationFromServer", function(input) {
		
		var position = postman.getLocationFromServer(input);
		log.info("locationFromServer ::: " + JSON.stringify(position) );
		if (position && position != null && app.myPosition.coords.latitude == ""){			
			app.myPosition.coords.latitude = parseFloat( position.coords.latitude ); 
			app.myPosition.coords.longitude = parseFloat( position.coords.longitude );				
		}		
		app.sendRequest4Neighbours();

	});//END locationFromServer	
	  
	socket.on("notificationOfNewContact", contactsHandler.processNewContacts);
	//END notificationOfNewContact
	
	socket.on("KeysDelivery", function (input){
		
		log.info("socket.on.KeysDelivery - receiving something");
		
		var data = postman.getKeysDelivery(input); 
		if (data == null) { return;	}
		
		if ( data.from == user.publicClientID ){
			log.info("socket.on.KeysDelivery - discard my own delivery");		
		}else{			
			try {				
				var contact = contactsHandler.getContactById( data.from );
				
				if ( typeof contact == 'undefined' || contact == null ){
					contact = new ContactOnKnet({ publicClientID : data.from });
					contactsHandler.setContactOnList( contact );
					gui.showEntryOnMainPage ( contact, false );
				}
				if ( contact.decryptionKeys == null ){	
					
		 			var masterKeydecrypted = app.keys.privateKey.decrypt( data.setOfKeys.masterKeyEncrypted , 'RSA-OAEP' );
		 				
					var decipher = forge.cipher.createDecipher('AES-CBC', masterKeydecrypted);
					decipher.start({ iv: data.setOfKeys.symKeysEncrypted.iv2use });
					decipher.update(forge.util.createBuffer( data.setOfKeys.symKeysEncrypted.keysEncrypted ) );
					decipher.finish();
										
					contact.decryptionKeys = KJUR.jws.JWS.readSafeJSONString(decipher.output.data).setOfSymKeys;
					contactsHandler.setContactOnList( contact );
					contactsHandler.setContactOnDB( contact );
					contactsHandler.sendProfileRequest( contact );

					mailBox.unwrapMessagesOf( contact );
				} 
			}catch (ex) {	
				log.debug("socket.on.KeysDelivery", contact);	
				return null;
			}	
	 	} // END else			
	});//END KeysDelivery event
	
	socket.on("KeysRequest", function (input){
		
		var data = postman.getKeysRequest(input); 
		if (data == null) { return;	}
		
		if ( data.from == user.publicClientID ){
			log.info("socket.on.KeysRequest - discard my own Request");
		}else{			
			try {				
				var contact = contactsHandler.getContactById( data.from );
				contactsHandler.sendKeys(contact);		

			}catch (ex) {	
				log.debug("socket.on.KeysRequest", ex);
				return null;
			}	
	 	}		
	});//END KeysRequest event
	
	socket.on("MessageFromClient", function (input){
		postman.onMsgFromClient( input );	
	});//END MessageFromClient event
	
	socket.on("WhoIsOnline", function (input){
		var ping = postman.getWhoIsOnline(input); 
		if (ping == null) { return;	}
		
		gui.showPeerIsOnline( ping );
		
	});//END WhoIsWriting event
	
	socket.on("WhoIsWriting", function (input){
		var ping = postman.getWhoIsWriting(input); 
		if (ping == null) { return;	}
		
		gui.showPeerIsTyping( ping );
		
	});//END WhoIsWriting event
	
	socket.on("PlansAround", function (input){
		var list = postman.getPlansAround(input); 
		if (list == null) { return;	}
		gui.listOfPlans = list;
		gui.showPlansInResultsPage( list );
		
	});//END PlansAround event
	
	socket.on("ImgOfPlanFromServer", function (input){
		var params = postman.getPlanImgFromServer(input); 
		if (params == null) { return;	}
		gui.listOfPlans.map(function(e){
			if (e.planId == params.planId){
				e.imgsrc = params.imgsrc;
			}
		});
		gui.showPlanImgInResultsPage( params );
		
	});//END PlansAround event
	
};//END of connect2server

Application.prototype.detectLanguage = function() {
	var language = {};
	language.detected = null;
	language.value = null;
	
	if (typeof cordova == "undefined" || cordova == null ){
		language.detected = 
		 navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
		app.setLanguage(language);
		
	}else{
		
		$.when( app.events.documentReady, app.events.deviceReady).done(function(){						
			navigator.globalization.getPreferredLanguage(
			    function (detectedLanguage) {
			    	language.detected = detectedLanguage.value;
			    	app.setLanguage(language);
				},
			    function () {
			    	language.detected = "English";
			    	app.setLanguage(language);
			    }
			);
		});	
			
	}
};

Application.prototype.detectPosition = function(){
	if (typeof cordova == "undefined" || cordova == null ){
		
		if ( navigator.geolocation ) {
	        function success(pos) {
	            app.myPosition = pos;
	            app.sendRequest4Neighbours();
	        }
	        function fail(error) {
	        	log.info("detectPosition ::: failed " + JSON.stringify(error) );	        	
	        }
	        navigator.geolocation.getCurrentPosition(
	        	success, 
	        	fail,
	        	{ maximumAge: 100000, enableHighAccuracy: true, timeout: 60000 }
	        );
	    } 
	    
    }else{
    	
    	$.when( app.events.deviceReady ).done(function(){
		    function success(pos) {
	            app.myPosition = pos;
	            app.sendRequest4Neighbours();	           
	        }
	        function fail(error) {
	        	console.log("DEBUG ::: detectPosition ::: failed");
	        }	
	        navigator.geolocation.watchPosition( 
	        	success,
	        	fail,
	        	{ maximumAge: 100000, enableHighAccuracy: false, timeout: 60000 }
	        );
    	});
    }
};

/**
 * @param message2send := Message
 * @param receiver := ContactOnKnet | Group  
 */
Application.prototype.forwardMsg = function( message2send, receiver ) {

	message2send.from = user.publicClientID;
	message2send.to = receiver.publicClientID;
	message2send.chatWith = receiver.publicClientID;
	message2send.timestamp = new Date().getTime();	
	message2send.msgID = message2send.assignId();
	
	var msg2store = new Message( message2send );
	msg2store.msgID = message2send.msgID;
	mailBox.storeMessage( msg2store );
	
	gui.showMsgInConversation( msg2store, { isReverse : false, withFX : true });					
	
	postman.sendMsg( message2send );
	
};

Application.prototype.registrationProcess = function(){
	
	gui.hideLoadingSpinner();
	
	gui.showWelcomeMessage( dictionary.Literals.label_35 );
	
	postman.generateKeyPair().done(function ( keys ){
		
		app.keys = keys;
		var certificate = postman.createCertificate( app.keys );
		app.keys.certificate = forge.pki.certificateToPem( certificate );		
		
  		var params = {
			onConnected : function (){
				var clientPEMpublicKey = forge.pki.publicKeyToPem( app.keys.publicKey );
				var registryRequest = {
					event : "register",
					data : {
						clientPEMpublicKey : clientPEMpublicKey
					}
				};
				var data2send = JSON.stringify( registryRequest );
	        	log.debug("registrationProcess ::: preparing" + data2send );
				app.authSocket.TLS.prepare( data2send ); 
			},
			onClosed : function(){} ,
			onDisconnected : function(){} ,
			onError : function(){
				gui.showWelcomeMessage( dictionary.Literals.label_42 );
			} ,
			onReconnect : function(){}
  		};
			
		app.establishTLS( params );
				
	});	
};

Application.prototype.init = function() {
	
	gui.loadBody();
	gui.loadAsideMenuMainPage();
	gui.bindDOMevents();	
	app.detectPosition();
	app.detectLanguage();
	app.loadPersistentData();
	app.loadContactsBook();
	app.loadMyNumber();

};

Application.prototype.initializeDevice = function() {
	
	Application.prototype.bindDeviceEvents();	
	
	if (typeof cordova == "undefined" || cordova == null ){
		app.events.deviceReady.resolve();
		app.isMobile = false;
	}
	
};

Application.prototype.initEasyRTC = function() {
	
		easyrtc.setStreamAcceptor( function(easyrtcid, stream) {
			log.info("easyRTC setStreamAcceptor trigered");
			
		   	$('#callRejectButton').show().unbind("click").on("click", function(){ 
		   		$('body').pagecontainer('change', '#chat-page', { transition : "none" });
	   		});	    	
	    	$('#callAcceptButton').hide();
	    	$('#imgConferenceCaller').hide();
	    	$('#conferenceTag').show();
	    	
  		    var conferenceStreamTag = document.getElementById('conferenceTag');
  		    easyrtc.setVideoObjectSrc( conferenceStreamTag, stream);
  		    
  		});
  		easyrtc.setOnStreamClosed( function (easyrtcid) {
  			log.info("easyRTC setOnStreamClosed trigered");
  		    easyrtc.setVideoObjectSrc(document.getElementById('conferenceTag'), "");
  		    $('body').pagecontainer('change', '#chat-page', { transition : "none" });
  		});
  		
  		easyrtc.setAcceptChecker(function(easyrtcid, callback) {
  			log.info("easyRTC setAcceptChecker trigered");
  			
  			$('body').pagecontainer('change', '#conference-page', { transition : "none" });  			
 			
  		    if( easyrtc.getConnectionCount() > 0 ) {
  		    	log.info("Drop current call and accept new from " + easyrtcid + " ?");
  		    	easyrtc.hangupAll();
  		    }
  		    else {
  		    	log.info("Accept incoming call from " + easyrtcid + " ?");
  		    }
  		    callback(true);

  		} );  		
		
  		easyrtc.useThisSocketConnection( socket );
  	    easyrtc.enableVideoReceive(true);
		easyrtc.enableAudio(true);
		easyrtc.enableVideo(true);
  	  	easyrtc.enableDataChannels(true);
	
};

Application.prototype.easyRTC_PerformCall = function (easyrtcid){  
	var selfEasyrtcid = easyrtcid;
	log.info("Easyrtc ::: I am:  " + easyrtcid);
	app.easyrtcid = easyrtcid;
	
    easyrtc.hangupAll();
    
    var acceptedCB = function(accepted, caller) {
        if( !accepted ) {
            easyrtc.showError("CALL-REJECTED", "Sorry, your call to was rejected");
            $('body').pagecontainer('change', '#chat-page', { transition : "none" });
        }
    };
    var successCB = function() {
	   	$('#callRejectButton').show();	   	
    	$('#callAcceptButton').hide();
    	$('#imgConferenceCaller').hide();
    	$('#conferenceTag').show();
    };
    var failureCB = function() {
    	$('body').pagecontainer('change', '#chat-page', { transition : "none" });
    };
    easyrtc.call(app.otherEasyrtcid, successCB, failureCB, acceptedCB);
};


Application.prototype.easyRTC_getReady4Call = function ( easyrtcid ){  
	  var selfEasyrtcid = easyrtcid;
	  log.info("Easyrtc ::: I am:  " + easyrtcid);
	  app.easyrtcid = easyrtcid;
	  var message2send = new Message({ 	
		  to : app.currentChatWith, 
		  from : user.publicClientID , 
		  messageBody : { messageType : "res4EasyRTCid" , easyRTCid : easyrtcid }
	  });
	  postman.sendMsg( message2send );
	  
	  gui.showLoadingSpinner();
};

Application.prototype.easyRTC_connectFailure = function (errorCode, message){  
	easyrtc.showError(errorCode, errmesg);    
};

Application.prototype.requestPeerEasyRTCid = function (){
		
	$('body').pagecontainer('change', '#conference-page', { transition : "none" });	
	$('#callRejectButton')
	 .show()
	 .unbind("click")
	 .on("click", function(){ 
		 $('body').pagecontainer('change', '#chat-page', { transition : "none" });
		 
   	 });
	$('#callAcceptButton').hide();
	$('#conferenceTag').hide();
					
	var message2send = new Message(	{ 	
		to : app.currentChatWith, 
		from : user.publicClientID , 
		messageBody : { messageType : "req4EasyRTCid" }
	});
	postman.sendMsg( message2send );
	
	var contact = contactsHandler.getContactById( app.currentChatWith); 
	if (typeof contact == "undefined" || contact == null) return;
	$('#imgConferenceCaller').remove();
	$('.ui-height-70percent').prepend($('<img>',{id:'imgConferenceCaller',src: contact.imgsrc, class: 'vertical-center' }));
	
	gui.showLoadingSpinner();	
};




Application.prototype.loadContacts = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {
     		var contact = new ContactOnKnet( cursor.value );
     		contactsHandler.setContactOnList( contact );      	
        	gui.showEntryOnMainPage( contact , false);
         	cursor.continue(); 
     	}else{
     		gui.orderEntriesOnMainPage();
     	    app.events.contactsLoaded.resolve();
     	}
	};	
};

Application.prototype.loadContactsBook = function() {
	if ( ! (typeof cordova == "undefined" || cordova == null) ){
		$.when( app.events.deviceReady , app.events.documentReady).done(function(){
						
		});		
	}	
};

Application.prototype.loadGroups = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["groups"], "readonly").objectStore("groups").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {
     		var group = new Group( cursor.value );
     		groupsHandler.list.push( group );      	
        	gui.showEntryOnMainPage( group ,false);
         	cursor.continue(); 
     	}
	};	
};

Application.prototype.loadMyNumber = function() {
	if ( ! (typeof cordova == "undefined" || cordova == null) ){
		$.when( app.events.deviceReady , app.events.documentReady).done(function(){
			window.plugins.sim.getSimInfo(app.loadMyNumberSuccess, app.loadMyNumberError);
		});		
	}	
};

Application.prototype.loadMyNumberError = function( result ) {
};

Application.prototype.loadMyNumberSuccess = function( result ) {
	if( user.myTelephone == "" || user.myTelephone == null ){
		var obj = JSON.parse(result);
		user.myTelephone = "" + obj.mcc + obj.mnc ;
		user.updateUserSettings();
	}
};


Application.prototype.loadPersistentData = function() {
	if (typeof cordova == "undefined" || cordova == null ){
		$.when( app.events.documentReady ).done(function(){
			app.loadStoredData();			
		});		
	}else{
		$.when( app.events.deviceReady , app.events.documentReady).done(function(){
			app.loadStoredData();			
		});		
	}	
};




Application.prototype.loadStoredData = function() {
		
	this.indexedDBHandler = indexedDB.open("com.instaltic.knet", 5);
		
	this.indexedDBHandler.onupgradeneeded= function (event) {
		var thisDB = event.target.result;
		if(!thisDB.objectStoreNames.contains("usersettings")){
			var objectStore = thisDB.createObjectStore("usersettings", { keyPath: "index" });
		}
		if(!thisDB.objectStoreNames.contains("messages")){
			var objectStore = thisDB.createObjectStore("messages", { keyPath: "msgID" });
			objectStore.createIndex("timestamp","timestamp",{unique:false});
			objectStore.createIndex("publicclientid","publicclientid",{unique:false});			
		}
		if(!thisDB.objectStoreNames.contains("contacts")){
			var objectStore = thisDB.createObjectStore("contacts", { keyPath: "publicClientID" });
		}
		if(!thisDB.objectStoreNames.contains("groups")){
			var objectStore = thisDB.createObjectStore("groups", { keyPath: "publicClientID" });
		}			
	};
		
	this.indexedDBHandler.onsuccess = function (event,caca) {
		
		db = event.target.result;					

		app.loadUserSettings();
		app.loadGroups();
		app.loadContacts();
		
	
	};
	
	this.indexedDBHandler.onerror = function(e){		
		log.debug("indexedDBHandler.onerror", e);
 		//TODO what if there is no way to open the DB		
	};
	this.indexedDBHandler.onblocked = function(){
		log.debug("indexedDBHandler.onblocked");
	};
};


Application.prototype.loadUserSettings = function(){
	
	var singleKeyRange = IDBKeyRange.only(0);

	try{	
		db.transaction(["usersettings"], "readonly").objectStore("usersettings").openCursor(singleKeyRange).onsuccess = function(e) {
			
			var cursor = e.target.result;
	     	if (cursor && typeof cursor.value.publicClientID != "undefined") {     		
	     		user = new UserSettings(cursor.value);
	     		
	     		app.keys.privateKey = forge.pki.privateKeyFromPem( user.keys.privateKey );
	     		app.keys.publicKey = forge.pki.publicKeyFromPem( user.keys.publicKey );  
	     		app.keys.certificate = user.keys.certificate;
	     		gui.loadLoadingSpinner();
				app.events.userSettingsLoaded.resolve();
				
	     		return;
	     	}else{
	     		app.registrationProcess();
	     	   	return;	     		
	     	}
		};		
	}catch(e){
		log.debug("Application.prototype.loadUserSettings", e);	   
		//TODO what if there is no way to open the DB
	}
};

// deviceready Event Handler 
Application.prototype.onDeviceReady = function() {
	
	try{
		app.devicePlatform  = device.platform;
		app.deviceVersion = device.version;
		
		if (app.devicePlatform == "WinCE" || app.devicePlatform == "Win32NT") {
			document.removeEventListener('backbutton',  gui.onBackButton , false);
		}else{
	        document.addEventListener('backbutton',  gui.onBackButton , false);
	    }
		
		app.events.deviceReady.resolve();		

	}catch(e){
    	log.debug("Application.prototype.onDeviceReady", e);
    }	
};

Application.prototype.onNativeCameraInit = function( sourceType , callback) {

	app.setMultimediaAsOpen();

	var options = {
		quality : 50,
		encodingType : Camera.EncodingType.JPEG
		//targetWidth: 300,
		//targetHeight: 300
		//saveToPhotoAlbum: true  //(this options breaks everything..)
	};

	if (sourceType == "PHOTOLIBRARY"){
		options.sourceType = navigator.camera.PictureSourceType.PHOTOLIBRARY;
		options.destinationType = navigator.camera.DestinationType.FILE_URI; 
	}else if (sourceType == "CAMERA"){
		options.sourceType = navigator.camera.PictureSourceType.CAMERA;
		options.destinationType = navigator.camera.DestinationType.FILE_URI; 
	}
									
	navigator.camera.getPicture(	
		function (datasrc){ 
			callback (datasrc);
		}, 
		function(message){
			console.log("DEBUG ::: Application.prototype.onNativeCameraInit failed");
		},
		options
	);

};


Application.prototype.onOnlineCustom =  function() {
	
	$.when( app.events.documentReady , 
			app.events.contactsLoaded , 
			app.events.userSettingsLoaded , 
			app.events.deviceReady	).done(function(){	
		setTimeout( function(){ app.sendLogin(); } , config.TIME_WAIT_WAKEUP * 2); 
	});
	
};

Application.prototype.onProcessPayment = function() {
	
	gui.showLoadingSpinner();

	$.when( app.events.deviceReady ).done(function(){
		var purchase = gui.getPurchaseDetails();		
		app.connect2paypal(purchase);
	});					
	
};

Application.prototype.onResumeCustom =  function() {
	
   	if	( app.multimediaWasOpened == false ){
   		gui.hideLocalNotifications();
   		setTimeout( function(){ app.sendLogin(); }, config.TIME_WAIT_WAKEUP ); 		
	}	    	
	app.inBackground = false; 
	app.multimediaWasOpened = false;
	
	postman.send("reconnectNotification", {	publicClientID : user.publicClientID } );
   	
};

Application.prototype.onTLSmsg = function ( input ) {
	var obj = JSON.parse( input );
	var event = obj.event;
	switch (event) {
		case "registration":
			app.userRegistration( obj.data );
			break;
		case "LoginResponse":
			app.connect2server( obj.data );
			gui.hideLoadingSpinner();
			break;			
		default:
			log.debug("onTLSmsg ::: any other event...");
			break;
	}
};

Application.prototype.userRegistration = function( data ){
	log.debug("userRegistration ::: registration...");
	
	if (typeof data == "undefined" || data == null || 
 		typeof data.publicClientID == "undefined" || data.publicClientID == null ||
 		typeof data.handshakeToken == "undefined" || data.handshakeToken == null ){
		log.debug("userRegistration ::: something went wrong...");
	}else{
	
 		user = new UserSettings( data );			
 		user.myCurrentNick = user.publicClientID;
 		user.lastProfileUpdate = new Date().getTime();			
		user.keys.privateKey = forge.pki.privateKeyToPem( app.keys.privateKey );
		user.keys.publicKey = forge.pki.publicKeyToPem( app.keys.publicKey );
		user.keys.certificate = app.keys.certificate;
		
		var transaction = db.transaction(["usersettings"],"readwrite");	
		var store = transaction.objectStore("usersettings");
		var request = store.add( user );

		$.mobile.loading('hide');
		gui.showTermsAndConditions();
		app.events.userSettingsLoaded.resolve(); 		
 	}			
};

Application.prototype.sendLogin = function(){
	
	
	if (app.connecting == true || 
		app.initialized == false || 
		( typeof socket != "undefined" && socket.connected == true)){
		log.info("sendLogin returned");  
		return;
	}else {
		log.info("sendLogin");
	}
	app.connecting = true;
	gui.showLoadingSpinner();
	
	var params = {
		onConnected : function (){

			var loginRequest = {
				event : "login",
				data : { handshakeToken: user.handshakeToken }
			};
			var data2send = JSON.stringify( loginRequest );
	    	log.debug("callback ::: establishTLS ::: onConnected : " + data2send );

			app.authSocket.TLS.prepare( data2send );
			gui.hideLoadingSpinner();
		},
		onClosed : function(){
			log.info("callback ::: establishTLS ::: onClosed");
			if ( typeof app.authSocket.TLS != "undefined" ){
				app.authSocket.TLS.close();
			}
		} ,
		onDisconnected : function(){
			log.info("callback ::: establishTLS ::: onDisconnected");
		},		
		onReconnect : function(){
			log.info("callback ::: establishTLS ::: onReconnect");
		},
		onError : function(){
			app.connecting = false; 
			log.info("callback ::: establishTLS ::: onError"); 
			setTimeout(function(){ app.sendLogin(); } , config.TIME_WAIT_HTTP_POST * 2);			
		},
		onConnect_error :function(){
			app.connecting = false; 
			log.info("callback ::: establishTLS ::: onConnect_error "); 
			setTimeout(function(){ app.sendLogin(); }, config.TIME_WAIT_HTTP_POST * 3);
		}
	};
			
	app.establishTLS( params );
	
};

Application.prototype.sendMultimediaMsg = function( options ) {
	var message2send = new Message(	{ 	
		to : options.receiver, 
		from : user.publicClientID , 
		messageBody : { messageType : "multimedia", src : options.src }
	});

	var msg2store = new Message( message2send );
	mailBox.storeMessage( msg2store );
	
	gui.showMsgInConversation( msg2store, { isReverse : false, withFX : true });					
	
	postman.sendMsg( message2send );
	
};

Application.prototype.sendProfileUpdate = function() {
	
	var profileResponseObject = {	
		publicClientIDofSender : user.publicClientID, 
		img : user.myPhotoPath,
		commentary : user.myCommentary,
		nickName: user.myCurrentNick,
		telephone: user.myTelephone,
		email : user.myEmail,
		visibility : user.visibility		
	};			
	postman.send("profileUpdate", profileResponseObject );	
};

Application.prototype.sendPushRegistrationId = function( token ) {

	var registration = {
		publicClientID : user.publicClientID,
		token : token
	};
	postman.send("PushRegistration", registration );
		
};

Application.prototype.sendRequest4Plans = function( selectedPosition ){
	
	var whatsAround = { location : { lat : null , lon : null} };
	
	if ( selectedPosition ){
		whatsAround.location.lat = selectedPosition.lat.toString();
		whatsAround.location.lon = selectedPosition.lng.toString();
	}	
	if ( whatsAround.location.lat != null ){		
		postman.send("Request4Plans", whatsAround );				
	}		
};


Application.prototype.sendRequest4Neighbours = function( selectedPosition ){
	
	var whoIsAround = { location : { lat : null , lon : null} };
	
	if ( selectedPosition ){
		whoIsAround.location.lat = selectedPosition.lat.toString();
		whoIsAround.location.lon = selectedPosition.lng.toString();
	}else if( app.myPosition.coords.latitude != "" ){
		whoIsAround.location.lat = app.myPosition.coords.latitude.toString()
		whoIsAround.location.lon = app.myPosition.coords.longitude.toString();
	}
	
	if ( whoIsAround.location.lat != null ){
		gui.showLoadingSpinner();
		postman.send("RequestOfListOfPeopleAround", whoIsAround );				
	}		
};


Application.prototype.establishTLS = function ( params ){
	
	log.debug("starting establishment of TLS ");
	if ( app.authSocket != null ){
		app.authSocket.disconnect();
	}
	if ( app.authSocket != null && typeof app.authSocket.TLS != "undefined" ){
		app.authSocket.TLS.close();		
	}
  	var options = { forceNew : true	};
	var url = 'http://' + config.ipServerAuth +  ":" + config.portServerAuth ;
  	app.authSocket = io.connect( url, options );
	
  	app.authSocket.on('connect', function () {
  		log.debug("authSocket.on.connect ::: emitting RequestTLSConnection");
  		var request = { 
  			clientPEMcertificate : app.keys.certificate
  		};
  		app.authSocket.emit('RequestTLSConnection', request);
	}); 
  	
  	app.authSocket.on('reconnect', function () {
  		log.debug("authSocket.on.reconnect");
  		params.onReconnect();
	}); 	
  	
  	app.authSocket.on('ResponseTLSConnection', function (answer){
  		var options = {
			serversPEMcertificate : answer.serversPEM,
			onConnected : params.onConnected,
			onClosed : params.onClosed,
			onTLSmsg : app.onTLSmsg,
			onDisconnected : params.onDisconnected ,
			onError : params.onError 
  		};
  		app.authSocket.TLS = postman.createTLSConnection( options );
 		app.authSocket.TLS.handshake();
	});  	
  	// base64-decode data and process it
  	app.authSocket.on('data2Client', function (data){		
  		app.authSocket.TLS.process( forge.util.decode64( data ) );
	});	
  	app.authSocket.on('disconnect', function () {
  		log.debug("authSocket.on.disconnect"); 
  		params.onDisconnected();
	});	
  	app.authSocket.on('connect_error', function () {
  		log.debug("authSocket.on.connect_error"); 
  		params.onError();
	});
  	
  	
    
};// END establishTLS

Application.prototype.setLanguage = function(language) {

	language.value = "";
	switch (true){
		case /en(?:\-[A-Z]{2}$)|EN$|en$|English$|english$/.test(language.detected):
			language.value = "en";
			break;
		case /es(?:\-[A-Z]{2}$)|ES$|es$|espa\u00f1ol$|Espa\u00f1ol$/.test(language.detected):
			language.value = "es";
			break;
		case /de(?:\-[A-Z]{2}$)|DE$|de$|deutsch$|Deutsch$/.test(language.detected):
			language.value = "de";
			break;
		case /it(?:\-[A-Z]{2}$)|IT$|it$|italiano$|Italiano$/.test(language.detected):
			language.value = "it";
			break;	
		case /fr(?:\-[A-Z]{2}$)|FR$|fr$|fran\u00e7ais$|Fran\u00e7ais$/.test(language.detected):
			language.value = "fr";
			break;
		case /pt(?:\-[A-Z]{2}$)|PT$|pt$|portugu\u00EAs$|Portugu\u00EAs$/.test(language.detected):
			language.value = "pt";
			break;			
			
		default:
			language.value = "en";
			break;	
	}
	
	if ( dictionary.AvailableLiterals.hasOwnProperty( language.value ) ){
		//log.debug("app.setLanguage ", language);
	}else{
		log.debug("app.setLanguage - NOT FOUND", language);	
		language.value = "en" ;
	}
	dictionary.Literals = dictionary.AvailableLiterals[language.value].value;
	gui.setLocalLabels();
    Globalize.load( dictionary.Literals.CLDR );
    gui.formatter = Globalize( language.value );
      
};

Application.prototype.setMultimediaAsOpen = function() {
	app.multimediaWasOpened = true;
};


//END Class Application

function AbstractHandler() {};

AbstractHandler.prototype.getObjById = function( publicClientID ){

	var obj = contactsHandler.getContactById( publicClientID ); 
	if ( !obj ){
		obj = groupsHandler.getGroupById( publicClientID );
	}
	return obj;
};

/**
 * @param obj := ContactOnKnet | Group 
 */
AbstractHandler.prototype.setOnDB = function( obj ) {
	if ( obj instanceof ContactOnKnet ){
		contactsHandler.setContactOnDB( obj );	
	}else{
		groupsHandler.setGroupOnDB( obj );
	}
};

/**
 * @param obj := ContactOnKnet | Group 
 */
AbstractHandler.prototype.setOnList = function( obj ) {
	if ( obj instanceof ContactOnKnet ){
		contactsHandler.setContactOnList( obj );	
	}else{
		groupsHandler.setGroupOnList( obj );
	}
};


function ContactOnKnet( c ) {
	this.publicClientID = c.publicClientID;
	this.imgsrc = (typeof c.imgsrc == 'undefined' || c.imgsrc == "" || c.imgsrc == null ) ? "./res/logo_300x300.png" : c.imgsrc ;
	this.nickName = (c.nickName) ? c.nickName : dictionary.Literals.label_23;
	this.location = (c.location) ? c.location : { lat : "", lon : "" };
	this.commentary = (typeof c.commentary == 'undefined' || c.commentary == "") ? dictionary.Literals.label_12 : c.commentary;
	this.lastProfileUpdate = (c.lastProfileUpdate) ? parseInt(c.lastProfileUpdate) : config.TIME_UNIX_2015;
	this.counterOfUnreadSMS = (c.counterOfUnreadSMS) ? c.counterOfUnreadSMS : 0;
	this.timeLastSMS = (c.timeLastSMS) ? parseInt(c.timeLastSMS) : 0 ;
	this.telephone = (c.telephone) ? c.telephone : "";
	this.email = (c.email) ? c.email : "";
	this.pubKeyPEM = (c.pubKeyPEM) ? c.pubKeyPEM : null;
	this.encryptionKeys = (c.encryptionKeys) ? c.encryptionKeys : null;
	this.decryptionKeys = (c.decryptionKeys) ? c.decryptionKeys : null;
	this.isAccepted = (c.isAccepted) ? c.isAccepted : false;
	this.isBlocked = (c.isBlocked) ? c.isBlocked : false;
	this.lastMsgTruncated = (typeof c.lastMsgTruncated == 'undefined' || c.lastMsgTruncated == null) ? "" : c.lastMsgTruncated ;
};

ContactOnKnet.prototype.set = function( c ) {
	this.publicClientID = (c.publicClientID) ? c.publicClientID : this.publicClientID;
	this.imgsrc = (typeof c.imgsrc == 'undefined' || c.imgsrc == "" || c.imgsrc == null ) ? this.imgsrc : c.imgsrc ;
	this.nickName = (c.nickName) ? c.nickName : this.nickName;
	this.location = (c.location) ? c.location : this.location;
	this.commentary = (typeof c.commentary == 'undefined' || c.commentary == "") ? this.commentary : c.commentary;
	this.lastProfileUpdate = (c.lastProfileUpdate) ? parseInt(c.lastProfileUpdate) : this.lastProfileUpdate;
	this.counterOfUnreadSMS = (c.counterOfUnreadSMS) ? c.counterOfUnreadSMS : this.counterOfUnreadSMS;
	this.timeLastSMS = (c.timeLastSMS) ? parseInt(c.timeLastSMS) : this.timeLastSMS ;
	this.telephone = (c.telephone) ? c.telephone : this.telephone ;
	this.email = (c.email) ? c.email : this.email;
	this.pubKeyPEM = (c.pubKeyPEM) ? c.pubKeyPEM : this.pubKeyPEM;
	this.encryptionKeys = (c.encryptionKeys) ? c.encryptionKeys : this.encryptionKeys;
	this.decryptionKeys = (c.decryptionKeys) ? c.decryptionKeys : this.decryptionKeys;
	this.lastMsgTruncated = (typeof c.lastMsgTruncated == 'undefined' || c.lastMsgTruncated == null) ? this.lastMsgTruncated : c.lastMsgTruncated;
};


function ContactsHandler() {
	this.listOfContacts = [];
};

ContactsHandler.prototype.addNewContactOnDB = function( contact ) {

	$('#linkAddNewContact' + contact.publicClientID)
		.attr({	'class': 'icon-list ui-btn ui-btn-icon-notext ui-icon-carat-r' })
		.unbind("click")
		.on("click", function(){ gui.showConversation( contact ); });
	
	var prompt2show = 	
	//'<div id="popupDiv" data-role="popup"> '+
	' <a class="backButton ui-btn-right" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext"></a>'+
	' <img class="darkink" src="./res/new_contact_added_195x195.png">' +
	' <p class="darkink">' +  dictionary.Literals.label_15 + '</p> ';
	//'</div>';
	gui.showDialog( prompt2show );	
	
	contactsHandler.setContactOnDB( contact );	
};

ContactsHandler.prototype.generateKeys = function(toContact) {
	toContact.encryptionKeys = [
		forge.random.getBytesSync(32).replace(/['"]/g,'A'),
        forge.random.getBytesSync(32).replace(/['"]/g,'B'),
        forge.random.getBytesSync(32).replace(/['"]/g,'C'),
        forge.random.getBytesSync(32).replace(/['"]/g,'D'),
        forge.random.getBytesSync(32).replace(/['"]/g,'E'),
        forge.random.getBytesSync(32).replace(/['"]/g,'F'),
        forge.random.getBytesSync(32).replace(/['"]/g,'G'),
        forge.random.getBytesSync(32).replace(/['"]/g,'H'),
        forge.random.getBytesSync(32).replace(/['"]/g,'I')
	];

};

ContactsHandler.prototype.getContactById = function(id) {
	return this.listOfContacts.filter(function(c){ return (c.publicClientID == id);	})[0];	
};
	
ContactsHandler.prototype.processNewContacts = function( input ) {
	gui.hideLoadingSpinner();
	var list = postman.getProcessNewContacts(input);
	if (list == null ) { return;}
	
	var page = $.mobile.activePage.attr( "id" );	

	list.map(function(c){

		if (c.publicClientID == user.publicClientID) return;
		
		var contact = contactsHandler.getContactById(c.publicClientID); 
		if (contact){
			contactsHandler.setContactOnList( c );			
		}else{			
			contact = new ContactOnKnet( c );
			contactsHandler.setContactOnList( contact );
			gui.showEntryOnMainPage( contact , true);						
		}
		if (/searchResultsPage/.test(page)){
			gui.showEntryOnResultsPage( contact , true);
		}
		contactsHandler.updateContactOnDB (contact );
		contactsHandler.sendProfileRequest( contact );
			
	});		
	
};

ContactsHandler.prototype.sendKeys = function(contact) {
	
	var setOfSymKeys = { setOfSymKeys : contact.encryptionKeys };
	
	var masterKey = forge.random.getBytesSync(32).replace(/['"]/g,'J');
	var iv2use = forge.random.getBytesSync(32).replace(/['"]/g,'K');	

	var publicKeyClient = forge.pki.publicKeyFromPem( contact.pubKeyPEM );	
	
	var masterKeyEncrypted = publicKeyClient.encrypt( masterKey , 'RSA-OAEP');	

	var cipher = forge.cipher.createCipher('AES-CBC', masterKey );
	cipher.start( { iv: iv2use  });
	cipher.update(forge.util.createBuffer( JSON.stringify(setOfSymKeys) ) );
	cipher.finish();		
		
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
	postman.send("KeysDelivery", data );
};


ContactsHandler.prototype.setContactOnList = function(contact) {
	var found = false;
	this.listOfContacts.map(function(c){
		if ( c.publicClientID == contact.publicClientID ){
	  		c.set( contact );
	  		found = true; 
	  		return;	
	  	}			
	});
	if ( found == false ){
		this.listOfContacts.push(contact);
	}
			
};

ContactsHandler.prototype.setContactOnDB = function(contact) {	
	try {
		var singleKeyRange = IDBKeyRange.only(contact.publicClientID); 			
		var transaction = db.transaction(["contacts"],"readwrite");	
		var store = transaction.objectStore("contacts");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				cursor.update( contact );     		
	     	}else{
	     		store.add( contact );
	     	}     	 
		};	
	}
	catch(e){
		log.debug("ContactsHandler.prototype.setContactOnDB", e); 
	}
};

ContactsHandler.prototype.setEncryptionKeys = function(toContact) {
	contactsHandler.generateKeys(toContact);
	contactsHandler.setContactOnDB(toContact);
	contactsHandler.sendKeys(toContact);	
};


ContactsHandler.prototype.sendProfileRequest = function( contact ) {

	var profileRetrievalObject = {	
		publicClientIDofRequester : user.publicClientID, 
		publicClientID2getImg : contact.publicClientID,
		lastProfileUpdate : parseInt(contact.lastProfileUpdate)
	};	
	postman.send("ProfileRetrieval", profileRetrievalObject );
};

ContactsHandler.prototype.updateContactOnDB = function( contact ) {	
	try {
		var singleKeyRange = IDBKeyRange.only(contact.publicClientID); 			
		var transaction = db.transaction(["contacts"],"readwrite");	
		var store = transaction.objectStore("contacts");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		cursor.update( contact );     		
	     	}	 
		};	
	}
	catch(e){
		log.debug("ContactsHandler.prototype.updateContactOnDB", e);
	}
};
	

function Group( g ) {
	this.publicClientID = (g.publicClientID) ? g.publicClientID : this.assignId();
	this.imgsrc = (typeof g.imgsrc == 'undefined' || g.imgsrc == "" || g.imgsrc == null ) ? "./res/group_black_195x195.png" : g.imgsrc ;
	this.nickName = (g.nickName) ? g.nickName : dictionary.Literals.label_23;
	this.commentary = (typeof g.commentary == 'undefined' || g.commentary == "") ? dictionary.Literals.label_12 : g.commentary;
	this.lastProfileUpdate = (g.lastProfileUpdate) ? parseInt(g.lastProfileUpdate) : config.TIME_UNIX_2015;
	this.location = (g.location) ? g.location : { lat : "", lon : "" };
	this.counterOfUnreadSMS = (g.counterOfUnreadSMS) ? g.counterOfUnreadSMS : 0;
	this.timeLastSMS = (g.timeLastSMS) ? parseInt(g.timeLastSMS) : 0 ;
	this.telephone = (g.telephone) ? g.telephone : "";
	this.email = (g.email) ? g.email : "";
	this.listOfMembers = ( g.listOfMembers instanceof Array ) ? g.listOfMembers : [] ;
	this.isAccepted = (g.isAccepted) ? g.isAccepted : false;
	this.isBlocked = (g.isBlocked) ? g.isBlocked : false;
	this.lastMsgTruncated = (typeof g.lastMsgTruncated == 'undefined' || g.lastMsgTruncated == null) ? "" : g.lastMsgTruncated;	
};

Group.prototype.addMember = function( contact  ) {
	var found = false;
	this.listOfMembers.map(function( m ){
		if ( m == contact.publicClientID ){
	  		found = true; 	return;	
	  	}			
	});
	if ( found == false ){
		this.listOfMembers.push( contact.publicClientID );
	}			
};

Group.prototype.assignId = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
};

Group.prototype.removeMember = function( contact  ) {	
	this.listOfMembers = this.listOfMembers.filter(function(id) { 
		return id !== contact.publicClientID; 
	});
};

Group.prototype.set = function( g ) {
	this.publicClientID = (g.publicClientID) ? g.publicClientID : this.publicClientID;
	this.imgsrc = (typeof g.imgsrc == 'undefined' || g.imgsrc == "" || g.imgsrc == null ) ? this.imgsrc : g.imgsrc ;
	this.nickName = (g.nickName) ? g.nickName : this.nickName;
	this.commentary = (typeof g.commentary == 'undefined' || g.commentary == "") ? this.commentary : g.commentary;
	this.location = (g.location) ? g.location : this.location;
	this.lastProfileUpdate = (g.lastProfileUpdate) ? parseInt(g.lastProfileUpdate) : this.lastProfileUpdate;
	this.counterOfUnreadSMS = (g.counterOfUnreadSMS) ? g.counterOfUnreadSMS : this.counterOfUnreadSMS;
	this.timeLastSMS = (g.timeLastSMS) ? parseInt(g.timeLastSMS) : this.timeLastSMS ;
	this.telephone = (g.telephone) ? g.telephone : this.telephone;
	this.email = (g.email) ? g.email : this.email;
	this.listOfMembers = ( g.listOfMembers instanceof Array ) ? g.listOfMembers : this.listOfMembers;
	this.isAccepted = (typeof g.isAccepted == 'boolean' ) ? g.isAccepted : this.isAccepted;
	this.isBlocked = (typeof g.isBlocked == 'boolean' ) ? g.isBlocked : this.isBlocked;
	this.lastMsgTruncated = (typeof g.lastMsgTruncated == 'undefined' || g.lastMsgTruncated == null) ? this.lastMsgTruncated : g.lastMsgTruncated;
};

function GroupsHandler() {
	this.list = [];
};


GroupsHandler.prototype.getGroupById = function(id) {
	return this.list.filter(function(g){ return (g.publicClientID == id);	})[0];	
};
GroupsHandler.prototype.getMembersOfGroup = function( publicClientID ) {
	var listOfMembers = [];
	this.list.map(function( g ){
		if ( g.publicClientID == publicClientID ){
	  		listOfMembers = g.listOfMembers ; 
	  		return;	
	  	}			
	});
	return listOfMembers;		
};

GroupsHandler.prototype.sendGroupUpdate = function( group ) {
	var updateMsg = new Message({ 	
		chatWith : group.publicClientID,
		to : group.publicClientID, 
		from : user.publicClientID , 
		messageBody : { messageType : "groupUpdate", group : group }
	});
	postman.sendMsg( updateMsg );
};

GroupsHandler.prototype.setGroupOnDB = function( group ) {	
	try {
		var singleKeyRange = IDBKeyRange.only( group.publicClientID ); 			
		var transaction = db.transaction(["groups"],"readwrite");	
		var store = transaction.objectStore("groups");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				cursor.update( group );     		
	     	}else{
	     		store.add( group );
	     	}     	 
		};	
	}
	catch(e){
		log.debug("ContactsHandler.prototype.setGroupOnDB", e);
	}
};

GroupsHandler.prototype.setGroupOnList = function( group ) {
	var found = false;
	this.list.map(function( g ){
		if ( g.publicClientID == group.publicClientID ){
	  		g.set( group );
	  		found = true; 
	  		return;	
	  	}			
	});
	if ( found == false ){
		this.list.push( group );
	}			
};


function Dictionary(){
	
	var _this = this;
	
	this.Literals_en = {
		label_1: "Profile",
		label_2: "Groups",
		label_3: "Search",
		label_4: "Account",
		label_5: "my nick Name:",
		label_6: "coming soon",
		label_7: "send",
		label_8: "who can see me...",
		label_9: "Anybody",
		label_10: "should you switch this off, then only your contacts would see you online, is not that boring?",
		label_11: "Here you are",
		label_12: "is still thinking on a nice commentary",
		label_13: "I'm new on Visible!",
		label_14: "drag & drop",
		label_15: "new contact saved ! <br> ;-) ",
		label_16: "new message from:",
		label_17: "My commentary:",
		label_18: "Do you really want to exit?",
		label_19: "Exit",
		label_20: "No,Yes",
		label_23 : "Name...",
		label_24 : "Commentary...",
		label_25 : "Telephone...",
		label_26 : "e-mail",
		label_27 : "User account Activation",
		label_28 : "License valid for a year",
		label_29 : "License valid for 4 years",
		label_30 : "Back-up functionality",
		label_31 : "Donation for associated NGOs",
		label_32 : "Donation for our Open Source Initiative",
		label_33 : "Total: ",
		label_34 : "Buy",
		label_35 : "Welcome ! we're generating your security channel, this process could take a few minutes, please be patience",
		label_36 : "new Group",
		label_37 : "My Groups",
		label_38 : "create",
		label_39 : "modify",
		label_40 : "Group: ",
		label_41 : "load earlier messages",
		label_42 : "please enable your internet connection",
		label_43 : "block",
		label_44 : "report abuse",
		label_45 : "add contact ",
		label_46 : "yes",
		label_47 : "no",
		label_48 : "report abuse",
		label_49 : "Consent",
		label_50 : "unblock contact?", 
		label_51 : "Do you want to block this person?",
		label_52 : "Blocked people",
		label_58 : "reported",
		label_59 : "agree",
		label_60 : "Privacy policy",
		label_61 : "typing",
		label_62 : "Group Info",
		label_63 : "Contact Info",
		label_64 : "around this area",
		label_65 : "create a new plan",
		label_66 : "search people or join a plan",
		label_67 : "today",
		label_68 : "clear",
		label_69 : "close",
		label_72 : "plan",
		label_75 : "join",
		label_76 : "Ask the organizer?",
		label_77 : "Do you want to add this member into your group?",
		label_78 : "Request sent",
		
		CLDR : {
			  "main": {
			    "en": {
			      "identity": {
			        "version": {
			          "_cldrVersion": "25",
			          "_number": "$Revision: 91 $"
			        },
			        "generation": {
			          "_date": "$Date: 2014-03-13 22:27:12 -0500 (Thu, 13 Mar 2014) $"
			        },
			        "language": "en"
			      },
			      "dates": {
			        "calendars": {
			          "gregorian": {
			              "months": {
			                  "format": {
			                    "abbreviated": {
			                      "1": "Jan",
			                      "2": "Feb",
			                      "3": "Mar",
			                      "4": "Apr",
			                      "5": "May",
			                      "6": "Jun",
			                      "7": "Jul",
			                      "8": "Aug",
			                      "9": "Sep",
			                      "10": "Oct",
			                      "11": "Nov",
			                      "12": "Dec"
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "January",
			                      "2": "February",
			                      "3": "March",
			                      "4": "April",
			                      "5": "May",
			                      "6": "June",
			                      "7": "July",
			                      "8": "August",
			                      "9": "September",
			                      "10": "October",
			                      "11": "November",
			                      "12": "December"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "1": "Jan",
			                      "2": "Feb",
			                      "3": "Mar",
			                      "4": "Apr",
			                      "5": "May",
			                      "6": "Jun",
			                      "7": "Jul",
			                      "8": "Aug",
			                      "9": "Sep",
			                      "10": "Oct",
			                      "11": "Nov",
			                      "12": "Dec"
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "January",
			                      "2": "February",
			                      "3": "March",
			                      "4": "April",
			                      "5": "May",
			                      "6": "June",
			                      "7": "July",
			                      "8": "August",
			                      "9": "September",
			                      "10": "October",
			                      "11": "November",
			                      "12": "December"
			                    }
			                  }
			                },
			                "days": {
			                  "format": {
			                    "abbreviated": {
			                      "sun": "Sun",
			                      "mon": "Mon",
			                      "tue": "Tue",
			                      "wed": "Wed",
			                      "thu": "Thu",
			                      "fri": "Fri",
			                      "sat": "Sat"
			                    },
			                    "narrow": {
			                      "sun": "S",
			                      "mon": "M",
			                      "tue": "T",
			                      "wed": "W",
			                      "thu": "T",
			                      "fri": "F",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "Su",
			                      "mon": "Mo",
			                      "tue": "Tu",
			                      "wed": "We",
			                      "thu": "Th",
			                      "fri": "Fr",
			                      "sat": "Sa"
			                    },
			                    "wide": {
			                      "sun": "Sunday",
			                      "mon": "Monday",
			                      "tue": "Tuesday",
			                      "wed": "Wednesday",
			                      "thu": "Thursday",
			                      "fri": "Friday",
			                      "sat": "Saturday"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "sun": "Sun",
			                      "mon": "Mon",
			                      "tue": "Tue",
			                      "wed": "Wed",
			                      "thu": "Thu",
			                      "fri": "Fri",
			                      "sat": "Sat"
			                    },
			                    "narrow": {
			                      "sun": "S",
			                      "mon": "M",
			                      "tue": "T",
			                      "wed": "W",
			                      "thu": "T",
			                      "fri": "F",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "Su",
			                      "mon": "Mo",
			                      "tue": "Tu",
			                      "wed": "We",
			                      "thu": "Th",
			                      "fri": "Fr",
			                      "sat": "Sa"
			                    },
			                    "wide": {
			                      "sun": "Sunday",
			                      "mon": "Monday",
			                      "tue": "Tuesday",
			                      "wed": "Wednesday",
			                      "thu": "Thursday",
			                      "fri": "Friday",
			                      "sat": "Saturday"
			                    }
			                  }
			                }
			          	}	
			        },
			        "fields": {
			          "second": {
			            "displayName": "Second",
			            "relative-type-0": "now",
			            "relativeTime-type-future": {
			              "relativeTimePattern-count-one": "in {0} second",
			              "relativeTimePattern-count-other": "in {0} seconds"
			            },
			            "relativeTime-type-past": {
			              "relativeTimePattern-count-one": "{0} second ago",
			              "relativeTimePattern-count-other": "{0} seconds ago"
			            }
			          }
			        }
			      },
			      "numbers": {
			        "currencies": {
			          "USD": {
			            "symbol": "$"
			          }
			        },
			        "defaultNumberingSystem": "latn",
			        "symbols-numberSystem-latn": {
			          "decimal": ".",
			          "exponential": "E",
			          "group": ",",
			          "infinity": "∞",
			          "minusSign": "-",
			          "nan": "NaN",
			          "percentSign": "%",
			          "perMille": "‰",
			          "plusSign": "+",
			          "timeSeparator": ":"
			        },
			        "decimalFormats-numberSystem-latn": {
			          "standard": "#,##0.###"
			        },
			        "currencyFormats-numberSystem-latn": {
			          "currencySpacing": {
			            "beforeCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            },
			            "afterCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            }
			          },
			          "standard": "#,##0.00"
			        }
			      }
			    }
			  },
			  "supplemental": {
			    "version": {
			      "_cldrVersion": "25",
			      "_number": "$Revision: 91 $"
			    },
			    "currencyData": {
			      "fractions": {
			        "DEFAULT": {
			          "_rounding": "0",
			          "_digits": "2"
			        }
			      }
			    },
			    "likelySubtags": {
			      "en": "en-GB",
			    },
			    "plurals-type-cardinal": {
			      "en": {
			        "pluralRule-count-one": "i = 1 and v = 0 @integer 1",
			        "pluralRule-count-other": " @integer 0, 2~16, 100, 1000, 10000, 100000, 1000000, … @decimal 0.0~1.5, 10.0, 100.0, 1000.0, 10000.0, 100000.0, 1000000.0, …"
			      }
			    }
			  }
			}
	};
	this.Literals_de = {
		label_1: "Profil",
		label_2: "Gruppen",
		label_3: "Suchen",
		label_4: "Konto",
		label_5: "Mein Spitzname:",
		label_6: "kommt bald",
		label_7: "Senden",
		label_8: "Sie sind sichtbar ...",
		label_9: "Alle",
		label_10: "sollten Sie dies abschalten, dann werden nur Ihre Kontakte Sie online sehen, ist das nicht langweilig?",
		label_11: "Hier sind Sie",
		label_12: "Denkt immer noch an einen sch\xF6nen Kommentar",
		label_13: "Ich bin neu auf Visible!",
		label_14: "Drag & Drop",
		label_15: "Neuer Kontakt gespeichert! <br> ;-)",
		label_16: "neue Nachrichten von:",
		label_17: "Mein Kommentar:",
		label_18: "Wollen Sie wirklich beenden?",
		label_19: "Verlassen",
		label_20: "Abbrechen,Ok",
		label_23 : "Name...",
		label_24 : "Kommentar...",
		label_25 : "Telefon...",
		label_26 : "e-mail",
		label_27: "Benutzerkonto-Aktivierung",
		label_28: "Lizenz g&uuml;ltig f&uuml;r ein Jahr",
		label_29: "Lizenz g&uuml;ltig f&uuml;r 4 Jahre",
		label_30: "Back-up-Funktionalit&auml;t",
		label_31: "Spende f&uuml;r assoziierten NGOs",
		label_32: "Spende f&uuml;r unsere Open Source Initiative",
		label_33: "Gesamtsumme: ",
		label_34: "Kaufen",
		label_35 : "Willkommen! Wir machen Ihrer Sicherheitsprotokoll, Dieser Prozess k\xF6nnte ein paar Minuten dauern, bitte et was Geduld",
		label_36 : "neue Gruppe",
		label_37 : "meine Gruppen",
		label_38 : "kreieren",
		label_39 : "modifizieren",
		label_40 : "Gruppe: ",
		label_41 : "laden fr&uuml;here Nachrichten",
		label_42 : "Bitte aktivieren Sie Ihre Internetverbindung",
		label_43 : "blockieren",
		label_44 : "missbrauch melden",
		label_45 : "Kontakt hinzuf&uuml;gen ",
		label_46 : "ja",
		label_47 : "nein",
		label_48 : "missbrauch melden",
		label_49 : "Zustimmung",
		label_50 : "entsperren Kontakt?", 
		label_51 : "Wollen Sie diesen Benutzer blockieren?",
		label_52 : "Blockierte Personen",
		label_58 : "berichtet",
		label_59 : "zustimmen",
		label_60 : "Datenschutzerkl&auml;rung",
		label_61 : "schreiben",
		label_62 : "Gruppeninformationen",
		label_63 : "Kontaktinfos",
		label_64 : "um dieses Gebiet",
		label_65 : "einen neuen Plan erstellen",
		label_66 : "Leute suchen oder einen Plan beitreten",
		label_67 : "heute",
		label_68 : "r&uuml;cksetzen",
		label_69 : "schlie&szlig;en",
		label_72 : "plan",
		label_75 : "teilnehmen",
		label_76 : "Fragen Sie den Veranstalter?",
		label_77 : "Do you want to add this member into your group?",
		label_78 : "Request sent",
		CLDR : {
		  "main": {
		    "de": {
		      "identity": {
		        "version": {
		          "_cldrVersion": "25",
		          "_number": "$Revision: 91 $"
		        },
		        "generation": {
		          "_date": "$Date: 2014-03-13 22:27:12 -0500 (Thu, 13 Mar 2014) $"
		        },
		        "language": "de"
		      },
		      "dates": {
		        "calendars": {
		          "gregorian": {
		              "months": {
		                  "format": {
		                    "abbreviated": {
		                      "1": "Jan.",
		                      "2": "Feb.",
		                      "3": "M\u00E4rz",
		                      "4": "Apr.",
		                      "5": "Mai",
		                      "6": "Juni",
		                      "7": "Juli",
		                      "8": "Aug.",
		                      "9": "Sep.",
		                      "10": "Okt.",
		                      "11": "Nov.",
		                      "12": "Dez."
		                    },
		                    "narrow": {
		                      "1": "J",
		                      "2": "F",
		                      "3": "M",
		                      "4": "A",
		                      "5": "M",
		                      "6": "J",
		                      "7": "J",
		                      "8": "A",
		                      "9": "S",
		                      "10": "O",
		                      "11": "N",
		                      "12": "D"
		                    },
		                    "wide": {
		                      "1": "Januar",
		                      "2": "Februar",
		                      "3": "M\u00E4rz",
		                      "4": "April",
		                      "5": "Mai",
		                      "6": "Juni",
		                      "7": "Juli",
		                      "8": "August",
		                      "9": "September",
		                      "10": "Oktober",
		                      "11": "November",
		                      "12": "Dezember"
		                    }
		                  },
		                  "stand-alone": {
		                    "abbreviated": {
		                      "1": "Jan",
		                      "2": "Feb",
		                      "3": "M\u00E4r",
		                      "4": "Apr",
		                      "5": "Mai",
		                      "6": "Jun",
		                      "7": "Jul",
		                      "8": "Aug",
		                      "9": "Sep",
		                      "10": "Okt",
		                      "11": "Nov",
		                      "12": "Dez"
		                    },
		                    "narrow": {
		                      "1": "J",
		                      "2": "F",
		                      "3": "M",
		                      "4": "A",
		                      "5": "M",
		                      "6": "J",
		                      "7": "J",
		                      "8": "A",
		                      "9": "S",
		                      "10": "O",
		                      "11": "N",
		                      "12": "D"
		                    },
		                    "wide": {
		                      "1": "Januar",
		                      "2": "Februar",
		                      "3": "M\u00E4rz",
		                      "4": "April",
		                      "5": "Mai",
		                      "6": "Juni",
		                      "7": "Juli",
		                      "8": "August",
		                      "9": "September",
		                      "10": "Oktober",
		                      "11": "November",
		                      "12": "Dezember"
		                    }
		                  }
		                },
		                "days": {
		                  "format": {
		                    "abbreviated": {
		                      "sun": "So.",
		                      "mon": "Mo.",
		                      "tue": "Di.",
		                      "wed": "Mi.",
		                      "thu": "Do.",
		                      "fri": "Fr.",
		                      "sat": "Sa."
		                    },
		                    "narrow": {
		                      "sun": "S",
		                      "mon": "M",
		                      "tue": "D",
		                      "wed": "M",
		                      "thu": "D",
		                      "fri": "F",
		                      "sat": "S"
		                    },
		                    "short": {
		                      "sun": "So.",
		                      "mon": "Mo.",
		                      "tue": "Di.",
		                      "wed": "Mi.",
		                      "thu": "Do.",
		                      "fri": "Fr.",
		                      "sat": "Sa."
		                    },
		                    "wide": {
		                      "sun": "Sonntag",
		                      "mon": "Montag",
		                      "tue": "Dienstag",
		                      "wed": "Mittwoch",
		                      "thu": "Donnerstag",
		                      "fri": "Freitag",
		                      "sat": "Samstag"
		                    }
		                  },
		                  "stand-alone": {
		                    "abbreviated": {
		                      "sun": "So",
		                      "mon": "Mo",
		                      "tue": "Di",
		                      "wed": "Mi",
		                      "thu": "Do",
		                      "fri": "Fr",
		                      "sat": "Sa"
		                    },
		                    "narrow": {
		                      "sun": "S",
		                      "mon": "M",
		                      "tue": "D",
		                      "wed": "M",
		                      "thu": "D",
		                      "fri": "F",
		                      "sat": "S"
		                    },
		                    "short": {
		                      "sun": "So.",
		                      "mon": "Mo.",
		                      "tue": "Di.",
		                      "wed": "Mi.",
		                      "thu": "Do.",
		                      "fri": "Fr.",
		                      "sat": "Sa."
		                    },
		                    "wide": {
		                      "sun": "Sonntag",
		                      "mon": "Montag",
		                      "tue": "Dienstag",
		                      "wed": "Mittwoch",
		                      "thu": "Donnerstag",
		                      "fri": "Freitag",
		                      "sat": "Samstag"
		                    }
		                  }
		                },
			            "dayPeriods": {
			              "format": {
			                "wide": {
			                  "am": "AM",
			                  "am-alt-variant": "am",
			                  "noon": "noon",
			                  "pm": "PM",
			                  "pm-alt-variant": "pm"
			                }
			              }
			            },
			            "dateFormats": {
			              "medium": "d/M/y"
			            },
			            "timeFormats": {
			              "medium": "HH:mm",
			            },
			            "dateTimeFormats": {
			              "medium": "{1} {0}"
			            }
		          	}
		        },
		        "fields": {
		          "second": {
		            "displayName": "Second",
		            "relative-type-0": "now",
		            "relativeTime-type-future": {
		              "relativeTimePattern-count-one": "in {0} second",
		              "relativeTimePattern-count-other": "in {0} seconds"
		            },
		            "relativeTime-type-past": {
		              "relativeTimePattern-count-one": "{0} second ago",
		              "relativeTimePattern-count-other": "{0} seconds ago"
		            }
		          }
		        }
		      },
		      "numbers": {
		        "currencies": {
		          "USD": {
		            "symbol": "$"
		          }
		        },
		        "defaultNumberingSystem": "latn",
		        "symbols-numberSystem-latn": {
		          "decimal": ".",
		          "exponential": "E",
		          "group": ",",
		          "infinity": "∞",
		          "minusSign": "-",
		          "nan": "NaN",
		          "percentSign": "%",
		          "perMille": "‰",
		          "plusSign": "+",
		          "timeSeparator": ":"
		        },
		        "decimalFormats-numberSystem-latn": {
		          "standard": "#,##0.###"
		        },
		        "currencyFormats-numberSystem-latn": {
		          "currencySpacing": {
		            "beforeCurrency": {
		              "currencyMatch": "[:^S:]",
		              "surroundingMatch": "[:digit:]",
		              "insertBetween": " "
		            },
		            "afterCurrency": {
		              "currencyMatch": "[:^S:]",
		              "surroundingMatch": "[:digit:]",
		              "insertBetween": " "
		            }
		          },
		          "standard": "#,##0.00"
		        }
		      }
		    }
		  },
		  "supplemental": {
		    "version": {
		      "_cldrVersion": "25",
		      "_number": "$Revision: 91 $"
		    },
		    "currencyData": {
		      "fractions": {
		        "DEFAULT": {
		          "_rounding": "0",
		          "_digits": "2"
		        }
		      }
		    },
		    "likelySubtags": {
		      "de": "de-DE",
		    },
		    "plurals-type-cardinal": {
		      "de": {
		        "pluralRule-count-one": "i = 1 and v = 0 @integer 1",
		        "pluralRule-count-other": " @integer 0, 2~16, 100, 1000, 10000, 100000, 1000000, … @decimal 0.0~1.5, 10.0, 100.0, 1000.0, 10000.0, 100000.0, 1000000.0, …"
		      }
		    }
		  }
		}			
	};
	this.Literals_it = {
		label_1: "Profilo",
		label_2: "Gruppi",
		label_3: "Ricerca",
		label_4: "Account",
		label_5: "il mio nick name:",
		label_6: "in arrivo",
		label_7: "invia",
		label_8: "Ti visibile per ...",
		label_9: "Chiunque",
		label_10: "si dovrebbe passare questa via, allora solo i contatti avrebbero visto voi on-line, non &egrave; che noioso?",
		label_11: "Ecco a voi",
		label_12: "\u00C8 ancora pensando a un bel commento",
		label_13: "Sono nuovo su Visible!",
		label_14: "trascinare l'immagine",
		label_15: "novo contacto guardado! <br>;-)",
		label_16: "nuovo messaggio:",
		label_17: "Il mio commento:",
		label_18: "Sei sicuro di voler uscire?",
		label_19: "Uscire",
		label_20: "Annulla,Ok",
		label_23 : "Nome...",
		label_24 : "Commento...",
		label_25 : "Telefono...",
		label_26 : "e-mail",
		label_27: "Conto di attivazione per l'utente",
		label_28: "Licenza valida per un anno",
		label_29: "Licenza valida per 4 anni",
		label_30: "Funzionalit&agrave; di back-up",
		label_31: "Donazione per le ONG associate",
		label_32: "Donazione per la nostra iniziativa Open Source",
		label_33: "Totale: ",
		label_34: "Acquistare",
		label_35 : "Benvenuto! generando il vostro protocollo di sicurezza, questo processo potrebbe richiedere alcuni minuti, si prega di essere pazienti",
		label_36 : "nuovo gruppo",
		label_37 : "I miei gruppi",
		label_38 : "creare",
		label_39 : "modificare",
		label_40 : "Gruppi: ",
		label_41 : "caricare i messaggi precedenti",
		label_42 : "si prega di abilitare la connessione a internet",
		label_43 : "bloccare",
		label_44 : "notifica di abuso",
		label_45 : "Aggiungi contatto ",
		label_46 : "certo",
		label_47 : "no",
		label_48 : "notifica di abuso",
		label_49 : "Consenso",
		label_50 : "sbloccare i contatti?", 
		label_51 : "Vuoi bloccare questa persona?",
		label_52 : "persone bloccate",
		label_58 : "segnalati",
		label_59 : "concordare",
		label_60 : "Politica sulla riservatezza",
		label_61 : "digitando",
		label_62 : "Info di gruppo",
		label_63 : "Info di contatto",
		label_64 : "intorno a questa zona",
		label_65 : "creare un nuovo piano",
		label_66 : "ricerca gente o aderire a un piano",
		label_67 : "oggi",
		label_68 : "reset",
		label_69 : "chiudere",
		label_72 : "piano",
		label_75 : "partecipare",
		label_76 : "Chiedi l'organizzatore?",
		label_77 : "Do you want to add this member into your group?",
		label_78 : "Request sent",
		CLDR : {
			  "main": {
			    "it": {
			      "identity": {
			        "version": {
			          "_cldrVersion": "25",
			          "_number": "$Revision: 91 $"
			        },
			        "generation": {
			          "_date": "$Date: 2014-03-13 22:27:12 -0500 (Thu, 13 Mar 2014) $"
			        },
			        "language": "it"
			      },
			      "dates": {
			        "calendars": {
			          "gregorian": {
			              "months": {
			                  "format": {
			                    "abbreviated": {
			                      "1": "Jan.",
			                      "2": "Feb.",
			                      "3": "M\u00E4rz",
			                      "4": "Apr.",
			                      "5": "Mai",
			                      "6": "Juni",
			                      "7": "Juli",
			                      "8": "Aug.",
			                      "9": "Sep.",
			                      "10": "Okt.",
			                      "11": "Nov.",
			                      "12": "Dez."
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "Januar",
			                      "2": "Februar",
			                      "3": "M\u00E4rz",
			                      "4": "April",
			                      "5": "Mai",
			                      "6": "Juni",
			                      "7": "Juli",
			                      "8": "August",
			                      "9": "September",
			                      "10": "Oktober",
			                      "11": "November",
			                      "12": "Dezember"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "1": "Jan",
			                      "2": "Feb",
			                      "3": "M\u00E4r",
			                      "4": "Apr",
			                      "5": "Mai",
			                      "6": "Jun",
			                      "7": "Jul",
			                      "8": "Aug",
			                      "9": "Sep",
			                      "10": "Okt",
			                      "11": "Nov",
			                      "12": "Dez"
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "Januar",
			                      "2": "Februar",
			                      "3": "M\u00E4rz",
			                      "4": "April",
			                      "5": "Mai",
			                      "6": "Juni",
			                      "7": "Juli",
			                      "8": "August",
			                      "9": "September",
			                      "10": "Oktober",
			                      "11": "November",
			                      "12": "Dezember"
			                    }
			                  }
			                },
			                "days": {
			                  "format": {
			                    "abbreviated": {
			                      "sun": "So.",
			                      "mon": "Mo.",
			                      "tue": "Di.",
			                      "wed": "Mi.",
			                      "thu": "Do.",
			                      "fri": "Fr.",
			                      "sat": "Sa."
			                    },
			                    "narrow": {
			                      "sun": "S",
			                      "mon": "M",
			                      "tue": "D",
			                      "wed": "M",
			                      "thu": "D",
			                      "fri": "F",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "So.",
			                      "mon": "Mo.",
			                      "tue": "Di.",
			                      "wed": "Mi.",
			                      "thu": "Do.",
			                      "fri": "Fr.",
			                      "sat": "Sa."
			                    },
			                    "wide": {
			                      "sun": "Sonntag",
			                      "mon": "Montag",
			                      "tue": "Dienstag",
			                      "wed": "Mittwoch",
			                      "thu": "Donnerstag",
			                      "fri": "Freitag",
			                      "sat": "Samstag"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "sun": "So",
			                      "mon": "Mo",
			                      "tue": "Di",
			                      "wed": "Mi",
			                      "thu": "Do",
			                      "fri": "Fr",
			                      "sat": "Sa"
			                    },
			                    "narrow": {
			                      "sun": "S",
			                      "mon": "M",
			                      "tue": "D",
			                      "wed": "M",
			                      "thu": "D",
			                      "fri": "F",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "So.",
			                      "mon": "Mo.",
			                      "tue": "Di.",
			                      "wed": "Mi.",
			                      "thu": "Do.",
			                      "fri": "Fr.",
			                      "sat": "Sa."
			                    },
			                    "wide": {
			                      "sun": "Sonntag",
			                      "mon": "Montag",
			                      "tue": "Dienstag",
			                      "wed": "Mittwoch",
			                      "thu": "Donnerstag",
			                      "fri": "Freitag",
			                      "sat": "Samstag"
			                    }
			                  }
			                },
			            "dayPeriods": {
			              "format": {
			                "wide": {
			                  "am": "AM",
			                  "am-alt-variant": "am",
			                  "noon": "noon",
			                  "pm": "PM",
			                  "pm-alt-variant": "pm"
			                }
			              }
			            },
			            "dateFormats": {
			              "medium": "d/M/y"
			            },
			            "timeFormats": {
			              "medium": "HH:mm",
			            },
			            "dateTimeFormats": {
			              "medium": "{1} {0}"
			            }
			          }
			        },
			        "fields": {
			          "second": {
			            "displayName": "Second",
			            "relative-type-0": "now",
			            "relativeTime-type-future": {
			              "relativeTimePattern-count-one": "in {0} second",
			              "relativeTimePattern-count-other": "in {0} seconds"
			            },
			            "relativeTime-type-past": {
			              "relativeTimePattern-count-one": "{0} second ago",
			              "relativeTimePattern-count-other": "{0} seconds ago"
			            }
			          }
			        }
			      },
			      "numbers": {
			        "currencies": {
			          "USD": {
			            "symbol": "$"
			          }
			        },
			        "defaultNumberingSystem": "latn",
			        "symbols-numberSystem-latn": {
			          "decimal": ".",
			          "exponential": "E",
			          "group": ",",
			          "infinity": "∞",
			          "minusSign": "-",
			          "nan": "NaN",
			          "percentSign": "%",
			          "perMille": "‰",
			          "plusSign": "+",
			          "timeSeparator": ":"
			        },
			        "decimalFormats-numberSystem-latn": {
			          "standard": "#,##0.###"
			        },
			        "currencyFormats-numberSystem-latn": {
			          "currencySpacing": {
			            "beforeCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            },
			            "afterCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            }
			          },
			          "standard": "#,##0.00"
			        }
			      }
			    }
			  },
			  "supplemental": {
			    "version": {
			      "_cldrVersion": "25",
			      "_number": "$Revision: 91 $"
			    },
			    "currencyData": {
			      "fractions": {
			        "DEFAULT": {
			          "_rounding": "0",
			          "_digits": "2"
			        }
			      }
			    },
			    "likelySubtags": {
			      "it": "it-IT",
			    },
			    "plurals-type-cardinal": {
			      "de": {
			        "pluralRule-count-one": "i = 1 and v = 0 @integer 1",
			        "pluralRule-count-other": " @integer 0, 2~16, 100, 1000, 10000, 100000, 1000000, … @decimal 0.0~1.5, 10.0, 100.0, 1000.0, 10000.0, 100000.0, 1000000.0, …"
			      }
			    }
			  }
			}
		
	}; 
	this.Literals_es = {
		label_1: "Perfil",
		label_2: "Grupos",
		label_3: "Buscar",
		label_4: "Cuenta",
		label_5: "mi apodo / nick:",
		label_6: "pr&oacute;ximamente",
		label_7: "enviar",
		label_8: "eres visible para...",
		label_9: "todo el mundo",
		label_10: "si desactivas esto, entonces solo tus contactos te ver&aacute;n conectado, no te parece aburrido?",
		label_11: "Aqu&iacute; estas",
		label_12: "sigue aun pensando en un comentario bonito ;-)",
		label_13: "soy nuevo en Visible!",
		label_14: "arrastra una imagen",
		label_15: "nuevo contacto guardado! <br>;-)",
		label_16: "mensaje de:",
		label_17: "Mi comentario:",
		label_18: "De verdad quieres salir?",
		label_19: "Salir",
		label_20: "Cancelar,Ok",
		label_23 : "Nombre...",
		label_24 : "Comentario...",
		label_25 : "Tel\xE9fono...",
		label_26 : "e-mail",
		label_27: "Activaci&oacute;n de cuenta de usuario",
		label_28: "Licencia v&aacute;lida por un a&ntilde;o",
		label_29: "Licencia v&aacute;lida por 4 a&ntilde;os",
		label_30: "Funcionalidad de back-up",
		label_31: "Donaci&oacute;n para las ONG asociadas",
		label_32: "Donaci&oacute;n para nuestra Iniciativa Open Source",
		label_33: "Total: ",
		label_34: "Comprar"	,
		label_35 : "\u00A1Bienvenido! generando su canal de seguridad, este proceso podría tardar unos minutos, por favor sea paciente",
		label_36 : "nuevo grupo",
		label_37 : "mis Grupos",
		label_38 : "crear",
		label_39 : "modificar",
		label_40 : "Grupo: ",
		label_41 : "cargar mensajes anteriores",
		label_42 : "Habilite la conexi\u00f3n a Internet por favor",
		label_43 : "bloquear",
		label_44 : "Denunciar abuso",
		label_45 : "guardar contacto ",
		label_46 : "si",
		label_47 : "no",
		label_48 : "Denunciar abuso",
		label_49 : "Consentimiento",
		label_50 : "\u00BFdesbloquear contacto?", 
		label_51 : "\u00BFQuieres bloquear a esta persona?",
		label_52 : "personas bloqueadas",
		label_58 : "reportado",
		label_59 : "de acuerdo",
		label_60 : "Pol&iacute;tica de privacidad",
		label_61 : "escribiendo",
		label_62 : "Info de grupo",
		label_63 : "Info de contacto",
		label_64 : "en esta zona",
		label_65 : "crear un plan nuevo",
		label_66 : "buscar gente o unirse a un plan",
		label_67 : "hoy",
		label_68 : "reiniciar",
		label_69 : "cerrar",
		label_72 : "plan",
		label_75 : "unirse",
		label_76 : "Preguntar al organizador?",
		label_77 : "Do you want to add this member into your group?",
		label_78 : "Request sent",
		CLDR : {
			  "main": {
			    "es": {
			      "identity": {
			        "version": {
			          "_cldrVersion": "25",
			          "_number": "$Revision: 91 $"
			        },
			        "generation": {
			          "_date": "$Date: 2014-03-13 22:27:12 -0500 (Thu, 13 Mar 2014) $"
			        },
			        "language": "es"
			      },
			      "dates": {
			        "calendars": {
			          "gregorian": {
			              "months": {
			                  "format": {
			                    "abbreviated": {
			                      "1": "ene.",
			                      "2": "feb.",
			                      "3": "mar.",
			                      "4": "abr.",
			                      "5": "may.",
			                      "6": "jun.",
			                      "7": "jul.",
			                      "8": "ago.",
			                      "9": "sept.",
			                      "10": "oct.",
			                      "11": "nov.",
			                      "12": "dic."
			                    },
			                    "wide": {
			                      "1": "enero",
			                      "2": "febrero",
			                      "3": "marzo",
			                      "4": "abril",
			                      "5": "mayo",
			                      "6": "junio",
			                      "7": "julio",
			                      "8": "agosto",
			                      "9": "septiembre",
			                      "10": "octubre",
			                      "11": "noviembre",
			                      "12": "diciembre"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "1": "ene.",
			                      "2": "feb.",
			                      "3": "mar.",
			                      "4": "abr.",
			                      "5": "may.",
			                      "6": "jun.",
			                      "7": "jul.",
			                      "8": "ago.",
			                      "9": "sept.",
			                      "10": "oct.",
			                      "11": "nov.",
			                      "12": "dic."
			                    },
			                    "wide": {
			                      "1": "enero",
			                      "2": "febrero",
			                      "3": "marzo",
			                      "4": "abril",
			                      "5": "mayo",
			                      "6": "junio",
			                      "7": "julio",
			                      "8": "agosto",
			                      "9": "septiembre",
			                      "10": "octubre",
			                      "11": "noviembre",
			                      "12": "diciembre"
			                    }
			                  }
			                },
			                "days": {
			                  "format": {
			                    "abbreviated": {
			                      "sun": "dom.",
			                      "mon": "lun.",
			                      "tue": "mar.",
			                      "wed": "mi\u00E9.",
			                      "thu": "jue.",
			                      "fri": "vie.",
			                      "sat": "s\u00E1b."
			                    },
			                    "short": {
			                      "sun": "DO",
			                      "mon": "LU",
			                      "tue": "MA",
			                      "wed": "MI",
			                      "thu": "JU",
			                      "fri": "VI",
			                      "sat": "SA"
			                    },
			                    "wide": {
			                      "sun": "domingo",
			                      "mon": "lunes",
			                      "tue": "martes",
			                      "wed": "mi\u00E9rcoles",
			                      "thu": "jueves",
			                      "fri": "viernes",
			                      "sat": "s\u00E1bado"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "sun": "dom.",
			                      "mon": "lun.",
			                      "tue": "mar.",
			                      "wed": "mi\u00E9.",
			                      "thu": "jue.",
			                      "fri": "vie.",
			                      "sat": "s\u00E1b."
			                    },
			                    "narrow": {
			                      "sun": "D",
			                      "mon": "L",
			                      "tue": "M",
			                      "wed": "X",
			                      "thu": "J",
			                      "fri": "V",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "DO",
			                      "mon": "LU",
			                      "tue": "MA",
			                      "wed": "MI",
			                      "thu": "JU",
			                      "fri": "VI",
			                      "sat": "SA"
			                    },
			                    "wide": {
			                      "sun": "domingo",
			                      "mon": "lunes",
			                      "tue": "martes",
			                      "wed": "mi\u00E9rcoles",
			                      "thu": "jueves",
			                      "fri": "viernes",
			                      "sat": "s\u00E1bado"
			                    }
			                  }
			                },
			            "dayPeriods": {
			              "format": {
			                "wide": {
			                  "am": "AM",
			                  "am-alt-variant": "am",
			                  "noon": "noon",
			                  "pm": "PM",
			                  "pm-alt-variant": "pm"
			                }
			              }
			            },
			            "dateFormats": {
			              "medium": "d/M/y"
			            },
			            "timeFormats": {
			              "medium": "HH:mm",
			            },
			            "dateTimeFormats": {
			              "medium": "{1} {0}"
			            }
			          }
			        },
			        "fields": {
			          "second": {
			            "displayName": "Second",
			            "relative-type-0": "now",
			            "relativeTime-type-future": {
			              "relativeTimePattern-count-one": "in {0} second",
			              "relativeTimePattern-count-other": "in {0} seconds"
			            },
			            "relativeTime-type-past": {
			              "relativeTimePattern-count-one": "{0} second ago",
			              "relativeTimePattern-count-other": "{0} seconds ago"
			            }
			          }
			        }
			      },
			      "numbers": {
			        "currencies": {
			          "USD": {
			            "symbol": "$"
			          }
			        },
			        "defaultNumberingSystem": "latn",
			        "symbols-numberSystem-latn": {
			          "decimal": ".",
			          "exponential": "E",
			          "group": ",",
			          "infinity": "∞",
			          "minusSign": "-",
			          "nan": "NaN",
			          "percentSign": "%",
			          "perMille": "‰",
			          "plusSign": "+",
			          "timeSeparator": ":"
			        },
			        "decimalFormats-numberSystem-latn": {
			          "standard": "#,##0.###"
			        },
			        "currencyFormats-numberSystem-latn": {
			          "currencySpacing": {
			            "beforeCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            },
			            "afterCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            }
			          },
			          "standard": "#,##0.00"
			        }
			      }
			    }
			  },
			  "supplemental": {
			    "version": {
			      "_cldrVersion": "25",
			      "_number": "$Revision: 91 $"
			    },
			    "currencyData": {
			      "fractions": {
			        "DEFAULT": {
			          "_rounding": "0",
			          "_digits": "2"
			        }
			      }
			    },
			    "likelySubtags": {
			      "es": "es-ES",
			    },
			    "plurals-type-cardinal": {
			      "es": {
			        "pluralRule-count-one": "i = 1 and v = 0 @integer 1",
			        "pluralRule-count-other": " @integer 0, 2~16, 100, 1000, 10000, 100000, 1000000, … @decimal 0.0~1.5, 10.0, 100.0, 1000.0, 10000.0, 100000.0, 1000000.0, …"
			      }
			    }
			  }
			}		
	}; 
	this.Literals_fr = {
		label_1: "Profil",
		label_2: "Groupes",
		label_3: "Recherche",
		label_4: "Compte",
		label_5: "mon surnom:",
		label_6: "&agrave; venir",
		label_7: "envoyer",
		label_8: "vous visible ...",
		label_9: "Tout le monde",
		label_10: "vous devez d&eacute;sactiver cette fonctionnalit&eacute;, seuls vos contacts verriez-vous en ligne, est pas ennuyeux?",
		label_11: "Ici, vous &ecirc;tes",
		label_12: "pens\u00e9e sur une belle commentaires",
		label_13: "Je suis nouveau sur Visible!",
		label_14: "glissez-d&eacute;posez",
		label_15: "nouveau contact sauvegard&eacute;! <br>;-)",
		label_16: "nouveau message de:",
		label_17: "Mon commentaire:",
		label_18: "Voulez-vous vraiment quitter?",
		label_19: "Quitter",
		label_20: "Annuler,Ok",
		label_23 : "Nom...",
		label_24 : "Commentaire...",
		label_25 : "T\xE9l\xE9phone...",
		label_26 : "e-mail",
		label_27: "Activation du compte de l'utilisateur",
		label_28: "licence valide pour un an",
		label_29: "licence valide pour 4 ans",
		label_30: "fonctionnalit&eacute; de back-up",
		label_31: "Don pour les ONG associ&eacute;es",
		label_32: "Don pour notre Open Source Initiative",
		label_33: "Total: ",
		label_34: "Acheter",
		label_35 : "Bienvenue! g&eacute;n&eacute;ration de votre protocole de s&eacute;curit&eacute;, ce processus peut prendre quelques minutes, soyez patient svp",
		label_36 : "nouveau groupe",
		label_37 : "mes Groupes",
		label_38 : "cr\u00e9er",
		label_39 : "modifier",
		label_40 : "Groupe: ",
		label_41 : "charger les messages pr&eacute;c&eacute;dents",
		label_42 : "s'il vous plait activez votre connexion Internet",
		label_43 : "bloquer",
		label_44 : "signaler un abus",
		label_45 : "ajouter le contact ",
		label_46 : "Oui",
		label_47 : "non",
		label_48 : "signaler un abus",
		label_49 : "Consentement",
		label_50 : "d&eacute;bloquer le contact?", 
		label_51 : "Voulez-vous bloquer cette personne?",
		label_52 : "personnes bloqu&eacute;es",
		label_58 : "signal\u00e9",
		label_59 : "d'accord",
		label_60 : "Politique de confidentialit&eacute;",
		label_61 : "&eacute;crit maintenant",
		label_62 : "Info du groupe",
		label_63 : "Info de contact",
		label_64 : "autour de cette zone",
		label_65 : "cr&eacute;er un nouveau plan",
		label_66 : "recherche de personnes ou de se joindre &agrave; un plan",
		label_67 : "aujourd'hui",
		label_68 : "r&eacute;initialiser",
		label_69 : "fermer",
		label_72 : "plan",
		label_75 : "joindre",
		label_76 : "Demandez &agrave; l'organisateur?",
		label_77 : "Do you want to add this member into your group?",
		label_78 : "Request sent",
		CLDR : {
			  "main": {
			    "fr": {
			      "identity": {
			        "version": {
			          "_cldrVersion": "25",
			          "_number": "$Revision: 91 $"
			        },
			        "generation": {
			          "_date": "$Date: 2014-03-13 22:27:12 -0500 (Thu, 13 Mar 2014) $"
			        },
			        "language": "fr"
			      },
			      "dates": {
			        "calendars": {
			          "gregorian": {
			              "months": {
			                  "format": {
			                    "abbreviated": {
			                      "1": "janv.",
			                      "2": "f\u00E9vr.",
			                      "3": "mars",
			                      "4": "avr.",
			                      "5": "mai",
			                      "6": "juin",
			                      "7": "juil.",
			                      "8": "ao\u00FBt",
			                      "9": "sept.",
			                      "10": "oct.",
			                      "11": "nov.",
			                      "12": "d\u00E9c."
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "janvier",
			                      "2": "f\u00E9vrier",
			                      "3": "mars",
			                      "4": "avril",
			                      "5": "mai",
			                      "6": "juin",
			                      "7": "juillet",
			                      "8": "ao\u00FBt",
			                      "9": "septembre",
			                      "10": "octobre",
			                      "11": "novembre",
			                      "12": "d\u00E9cembre"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "1": "janv.",
			                      "2": "f\u00E9vr.",
			                      "3": "mars",
			                      "4": "avr.",
			                      "5": "mai",
			                      "6": "juin",
			                      "7": "juil.",
			                      "8": "ao\u00FBt",
			                      "9": "sept.",
			                      "10": "oct.",
			                      "11": "nov.",
			                      "12": "d\u00E9c."
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "janvier",
			                      "2": "f\u00E9vrier",
			                      "3": "mars",
			                      "4": "avril",
			                      "5": "mai",
			                      "6": "juin",
			                      "7": "juillet",
			                      "8": "ao\u00FBt",
			                      "9": "septembre",
			                      "10": "octobre",
			                      "11": "novembre",
			                      "12": "d\u00E9cembre"
			                    }
			                  }
			                },
			                "days": {
			                  "format": {
			                    "abbreviated": {
			                      "sun": "dim.",
			                      "mon": "lun.",
			                      "tue": "mar.",
			                      "wed": "mer.",
			                      "thu": "jeu.",
			                      "fri": "ven.",
			                      "sat": "sam."
			                    },
			                    "narrow": {
			                      "sun": "D",
			                      "mon": "L",
			                      "tue": "M",
			                      "wed": "M",
			                      "thu": "J",
			                      "fri": "V",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "di",
			                      "mon": "lu",
			                      "tue": "ma",
			                      "wed": "me",
			                      "thu": "je",
			                      "fri": "ve",
			                      "sat": "sa"
			                    },
			                    "wide": {
			                      "sun": "dimanche",
			                      "mon": "lundi",
			                      "tue": "mardi",
			                      "wed": "mercredi",
			                      "thu": "jeudi",
			                      "fri": "vendredi",
			                      "sat": "samedi"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "sun": "dim.",
			                      "mon": "lun.",
			                      "tue": "mar.",
			                      "wed": "mer.",
			                      "thu": "jeu.",
			                      "fri": "ven.",
			                      "sat": "sam."
			                    },
			                    "narrow": {
			                      "sun": "D",
			                      "mon": "L",
			                      "tue": "M",
			                      "wed": "M",
			                      "thu": "J",
			                      "fri": "V",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "di",
			                      "mon": "lu",
			                      "tue": "ma",
			                      "wed": "me",
			                      "thu": "je",
			                      "fri": "ve",
			                      "sat": "sa"
			                    },
			                    "wide": {
			                      "sun": "dimanche",
			                      "mon": "lundi",
			                      "tue": "mardi",
			                      "wed": "mercredi",
			                      "thu": "jeudi",
			                      "fri": "vendredi",
			                      "sat": "samedi"
			                    }
			                  }
			                },
			            "dayPeriods": {
			              "format": {
			                "wide": {
			                  "am": "AM",
			                  "am-alt-variant": "am",
			                  "noon": "noon",
			                  "pm": "PM",
			                  "pm-alt-variant": "pm"
			                }
			              }
			            },
			            "dateFormats": {
			              "medium": "d/M/y"
			            },
			            "timeFormats": {
			              "medium": "HH:mm",
			            },
			            "dateTimeFormats": {
			              "medium": "{1} {0}"
			            }
			          }
			        },
			        "fields": {
			          "second": {
			            "displayName": "Second",
			            "relative-type-0": "now",
			            "relativeTime-type-future": {
			              "relativeTimePattern-count-one": "in {0} second",
			              "relativeTimePattern-count-other": "in {0} seconds"
			            },
			            "relativeTime-type-past": {
			              "relativeTimePattern-count-one": "{0} second ago",
			              "relativeTimePattern-count-other": "{0} seconds ago"
			            }
			          }
			        }
			      },
			      "numbers": {
			        "currencies": {
			          "USD": {
			            "symbol": "$"
			          }
			        },
			        "defaultNumberingSystem": "latn",
			        "symbols-numberSystem-latn": {
			          "decimal": ".",
			          "exponential": "E",
			          "group": ",",
			          "infinity": "∞",
			          "minusSign": "-",
			          "nan": "NaN",
			          "percentSign": "%",
			          "perMille": "‰",
			          "plusSign": "+",
			          "timeSeparator": ":"
			        },
			        "decimalFormats-numberSystem-latn": {
			          "standard": "#,##0.###"
			        },
			        "currencyFormats-numberSystem-latn": {
			          "currencySpacing": {
			            "beforeCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            },
			            "afterCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            }
			          },
			          "standard": "#,##0.00"
			        }
			      }
			    }
			  },
			  "supplemental": {
			    "version": {
			      "_cldrVersion": "25",
			      "_number": "$Revision: 91 $"
			    },
			    "currencyData": {
			      "fractions": {
			        "DEFAULT": {
			          "_rounding": "0",
			          "_digits": "2"
			        }
			      }
			    },
			    "likelySubtags": {
			      "fr": "fr-FR",
			    },
			    "plurals-type-cardinal": {
			      "fr": {
			        "pluralRule-count-one": "i = 1 and v = 0 @integer 1",
			        "pluralRule-count-other": " @integer 0, 2~16, 100, 1000, 10000, 100000, 1000000, … @decimal 0.0~1.5, 10.0, 100.0, 1000.0, 10000.0, 100000.0, 1000000.0, …"
			      }
			    }
			  }
			}	
	}; 
	this.Literals_pt = {
		label_1: "Perfil",
		label_2: "Grupos",
		label_3: "Pesquisa",
		label_4: "Conta",
		label_5: "meu nick name:",
		label_6: "em breve",
		label_7: "enviar",
		label_8: "voc&ecirc; vis&iacute;vel para ...",
		label_9: "Qualquer um",
		label_10: "voc&ecirc; deve desligar esta op&ccedil;&atilde;o, ent&atilde;o apenas seus contatos iria v&ecirc;-lo on-line, n&atilde;o &eacute; t&atilde;o chato?",
		label_11: "Aqui est&aacute;",
		label_12: "ainda est&aacute; pensando em um coment&aacute;rio agrad&aacute;vel",
		label_13: "Eu sou novo no Visible!",
		label_14: "arrastar e solta",
		label_15: "novo contacto guardado! <br>;-)",
		label_16: "mensagens novas de: ",
		label_17: "Meu coment&aacute;rio:",
		label_18: "Voce realmente deseja sair?",
		label_19: "Sair",
		label_20: "Cancelar,Ok",
		label_23 : "Nome ...",
		label_24 : "Comentario...",
		label_25 : "Telefone...",
		label_26 : "e-mail"	,
		label_27: "Ativa&ccedil;&atilde;o de Conta de Usu&aacute;rio",
		label_28: "Licen&ccedil;a v&aacute;lida por um ano",
		label_29: "licen&ccedil;a v&aacute;lida por 4 anos",
		label_30: "back-up funcionalidade",
		label_31: "Doa&ccedil;&atilde;o para as ONGs associadas",
		label_32: "Doa&ccedil;&atilde;o para o nosso Iniciativa Open Source",
		label_33: "Total: ",
		label_34: "Comprar",
		label_35 : "Bem-vindo! gerando seu protocolo de segurança, esse processo pode levar alguns minutos, por favor, seja paciente",
		label_36 : "novo grupo",
		label_37 : "meus Grupos",
		label_38 : "criar",
		label_39 : "modificar",
		label_40 : "Grupo: ",
		label_41 : "carregar mensagens anteriores",
		label_42 : "Por favor, ative sua conex\u00E3o de internet",
		label_43 : "bloquear",
		label_44 : "Denunciar abuso",
		label_45 : "adicionar contato ",
		label_46 : "sim",
		label_47 : "n&atilde;o",
		label_48 : "Denunciar abuso",
		label_49 : "Consentimento",
		label_50 : "desbloquear o contato?", 
		label_51 : "Voc&ecirc; deseja bloquear esta pessoa?",
		label_52 : "pessoas bloqueadas",
		label_58 : "relatado",
		label_59 : "concordar",
		label_60 : "Pol&iacute;tica de Privacidade",
		label_61 : "digitando",
		label_62 : "Info do grupo",
		label_63 : "Info de contato",
		label_64 : "em torno desta &aacute;rea",
		label_65 : "criar um novo plano",
		label_66 : "busca de pessoas ou aderir a um plano",
		label_67 : "hoje",
		label_68 : "restabelecer",
		label_69 : "fechar",
		label_72 : "plan",
		label_75 : "juntar-se",
		label_76 : "Pe&ccedil;a o organizador?",
		label_77 : "Do you want to add this member into your group?",


		CLDR : {
			  "main": {
			    "pt": {
			      "identity": {
			        "version": {
			          "_cldrVersion": "25",
			          "_number": "$Revision: 91 $"
			        },
			        "generation": {
			          "_date": "$Date: 2014-03-13 22:27:12 -0500 (Thu, 13 Mar 2014) $"
			        },
			        "language": "pt"
			      },
			      "dates": {
			        "calendars": {
			          "gregorian": {
			              "months": {
			                  "format": {
			                    "abbreviated": {
			                      "1": "jan",
			                      "2": "fev",
			                      "3": "mar",
			                      "4": "abr",
			                      "5": "mai",
			                      "6": "jun",
			                      "7": "jul",
			                      "8": "ago",
			                      "9": "set",
			                      "10": "out",
			                      "11": "nov",
			                      "12": "dez"
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "janeiro",
			                      "2": "fevereiro",
			                      "3": "mar�o",
			                      "4": "abril",
			                      "5": "maio",
			                      "6": "junho",
			                      "7": "julho",
			                      "8": "agosto",
			                      "9": "setembro",
			                      "10": "outubro",
			                      "11": "novembro",
			                      "12": "dezembro"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "1": "jan",
			                      "2": "fev",
			                      "3": "mar",
			                      "4": "abr",
			                      "5": "mai",
			                      "6": "jun",
			                      "7": "jul",
			                      "8": "ago",
			                      "9": "set",
			                      "10": "out",
			                      "11": "nov",
			                      "12": "dez"
			                    },
			                    "narrow": {
			                      "1": "J",
			                      "2": "F",
			                      "3": "M",
			                      "4": "A",
			                      "5": "M",
			                      "6": "J",
			                      "7": "J",
			                      "8": "A",
			                      "9": "S",
			                      "10": "O",
			                      "11": "N",
			                      "12": "D"
			                    },
			                    "wide": {
			                      "1": "janeiro",
			                      "2": "fevereiro",
			                      "3": "mar�o",
			                      "4": "abril",
			                      "5": "maio",
			                      "6": "junho",
			                      "7": "julho",
			                      "8": "agosto",
			                      "9": "setembro",
			                      "10": "outubro",
			                      "11": "novembro",
			                      "12": "dezembro"
			                    }
			                  }
			                },
			                "days": {
			                  "format": {
			                    "abbreviated": {
			                      "sun": "dom",
			                      "mon": "seg",
			                      "tue": "ter",
			                      "wed": "qua",
			                      "thu": "qui",
			                      "fri": "sex",
			                      "sat": "s�b"
			                    },
			                    "narrow": {
			                      "sun": "D",
			                      "mon": "S",
			                      "tue": "T",
			                      "wed": "Q",
			                      "thu": "Q",
			                      "fri": "S",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "dom",
			                      "mon": "seg",
			                      "tue": "ter",
			                      "wed": "qua",
			                      "thu": "qui",
			                      "fri": "sex",
			                      "sat": "s�b"
			                    },
			                    "wide": {
			                      "sun": "domingo",
			                      "mon": "segunda-feira",
			                      "tue": "ter�a-feira",
			                      "wed": "quarta-feira",
			                      "thu": "quinta-feira",
			                      "fri": "sexta-feira",
			                      "sat": "s�bado"
			                    }
			                  },
			                  "stand-alone": {
			                    "abbreviated": {
			                      "sun": "dom",
			                      "mon": "seg",
			                      "tue": "ter",
			                      "wed": "qua",
			                      "thu": "qui",
			                      "fri": "sex",
			                      "sat": "s�b"
			                    },
			                    "narrow": {
			                      "sun": "D",
			                      "mon": "S",
			                      "tue": "T",
			                      "wed": "Q",
			                      "thu": "Q",
			                      "fri": "S",
			                      "sat": "S"
			                    },
			                    "short": {
			                      "sun": "dom",
			                      "mon": "seg",
			                      "tue": "ter",
			                      "wed": "qua",
			                      "thu": "qui",
			                      "fri": "sex",
			                      "sat": "s�b"
			                    },
			                    "wide": {
			                      "sun": "domingo",
			                      "mon": "segunda-feira",
			                      "tue": "ter�a-feira",
			                      "wed": "quarta-feira",
			                      "thu": "quinta-feira",
			                      "fri": "sexta-feira",
			                      "sat": "s�bado"
			                    }
			                  }
			                },
			            "dayPeriods": {
			              "format": {
			                "wide": {
			                  "am": "AM",
			                  "am-alt-variant": "am",
			                  "noon": "noon",
			                  "pm": "PM",
			                  "pm-alt-variant": "pm"
			                }
			              }
			            },
			            "dateFormats": {
			              "medium": "d/M/y"
			            },
			            "timeFormats": {
			              "medium": "HH:mm",
			            },
			            "dateTimeFormats": {
			              "medium": "{1} {0}"
			            }
			          }
			        },
			        "fields": {
			          "second": {
			            "displayName": "Second",
			            "relative-type-0": "now",
			            "relativeTime-type-future": {
			              "relativeTimePattern-count-one": "in {0} second",
			              "relativeTimePattern-count-other": "in {0} seconds"
			            },
			            "relativeTime-type-past": {
			              "relativeTimePattern-count-one": "{0} second ago",
			              "relativeTimePattern-count-other": "{0} seconds ago"
			            }
			          }
			        }
			      },
			      "numbers": {
			        "currencies": {
			          "USD": {
			            "symbol": "$"
			          }
			        },
			        "defaultNumberingSystem": "latn",
			        "symbols-numberSystem-latn": {
			          "decimal": ".",
			          "exponential": "E",
			          "group": ",",
			          "infinity": "∞",
			          "minusSign": "-",
			          "nan": "NaN",
			          "percentSign": "%",
			          "perMille": "‰",
			          "plusSign": "+",
			          "timeSeparator": ":"
			        },
			        "decimalFormats-numberSystem-latn": {
			          "standard": "#,##0.###"
			        },
			        "currencyFormats-numberSystem-latn": {
			          "currencySpacing": {
			            "beforeCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            },
			            "afterCurrency": {
			              "currencyMatch": "[:^S:]",
			              "surroundingMatch": "[:digit:]",
			              "insertBetween": " "
			            }
			          },
			          "standard": "#,##0.00"
			        }
			      }
			    }
			  },
			  "supplemental": {
			    "version": {
			      "_cldrVersion": "25",
			      "_number": "$Revision: 91 $"
			    },
			    "currencyData": {
			      "fractions": {
			        "DEFAULT": {
			          "_rounding": "0",
			          "_digits": "2"
			        }
			      }
			    },
			    "likelySubtags": {
			      "pt": "pt-PT",
			    },
			    "plurals-type-cardinal": {
			      "pt": {
			        "pluralRule-count-one": "i = 1 and v = 0 @integer 1",
			        "pluralRule-count-other": " @integer 0, 2~16, 100, 1000, 10000, 100000, 1000000, … @decimal 0.0~1.5, 10.0, 100.0, 1000.0, 10000.0, 100000.0, 1000000.0, …"
			      }
			    }
			  }
			}
	};
	
	this.AvailableLiterals = {
		"en" : { value : _this.Literals_en } ,
    	"de" : { value : _this.Literals_de } ,
    	"it" : { value : _this.Literals_it } ,
    	"es" : { value : _this.Literals_es } ,
    	"fr" : { value : _this.Literals_fr } ,
    	"pt" : { value : _this.Literals_pt }    	
    };
	
	this.Literals = this.AvailableLiterals["en"].value;
};


/***********************************************************************************************
 * *********************************************************************************************
 * **************				DEBUG MODE	 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/

//	window.shimIndexedDB.__debug(false);
//  window.shimIndexedDB.__useShim();
log4javascript.setEnabled(true);

/***********************************************************************************************
 * *********************************************************************************************
 * **************				MAIN		 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/
var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
var db;
var socket;
var push;
var user;
var config = new Config();
var gui = new GUI();
var postman = new Postman();
var mailBox = new MailBox();
var abstractHandler = new AbstractHandler();
var contactsHandler = new ContactsHandler();
var groupsHandler = new GroupsHandler();
var dictionary = new Dictionary();
var log = log4javascript.getDefaultLogger();
var app = new Application();

/***********************************************************************************************
 * *********************************************************************************************
 * **************				BINDING EVENTS 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/

$.when( app.events.documentReady, 
		app.events.contactsLoaded, 
		app.events.userSettingsLoaded, 
		app.events.deviceReady ).done(function(){

	app.initialized = true;	
	gui.bindButtonsOnMainPage();	
	app.sendLogin();

});

$(document).ready(function() {
	FastClick.attach(document.body);		
	app.init();	
	app.initializeDevice();
	
    function disableBack() { window.history.forward() }

    window.onload = disableBack();
    window.onpageshow = function(evt) { if (evt.persisted) disableBack() }
});