let glob = global.require('glob');
let path = global.require('path');
let chokidar = global.require('chokidar');

export function getQuery () {
    let query = {};
    let queryString = window.location.href.split('?')[1];
    let variables = queryString.split('&');

    variables.forEach((variable => {
        let parts = variable.split('=');
        query[parts[0]] = parts[1];
    }));

    return query; 
}

export function getTestFiles (pattern) {
    return glob(pattern, {
        cwd: process.cwd(),
        sync: true,
        nodir: true,
        ignore: ['node_modules/**']
    }).map(file => {
        return path.resolve(process.cwd(), file);
    });
}

export function startWatcher (callback) {
    let watcher = chokidar.watch(process.cwd(), {
        ignored: /\.git|node_modules|bower_components/
    });

    watcher.on('change', callback);
}