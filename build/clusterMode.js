var cluster = require('cluster');
var http = require('http');
var cpus = require('os').cpus().length;

if (cluster.isMaster) {
	var workers = 0;
	var workerObj = {};
	var options = {
		hostname: 'localhost',
		port: 3050,
		path: '/',
		agent: false
	}

	console.log('master process start up...');
	for (var i = 0; i < cpus; i++) {
		cluster.fork();
	}

	Object.keys(cluster.workers).forEach(function(id) {
		cluster.workers[id].on('message', function(pid) {
			workerObj['process id:  ' + pid] += 1;
		});
	})

	cluster.on('listening', function(worker, address) {
		workerObj['process id:  ' + worker.process.pid] = 0;
		console.log('worker process id: ' + worker.process.pid);
	});

	cluster.on('exit', function(worker, code, signal) {
		console.log('worker: ' + worker.process.pid + ' died');
	});

	cluster.on('online', function(worker) {
		workers +=1;
		if (workers === cpus) {
			setTimeout(function() {
				var totalReq = 100;
				var selfReq = require('./req');
		    console.log('requesting');
		    selfReq(options, totalReq, function() {
		    	console.log('req end');
		    	console.log('waiting for result...');
		    	setTimeout(function() {
		    		console.log(workerObj);
		    	}, 2500);
		    });
			}, 2000);
		}
	});
} else {
	var server = http.createServer(function(req, res) {
		process.send(process.pid);
		res.end();
	});

	server.listen(3050);
}