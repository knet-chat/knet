
var fs = require('fs');
var lineByLine = require('n-readlines');
var squel = require("squel");
var readline = require('readline');
var pg = require('pg');

rl = readline.createInterface(process.stdin, process.stdout);
rl.question('What is the user of the DataBase ? ', function(user) {	
rl.question('What is the password of the DataBase ? ', function(pass) {
rl.question('What is the Name of the DataBase ? ', function(dbName) {
rl.question('and the name of the .csv ? ', function(dpipFilename) {	
	
	var conString = "postgres://" +  user + ":" + pass + "@localhost/" + dbName ;
	
	pg.connect(conString, function(err, client, done) {
		
		var clientOfDB = client;
		if(err) return console.error('DEBUG ::: could not connect to DB', err);
	
		var liner = new lineByLine(__dirname + "/" + dpipFilename );
		var line;
	
		while (line = liner.next()) {
			
			var parts = line.toString('utf8').split('\",\"');
			var ip_start = parts[0].replace(/\"/g, "") ,
				ip_end =   parts[1].replace(/\"/g, "") ,
				country =  parts[2].replace(/\"/g, "")  ,
				stateprov = parts[3].replace(/\"/g, "").replace(/\'/g, "") ,
				city = 		parts[4].replace(/\"/g, "").replace(/\'/g, "") ,
				latitude = parseFloat( parts[5].replace(/\"/g, "") ),
				longitude = parseFloat( parts[6].replace(/\"/g, "") ), 
				timezone_offset = parseFloat( parts[7].replace(/\"/g, "") ),
				timezone_name = parts[8].replace(/\"\r/g, "").replace(/\'/g, "") ;
			
			var query2send = squel.insert()
							    .into("dbip_lookup")
							    .set("ip_start", ip_start  )
							    .set("ip_end", ip_end  )
							    .set("country",country  )
							    .set("stateprov",stateprov  )
							    .set("city ", city )
							    .set("latitude", latitude)
							    .set("longitude", longitude)
							    .set("timezone_offset",timezone_offset )
							    .set("timezone_name", timezone_name )
							    .toString() + ";" ;		
	
			fs.appendFileSync( dpipFilename + ".sql" , query2send + "\n", { encoding : "utf8" } );	
	
		}	// END while through every line
		
	});	// END connection to pg
		
});// ? dpipFilename 
});// ? dbName		
});// ? pwd
});// ? user
rl.on('close', function() {
  console.log('upss! the terminal was closed');
});
