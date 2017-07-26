import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from "path";
import * as fs from "fs";
import * as busboy from "connect-busboy";
import * as cluster from 'cluster';
import * as os from 'os';

if (cluster.isMaster) {
    let workers = 0;
    const workerObj = {};
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/test',
        agent: false
    }

    os.cpus().forEach(() => {
        cluster.fork();
    })

	Object.keys(cluster.workers).forEach(function(id) {
		cluster.workers[id].on('message', function(pid) {
			workerObj['process id:  ' + pid] += 1;
		});
	})
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
    });

    cluster.on('listening', function (worker, address) {
        workerObj['process id:  ' + worker.process.pid] = 0;
        console.log('worker process id: ' + worker.process.pid);
    });

    cluster.on('exit', function (worker, code, signal) {
        console.log('worker: ' + worker.process.pid + ' died');
    });

    cluster.on('online', function (worker) {
        workers += 1;
        if (workers === os.cpus().length) {
            setTimeout(function () {
                var totalReq = 1000;
                var selfReq = require('./req');
                console.log('requesting');
                selfReq(options, totalReq, function () {
                    console.log('req end');
                    console.log('waiting for result...');
                    setTimeout(function () {
                        console.log(workerObj);
                    }, 500);
                });
            }, 2500);
        }
    });



} else {
    let app: express.Express = express();
    let router: express.Router = express.Router();
    app.use(busboy());
    app.use(express.static('./build'));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(router);
    router.get('/test', (req: express.Request, res: express.Response, next: express.NextFunction) => {
        process.send(process.pid);
        res.send('test');
    })
    router.post('/file', async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        req.pipe(req['busboy']);
        req['busboy'].on('file', (fieldname, file, filename) => {
            var saveTo = path.join(__dirname, 'static', path.basename(filename));
            file.pipe(fs.createWriteStream(saveTo));
        });
        req['busboy'].on('finish', () => {
            console.log('Done parsing form!');
            res.writeHead(200, { Connection: 'close', Location: '/' });
            res.end();
        });
    })
    app.listen(3000);
}