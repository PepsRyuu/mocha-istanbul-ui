export default function (opts) {
    let glob = global.require('glob');
    let path = global.require('path');
    let app_process = global.require('electron').remote.app;

    function loadResource (url) {
        return new Promise(resolve => {
            let tag;
            if (url.endsWith('.css')) {
                tag = document.createElement('link');
                tag.setAttribute('type', 'text/css');
                tag.setAttribute('rel', 'stylesheet');
                tag.setAttribute('href', url + '?' + Date.now());
            }

            if (url.endsWith('.js')) {
                tag = document.createElement('script');
                tag.setAttribute('src', url + '?' + Date.now());
            }

            tag.setAttribute('data-miui-controlled', 'true');
            tag.onload = resolve;
            document.head.appendChild(tag);
        });
    }

    function getTestFiles (pattern) {
        return glob(pattern, {
            cwd: process.cwd(),
            sync: true,
            nodir: true,
            ignore: ['node_modules/**']
        }).map(file => {
            return path.resolve(process.cwd(), file);
        });
    }

    function Reporter (runner) {
        let indentation = 0;
        let indent = () => Array(indentation).join(' ');
        let stdout = (msg) => opts.console && app_process.console.log(msg);
        let stderr = (msg) => stdout(`\x1b[31m${msg}\x1b[0m`);

        runner.on('start', () => {
            stdout(' ');
        });

        runner.on('suite', suite => {
            indentation++;
            stdout(indent() + suite.title);
            window.parent.__miui__.publish('suite', {
                title: suite.title
            });
        });

        runner.on('suite end', () => {
            indentation--;
            if (indentation === 1) {
                stdout(' ');
            }

            window.parent.__miui__.publish('suite end');
        });

        runner.on('pending', (test) => {
            window.parent.__miui__.publish('pending', {
                title: test.title,
                state: 'pending'
            });
            stdout(indent() + ' - ' + test.title);
        });

        runner.on('pass', (test) => {
            window.parent.__miui__.publish('pass', {
                title: test.title,
                state: test.state,
                duration: test.duration
            });
            stdout(indent() + '\\x1b[32m ✓ \\x1b[0m' + test.title);
        });

        runner.on('fail', (test, err) => {
            window.parent.__miui__.publish('fail', {
                title: test.title,
                state: test.state,
                duration: test.duration,
                error: err.stack
            });

            stderr(indent() + ' ✖ ' + test.title);
            stderr(err.stack.split('\\n').map(s => indent() + '       ' + s).join('\\n'));
        });
    }

    let mocha = new (global.require('mocha'))({
        ui: 'bdd', 
        reporter: Reporter
    });

    mocha.suite.emit('pre-require', global, '', mocha);

    let __beforeEachCbs = [];
    let __afterEachCbs = [];
    let __files = [];
    let isRunning = false;

    window.__miui_testrunner = {
        grep: function(pattern) {
            mocha.grep(pattern);
        },

        clear: function () {
            mocha.suite.suites = [];
            mocha.suite._beforeEach = [];
            mocha.suite._afterEach = [];

            [].forEach.call(document.querySelectorAll('[data-miui-controlled]'), el => el.remove());

            for (let file in global.require.cache) {
                if (!file.indexOf('node_modules') > -1) {
                    delete global.require.cache[file];
                }
            }
        },

        run: async function() {
            isRunning = true;

            __beforeEachCbs.forEach(cb => {
                beforeEach(cb);
            });

            __afterEachCbs.forEach(cb => {
                afterEach(cb);
            });

            try {
                let http_files = __files.filter(f => f.indexOf('://') > 0);
                let req_files = __files.filter(f => f.indexOf('://') === -1);

                for (let i = 0; i < http_files.length; i++) {
                    await loadResource(http_files[i]);
                }

                mocha.files = req_files.reduce((acc, val) => {
                    acc = acc.concat(getTestFiles(val));
                    return acc;
                }, []);

                mocha.run(() => {
                    window.parent.__miui__.publish('done');
                    isRunning = false;
                });
            } catch (e) {
                isRunning = false;
                console.error(e);
                window.parent.__miui__.publish('crash');
            }
        },

        __beforeEach: function (cb) {
            __beforeEachCbs.push(cb);
        },

        __afterEach: function (cb) {
            __afterEachCbs.push(cb);
        }
    }

    window.miui = {
        clear: function () {
            if (isRunning) {
                return;
            }

            window.parent.__miui__.publish('reset');
            window.__miui_testrunner.clear();
        },

        run: function () {
            if (isRunning) {
                return;
            }

            window.parent.__miui__.publish('reset'); // for statsReset
            window.__miui_testrunner.run();
        },

        files: function (files) {
            __files = files;
        }
    }

    window.miui.files(opts.files);
    window.parent.__miui__.publish('init');
}
