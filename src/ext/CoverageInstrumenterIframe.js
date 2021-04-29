export default function () {
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
        '**/node_modules/**',
        '**/*.spec.js'
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

        try {
			let instrumented = instrumenter.instrumentSync(code, filename);
			let sourceMap = instrumenter.lastSourceMap();
			sourceMap.sourceRoot = '';
			sourceMap.sources = sourceMap.sources.map(file => {
			return 'sources:///' + relativeFilename;
			});
			instrumented += '\n' + convertSourceMap.fromObject(sourceMap).toComment();
			return instrumented;
		} catch (e) {
			e.message = 'InstrumentError @ ' + filename + '\n' + e.message;
			throw e;
		}
    }, { exts: ['.js', '.mjs'] });
}