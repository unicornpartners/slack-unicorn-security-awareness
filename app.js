var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB({region:"us-west-2"});
var http = require("https");

var googleAPIKey = process.env.GOOGLE_API_KEY;
var slackAPIToken = process.env.SLACK_API_TOKEN;

function getRandom10() {
  return getRandomInt(1, 5) * 10; // Returns 10, 20, 30, 40 or 50
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

var options = {
  "method": "GET",
  "hostname": "www.googleapis.com",
  "port": null,
  "path": "/customsearch/v1?key="+googleAPIKey+"&cx=009421135350921084563%3Ahdlpyyjslg0&q=unicorns&searchType=image&safe=high&start=" + getRandom10(1,100000),
  "headers": {
    "cache-control": "no-cache"
  }
};

let now = new Date();
let ddbKey = now.getDate() +'/'+ now.getMonth() +'/'+ now.getFullYear()+"wes";



function getSlackUserProfile(userId,callback) {

	var http = require("https");

	var options = {
	  "method": "GET",
	  "hostname": "slack.com",
	  "port": null,
	  "path": "/api/users.info?token="+slackAPIToken+"&user="+userId,
	  "headers": {
	    "content-type": "application/x-www-form-urlencoded",
	    "cache-control": "no-cache",
	    "postman-token": "2e1d003d-27ac-1955-8417-1cbaa7408f65"
	  }
	};

	var req = http.request(options, function (res) {
	  var chunks = [];

	  res.on("data", function (chunk) {
	    chunks.push(chunk);
	  });

	  res.on("end", function () {
	    var resp = JSON.parse(Buffer.concat(chunks));
	    //console.log(resp);
	    let ret = {image: resp.user.profile.image_original, name: resp.user.name, id: `<@${resp.user.id}|${resp.user.name}>`};
	    callback(null,ret);
	  });
	});

	req.end();

}

function response(event,unicorn,callback){
	let ninjaId = event.text.match(/([A-Z0-9]{8,10})/)[0];
	//console.log(ninjaId);
   	getSlackUserProfile(ninjaId,function(err,data){
   		let ninja = data;
   		getSlackUserProfile(event.victimId,function(err,data){
   			let victim = data;
   			var resp = finalResponse(unicorn,victim,ninja)
   			callback(null,resp);
   		})
   	})
}

function finalResponse(unicorn,victim,ninja){
	var resp = {
		"response_type": "in_channel",
	    "attachments": [
	        {
	            "fallback": `${victim.id} was just mercilessly Unicorned.`,
	            "color": "#36a64f",
	            "pretext": `${victim.id} was just mercilessly Unicorned by ${ninja.id}`,
	            "author_name": ninja.name,
	            "author_icon": ninja.image,
	            "image_url": unicorn
	        }
	    ]
	}
	return resp;
}


exports.handler = (event,context,callback) => {
 lambdaRet = callback;
 var params = {
  Key: {
   "date": {
     S: ddbKey
    }
  }, 
  TableName: "unicorn-security"
 };
 dynamodb.getItem(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else {
   	int = getRandomInt(0,10)
   	if ( typeof data.Item == 'undefined' ){
   		console.log("There is no Entry");



   		// Start Add Item

   		  	var req = http.request(options, function (res) {
		   	var chunks = [];

			  res.on("data", function (chunk) {
			    chunks.push(chunk);
			  });

			  res.on("end", function () {
			    var body = Buffer.concat(chunks);
			    let res = JSON.parse(body.toString())

			    let unicorns = {};
			    unicorns.Item = {};
			    console.log(`There is ${res.items.length} results in this Request`);


			    for (i=0; i < res.items.length; i++){
			    	unicorns.Item[`un${i}`] = {S: res.items[i].link};
			    }

			    unicorns.Item[`date`] = {S: ddbKey};
			    unicorns.TableName = 'unicorn-security';

			    dynamodb.putItem(unicorns, function(err, data) {
				   if (err) console.log(err, err.stack); // an error occurred
				   else {

				   	response(event,unicorns.Item[`un${int}`].S,lambdaRet);
					 	
				   }
				});
			  });
			});

			req.end();

   		// End Add Item

   	} else { 
   		response(event,data.Item[`un${int}`].S,lambdaRet);
   	}
   } 
})

}

/* For Testin
event = {"text":"<@sdsd|sdsd>","victimId": "sdsd", "victimName": "sdsd"}
exports.handler(event,null,function(err,data){
	console.log(data);
});
*/