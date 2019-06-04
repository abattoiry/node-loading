const readline = require('readline');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

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

function loading(self) {
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

Progress.prototype = {
	start: function (main) {
		const self = this;
		if (!main) {
			loading(self);
		} else {
			if (cluster.isMaster) { // 主线程
				const workings = Object.keys(cluster.workers);
				if (workings.length < numCPUs) {
					worker = cluster.fork();
				}
				if (main) {
					main();
				}
			} else { // 子线程
				process.on('message', (msg) => {
					if (msg === 'shutdown') {
						clearInterval(self.loading);
					}
				});
				loading(self);
			}
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
		clearInterval(this.loading);
		if (!worker) {
			return;
		}
		worker.send('shutdown');
		try {
			worker.disconnect();
		} catch (err) {
			console.log(err);
		}
	}
}

module.exports.get = function () {
	return Progress;
}
