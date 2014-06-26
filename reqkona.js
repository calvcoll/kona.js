var request = require('request');
var querystring = require('querystring')
var fs = require('fs');

var opts = require('nomnom')
	.script('konajs')
	.option('debug', {
		abbr: 'd',
		flag: true,
		help: 'Prints debugging info'
	})
	.option('version', {
		flag: true,
		help: 'Prints version of konajs',
		callback: function() {
			return "Version 0.1";
		}
	})
	.option('sfw', {
		abbr: 's',
		flag: true,
		default: false,
		metavar: 'BOOLEAN',
		help: 'Prevents NSFW pictures'
	})
	.option('time', {
		abbr: 't',
		default: 300,
		flag: true,
		metavar: 'SECONDS',
		help: 'The seconds between wallpaper changes'
	})
	.parse();

hosts = ["http://konachan.com","http://yande.re"];

host = hosts[Math.floor(Math.random() * 2)];

sfw = opts.sfw
if (opts.debug) console.log("sfw?: " + sfw)
time = opts.time
if (opts.debug) console.log("time: " + time)


console.log("Host: " + host)

request(host + "/post.json?limit=1", function(error, response, body){

	if (!error && response.statusCode == 200) {
		json = JSON.parse(body)[0]
		if (opts.debug) console.log(json)
		file_url = json.file_url
		if (opts.debug) console.log(file_url)
		if (file_url != undefined) {
			console.log("Downloading " + file_url)
			var file_name = querystring.unescape(file_url.split('/')[file_url.split('/').length - 1])
			console.log("File name is :" + file_name)
			request(file_url).pipe(fs.createWriteStream(file_name))
		}
	}

});
