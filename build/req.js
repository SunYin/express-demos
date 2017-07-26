var http = require('http');

module.exports = function(options, totalReq, cb) {
  var finishReq = 0;
  for(var i = 0; i < totalReq; i ++) {
    (function(j) {
      http.get(options, function(res) {
        finishReq += 1;
        if (finishReq === totalReq && typeof cb === 'function') {
          cb();
        }
      }).on('error', function(e) {
        console.log('error: ',e);
      });
    })(i);
  }
}