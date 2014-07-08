var request = require('request');
var stream_throttler = require('stream-throttle');

var querystring = require('querystring');
var fs = require('fs');

var opts = require('nomnom')
	.script('konajs') 										// Sets the name in help
	.option('debug', {										// Sets xyz option
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
	.option('nsfw', {
		abbr: 'n',
		flag: true,
		help: 'NSFW pictures are allowed with this flag'
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
	.option('host', {
		flag: false,
		help: 'The host to use. (has to be danbooru based)'
	})
	.option('throttle', {
		flag: false,
		default: -1,
		help: 'Throttles the download speed of the program, this has to be higher than 0.',
		metavar: 'kb/s',
	})
	.option('jpeg', {
		abbr: 'j',
		flag: true,
		help: 'When flagged, this will download a jpeg file instead of a png'
	})
	.option('test', {
		flag: true,
		help: "Runs through, but doesn't download"
	})
	.option('directory', {
		abbr: 'd',
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
			console.log("Couldn't write to log file!");
		}
	});
}

var log = function(text) {
	json = false;
	if (typeof text != "string") {
		text = JSON.stringify(text);
		json = true;
	}
	if (!json) console.log(text);
	fs.appendFile('./kona.log', text + "\n", function(error) {
		if (error) {
			console.log("Couldn't write to log file!");
		}
	});
}

var hosts = ['https://konachan.com','https://yande.re'];
var nsfw_tags = ['nsfw', 'nude', 'uncensored', 'pussy', 'anus', 'masturbation', 'penis', 'breasts', 'no_bra', 'no_pan', 'nipples'];
var url_nsfw_tags = nsfw_tags.slice(5, nsfw_tags.length - 1);

// TODO: Add better searches for sfw
var sfw = !opts.nsfw;
if (opts.debug) log("sfw?: " + sfw);

var time = opts.time;
if (opts.debug) log("time: " + time);

var test = opts.test;
if (test == undefined) test = false;
if (opts.debug) log("test: " + test);
if (test) log("This is a test, so you will not download the file.");

var limit = opts.limit;
if (opts.debug) log("limit: " + limit);

var host = opts.host;
if (opts.debug) log("host_to_use: " + host);

var jpeg = opts.jpeg;
if (jpeg == undefined) jpeg = false;
if (opts.debug) log("jpeg: " + jpeg);
var throttle_speed = opts.throttle;
if (opts.debug) log("throttling_speed: " + throttle_speed);
var is_throttled = false;
if (throttle_speed > 0) is_throttled = true;
else if (throttle_speed != -1) {
	log('You gave an incorrect speed to throttle by.');
	log('Enter a value higher than 0.');
	process.exit(1);
}
if (opts.debug) log("is_throttled: " + is_throttled);
if (is_throttled) {
	var throttler = new stream_throttler.ThrottleGroup({rate:limit})
}

if (host != undefined) {
	var host_on_list = false;
	for (i=0; i<hosts.length; i++) {
		if (host == hosts[i]) {
			host_on_list = true;
			break;
		}
	}
	if (!host_on_list) {
		log('Host supplied isn\'t on the list, sorry.');
		log('If you think this is supplied in error, open an issue with the host url specified.');
		process.exit(1);
	}
}

var init = function() {
	log('App started.');
	if (sfw) log('The tags to block nsfw material are not fully complete, send me any tags you believe should be added.')
	images_downloaded = 0;
	process.setMaxListeners(0); //unlimited listeners

	start();
}

var dir = opts.directory
if (opts.debug) log("directory: " + dir);
fs.exists(dir, function(exists) {
	if (exists) {
		fs.stat(dir, function(err,stats) {
			if (stats.isFile()) {
				log('Directory supplied is a file, this could cause problems.');
				process.exit(1);
			}
			else if (!err) {
				init();
			}
		});
	}
	else {
		log('Directory doesn\'t exist, it shall be created.');
		fs.mkdir(dir,init);
		log('Directory created.');
	}
});

var onRequestFinish = function() {
	log("Images downloaded & saved.");
	images_downloaded += 1;
	if (images_downloaded % limit == 0) {
		log('All pictures downloaded.')
	}
}

var onRequestError = function(error) {
	log('Streaming error.')
	silentlog('Stream error: ' + error)
	images_downloaded += 1;
	if (images_downloaded % limit == 0) {
		log('All pictures downloaded.')
	}
}

var downloadImage = function(file_url) {
	log("Downloading " + file_url);
	var file_name = file_url.split('/')[file_url.split('/').length - 1]; //querystring.unescape(); //removes html escaped strings
	if (opts.debug) log("File name is: " + file_name);
	var path = dir + file_name;
	if (dir[dir.length - 1] != '/') {
		path = dir + '/' + file_name;
	}

	if (opts.debug && !test) log('path: ' + path)

	if (!test) {
		if (!is_throttled) request(file_url).pipe(fs.createWriteStream(path)).on('finish', onRequestFinish).on('error', onRequestError);
		else if (throttle_speed > 0) request(file_url).pipe(throttler.throttle).pipe(fs.createWriteStream(path)).on('finish', onRequestFinish).on('error', onRequestError);
	}
}

var download = function() {
	if (host == undefined) host = hosts[Math.floor(Math.random() * 2)];
	log("Host: " + host);
	var url = host + '/post.json?limit=' + limit;
	if (sfw) {
		url += '&tags=-' + url_nsfw_tags.join('+-')
	}
	log("url:" + url);
	request(url, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			jsonlist = JSON.parse(body);
			for (iter = 0; iter < jsonlist.length; iter++) {
				var json = jsonlist[iter];
				if (opts.debug && opts.json) log(json)
				var file_url = json.file_url;
				if (jpeg) file_url = json.jpeg_url;
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
	})
}

var start = function() {
	download();
	setInterval(download, time * 1000);
}
