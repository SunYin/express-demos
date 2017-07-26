import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from "path";
import * as fs from "fs";
import * as busboy from "connect-busboy";
import * as cluster from 'cluster';
import * as os from 'os';

let app: express.Express = express();
let router: express.Router = express.Router();
app.use(busboy());
app.use(express.static('./build'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(router);
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