var forge = require('node-forge')({disableNativeCode: true});
		
module.exports = function( callback ) {
	
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

	var setOfKeys = {};
	setOfKeys.publicKey = forge.pki.publicKeyToPem( keys.publicKey );
	setOfKeys.privateKey = forge.pki.privateKeyToPem( keys.privateKey );
	setOfKeys.certificate = forge.pki.certificateToPem( cert );	
	
	callback( setOfKeys );
}
	

