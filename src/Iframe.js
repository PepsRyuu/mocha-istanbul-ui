// All of the tests run in blank iframe.
// The reason for this is so that if any tests want to create any DOM elements
// or add some styles, they won't conflict with the styles and DOM for the test reporter.

let el;

// Need to modify require in the iframe
// so that they resolve relatively to node_modules for the project
// and not to the embedded iframe.
function overrideRequireResolution () {
    let Module = require('module');
    let global_require = global.require;

    function resolveModule (mod) {
        return Module._resolveFilename(mod, {
            id: __dirname,
            filename: __dirname,
            paths: Module._nodeModulePaths(process.cwd())
        });
    }

    global.require = function (mod) {
        return global_require(resolveModule(mod));
    };

    ['cache' , 'extensions', 'resolve'].forEach(prop => {
        Object.defineProperty(global.require, prop, {
            get() {
                return global_require[prop];
            }
        })
    });
}

export default {
    init () {
        el = document.createElement('iframe');
        document.body.appendChild(el);
        el.contentDocument.write(`<html><head><title>Test Frame</title></head><body></body></html>`);
        this.evaluate(overrideRequireResolution);
    },

    evaluate (fn, args = []) {
        if (!Array.isArray(args)) {
            args = [args];
        }

        el.contentWindow.eval(`(${fn.toString()})(...${JSON.stringify(args)})`);
    },

    getWindow () {
        return el.contentWindow;
    },

    destroy () {
        el.remove();
    }
}