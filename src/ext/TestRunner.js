let test_stats, parent_suites, active_suite, progress_callback, reset_callback, done_callback;

function setup (opts, callback) {
    progress_callback = opts.onTestProgress;
    reset_callback = opts.onTestReset;
    done_callback = opts.onTestDone;

    window.__miui__.subscribe((type, data) => {
        if (type === 'init') {
            callback();
        }

        if (type === 'suite') {
            let obj = { 
                title: data.title, 
                tests: [],
                suites: []
            };

            active_suite.suites.push(obj);
            parent_suites.push(active_suite);
            active_suite = obj;
            progress_callback(test_stats);
        }

        if (type === 'suite end') {
            active_suite = parent_suites.pop();
        }

        if (type === 'pass' || type === 'fail' || type === 'pending') {
            active_suite.tests.push(data);
            progress_callback(test_stats);
            test_stats[data.state]++;
        }

        if (type === 'reset') {
            statsReset();
            reset_callback();
        }

        if (type === 'done') {
            done_callback(test_stats.failed > 0? 1 : 0, test_stats);
        }

        if (type === 'crash') {
            done_callback(1, test_stats);
        }
    });

    window.__miui_iframe.contentDocument.write(`
        <script>
        (function () {
            global.require('mocha/mocha.js');
            let app_process = global.require('electron').remote.app;

            function Reporter (runner) {
                let indentation = 0;
                let indent = () => Array(indentation).join(' ');
                let stdout = (msg) => ${opts.console} && app_process.console.log(msg);
                let stderr = (msg) => stdout(\`\\x1b[31m\$\{msg\}\\x1b[0m\`);

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

            mocha.setup({ ui: 'bdd', reporter: Reporter });

            window.__miui_testrunner = {
                grep: function(pattern) {
                    this.reset();
                    mocha.grep(pattern);
                },

                reset: function () {
                    mocha.suite.suites = [];

                    for (let file in global.require.cache) {
                        if (!file.indexOf('node_modules') > -1) {
                            delete global.require.cache[file];
                        }
                    }
                },

                run: function(files) {
                    try {
                        files.forEach(global.require);
                        mocha.run(() => {
                            window.parent.__miui__.publish('done');
                        });
                    } catch (e) {
                        console.error(e);
                        window.parent.__miui__.publish('crash');
                    }
                }
            }

            window.miui = {
                reset: function () {
                    window.parent.__miui__.publish('reset');
                    window.__miui_testrunner.reset();
                },

                run: function () {
                    window.parent.__miui__.publish('reset'); // for statsReset
                    window.__miui_testrunner.run([]);
                }
            }

            window.parent.__miui__.publish('init');
        })();
        </script>
    `);
}

function statsReset () {
    test_stats = {
        passed: 0,
        failed: 0,
        pending: 0,
        suites: []
    };

    parent_suites = [];
    active_suite = test_stats;
}

export default class TestRunner {
    static setup (opts, callback) {
        setup(opts, callback);
    }

    static grep (pattern) {
        statsReset();
        window.__miui_iframe.contentWindow.__miui_testrunner.grep(pattern);
    }

    static reset () {
        statsReset();
        window.__miui_iframe.contentWindow.__miui_testrunner.reset();
    }

    static run (files) {
        this.reset();
        window.__miui_iframe.contentWindow.__miui_testrunner.run(files);
    }
}