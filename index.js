const readline = require('readline');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (numCPUs < 2) {
	console.log('不支持');
	return;
}

let worker;

var Progress = function () {
	this.stream = process.stderr;
	this.line = readline;
	this.loading;
	this.index = 0;
	this.progressMessage = 'Loading';
	this.pieces = [
		'- ' + this.progressMessage + '.',
		'\\ ' + this.progressMessage + '..',
		'| ' + this.progressMessage + '...',
		'/ ' + this.progressMessage + '....'
	];

	this.longWaitMessage = false;
	this.timeSpent = 0;
}

Progress.prototype = {
	start: function (main) {
		const self = this;
		if (cluster.isMaster) { // 主线程
			const workings = Object.keys(cluster.workers);
			if (workings.length < numCPUs) {
				worker = cluster.fork();
			}
			main();
		} else { // 子线程
			process.on('message', (msg) => {
				if (msg === 'shutdown') {
					clearInterval(self.loading);
				}
			});
			self.loading = setInterval(() => {
				if (self.longWaitMessage && self.timeSpent % 25 == 0) {
					readline.clearLine(process.stdout, 0)
					self.stream.write(self.longWaitMessage + '\n');
				}

				readline.clearLine(process.stdout, 0)
				self.stream.write(self.pieces[self.index++]);
				readline.cursorTo(process.stdout, 0, null)

				if (self.index > 3) {
					self.index = 0;
				}
				self.timeSpent += 1;
			}, 150);
		}
	},

	setLongWaitMessage: function (message) {
		this.longWaitMessage = message;
	},

	setProgressMessage: function (message) {
		this.progressMessage = message;
	},

	finish: function () {
		this.line.clearLine();
		this.timeSpent = 0;
		worker.send('shutdown');
		worker.disconnect();
	}
}

module.exports.get = function () {
	return Progress;
}
