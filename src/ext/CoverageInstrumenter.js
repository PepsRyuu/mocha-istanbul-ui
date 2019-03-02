let path = global.require('path');
let fs = global.require('fs');
let { execSync } = global.require('child_process');

export default class CoverageInstrumenter {
    static instrument () {
        window.__miui_iframe.contentDocument.write(`
            <script>
                (function () {
                    let r = mod => global.require(window.top.require.resolve(mod));
                    let { addHook } = r('pirates');
                    let path = r('path');
                    let istanbul = r('istanbul-lib-instrument');
                    let convertSourceMap = r('convert-source-map');
                    let minimatch = r('minimatch');                    

                    let exclude = [
                        '**/test/**', 
                        '**/tests/**', 
                        '**/test{,-*}.js', 
                        '**/*.test.js', 
                        '**/__tests__/**', 
                        '**/node_modules/**'
                    ];

                    let instrumenter = istanbul.createInstrumenter({
                        coverageVariable: '__coverage__',
                        produceSourceMap: true,
                        preserveComments: true,
                        esModules: true,
                        noCompact: false
                    });

                    addHook((code, filename) => {
                        let relativeFilename = path.relative(process.cwd(), filename);

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
                        instrumented += '\\n' + convertSourceMap.fromObject(sourceMap).toComment();
                        return instrumented;
                    }, { exts: ['.js', '.mjs'] });
                })();
            </script>
        `); 
    }

    static reset () {
        if (window.__miui_iframe.contentWindow.__coverage__) {
            let cov = window.__miui_iframe.contentWindow.__coverage__;
            for (let file in cov) {
                ['b', 'f', 's'].forEach(type => {
                    for (let line in cov[file][type]) {
                        if (cov[file][type][line] instanceof Array) {
                            cov[file][type][line] = cov[file][type][line].map(val => 0);
                        } else {
                            cov[file][type][line] = 0;
                        }
                    }
                });
            }
        }   
    }

    static isCoverageAvailable () {
        return window.__miui_iframe.contentWindow.__coverage__ !== undefined;
    }

    static getCoverage () {
        if (window.__miui_iframe.contentWindow.__coverage__) {
            let totalLines = 0;
            let linesCovered = 0;
            let coverage = window.__miui_iframe.contentWindow.__coverage__;

            for (let file in coverage) {
                totalLines += Object.keys(coverage[file].s).length;
                linesCovered += Object.keys(coverage[file].s).filter(n => coverage[file].s[n] > 0).length;
            }

            let percentage = Math.floor(linesCovered / totalLines * 100);

            return {
                percentage,
                coverage
            };
        }
    }

    static saveCoverageToFile () {
        if (window.__miui_iframe.contentWindow.__coverage__) {
            let coverage_folder = path.resolve(process.cwd(), 'target/coverage');
            if (!fs.existsSync('target')) {
                fs.mkdirSync('target');
            }

            if (!fs.existsSync(coverage_folder)) {
                fs.mkdirSync(coverage_folder);
            }

            let coverage_file = path.resolve(coverage_folder, 'coverage.json');
            let istanbul = path.resolve(process.cwd(), 'node_modules/.bin/istanbul');

            fs.writeFileSync(coverage_file, JSON.stringify(window.__miui_iframe.contentWindow.__coverage__));
            execSync(`${istanbul} report --include ${coverage_file} lcovonly cobertura html --dir ${coverage_folder}`);
        }
    }
}




