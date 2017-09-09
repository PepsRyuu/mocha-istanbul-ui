#!/usr/bin/env node

var path = require('path');
var exec = require('child_process').exec;
var cmd = path.resolve(process.cwd(), './node_modules/.bin/electron');
var args = process.argv.slice(2).map(s => '"' + s + '"').join(' ');

var child = exec(cmd + ' ' + __dirname + '/index.js ' + args);
child.stdout.on('data', function(data) {
    process.stdout.write(data);
});