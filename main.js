// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, Tray, globalShortcut } = require('electron')
const AutoLaunch = require('auto-launch');
const path = require('path');

// require('electron-reload')(__dirname, {
//   // Note that the path to electron may vary according to the main file
//   electron: require(`${__dirname}/node_modules/electron`)
// });

let win;

function createWindow () {

  let tray = null;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 250,
    webPreferences: {
      //PRELOAD JEST CHYBA PO TO ZEBY ZALADOWAC COS PRZED WYRENDEROWANIEM HTML'A
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname + '/icons/png/256x256.png')
  })

  win = mainWindow;

  mainWindow.setMenu(null);
  mainWindow.setResizable(false);
  // and load the index.html of the app.
  mainWindow.loadFile('public/index.html')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
  mainWindow.hide();
  tray = createTray();

  function createTray() {
    if(tray !== null) tray.destroy();
    let appIcon = new Tray(path.join(__dirname, '/icons/png/256x256.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Exit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);
  
    appIcon.on('double-click', function (event) {
        mainWindow.show();
    });
    appIcon.setToolTip('Record In Time');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
  }

  mainWindow.on('minimize', event => {
    event.preventDefault();
    mainWindow.hide();
    tray = createTray();
  })

  mainWindow.on('restore', function (event) {
    mainWindow.show();
    tray.destroy();
  });

}

let isRecording;

const startRecord = () => {
  isRecording = !isRecording;
  if(isRecording) {
    win.send('start', {});
  } else {
    win.send('stop', {});
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  autoStart();

  globalShortcut.register('F10', () => startRecord())

  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  
})

app.on('window-all-closed', function () {
  globalShortcut.unregister('f12');
  win = null;
  if (process.platform !== 'darwin') app.quit()
})

function autoStart() {
  const appAutoLauncher = new AutoLaunch({
    name: 'Record In Time',
    path: path.dirname(app.getPath('exe') + '/Record In Time.exe')
  });
 
  appAutoLauncher.enable();
 
  appAutoLauncher.isEnabled()
  .then(function(isEnabled){
      if(isEnabled){
          return;
      }
      appAutoLauncher.enable();
  })
  .catch(function(err){
      // handle error
  });
}