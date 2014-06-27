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
		flag: true,
		help: 'Prevents NSFW pictures'
	})
	.option('time', {
		abbr: 't',
		default: 300,
		flag: false,
		metavar: 'SECONDS',
		help: 'The seconds between wallpaper changes'
	})
	.option('test', {
		flag: true,
		help: "Runs through, but doesn't download"
	})
	.option('directory', {
		abbr: 'dir',
		default: './',
		flag: false,
		metavar: 'DIRECTORY',
		help: 'The directory to save files into'
	})
	.parse();

var silentlog = function(text) {
	json = false;
	if (typeof text != "string") {
		text = JSON.stringify(text);
		json = true;
	}
	fs.appendFile('./kona.log', text + "\n", function(error) {
		if (error) {
			console.log("Couldn't write to log!");
		}
	});	
}

var log = function(text) {
	json = false;
	if (typeof text != "string") {
		text = JSON.stringify(text);
		json = true;
	}
	fs.appendFile('./kona.log', text + "\n", function(error) {
		if (error) {
			console.log("Couldn't write to log!");
		}
		else {
			if (!json) console.log(text);
		}
	});
}

// TODO: Add better searches for sfw
sfw = opts.sfw
if (opts.debug) log("sfw?: " + sfw);
time = opts.time
if (opts.debug) log("time: " + time);
dir = opts.directory
if (opts.debug) log("directory: " + dir);
test = opts.test
if (opts.debug) log("test: " + test);

nsfw_tags = ['nsfw', 'nude', 'uncensored', 'pussy', 'anus', 'masturbation', 'penis', 'breasts'];

hosts = ["https://konachan.com","https://yande.re"];

log('App started.');
if (sfw) log('The tags to block nsfw material are not fully complete, send me any tags you believe should be added.')

var downloadImage = function(file_url) {
	log("Downloading " + file_url);
	var file_name = querystring.unescape(file_url.split('/')[file_url.split('/').length - 1]); //removes html escaped strings
	if (opts.debug) log("File name is :" + file_name);
	var path = dir + file_name;
	if (dir[dir.length - 1] != '/') {
		path = dir + '/' + file_name;
	}

	if (!test) {
		request(file_url).pipe(fs.createWriteStream(path).on('finish', function() {
			log("File saved.");
		}).on('error', function(error) {
			silentlog(error);
		}));
	}
}

var download = function() {
	host = hosts[Math.floor(Math.random() * 2)];
	log("Host: " + host);
	request(host + "/post.json?limit=100", function(error, response, body) {
		if (!error && response.statusCode == 200) {
			jsonlist = JSON.parse(body);
			log('json start')
			if (opts.debug) log(jsonlist);
			log('json end')
			for (iter = 0; iter < jsonlist.length; iter++) {
				json = jsonlist[iter];
				if (opts.debug) log(json);
				file_url = json.file_url;
				imagetags = json.tags;
				imageSFW = true;
				for (i=0; i<nsfw_tags.length; i++) {
					if (imagetags != undefined)
						if (imagetags.indexOf(nsfw_tags[i]) != -1) {
							imageSFW = false;
							break;
						}
					else {
						log("Couldn't find tags.")
					}
				}
				if (opts.debug) log(file_url);

				if (file_url != undefined && imagetags != undefined) {
					if (sfw && imageSFW) downloadImage(file_url);
					else if (!sfw) downloadImage(file_url);
					else log('Image is not sfw according to tags.');
				}
			}
		}
		else {
			log("Couldn't retrieve a valid url.");
		}
	}).on('end', function() {
		if (opts.debug) log('call ended');
	}).on('error', function(error) {
		silentlog(error)
	});
}

var start = function() {
	download();
	setInterval(download, time * 1000);
}

start();