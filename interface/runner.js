const Runner = (function () {
    const glob = require('glob'); 
    const path = require('path');
    const fs = require('fs');
    const addHook = require('pirates').addHook;
    const istanbul = require('istanbul-lib-instrument');
    const minimatch = require('minimatch');                    
    const convertSourceMap = require('convert-source-map');
    const execSync = require('child_process').execSync;
    const remote = require('electron').remote;
    const app = remote.app;

    const filePatterns = window.location.href.match(/files=(.*?)(&|$)/)[1].split(',');
    const bootstrapFile = filePatterns.length > 1? filePatterns[0] : undefined;
    const testFiles = filePatterns.length > 1? filePatterns[1] : filePatterns[0];
    const node_modules_path = path.resolve(process.cwd(), 'node_modules');

    function stdout (message) {
        if (Utils.getFlags().includes('console')) {
            app.console.log(message);
        }
    }

    function stderr (message) {
        stdout('\x1b[31m' + message + '\x1b[0m');
    }

    const mochaStats = {
        passed: 0,
        failed: 0
    };

    function MultiReporter (runner) {
        let HTMLReporter = require('mocha/lib/reporters/html.js');
        new HTMLReporter(runner);

        let indentation = 0;
        let indent = () => {
            return Array(indentation).join(' ');
        };
  
        runner.on('start', () => {
            stdout(' ');
        });

        runner.on('suite', suite => {
            indentation++;
            stdout(indent() + suite.title);
        });

        runner.on('suite end', () => {
            indentation--;
            if (indentation === 1) {
                stdout(' ');
            }
        });

        runner.on('pending', test => {
            stdout(indent() + ' - ' + test.title);
        });

        runner.on('pass', test => {
            mochaStats.passed++;
            stdout(indent() + '\x1b[32m ✓ \x1b[0m' + test.title);
        });

        runner.on('fail', (test, err) => {
            mochaStats.failed++;
            stderr(indent() + ' ✖ ' + test.title);
            stderr(err.stack.split('\n').map(s => indent() + '       ' + s).join('\n'));
        });
    }

    return {
        init (callback) {
            // setup file
            setTimeout(() => {
                // Add mocha script and styles.
                let mochaPath = require.resolve('mocha');
                eval(fs.readFileSync(mochaPath.replace('index.js', 'mocha.js'), 'utf8'));

                let mochaStyle = document.createElement('style');
                mochaStyle.textContent = fs.readFileSync(mochaPath.replace('index.js', 'mocha.css'), 'utf8');
                document.head.appendChild(mochaStyle);

                mocha.setup({ui: 'bdd', reporter: MultiReporter});

                if (bootstrapFile) {
                    require(path.resolve(process.cwd(), filePatterns[0]));
                }

                if (Utils.getFlags().includes('instrument')) {

                    let exclude = ['**/test/**', '**/test{,-*}.js', '**/*.test.js', '**/__tests__/**', '**/node_modules/**'];
                    let instrumenter = istanbul.createInstrumenter({
                        coverageVariable: '__coverage__',
                        produceSourceMap: true,
                        preserveComments: true,
                        esModules: true,
                        noCompact: false
                    });

                    addHook((code, filename) => {
                        let relativeFilename = path.relative(process.cwd(), filename);

                        // Check for exclusions.
                        for (let i = 0 ; i < exclude.length; i++) {
                            if (minimatch(relativeFilename, exclude[i])) {
                                return code;
                            }
                        }

                        let instrumented = instrumenter.instrumentSync(code, filename);
                        let sourceMap = instrumenter.lastSourceMap();
                        sourceMap.sourceRoot = '';
                        sourceMap.sources = sourceMap.sources.map(file => {
                            return 'sources:///' + relativeFilename;
                        })
                        instrumented += '\n' + convertSourceMap.fromObject(sourceMap).toComment();
                        return instrumented;
                    });
                }

                callback();
            }, 2000);
        },

        reset () {
            document.querySelector('#mocha').innerHTML = '';
            error_screen.style.display = 'none';
            mocha.suite.suites = [];

            for (let fileName in require.cache) {
                if (!fileName.startsWith(node_modules_path)) {
                    delete require.cache[fileName];
                }
            }

            mochaStats.passed = 0;
            mochaStats.failed = 0;
        },

        load () {
            var files = glob(testFiles, {
                cwd: process.cwd(),
                sync: true,
                nodir: true,
                ignore: ['node_modules/**']
            });

            files.forEach(file => {
                var filePath = path.resolve(process.cwd(), file);
                require(filePath);
            });
        },

        run (callback) {
            this.reset();

            try {
                this.load();
                mocha.run(function() {
                    stdout(' Passed: ' + mochaStats.passed);
                    stdout(' Failed: ' + mochaStats.failed);

                    let code = mochaStats.failed > 0? 1 : 0;
                    callback(code);  
                });
            } catch (e) {
                error_screen.style.display = 'block';
                error_screen.textContent = e.stack;
                callback(1);
            }
        }
    }
})();