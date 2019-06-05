let chokidar = global.require('chokidar');

export function getQuery () {
    let query = {};
    let queryString = window.location.href.split('?')[1];
    let variables = queryString.split('&');

    variables.forEach((variable => {
        let parts = variable.split('=');
        query[parts[0]] = parts[1];
    }));

    for (let key in query) {
        if (query[key] === 'undefined') {
            delete query[key];
        }

        if (query[key] === 'true' || query[key] === 'false') {
            query[key] = (query[key] === 'true');
        }
    }

    return query; 
}

export function startWatcher (callback) {
    let watcher = chokidar.watch(process.cwd(), {
        ignored: /\.git|node_modules|bower_components/
    });

    watcher.on('change', callback);
}