const Watcher = (function () {
    let chokidar = require('chokidar');
    let _watcher = chokidar.watch(process.cwd(), {
        ignored: /\.git|node_modules|bower_components/
    });

    return {
        init () {},

        on (event, callback) {
            _watcher.on(event, callback);
        }
    }
})();