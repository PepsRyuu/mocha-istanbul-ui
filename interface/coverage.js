const CoverageReporter = (function () {

    const fs = require('fs');
    const path = require('path');
    const execSync = require('child_process').execSync;

    return {
        init () {
            coverage_report_close.onclick = () => {
                coverage_report.style.display = 'none';
            };
        },

        reset () {
            let cov = window.__coverage__;
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
        },

        showLink () {
            let el = document.createElement('li');
            el.innerHTML = `
                <a
                    href="javascript:void(0)"
                    onclick="CoverageReporter.showReport()"
                >line coverage:</a>
                <em>${this.calculateCoverage()}%</em>
            `;

            let parent = document.querySelector('#mocha-stats');
            parent.insertBefore(el, parent.firstChild);
        },

        calculateCoverage () {
            let totalLines = 0;
            let linesCovered = 0;
            let cov = window.__coverage__;

            for (let file in cov) {
                totalLines += Object.keys(cov[file].s).length;
                linesCovered += Object.keys(cov[file].s).filter(n => cov[file].s[n] > 0).length;
            }

            return Math.floor(linesCovered / totalLines * 100);
        },

        showReport () {
            let cov = window.__coverage__;
            coverage_report.style.display = 'block';
            coverage_report_files.innerHTML = '';

            for (let prop in cov) {
                let el = document.createElement('label');
                el.innerHTML = `
                    <input
                        type="radio"
                        name="coverage_file"
                        onchange="CoverageReporter.showSource('${prop.replace(/\\/g, '\\\\')}')"
                    >
                    <span>${prop.replace(process.cwd(), '')}</span>

                `
                coverage_report_files.appendChild(el);
            }

            coverage_report_source.innerHTML = '';

        },

        showSource (file) {
            let cov = window.__coverage__[file];
            coverage_report_source.innerHTML = '';
            let code = fs.readFileSync(file, 'utf8').split('\n');

            let totalLines = code.length;
            let lineNumberWidth = totalLines.toString().length * 8 + 30;

            let lineEls = [];
            for (let i = 0; i < code.length; i++) {
                let el = document.createElement('div');
                el.innerHTML = `
                    <span style="width:${lineNumberWidth}px">${i + 1}</span>
                    <span>${code[i].replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                `;

                coverage_report_source.appendChild(el);
                lineEls.push(el);
            }

            let sLength = Object.keys(cov.s).length;
            for (let i = 0; i < sLength; i++) {
                let start = cov.statementMap[i].start.line - 1;
                let end = cov.statementMap[i].end.line - 1;

                for (let j = start; j <= end; j++) {
                    lineEls[j].style.backgroundColor = cov.s[i] > 0 ? '#42c0c0' : '#d4426d';
                    lineEls[j].setAttribute('data-covered', '' + cov.s[i] > 0);
                }
            }

            // Branch coverage, partial coverage should be yellow. Uncovered lines should be red?
            let bLength = Object.keys(cov.b).length;
            for (let i = 0; i < bLength; i++) {
                let bEntry = cov.b[i];
                for (let j = 0; j < bEntry.length; j++) {
                    if (bEntry[j] === 0) {
                        let line = cov.branchMap[i].locations[j].start.line - 1;
                        let el = lineEls[line];
                        el.style.backgroundColor = el.getAttribute('data-covered') === 'true'? '#fbb316' : '#d4426d';
                    }
                }
            }
        },

        saveReport () {
            let coverage_folder = path.resolve(process.cwd(), 'target/coverage');
            if (!fs.existsSync(coverage_folder)) {
                fs.mkdirSync(coverage_folder);
            }

            let coverage_file = path.resolve(coverage_folder, 'coverage.json');
            let istanbul = path.resolve(process.cwd(), 'node_modules/.bin/istanbul');

            fs.writeFileSync(coverage_file, JSON.stringify(window.__coverage__));
            execSync(`${istanbul} report --include ${coverage_file} lcovonly cobertura html --dir ${coverage_folder}`);
        }
    }
})();