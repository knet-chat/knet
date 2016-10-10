//	https://github.com/petersirka/node-paypal-express-checkout
//	License: 	MIT 
//	author :	petersirka@gmail.com
//	author :	marco.vereda@instaltic.com

var urlParser = require('url');
var https = require('https');
var querystring = require('querystring');

function Paypal(username, password, signature, returnUrl, cancelUrl, debug) {

	this.username = username;
	this.password = password;
	this.solutiontype = 'Mark';
	this.signature = signature;
	this.debug = debug || false;
	this.returnUrl = returnUrl;
	this.cancelUrl = cancelUrl;

	this.url = 'https://' + (debug ? 'api-3t.sandbox.paypal.com' : 'api-3t.paypal.com') + '/nvp';
	this.redirect = 'https://' + (debug ? 'www.sandbox.paypal.com/cgi-bin/webscr' : 'www.paypal.com/cgi-bin/webscr');
};

Paypal.prototype.params = function() {
	var self = this;
	return {
		USER: self.username,
		PWD: self.password,
		SIGNATURE: self.signature,
		SOLUTIONTYPE: self.solutiontype,
		VERSION: '52.0'
	};
};

/*
	Get payment detail
	@token {String}
	@payer {String} :: PayerID
	@callback {Function} :: callback(err, data, invoiceNumber, price);
	return {Paypal}
*/
Paypal.prototype.detail = function(token, payer, callback) {

	if (typeof(token.get) !== 'undefined' && typeof(payer) === 'function') {
		callback = payer;
		payer = token.get.PayerID;
		token = token.get.token;
	}

	var self = this;
	var params = self.params();

	params.TOKEN = token;
	params.METHOD = 'GetExpressCheckoutDetails';
	
	var timeStamp = new Date();
	console.log(timeStamp.toLocaleString() + " GetExpressCheckoutDetails " + self.url);
	console.log(JSON.stringify(params));
	
	self.request(self.url, 'POST', params, function(err, data) {

		if (err) {
			callback(err, data);
			return;
		}

		if (typeof(data.CUSTOM) === 'undefined') {
			callback(data, null);
			return;
		}

		var custom = data.CUSTOM.split('|');

		var params = self.params();
		params.PAYMENTACTION = 'Sale';
		params.PAYERID = payer;
		params.TOKEN = token;
		params.AMT = custom[1];
		params.CURRENCYCODE = custom[2];
		params.METHOD = 'DoExpressCheckoutPayment';
		
		var timeStamp = new Date();
		console.log(timeStamp.toLocaleString() + " DoExpressCheckoutPayment " + self.url);
		console.log(JSON.stringify(params));

		self.request(self.url, 'POST', params, function(err, data) {

			if (err) {
				callback(err, data);
				return;
			}

			callback(null, data, custom[0], custom[1]);
		});
	});

	return self;
};

/*
	SetExpressCheckout
	@invoiceNumber {String}
	@amount {Number}
	@description {String}
	@currency {String} :: EUR, USD
	@callback {Function} :: callback(err, url);
	return {Paypal}
*/
Paypal.prototype.pay = function(invoiceNumber, amount, description, currency, callback) {

	var self = this;
	var params = self.params();

	params.PAYMENTACTION = 'Sale';
	params.AMT = prepareNumber(amount);
	params.RETURNURL = self.returnUrl;
	params.CANCELURL = self.cancelUrl;
	params.DESC = description;
	params.NOSHIPPING = 1;
	params.ALLOWNOTE = 1;
	params.CURRENCYCODE = currency;
	params.METHOD = 'SetExpressCheckout';
	params.INVNUM = invoiceNumber;
	params.CUSTOM = invoiceNumber + '|' + params.AMT + '|' + currency;

	var timeStamp = new Date();
	console.log(timeStamp.toLocaleString() + " SetExpressCheckout " + self.url);
	console.log(JSON.stringify(params));
	
	
	self.request(self.url, 'POST', params, function(err, data) {

		if (err) {
			callback(err, null);
			return;
		}

		if (data.ACK === 'Success') {
			callback(null, self.redirect + '?cmd=_express-checkout-mobile&useraction=commit&token=' + data.TOKEN);
			return;
		}

		callback(new Error('ACK ' + data.ACK + ': ' + data.L_LONGMESSAGE0), null);
	});

	return self;
};

/*
	Internal function
	@url {String}
	@method {String}
	@data {String}
	@callback {Function} :: callback(err, data);
	return {Paypal}
*/
Paypal.prototype.request = function(url, method, data, callback) {

	var self = this;
	var params = querystring.stringify(data);

	if (method === 'GET')
		url += '?' + params;

	var uri = urlParser.parse(url);
	var headers = {};

	headers['Content-Type'] = method === 'POST' ? 'application/x-www-form-urlencoded' : 'text/plain';
	headers['Content-Length'] = params.length;

	var location = '';
	var options = { protocol: uri.protocol, auth: uri.auth, method: method || 'GET', hostname: uri.hostname, port: uri.port, path: uri.path, agent: false, headers: headers };

	var response = function (res) {
		var buffer = '';

		res.on('data', function(chunk) {
			buffer += chunk.toString('utf8');
		})

		req.setTimeout(exports.timeout, function() {
			callback(new Error('timeout'), null);
		});

		res.on('end', function() {

			var error = null;
			var data = '';

			if (res.statusCode > 200) {
				error = new Error(res.statusCode);
				data = buffer;
			} else
				data = querystring.parse(buffer);

			callback(error, data);
		});
	};

	var req = https.request(options, response);
	
	req.on('error', function(err) {
    	console.log(err);
	});
	
	if (method === 'POST')
		req.end(params);
	else
		req.end();

	return self;
};

function prepareNumber(num, doubleZero) {
	var str = num.toString().replace(',', '.');

	var index = str.indexOf('.');
	if (index > -1) {
		var len = str.substring(index + 1).length;
		if (len === 1)
			str += '0';
		if (len > 2)
			str = str.substring(0, index + 3);
	} else {
		if (doubleZero || true)
			str += '.00';
	}
	return str;
}

exports.timeout = 10000;
exports.Paypal = Paypal;

exports.init = function(username, password, signature, returnUrl, cancelUrl, debug) {
	return new Paypal(username, password, signature, returnUrl, cancelUrl, debug);
};

exports.create = function(username, password, signature, returnUrl, cancelUrl, debug) {
	return exports.init(username, password, signature, returnUrl, cancelUrl, debug);
};


