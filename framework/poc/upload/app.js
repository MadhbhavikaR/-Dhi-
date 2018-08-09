const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

var express = require('express');
var app = express();
var fs = require('fs');
var server = http.createServer(app);
var archiver = require('archiver');
var zipFolder = require('zip-folder');

app.use(express.bodyParser());
app.post('/save', function(req, res) {
	var sourceDirName =  req.body.sourceDirName;
	var destDirName =  req.body.destDirName;
	zipFolder(sourceDirName, sourceDirName+'\\archive.zip', function(err) {
    if(err) {
        console.log('oh no!', err);
    } else {
        console.log('EXCELLENT');
		moveFile(sourceDirName+'\\archive.zip',destDirName);
		console.log('super');
    }
});
});

server.listen(3000, process.env.IP);
	
var moveFile = (file, dir2)=>{
  //include the fs, path modules
  var fs = require('fs');
  var path = require('path');

  //gets file name and adds it to dir2
  var f = path.basename(file);
  var dest = path.resolve(dir2, f);

  fs.rename(file, dest, (err)=>{
    if(err) console.log('oh no!', err);
    else console.log('Successfully moved');
  });
};	