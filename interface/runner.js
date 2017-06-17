const Runner = (function () {
    let glob = require('glob'); 
    let path = require('path');

    let filePatterns = window.location.href.match(/files=(.*?)(&|$)/)[1].split(',');

    return {
        init (callback) {
            // setup file
            setTimeout(() => {
                // Add mocha script and styles.
                const fs = require('fs');
                let mochaPath = require.resolve('mocha');
                eval(fs.readFileSync(mochaPath.replace('index.js', 'mocha.js'), 'utf8'));

                let mochaStyle = document.createElement('style');
                mochaStyle.textContent = fs.readFileSync(mochaPath.replace('index.js', 'mocha.css'), 'utf8');
                document.head.appendChild(mochaStyle);

                mocha.setup({ui: 'bdd'});
                require(path.resolve(process.cwd(), filePatterns[0]));
                callback();
            }, 2000);
        },

        reset () {
            document.querySelector('#mocha').innerHTML = '';
            mocha.suite.suites = [];
            let node_modules_path = path.resolve(process.cwd(), 'node_modules');

            for (let fileName in require.cache) {
                if (!fileName.startsWith(node_modules_path)) {
                    delete require.cache[fileName];
                }
            }
        },

        load () {
            var files = glob(filePatterns[1], {
                cwd: process.cwd(),
                sync: true,
                nodir: true,
                ignore: ['node_modules/**']
            });

            files.forEach(file => {
                var startTime = Date.now();
                var filePath = path.resolve(process.cwd(), file);
                require(filePath);
                console.log('Required file ' + file + ' in:' + (Date.now() - startTime))
            });
        },

        run (callback) {
            this.reset();
            this.load();
            mocha.run(callback);
        }
    }
})();