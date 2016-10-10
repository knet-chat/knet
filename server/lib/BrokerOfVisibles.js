var _ 				= require('underscore')._ 
	Client			= require('./Client.js');
var pg = require('pg');
var when = require('when');
var squel = require("squel");
var config = require('./Config.js');


function BrokerOfVisibles(_io, _logger) {
	var io = _io;
	var this_ = this;
	var listOfClients = []; 
	var clientOfDB = null;
	var logger = _logger;

    //TODO : what about this?
    //call `done()` to release the client back to the pool
    //done();
    //client.end();
	this.initDBConnection = function (user, pass, host, name){
		var d = when.defer();
		var conString = "postgres://" +  user + ":" + pass + "@" + host + "/"+ name;
		pg.connect(conString, function(err, client, done) {
			if(err) {
				return logger.error('BrokerOfVisibles ::: ERROR connecting to the Database', err);
			}
			logger.info('BrokerOfVisibles ::: correctly connected to the Database');

			clientOfDB = client;
			return d.resolve(true);
		});	
		return d.promise;	
	};
	
	
	//XEP-XXXX: image of a plan
	this.getImgOfPlan = function( params ) {
		
		var d = when.defer();

		var query2send = squel.select()
		.field("photo")
	    .from("profilesphoto")				    	
    	.where("publicclientid = '" + params.planId + "'").toString();

		clientOfDB.query(query2send, function(err, result) {
     
			if(err) { logger.error('getImgOfPlan ::: error running query', err); }
			
			if (typeof result.rows[0] == "undefined"){
		    	logger.error('getImgOfPlan ::: I dont know any publicClientID like this');
		    	return  d.resolve(null);
		    }    		
			var res = { 
				planId : params.planId, 
				imgsrc : result.rows[0].photo  
			};
			return d.resolve(res);

		});				    	
		
		return d.promise;
		
	};	
	
	//XEP-0080: plans Location
	this.getListOfPlansAround = function( params) {
		
		var d = when.defer();

		var today = new Date().getTime();
		var yesterday = today - 86400000 ;
		
		var query2send = squel.select()
			.field("planid")
			.field("organizer")
			.field("nickname")
			.field("commentary")
			.field("ST_X(location::geometry)", "lon")
			.field("ST_Y(location::geometry)", "lat")
			.field("meetinginitdate")
			.field("meetinginittime")
			.field("organizerobj")
		    .from("plan")							    				    
		    .order("location::geometry <-> 'SRID=4326;POINT(" + params.location.lon + " " + params.location.lat + ")'::geometry" )
		    .where("meetinginitdate > " + yesterday )
		    .limit(config.MAX_PROFILES_QUERY).toString();
							 							        
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('getListOfPlansAround ::: error running query', err);	
		    	return d.resolve(err);
		    }		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	logger.error('getListOfPlansAround ::: upss no plans around');
			    	return  d.resolve([]);
			    }		    
			    
				var listOfPlans = [];
				result.rows.map(function(r){
					
					var plan = {
						planId : r.planid ,		
						organizer : r.organizer ,
						imgsrc : "" ,
						nickName : r.nickname ,
						commentary : (typeof r.commentary == "undefined" || r.commentary == null ) ? "" : r.commentary,
						location : { lat : r.lat.toString() , lon : r.lon.toString() }, 
						meetingInitDate : r.meetinginitdate.toString() , 
						meetingInitTime : r.meetinginittime,
						organizerObj : r.organizerobj
					};
					  
					listOfPlans.push( plan );					
				});			   		
			    
			    return  d.resolve(listOfPlans);
			    
		    }catch (ex) {
				logger.error("getListOfPlansAround  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};	
	
	//XEP-0080: User Location:: distribute its Location to its "Visible"s	
	this.getListOfPeopleAround = function(client , online) {
		
		var d = when.defer();
	    		
		var query2send;
	
		if (online){
			query2send = squel.select()
	    						.field("publicclientid")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
	    						.field("pubkeypem")
	    						.field("visibility")
							    .from("client")							    				    
							    .order("location::geometry <-> 'SRID=4326;POINT(" + client.location.lon + " " + client.location.lat + ")'::geometry" )
							    .where("socketid IS NOT NULL")
							    .where("visibility = 'on'")
							    .limit(config.MAX_PROFILES_QUERY)
							    .toString();			
		}else{
			query2send = squel.select()
	    						.field("publicclientid")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
	    						.field("pubkeypem")
	    						.field("visibility")
							    .from("client")							    				    
							    .order("location::geometry <-> 'SRID=4326;POINT(" + client.location.lon + " " + client.location.lat + ")'::geometry" )
							    .where("visibility = 'on'")
							    .limit(config.MAX_PROFILES_QUERY_ONLINE)
							    .toString();			
		}
							 							        
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('getListOfPeopleAround ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	logger.error('getListOfPeopleAround ::: upss nobody around');
			    	return  d.resolve([]);
			    }			    
			    
				var listOfVisibles = [];
				result.rows.map(function(r){
					
					if (	r.publicclientid != client.publicClientID && 
							r.lat != null && r.lon != null){
						var visible = {
							publicClientID : r.publicclientid,
							location : { lat : r.lat.toString() , lon : r.lon.toString() } ,
							nickName : r.nickname,
				  			commentary :  (typeof r.commentary == "undefined" || r.commentary == null ) ? "" : r.commentary,
				  			pubKeyPEM : r.pubkeypem
				  		}; 
						listOfVisibles.push(visible);
					}
				});			   		
			    
			    return  d.resolve(listOfVisibles);
			    
		    }catch (ex) {
				logger.error("getListOfPeopleAround  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};
	

	
	this.getClientById = function(publicClientID) {
		
	    var d = when.defer();
	    
	    var query2send = squel.select()
	    						.field("indexofcurrentkey")
	    						.field("currentchallenge")
	    						.field("publicclientid")
	    						.field("socketid")
	    						.field("membersince")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("myarrayofkeys")
	    						.field("location")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
	    						.field("lastprofileupdate")
	    						.field("pubkeypem")	    						
	    						.field("visibility")
	    						.field("version")
							    .from("client")
							    .where("publicclientid = '" + publicClientID + "'")							    
							    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('getClientById ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	logger.error('getClientById ::: publicClientID not found');
			    	return  d.resolve(null);
			    }
		    		    
			    var client = {};
			    var entry = result.rows[0];
			    
			    
			    client.publicClientID = entry.publicclientid;
			    
			    if (entry.indexofcurrentkey == null)
			    	client.indexOfCurrentKey = 0;
			    else
			    	client.indexOfCurrentKey = entry.indexofcurrentkey;
			    
			    if (entry.currentchallenge == null)
			    	client.currentChallenge == "";
			    else
			    	client.currentChallenge = entry.currentchallenge;
			    
			    if (entry.socketid == null)
			    	client.socketid = "";
			    else
			    	client.socketid = entry.socketid ; 
			    
			    client.memberSince = entry.membersince;
			    client.nickName = entry.nickname;
			    client.commentary = entry.commentary;

			    if (entry.location == null )
			    	client.location = { "lat" : "", "lon" : "" };
			    else
			    	client.location = { "lat" : entry.lat.toString(), "lon" : entry.lon.toString() };			    
			    
			    client.myArrayOfKeys = JSON.parse( entry.myarrayofkeys );
			    client.lastProfileUpdate = entry.lastprofileupdate;
			    client.pubKeyPEM = entry.pubkeypem;			    
			    client.visibility = entry.visibility;
			    client.version = entry.version;
			    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				logger.error("getClientById  :::  exception thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};
	
	this.getClientByHandshakeToken = function(handshakeToken) {
		
	    var d = when.defer();
	    
	    var query2send = squel.select()
	    						.field("indexofcurrentkey")
	    						.field("currentchallenge")
	    						.field("publicclientid")
	    						.field("socketid")
	    						.field("membersince")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("myarrayofkeys")
	    						.field("location")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
	    						.field("lastprofileupdate")
							    .field("pubkeypem")
	    						.field("visibility")
	    						.field("version")
							    .from("client")
							    .where("handshaketoken = '" + handshakeToken + "'")							    
							    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('getClientByHandshakeToken ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	logger.error('getClientByHandshakeToken ::: I dont know any publicClientID like this');
			    	return  d.resolve(null);
			    }
		    		    
			    var client = {};
			    var entry = result.rows[0];
			    
			    
			    client.publicClientID = entry.publicclientid;
			    
			    if (entry.indexofcurrentkey == null)
			    	client.indexOfCurrentKey = 0;
			    else
			    	client.indexOfCurrentKey = entry.indexofcurrentkey;
			    
			    if (entry.currentchallenge == null)
			    	client.currentChallenge == "";
			    else
			    	client.currentChallenge = entry.currentchallenge;
			    
			    if (entry.socketid == null)
			    	client.socketid = "";
			    else
			    	client.socketid = entry.socketid ; 
			    
			    client.memberSince = entry.membersince;
			    client.nickName = entry.nickname;
			    client.commentary = entry.commentary;

			    if (entry.location == null )
			    	client.location = { "lat" : "", "lon" : "" };
			    else
			    	client.location = { "lat" : entry.lat.toString(), "lon" : entry.lon.toString() };			    
			    
			    client.myArrayOfKeys = JSON.parse( entry.myarrayofkeys );
			    client.lastProfileUpdate = entry.lastprofileupdate;
			    client.pubKeyPEM = entry.pubkeypem;			    
			    client.visibility = entry.visibility;
			    client.version = entry.version;
   	
	    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				logger.error("getClientByHandshakeToken  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};
	//TODO it should also return the PEM
	this.getProfileByID = function( publicClientID ) {	
		
		var d = when.defer();
	    
	    var query2send = squel.select()
    						.field("nickname")
    						.field("commentary")
     						.field("telephone")
    						.field("email")   						
    						.field("lastprofileupdate")
						    .from("client")
						    .where("publicclientid = '" + publicClientID + "'")
						    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('getProfileByID ::: error running query', err);	
		    	return d.resolve(null);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	logger.error('getProfileByID ::: I dont know any publicClientID like this');
			    	return  d.resolve(null);
			    }
		    		    
			    var profile = {};
			    var entry = result.rows[0];			    
			    
			    profile.publicClientID = publicClientID;
			    profile.nickName = entry.nickname;
			    profile.commentary = entry.commentary;
			    profile.telephone = (typeof entry.telephone == "undefined" || entry.telephone == null ) ? "" : entry.telephone ;
			    profile.email = (typeof entry.email == "undefined" || entry.email == null ) ? "" : entry.email ;
			    profile.lastProfileUpdate = entry.lastprofileupdate;
			    
    			var query2send = squel.select()
    				.field("photo")
				    .from("profilesphoto")				    	
			    	.where("publicclientid = '" + publicClientID + "'")
				    .toString();
		
				clientOfDB.query(query2send, function(err, result) {
		     
					if(err) {
						logger.error('getProfileByID ::: error running query', err);	
					}
					
					if (typeof result.rows[0] == "undefined"){
				    	logger.error('getProfileByID ::: I dont know any publicClientID like this');
				    	return  d.resolve(null);
				    }
		    		    
			  		profile.imgsrc = result.rows[0].photo;
		
					return d.resolve(profile);
		
				});				    	
	    
			    
		    }catch (ex) {
				logger.error("getProfileByID  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;

	};
	
	this.getPushRegistryByID = function( publicClientID ) {	
		
		var d = when.defer();
		
	    var query2send = squel.select()
    						.field("pushtoken")
						    .from("client")
						    .where("publicclientid = '" + publicClientID + "'")
						    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('getPushRegistryByID ::: error running query', err);	
		    	return d.resolve(null);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	logger.error('getPushRegistryByID ::: publicClientID not found');
			    	return  d.resolve( null );
			    }
		    		    
			    var pushRegistry = {};
			    var entry = result.rows[0];			    
			    pushRegistry.token = entry.pushtoken;
			    
				return d.resolve( pushRegistry );	    
			    
		    }catch (ex) {
				logger.error("getPushRegistryByID ::: exception " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;

	};
	
	this.createNewClient = function( pubKeyPEM ) {
		
		var newClient = new Client ( pubKeyPEM );		
		var d = when.defer();	
		
		var query2send = squel.insert()
							    .into("client")
							    .set("publicclientid", newClient.publicClientID )
							    .set("indexofcurrentkey", newClient.indexOfCurrentKey )
							    .set("membersince", newClient.memberSince )
							    .set("currentchallenge", newClient.currentChallenge )
							    .set("socketid ", null)
							    .set("nickname", null)
							    .set("commentary", null)
							    .set("location", null)
							    .set("telephone", null)
							    .set("email", null)
							    .set("myarrayofkeys", JSON.stringify(newClient.myArrayOfKeys ) )
							    .set("handshaketoken", newClient.handshakeToken)
							    .set("lastprofileupdate", newClient.lastProfileUpdate)
							    .set("pubkeypem", newClient.pubKeyPEM)
							    .set("visibility", newClient.visibility)
							    .toString() ;
			query2send += " ; " ;
			query2send += squel.insert()
						    .into("profilesphoto")
						    .set("publicclientid", newClient.publicClientID )								
						    .set("photo", null)									
						    .toString() ;
							    
		clientOfDB.query(query2send, function(err, result) {
		     
			//clientOfDB.done();
		    
		    if(err) {
		    	logger.error('createNewClient :::error running query', err);	
		    	logger.error('createNewClient ::: query error: ', query2send);	
		    	return d.resolve(null);
		    }		    
		    
		    return  d.resolve(newClient);
		    
		  });
		
		return d.promise;
		

	};
	
	this.createNewPlan = function( client, params ) {
		
		if ( client.publicClientID != params.organizer){
			logger.error('createNewPlan ::: params error: publicClientID != params.organizer ');	
			return;
		}
		
		var query2send = squel.insert()
		    .into("plan")
		    .set("planid", params.planId )
		    .set("organizer", params.organizer )		
		    .set("nickname", params.nickName )
		    .set("commentary", params.commentary )
		    .set("location", "ST_GeographyFromText('SRID=4326;POINT(" + params.location.lon  + " " + params.location.lat + ")')" , {dontQuote: true} )
		    .set("meetinginitdate", params.meetingInitDate)
		    .set("meetinginittime", JSON.stringify( params.meetingInitTime ) )
		    .set("organizerobj", JSON.stringify( params.organizerObj ) ).toString();
		
		query2send += " ; " + squel.insert()
		    .into("profilesphoto")
		    .set("publicclientid", params.planId )								
		    .set("photo", params.imgsrc).toString() ;
		
		
		clientOfDB.query(query2send, function(err, result) {		     
			//clientOfDB.done();		    
		    if(err) {
		    	logger.error('createNewPlan :::error running query', err);	
		    	logger.error('createNewPlan ::: query error: ', query2send);	
		    }		    
		});			

	};	
	
	this.updateClientsHandshake = function(client) {
			
		var d = when.defer();
		
		 var query2send = squel.update()
							    .table("client")
							    .set("indexofcurrentkey", client.indexOfCurrentKey)
							    .set("currentchallenge", client.currentChallenge)
							    .where("publicclientid = '" + client.publicClientID + "'")
							    .toString();
		
		clientOfDB.query(query2send, function(err, result) {
		     
			//clientOfDB.done();
		    
			if(err) {
				logger.error('updateClientsHandshake :::error running query', err);	
				logger.error('updateClientsHandshake ::: query error: ', query2send);	
			   	return d.resolve(null);
			}		    

			return  d.resolve(true);
    
		});
		
		return d.promise;			
	
	};
	
	
	this.updateClientsLocation = function(client , ip) {
		
		var d = when.defer();
		
		if (ip.indexOf(",") != -1){
			var IPs = ip.split(",");
			ip = IPs[ IPs.length - 1 ].trim();
		}
				
		if (BrokerOfVisibles.prototype.isValidIP(ip) == false) return d.resolve(false); 	
			

		var query2send = squel.select()	    						
							    .from("dbip_lookup")
							    .where("ip_start <= '" + ip + "'")
							    .where("ip_end >= '" + ip + "'")								    
							    .toString();		
		
		clientOfDB.query(query2send, function(err, result) {
	
			if(err){
				logger.error('updateClientsLocation :::error running query', err);
				return  d.resolve(false);
			} 
									
		    if (typeof result == "undefined"){
				logger.error('updateClientsLocation ::: could not resolve location by IP');
				return  d.resolve(false);
			}
			try{	    
				var entry = result.rows[0];				
				var discoveredLocation = {
					lat : entry.latitude,
					lon : entry.longitude
				};
			}catch(e){
				logger.error('updateClientsLocation ::: unexpected error', e);
				return  d.resolve(false);
			}
			
			var query2send = squel.update()
							    .table("client")
						    	.set("location", "ST_GeographyFromText('SRID=4326;POINT(" + discoveredLocation.lon  + " " + discoveredLocation.lat + ")')" , {dontQuote: true} )					    	
						    	.where("publicclientid = '" + client.publicClientID + "'")
							    .toString();
		
			clientOfDB.query(query2send, function(err, result) {
	     
				if(err) {
					logger.error('updateClientsLocation :::error running query', err);	
				}
				d.resolve(true);
			});
			
		});	
		return d.promise;
	};
	
	this.updatePlan = function( client, params ) {
		
		if ( client.publicClientID != params.organizer){
			logger.error('createNewPlan ::: params error: publicClientID != params.organizer ');	
			return;
		}
		
		if ( params.commentary != null )
			params.commentary = BrokerOfVisibles.prototype.sanitize(params.commentary);
		if ( params.nickName != null )
			params.nickName = BrokerOfVisibles.prototype.sanitize(params.nickName);
		
		var query2send = squel.update()
		    .table("plan")
		    .set("planid", params.planId )
		    .set("organizer", params.organizer )		
		    .set("nickname", params.nickName )
		    .set("commentary", params.commentary )
		    .set("location", "ST_GeographyFromText('SRID=4326;POINT(" + params.location.lon  + " " + params.location.lat + ")')" , {dontQuote: true} )
		    .set("meetinginitdate", params.meetingInitDate)
		    .set("meetinginittime", JSON.stringify( params.meetingInitTime ) )
		    .set("organizerobj", JSON.stringify(params.organizerObj) )
		    .where("planid = '" + params.planId + "'").toString();
		
			query2send += " ; " + squel.update()
		    .table("profilesphoto")
		    .set("photo", params.imgsrc )
		    .where("publicclientid = '" + params.planId + "'").toString();
		
		clientOfDB.query(query2send, function(err, result) {		     
			//clientOfDB.done();		    
		    if(err) {
		    	logger.error('updatePlan ::: error running query', err);	
		    	logger.error('updatePlan ::: query error: ', query2send);	
		    }		    
		});
	};
	
	this.updatePushRegistry = function( client ) {
	
		if ( client.pushToken != null )
			client.pushToken = BrokerOfVisibles.prototype.sanitize( client.pushToken );
				
		var query2send = squel.update()
							    .table("client")
							    .set("pushtoken", client.pushToken)	
							    .where("publicclientid = '" + client.publicClientID + "'")
							    .toString();
			query2send = "BEGIN; " + query2send + "; COMMIT;";				  
		
		clientOfDB.query(query2send, function(err, result) {		     
			 
			if(err) {
				logger.error('updatePushRegistry :::error running query', err);	
				logger.error('updatePushRegistry ::: query error: ', query2send);	
			}
    
		});	
	
	};
	
	this.updateClientsProfile = function(client) {
		
		if ( client.commentary != null )
			client.commentary = BrokerOfVisibles.prototype.sanitize(client.commentary);
		if ( client.nickName != null )
			client.nickName = BrokerOfVisibles.prototype.sanitize(client.nickName);
		if ( client.telephone != null )
			client.telephone = BrokerOfVisibles.prototype.sanitize(client.telephone);
		else
			client.telephone = "";
			
		if ( client.email != null )
			client.email = BrokerOfVisibles.prototype.sanitize(client.email);
		else
			client.email = "";
		
		if ( typeof client.visibility == "undefined" || client.visibility == null )
			client.visibility = "on";
		if ( typeof client.version == "undefined" || client.version == null )
			client.version = "0.0.1";
		
		var query2send = squel.update()
						    .table("client")
						    .set("location", "ST_GeographyFromText('SRID=4326;POINT(" + client.location.lon + " " + client.location.lat + ")')" , {dontQuote: true} )
						    .set("socketid", client.socketid)
						    .set("nickname", client.nickName)
						    .set("commentary", client.commentary)
						    .set("lastprofileupdate", client.lastProfileUpdate)
						    .set("telephone", client.telephone)
						    .set("email", client.email)
						    .set("visibility", client.visibility)
						    .set("version", client.version)	
						    .where("publicclientid = '" + client.publicClientID + "'")
						    .toString();
			query2send = "BEGIN; " + query2send + "; COMMIT;";				  
		
		clientOfDB.query(query2send, function(err, result) {		     
			 
			if(err) {
				logger.error('updateClientsProfile :::error running query', err);	
				logger.error('updateClientsProfile ::: query error: ', query2send);	
			}
    
		});		
	
	};

	this.updateClientsPhoto = function( client, img ) {
		
		var query2send = squel.update()
						    .table("profilesphoto")
						    .set("photo", img )
						    .where("publicclientid = '" + client.publicClientID + "'")
						    .toString();
		
		clientOfDB.query(query2send, function(err, result) {		     
			 
			if(err) {
				logger.error('updateClientsPhoto :::error running query', err);	
				logger.error('updateClientsPhoto ::: query error: ', query2send);	
			}
    
		});		
	
	};	
	
	
	
	this.evaluateResponseToTheChanllenge = function(joinServerParameters) {
		var client;
		try{
			client = _.find(listOfClients, function(client) {	
	  		return (	client.publicClientID  == joinServerParameters.publicClientID &&
	  					client.currentChallenge == joinServerParameters.token);	
			});		
		}
		catch(e){
			logger.error("evaluateResponseToTheChanllenge ::: joinServerParameters probably null");
		}
	
		return client;
	};
	
	this.isClientOnline = function(publicClientID) {
		
	    var d = when.defer();
	    
	    var query2send = squel.select()
	    						.field("indexofcurrentkey")
	    						.field("currentchallenge")
	    						.field("publicclientid")
	    						.field("socketid")
	    						.field("membersince")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("myarrayofkeys")
	    						.field("location")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
							    .from("client")
							    .where("publicclientid = '" + publicClientID + "'")								    
							    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	logger.error('isClientOnline ::: error running query', err);	
		    	return d.resolve(null);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined" || 
			    	result.rows[0].socketid == null ){
			    	//logger.error('isClientOnline ::: publicClientID not registered or socket is set to null --> offline for client:' + publicClientID );
			    	return  d.resolve(null);
			    }
		    		    
			    var client = {};
			    var entry = result.rows[0];
			    
			    client.publicClientID = entry.publicclientid;
			    
			    if (entry.indexofcurrentkey == null)
			    	client.indexOfCurrentKey = 0;
			    else
			    	client.indexOfCurrentKey = entry.indexofcurrentkey;
			    
			    if (entry.currentchallenge == null)
			    	client.currentChallenge == "";
			    else
			    	client.currentChallenge = entry.currentchallenge;
			    
			    if (entry.socketid == null)
			    	client.socketid = "";
			    else
			    	client.socketid = entry.socketid ; 
			    
			    client.memberSince = entry.membersince;
			    client.nickName = entry.nickname;
			    client.commentary = entry.commentary;

			    if (entry.location == null )
			    	client.location = { "lat" : "", "lon" : "" };
			    else
			    	client.location = { "lat" : entry.lat.toString(), "lon" : entry.lon.toString() };			    
			    
			    client.myArrayOfKeys = JSON.parse( result.rows[0].myarrayofkeys );	
			    
			    			   		    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				logger.error("isClientOnline  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;

	}; // END METHOD
	
};//END CLASS

BrokerOfVisibles.prototype.isLocationWellFormatted = function( location ) {	
	try {    
		
		if ( 	location.lat == '' ||
				location.lon == '' ||
			 	Object.keys(location).length != 2 ) {
			
			console.error("isLocationWellFormatted ::: didnt pass the format check 1 :" + JSON.stringify( location ) );
			return false;
		}
		
		return true; 
	}
	catch (ex) {
		console.error("isLocationWellFormatted ::: didnt pass the format check ex: " + ex  + ex.stack );
		return false;
	}	
};

BrokerOfVisibles.prototype.sanitize = function(html) {
	
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
	return html.replace(/</g, '&lt;').replace(/\'/g, "&#39") ;
};

BrokerOfVisibles.prototype.escape = function (str) {
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



BrokerOfVisibles.prototype.isValidIP = function (ip) {
	
	var validIP = false;
	if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(ip)) {
		validIP = true;
	}else{
		if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(ip)) {
			validIP = true;
		}
	}
    return validIP;
};



module.exports = BrokerOfVisibles;