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
	.option('page', {
		flag: false,
		default: -1,
		abbr: 'p',
		help: 'Sets the page',
		metavar: 'PAGE'
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

  module.exports = {
    opts : opts
  }
