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
	.option('limit', {
		abbr: 'l',
		default: 1,
		flag: false,
		metavar: 'PICTURES',
		help: 'The amount of pictures to be downloaded at once'
	})
	.option('json', {
		flag: true,
		help: 'Whether or not to print json out under debug'
	})
	.option('test', {
		flag: true,
		help: "Runs through, but doesn't download"
	})
	.option('directory', { // no abbr since it seems to break it
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
var sfw = opts.sfw
if (opts.debug) log("sfw?: " + sfw);

var time = opts.time
if (opts.debug) log("time: " + time);

var dir = opts.directory
if (opts.debug) log("directory: " + dir);
if (fs.existsSync(dir)) {
	fs.statSync(dir, function(err, stats) {
		if (stats.isFile()) {
			log('Directory supplied is a file, this could cause problems.');
			process.exit(1);
		}
	});
}
else {
	log('Directory doesn\'t exist, it shall be created.');
	fs.mkdirSync(dir);
	log('Directory created.');
}

var test = opts.test
if (opts.debug) log("test: " + test);

var limit = opts.limit
if (opts.debug) log("limit: " + limit)

nsfw_tags = ['nsfw', 'nude', 'uncensored', 'pussy', 'anus', 'masturbation', 'penis', 'breasts', 'no_bra', 'no_pan', 'nipples'];

hosts = ["https://konachan.com","https://yande.re"];

log('App started.');
if (sfw) log('The tags to block nsfw material are not fully complete, send me any tags you believe should be added.')
images_downloaded = 0;

var downloadImage = function(file_url) {
	log("Downloading " + file_url);
	var file_name = querystring.unescape(file_url.split('/')[file_url.split('/').length - 1]); //removes html escaped strings
	if (opts.debug) log("File name is: " + file_name);
	var path = dir + file_name;
	if (dir[dir.length - 1] != '/') {
		path = dir + '/' + file_name;
	}

	if (opts.debug && !test) log('path: ' + path)

	if (!test) {
		request(file_url).pipe(fs.createWriteStream(path).on('finish', function() {
			log("File saved.");
			images_downloaded += 1;
			if (images_downloaded % limit == 0) {
				log('All pictures downloaded.')
			}
		}).on('error', function(error) {
			log('File saving error. :(')
			silentlog('Saving error: ' + error);
		})).on('error', function(error) {
			log('Possible streaming error.')
			silentlog('Stream error: ' + error)
		}).setMaxListeners(100);
	}
}

var download = function() {
	host = hosts[Math.floor(Math.random() * 2)];
	log("Host: " + host);
	request(host + "/post.json?limit=" + limit, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			jsonlist = JSON.parse(body);
			for (iter = 0; iter < jsonlist.length; iter++) {
				var json = jsonlist[iter];
				if (opts.debug && opts.json) log(json)
				var file_url = json.file_url;
				var file_tags = json.tags;
				log('File tags: ' + file_tags);

				var image_sfw = true;
				nsfw_tags.forEach(function(element,index,array){
					if (file_tags.indexOf(element) != -1) image_sfw = false;
				});

				if (opts.debug) log(file_url);

				if (file_url != undefined ) {
					if (sfw && image_sfw) downloadImage(file_url);
					else if (!sfw) downloadImage(file_url);
					else if (sfw && !image_sfw) {
						log('Image ' + file_url + ' is not sfw according to tags. \n These tags are: ' + file_tags);
						images_downloaded += 1
					}
					// downloadImage(file_url);
				}
			}
		}
		else {
			log("Couldn't retrieve a valid url.");
		}
	}).on('end', function() {
		if (opts.debug) log('call ended');
	}).on('error', function(error) {
		silentlog('Fetching error: ' + error)
	}).setMaxListeners(100);
}

var start = function() {
	download();
	setInterval(download, time * 1000);
}

start();
