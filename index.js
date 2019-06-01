const electron = require('electron');
const {app, BrowserWindow} = electron;
const console = require('console');
const commander = require('commander');

require('electron-context-menu')();

commander
    .usage('[file-pattern] [flags]')
    .option('--console', 'Output test results to console.')
    .option('--once', 'Run test cases once and exit.')
    .option('--instrument', 'Instrument the code for coverage.')
    .option('--watch', 'Watch for file changes and re-run tests.')
    .option('--manual', 'Manual test execution through API.')
    .option('--bootstrap <file>', 'File to run before tests')
    .option('--require <files>', 'Files to require before tests.')
    .parse(process.argv);

let mainWindow;

let files = commander.args[0];
let flags = commander.options.map(opt => {
    let name = opt.long.replace('--', '');
    let value = commander[name];

    // Workaround for EventEmitter conflict bug.
    // Commander extends EventEmitter, and puts flags onto the same namespace. 🙄
    if (name === 'once') {
        value = undefined;
    }

    if (name === 'once' && process.argv.indexOf(opt.long) > -1) {
        value = true;
    }

    return { name, value };
}).filter(opt => {
    return opt.value !== undefined;
});

app.console = new console.Console(process.stdout, process.stderr);
app.process = process;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.commandLine.appendSwitch('disable-site-isolation-trials');

app.on('ready', function() {
    let {width, height} = electron.screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        width: Math.min(1280, width), 
        height: Math.min(768, height),
        title: 'Mocha Istanbul UI',
        webPreferences: {
            webSecurity: false,
            allowRunningInsecureContent: true,
            nodeIntegration: true,
            nodeIntegrationInSubFrames: true
        }
    });

    mainWindow.setMenu(null);

    let url;
    if (process.env.NODE_ENV === 'development') {
        url = 'http://localhost:8080/index.html'; // needed for HMR to work
    } else {
        url = 'file://' + __dirname + '/dist/index.html'
    }
 
    url += '?files=' + files;
    flags.forEach(flag => {
        url += `&${flag.name}=${flag.value}`;
    });

    mainWindow.loadURL(url);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});