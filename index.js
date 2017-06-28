const electron = require('electron');
const {app, BrowserWindow} = electron;
const console = require('console');

require('electron-context-menu')();

let mainWindow;
let args = process.argv.slice(2);
let flags = args.filter(val => val.startsWith('--'));
let files = args.filter(val => !val.startsWith('--'));

if (flags.includes('--help')) {
    console.log(`Mocha Istanbul UI

    Usage: mocha-istanbul-ui <setup-file> <test-files> <flags>

    Options:

        --once      Run test cases once and exit. 
                    Exit code 1 if a test fails.

        --console   Output test results to console.
    `);

    return app.quit();
}


app.console = new console.Console(process.stdout, process.stderr);
app.process = process;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function() {
    let {width, height} = electron.screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        width: width, 
        height: height,
        title: 'Mocha Istanbul UI'
    });

    mainWindow.setMenu(null);

    let url = 'file://' + __dirname + '/index.html?files=' + files;
    flags.forEach(flag => {
        url += `&${flag.replace('--', '')}=true`;
    });

    mainWindow.loadURL(url);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});