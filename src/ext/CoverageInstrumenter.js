import CoverageInstrumenterIframe from './CoverageInstrumenterIframe';
import Iframe from '../Iframe';

let fs = global.require('fs');
let path = global.require('path');
let { execSync } = global.require('child_process');

export default class CoverageInstrumenter {
    static instrument () {
        Iframe.evaluate(CoverageInstrumenterIframe);
    }

    static getRawCoverage () {
        return Iframe.getWindow().__coverage__;
    }

    static isCoverageAvailable () {
        return Iframe.getWindow().__coverage__ !== undefined;
    }

    static reset () {
        if (!this.isCoverageAvailable()) {
            return;
        }

        let cov = this.getRawCoverage();
        for (let file in cov) {
            ['b', 'f', 's'].forEach(type => {
                for (let line in cov[file][type]) {
                    if (Array.isArray(cov[file][type][line])) {
                        cov[file][type][line] = cov[file][type][line].map(val => 0);
                    } else {
                        cov[file][type][line] = 0;
                    }
                }
            });
        }
    }

    static getCoverage () {
        if (!this.isCoverageAvailable()) {
            return;
        }

        let totalLines = 0;
        let linesCovered = 0;
        let cov = this.getRawCoverage();

        for (let file in cov) {
            totalLines += Object.keys(cov[file].s).length;
            linesCovered += Object.keys(cov[file].s).filter(n => cov[file].s[n] > 0).length;
        }

        let percentage = Math.floor(linesCovered / totalLines * 100);
        return { percentage, coverage: cov };
    }

    static saveCoverageToFile () {
        if (!this.isCoverageAvailable()) {
            return;
        }

        let dir = path.resolve(process.cwd(), 'coverage');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        let cov = this.getRawCoverage();
        fs.writeFileSync(path.resolve(dir, 'coverage.json'), JSON.stringify(cov));

        let { Report, Collector } = require('istanbul');
        ['lcovonly', 'cobertura', 'html'].forEach(report_type => {
            let collector = new Collector();
            collector.add(cov);
            let report = Report.create(report_type, { dir });
            report.writeReport(collector, true);
        });
    }
}