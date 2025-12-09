// electron.js

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process'); // For å starte serveren

// Start backend-serveren i en egen prosess
const serverProcess = fork(path.join(__dirname, 'server', 'server.js'));

function createWindow() {
  // Lag et nytt app-vindu
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Sikkerhetsinnstillinger
    }
  });

  // Last inn React-appen din
  // I produksjon ville den lastet en bygget fil, f.eks. path.join(__dirname, 'frontend/build/index.html')
  mainWindow.loadURL('http://localhost:5174'); // Peker til din vanlige dev-server
}

app.whenReady().then(createWindow);

// Avslutt server-prosessen når appen lukkes
app.on('will-quit', () => {
  serverProcess.kill();
});