var request = require('request');
var stream_throttler = require('stream-throttle');
var colors = require('colors');

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
			return "Version 0.5";
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
	.option('tags', {
		flag: false,
		help: 'Tags to use, separated by a comma (and surrounded with \'\' or otherwise it will not work).',
		metavar: '\'TAG,TAG,TAG\' or TAG'
	})
	.option('width', {
		flag: false,
		help: 'The minimum width of the images to request',
		metavar: 'pixels'
	})
	.option('height', {
		flag: false,
		help: 'The minimum height of the images to request',
		metavar: 'pixels'
	})
	.option('repeat', {
		flag: true,
		default: false,
		help: 'Sets program to repeat downloading files, after the one try.'
	})
	.option('data_cap', {
		flag: false,
		default: -1,
		abbr: 'c',
		help: 'Sets the data-cap of the application',
		metavar: 'KB'
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

colors.setTheme({
	warn: 'yellow',
	error: 'red',
	debug: 'cyan',
	info: 'green',
	data: 'white'
})

var log_path = 'kona.log';
fs.exists(log_path, function(exists) {
	if (!exists) {
		console.log('Log file doesn\'t exist, it shall be created.'.info);
		fs.openSync(log_path,'w');
		log('Log file created.', 'info');
	}
});

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

/**var silentlog = function(text,something) {
	console.log('Note to dev: You forgot this doesn`t have a second parameter.'.error);
	silentlog(text);
}*/

var log = function(text) {
	json = false;
	if (typeof text != "string") {
		text = JSON.stringify(text);
		json = true;
	}
	if (!json) console.log(text);
	fs.appendFile('./kona.log', text + "\n", function(error) {
		if (error) {
			console.log("Couldn't write to log file!".error);
		}
	});
}

var log = function(text, color) {
	json = false;
	if (typeof text != "string") {
		text = JSON.stringify(text);
		json = true;
	}
	if (!json) {
		if (color == 'warn') console.log(text.warn);
		if (color == 'error') console.log(text.error);
		if (color == 'debug') console.log(text.debug);
		if (color == 'info') console.log(text.info);
		if (color == 'data') console.log(text.data);
	}
	fs.appendFile('./kona.log', text + "\n", function(error) {
		if (error) {
			console.log("Couldn't write to log file!".error);
		}
	});
}

var hosts = ['http://konachan.com','https://yande.re'];

var sfw = !opts.nsfw;
if (opts.debug) log("sfw?: " + sfw, 'debug');

var time = opts.time;
if (opts.debug) log("time: " + time, 'debug');

var test = opts.test;
if (test == undefined) test = false;
if (opts.debug) log("test: " + test, 'debug');
if (test) log("This is a test, so you will not download the file.");

var limit = opts.limit;
if (opts.debug) log("limit: " + limit, 'debug');

var host = opts.host;
if (opts.debug) log("host_to_use: " + host, 'debug');

var tags = opts.tags;
if (opts.debug) log("tags: " + tags, 'debug');

var width = opts.width;
if (opts.debug) log('width: ' + width, 'debug');

var height = opts.height;
if (opts.debug) log('height: ' + height, 'debug');

var repeat = opts.repeat;
if (opts.debug) log('repeat: ' + repeat, 'debug');

var jpeg = opts.jpeg;
if (jpeg == undefined) jpeg = false;
if (opts.debug) log("jpeg: " + jpeg, 'debug');
var throttle_speed = opts.throttle;
if (opts.debug) log("throttling_speed: " + throttle_speed, 'debug');
var is_throttled = false;
if (throttle_speed > 0) is_throttled = true;
else if (throttle_speed != -1) {
	log('You gave an incorrect speed to throttle by.', 'error');
	log('Enter a value higher than 0.', 'info');
	process.exit(1);
}
if (opts.debug) log("is_throttled: " + is_throttled, 'debug');
if (is_throttled) {
	var throttler = new stream_throttler.ThrottleGroup({rate:limit})
}

var data_cap = opts.data_cap;
if (opts.debug) log('cap: ' + data_cap, 'debug');
var is_capped = false;
if (data_cap > 0) is_capped = true;
else if (data_cap != -1) {
	log('You have given an incorrect data limit to throttle by.', 'error');
	log('Enter a value higher than 0.', 'info');
	process.exit(1);
}
if (opts.debug) log('is_capped: ' + is_capped, 'debug');
if (is_capped) {
	var data_transferred = 0;
	var cap_reached = false;
}

var download_streams = [];

if (host != undefined) {
	var host_on_list = false;
	for (i=0; i<hosts.length; i++) {
		if (host == hosts[i]) {
			host_on_list = true;
			break;
		}
	}
	if (!host_on_list) {
		log('Host supplied isn\'t on the list, sorry.', 'error');
		log('If you think this is supplied in error, open an issue with the host url specified.', 'info');
		process.exit(1);
	}
}

var init = function() {
	log('App started.');
	if (sfw) log('The tags to block nsfw material are not fully complete, send me any tags you believe should be added.', 'info')
	images_downloaded = 0;
	process.setMaxListeners(0); //unlimited listeners

	start();
}

var dir = opts.directory
if (opts.debug) log("directory: " + dir, 'debug');
fs.exists(dir, function(exists) {
	if (exists) {
		fs.stat(dir, function(err,stats) {
			if (stats.isFile()) {
				log('Directory supplied is a file, this could cause problems.', 'error');
				process.exit(1);
			}
			else if (!err) {
				init();
			}
		});
	}
	else {
		log('Directory doesn\'t exist, it shall be created.', 'info');
		fs.mkdir(dir,init);
		log('Directory created.', 'info');
	}
});

var updateStreams = function(stream) {
	download_streams.splice(download_streams.indexOf(stream), 1);
	if (is_capped) {
		data_transferred += Math.ceil(stream.bytesWritten / 1024)
		if (data_transferred >= data_cap) {
			cap_reached = true;
		}
	}
	if (cap_reached) {
		log('Deleting the files that will exceed the data limit if downloaded.', 'error') //written as error to alert the user.
		if (download_streams.length > 0) {
			for (i=0; i<download_streams.length; i++) {
				var _stream = download_streams[i];
				var _stream_path = _stream.path;
				_stream.close();
				fs.exists(_stream_path, function(exists) {
					if (exists) {
						fs.unlink(_stream_path, function(err) {
							if (err) silentlog(err);
							else {
								path_split = _stream_path.split('/');
								file_name = path_split[path_split.length-1];
								log('Deleted: ' + file_name, 'info');
							}
						});
					}
				});
			}
			while (download_streams.length > 0) {
				download_streams.pop();
			}
		}
	}
}

var onRequestFinish = function(stream) {
	log("Image downloaded & saved.", 'info');
	images_downloaded += 1;
	if (images_downloaded % limit == 0) {
		log('All pictures downloaded.', 'info')
	}

	updateStreams(stream);
}

var onRequestError = function(error) {
	log('Streaming error.', 'error')
	silentlog('Stream error: ' + error)
	images_downloaded += 1;
	if (images_downloaded % limit == 0) {
		log('All pictures downloaded.', 'error')
	}
}

var downloadImage = function(file_url) {
	log("Downloading " + file_url);
	var file_name = file_url.split('/')[file_url.split('/').length - 1];
	if (opts.debug) log("File name is: " + file_name, 'debug');
	var path = dir + file_name;
	if (dir[dir.length - 1] != '/') {
		path = dir + '/' + file_name;
	}

	if (opts.debug && !test) log('path: ' + path, 'debug')

	if (!test && !cap_reached) {
		var write_stream = fs.createWriteStream(path)
		download_streams.push(write_stream);

		if (!is_throttled) request(file_url).pipe(write_stream).on('finish', function() {onRequestFinish(write_stream);}).on('error', onRequestError);
		else if (throttle_speed > 0) request(file_url).pipe(throttler.throttle()).pipe(write_stream).on('finish', function() {onRequestFinish(write_stream);}).on('error', onRequestError);
	}
}

var download = function() {
	if (host == undefined) host = hosts[Math.floor(Math.random() * 2)];
	log("Host: " + host, 'info');
	var url = host + '/post.json?limit=' + limit;
	if (tags || sfw || height || width) url += '&tags=';
	if (tags) {
		url += tags.replace(',', '+');
	}
	if (sfw) {
		if (tags) url += '%20rating:safe'
	}
	if (height || width) {
		if (height) url += '%20height:' + height + '..'
		if (width) url += '%20width:' + width + '..'
	}
	if (opts.debug) log("url:" + url, 'debug');

	request(url, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			jsonlist = JSON.parse(body);
			if (jsonlist != undefined) {
				for (iter = 0; iter < jsonlist.length; iter++) {
					var json = jsonlist[iter];
					if (opts.debug && opts.json) log('json: ' + json, 'debug')
					var file_url = json.file_url;
					if (jpeg) file_url = json.jpeg_url;
					var file_tags = json.tags;
					if (opts.debug) log('File tags: ' + file_tags, 'debug');

					if (opts.debug) log(file_url);

					if (file_url != undefined ) {
						downloadImage(file_url);
					}
				}
			}
			else { //if tags don't work this is usually thrown
				log('The tags have given no results, try different, or less tags.');
				process.exit(1);
			}
		}
		else if (error) { //error thrown from request
			log('Error occured fetching the list of images from ' + host, 'error');
			silentlog(error);
		}
		else { //status code should be the last thing that could be wrong.
			log("Got a different status code: " + response.statusCode, 'error');
		}
	}).on('end', function() {
		if (opts.debug) log('call ended', 'debug');
	}).on('error', function(error) {
		silentlog('Fetching error: ' + error)
	})
}

var start = function() {
	download();
	if (repeat)	setInterval(download, time * 1000);
}
