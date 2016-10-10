var	uuid	= require('node-uuid');
var forge = require('node-forge')({disableNativeCode: true});

function Client( pubKeyPEM ) {
  this.indexOfCurrentKey = 1;
  this.currentChallenge = uuid.v4();
  this.publicClientID = uuid.v4();
  this.socketid = null;
  this.location = { lat : "", lon : ""};
  this.memberSince = new Date().getTime();
  this.nickName = "";
  this.commentary = "";
  this.myArrayOfKeys = [forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32)];
  
  for (i = 0; i < this.myArrayOfKeys.length; i++) { 
    this.myArrayOfKeys[i] = this.myArrayOfKeys[i].replace(/['"]/g,'X');
  }
                        
  this.myArrayOfIV = 	[forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32)];
  
  for (i = 0; i < this.myArrayOfIV.length; i++) { 
   this.myArrayOfIV[i] = this.myArrayOfIV[i].replace(/['"]/g,'X');
  }
  
  this.handshakeToken = uuid.v4();
  //newer than 2015
  this.lastProfileUpdate = 1420070401000;
  this.pubKeyPEM = pubKeyPEM;
  this.visibility = "on";

};

Client.prototype.updateLocation = function(location) {
  if (this.isLocationWellFormatted(location) == true) {
    this.location = location;
  }
};

Client.prototype.setNewParameters = function(parameters) {
  if (this.isLocationWellFormatted(parameters.location) == true) {
    this.location = parameters.location;
  }
  this.nickName = parameters.nickName;
 // this.commentary = parameters.commentary;
};

//TODO to be done
Client.prototype.isLocationWellFormatted = function(location) {
  //var isformatted = false;
  var isformatted = true;
  return isformatted;
};

Client.prototype.setSocketId = function(id) {
	this.socketid = id;

};

module.exports = Client;