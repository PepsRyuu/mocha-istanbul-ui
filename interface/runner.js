const Runner = (function () {
    const glob = require('glob'); 
    const path = require('path');
    const fs = require('fs');
    const execSync = require('child_process').execSync;
    const remote = require('electron').remote;
    const app = remote.app;

    const filePatterns = window.location.href.match(/files=(.*?)(&|$)/)[1].split(',');
    const node_modules_path = path.resolve(process.cwd(), 'node_modules');

    function stdout (message) {
        if (Utils.getFlags().includes('console')) {
            app.console.log(message);
        }
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
            stdout(indent() + ' ✓ ' + test.title);
        });

        runner.on('fail', test => {
            mochaStats.failed++;
            stdout(indent() + ' ✖ ' + test.title);
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

                require(path.resolve(process.cwd(), filePatterns[0]));
                callback();
            }, 2000);
        },

        reset () {
            document.querySelector('#mocha').innerHTML = '';
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
            var files = glob(filePatterns[1], {
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
            this.load();
            mocha.run(function() {
                stdout(' Passed: ' + mochaStats.passed);
                stdout(' Failed: ' + mochaStats.failed);

                let code = mochaStats.failed > 0? 1 : 0;
                callback(code);  
            });
        }
    }
})();