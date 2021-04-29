export default function (opts) {
    let glob = global.require('glob');
    let path = global.require('path');
    let Mocha = global.require('mocha');

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
        runner.on('suite', (suite) => {
            window.onMochaEvent('suite', {
                title: suite.title
            });
        });

        runner.on('suite end', () => {
            window.onMochaEvent('suite end');
        });

        runner.on('pending', (test) => {
            window.onMochaEvent('pending', {
                title: test.title,
                state: 'pending'
            });
        });

        runner.on('pass', (test) => {
            window.onMochaEvent('pass', {
                title: test.title,
                state: test.state,
                duration: test.duration
            });
        });

        runner.on('fail', (test, err) => {
            window.onMochaEvent('fail', {
                title: test.title,
                state: test.state,
                duration: test.duration,
                error: err.stack
            });

        });
    }

    let mocha = new Mocha({ ui: 'bdd', reporter: Reporter });
    mocha.suite.emit('pre-require', global, '', mocha);
    mocha.cleanReferencesAfterRun(false);

    let __beforeEachCbs = [];
    let __afterEachCbs = [];
    let __files = opts.files;
    let isRunning = false;

    window.__miui_testrunner = {
        grep: function(pattern) {
            mocha.grep(pattern.replace(/(\(|\))/g, '\\$1'));
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
                    return acc.concat(getTestFiles(val));
                }, []);

                mocha.run(() => {
                    isRunning = false;
                    window.onMochaEvent('done');
                });
            } catch (e) {
                isRunning = false;
                console.error(e);
                window.onMochaEvent('crash');
            }
        },

        __beforeEach: function (cb) {
            __beforeEachCbs.push(cb);
        },

        __afterEach: function (cb) {
            __afterEachCbs.push(cb);
        }
    }

    window.onMochaEvent('init');
}
