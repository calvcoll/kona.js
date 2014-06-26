var request = require('request');
var querystring = require('querystring')
var fs = require('fs');

var opts = require('nomnom')
	.script('konajs') 										// Sets the name in help
	.option('debug', {										// Sets xyz option
		abbr: 'd',													// sets abbrievated command
		flag: true,													// Whether it's a flag and doesn't swallow the next value
		help: 'Prints debugging info'				// User readable info on the command
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
		flag: false,
		default: false,
		metavar: 'BOOLEAN',
		help: 'Prevents NSFW pictures'
	})
	.option('time', {
		abbr: 't',
		default: 300,
		flag: false,
		metavar: 'SECONDS',
		help: 'The seconds between wallpaper changes'
	})
	.option('directory', {
		abbr: 'dir',
		default: './',
		flag: false,
		metavar: 'DIRECTORY',
		help: 'The directory to save files into'
	})
	.parse();


// TODO: Add this!
sfw = opts.sfw
if (opts.debug) console.log("sfw?: " + sfw)
// END TODO
time = opts.time
if (opts.debug) console.log("time: " + time)
dir = opts.directory
if (opts.debug) console.log("directory: " + dir)

hosts = ["http://konachan.com","http://yande.re"];

var download = function() {
	host = hosts[Math.floor(Math.random() * 2)];

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
				if (opts.debug) console.log("File name is :" + file_name)
				var path = dir + file_name
				if (dir[dir.length - 1] != '/') {
					path = dir + '/' + file_name
				}
				request(file_url).pipe(fs.createWriteStream(path))
				console.log("File saved.")
			}
		}

	});
}
download();
setInterval(download, time * 1000);
