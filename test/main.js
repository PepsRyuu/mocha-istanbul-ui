let { expect } = require('chai');

let iframe = document.createElement('iframe');
iframe.setAttribute('style', `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 500px;
    height: 500px;
`);
document.body.appendChild(iframe);

function load_runtime (params) {
    return new Promise(resolve => {
        iframe.src ='http://localhost:8080/index.html?' + Object.keys(params).map(key => key + '=' + params[key]).join('&');
        
        setTimeout(() => {
            resolve({
                execute: function (js) {
                    return iframe.contentWindow.eval(js);
                },
                stop: function () {
                    iframe.src = 'about:blank';
                }
            });
        }, 2000);
    });
}

function wait (delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

describe ('mocha-istanbul-ui', function () {
    this.timeout(10000);

    it ('glob - runs tests', async function () {
        let runtime = await load_runtime({ files: 'examples/example-glob/test/*.js' });
        expect(runtime.execute(`document.body.querySelectorAll('.TestReporter-suiteTest').length`)).to.equal(4);
        runtime.stop();
    }); 

    it ('glob - restarts tests with no changes', async function () {
        let runtime = await load_runtime({ files: 'examples/example-glob/test/*.js' });
        expect(runtime.execute(`document.body.querySelectorAll('.TestReporter-suiteTest').length`)).to.equal(4);
        runtime.execute(`document.querySelector('.MIUI-App-controls button:last-child').click()`);
        await wait(1000);
        expect(runtime.execute(`document.body.querySelectorAll('.TestReporter-suiteTest').length`)).to.equal(4);
        runtime.stop();
    }); 
});