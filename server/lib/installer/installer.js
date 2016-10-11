
var fs = require('fs');
var lineByLine = require('n-readlines');
var squel = require("squel");
var readline = require('readline');
var pg = require('pg');

var config = JSON.parse(fs.readFileSync(__dirname + '/config_template.json', 'utf8'));

rl = readline.createInterface(process.stdin, process.stdout);
rl.question('What is the host of the database ? ', function(dbHost) {
rl.question('What is the user of the database ? ', function(dbUser) {	
rl.question('What is the password of the database ? ', function(pass) {
rl.question('What is the name of the database ? ', function(dbName) {
rl.question('IP address for the knet-server ? ', function(ipServer) {
rl.question('Number of Non TLS instances ? ', function(numberNonTLSintances) {
rl.question('Number of TLS instances ? ', function(numberTLSintances) {
rl.question('Enter your Paypal details like this: yourPayPalname,yourPayPalpass,yourPayPalSignature  ', function(paypalInput) {	
rl.question('Enter your keyGCM: ', function(keyGCM) {
		

	var conString = "postgres://" +  dbUser + ":" + pass + "@" + dbHost + "/" + dbName ;
	pg.connect(conString, function(err, client, done) {
		
		if(err){
			console.error('ERROR ::: ');
			console.error('ERROR ::: could not connect to DB', err);
			console.error('ERROR ::: could not connect to DB', err);
			console.error('WARNING ::: writing config.json anyway');
		}				
		console.log('INFO ::: assigning ports from 8080 and on for Non TLS instances ... ');
		
		config.listOfServerSockets[0].ipServerSockets = ipServer;
		
		config.instance = [];
		var nginx_io_nodes = "";
		for ( i = 0 ; i < parseInt(numberNonTLSintances) ;  i++  ){
			
			config.instance[i] = {};
			config.instance[i].id = i;
			config.instance[i].db = {};
			config.instance[i].db.host = dbHost;
			config.instance[i].db.name = dbName;
			config.instance[i].db.user = dbUser;
			config.instance[i].db.pass = pass;
			config.instance[i].ipAddress = ipServer;
			config.instance[i].portNumber = 8080 + i;
			config.instance[i].useTLS = false;
			nginx_io_nodes += "\t\tserver " + config.instance[i].ipAddress + ":" + config.instance[i].portNumber + "; \n";
			
		}
		console.log('INFO ::: assigning ports from 9080 and on for TLS instances ... ');

		var nginx_tls_nodes = "";

		for ( i = parseInt(numberNonTLSintances) ;  i < parseInt(numberNonTLSintances) + parseInt(numberTLSintances); i++ ){
			
			config.instance[i] = {};
			config.instance[i].id = i;
			config.instance[i].db = {};
			config.instance[i].db.host = dbHost;
			config.instance[i].db.name = dbName;
			config.instance[i].db.user = dbUser;
			config.instance[i].db.pass = pass;
			config.instance[i].ipAddress = ipServer;
			config.instance[i].portNumber = 9080 + i - parseInt(numberNonTLSintances);
			config.instance[i].useTLS = true;
			nginx_tls_nodes += "\t\tserver " + config.instance[i].ipAddress + ":" + config.instance[i].portNumber + "; \n";
			
		}	
		
		var paypalInputArray = paypalInput.split(","); 
		config.paypal.username = paypalInputArray[0];
		config.paypal.password = paypalInputArray[1];
		config.paypal.signature = paypalInputArray[2];
		config.paypal.returnURL = "http://" + ipServer + "/successPaymentipServer";
		config.paypal.cancelURL = "http://" + ipServer + "/cancelPayment";
		
		config.keyGCM = keyGCM;
		
		
		fs.writeFileSync( __dirname + '/../config.json' , JSON.stringify(config) + "\n", { encoding : "utf8", flag: 'w'} );
		console.log('INFO ::: server/lib/config.json ,  done!');
		
		console.log('INFO ::: redis is configured to work on : localhost:6379 ');
		console.log('INFO ::: don\'t forget to set you Paypal details and the keyGCM');
		
		console.log('INFO ::: writing configuration of Nginx');		
		var NginxFile = fs.readFileSync(__dirname + '/nginx_template.conf', 'utf8');
		
        NginxFile = NginxFile.replace(/#TO_BE_REPLACED_BY_INSTALLER_HERE_server_name/g, ipServer );        
        NginxFile = NginxFile.replace(/#TO_BE_REPLACED_BY_INSTALLER_HERE_io_nodes/g, nginx_io_nodes );        
        NginxFile = NginxFile.replace(/#TO_BE_REPLACED_BY_INSTALLER_HERE_tls_nodes/g, nginx_tls_nodes );
        
        fs.writeFileSync( __dirname + '/nginx.conf' , NginxFile + "\n", { encoding : "utf8", flag: 'w'} );
        
		console.log('INFO ::: /etc/nginx/nginx.conf done!');
		
		console.log('INFO ::: writing configuration of www client');		
		var clientConfig = fs.readFileSync(__dirname + '/../../../client/js/config.js', 'utf8');		
		clientConfig = clientConfig.replace(/TO_BE_REPLACED_BY_INSTALLER_HERE_ipServerAuth/g, ipServer );        
        fs.writeFileSync( __dirname + '/../../../client/js/config.js' , clientConfig + "\n", { encoding : "utf8", flag: 'w'} );
        
        
		console.log('INFO ::: writing configuration of shell scripts');	
		var numberOfInstances = parseInt(numberNonTLSintances) + parseInt(numberTLSintances);
		fs.writeFileSync( __dirname + '/NUMBER_OF_INSTANCES.dat' , numberOfInstances + "\n", { encoding : "utf8", flag: 'w'} );
		
			        

		
		process.exit();
		
	});	// END connection to pg

});// ? keyGCM	
});// ?	paypalInput
});// ? numberTLSintances 
});// ? numberNonTLSintances 
});// ? ipServer 
});// ? dbName		
});// ? pwd
});// ? dbuser
});// ? dbhost

rl.on('close', function() {
  console.log('upss! the terminal was closed');
});
