#!/usr/bin/env node

var path = require('path');
var exec = require('child_process').exec;
var cmd = path.resolve(process.cwd(), './node_modules/.bin/electron');
var files = process.argv.slice(2).join(' ');

var child = exec(cmd + ' ' + __dirname + '/index.js ' + files);
child.stdout.on('data', function(data) {
    console.log(data); 
});