#!/usr/bin/env node

var path = require('path');
var exec = require('child_process').exec;
var cmd = 'node ' + path.dirname(require.resolve('electron')) + '/cli.js';

var args = process.argv.slice(2);

// This is a workaround for a crash in electron.exe, where it doesn't like
// flags appearing after a URL. We simply just push them higher up the flag list.
args.sort(function (a, b) {
    if (a === '--once' || a === '--console') {
        return -1;
    } else {
        return 0;
    }
});

var child = exec(cmd + ' ' + __dirname + '/index.js ' + args.map(function (s) {
    return '"' + s + '"';   
}).join(' '));

child.stdout.on('data', function(data) {
    process.stdout.write(data);
});

child.on('exit', function (code) {
    process.exit(code);
});