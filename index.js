const electron = require('electron');
const {app, BrowserWindow} = electron;
require('electron-context-menu')();

let mainWindow;
let files = process.argv.slice(2).join(',');

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
    mainWindow.loadURL('file://' + __dirname + '/index.html?files=' + files);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});