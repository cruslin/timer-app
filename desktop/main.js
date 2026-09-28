// Desktop shell. The app itself is Timer.html; it downloads newer builds from the
// hosted site on its own (see the update script in index.html) and hands them to
// this shell, which loads the newest copy at startup. So the shell only needs
// re-releasing if the shell changes.
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const bundled = path.join(__dirname, 'app', 'Timer.html');
const updateFile = () => path.join(app.getPath('userData'), 'Timer-update.html');
const versionOf = html => +((/name="app-version" content="(\d+)"/.exec(html) || [])[1] || 0);

// The downloaded copy if it is newer than the one bundled in this exe, else the bundled one.
function pageToLoad() {
  try {
    const bundledVersion = versionOf(fs.readFileSync(bundled, 'utf8'));
    if (versionOf(fs.readFileSync(updateFile(), 'utf8')) > bundledVersion) return updateFile();
  } catch (e) { /* no update saved yet */ }
  return bundled;
}

ipcMain.handle('save-update', (e, version, html) => {
  if (typeof html !== 'string' || versionOf(html) !== version) return false;
  const tmp = updateFile() + '.tmp';
  fs.writeFileSync(tmp, html);
  fs.renameSync(tmp, updateFile());   // never leave a half-written page behind
  return true;
});

if (!app.requestSingleInstanceLock()) { app.quit(); }

let control;

function placeProjector(win) {
  // Send projector windows to a second display, fullscreen, if one is connected.
  const main = screen.getDisplayNearestPoint(control.getBounds());
  const other = screen.getAllDisplays().find(d => d.id !== main.id);
  if (!other) return;
  win.setBounds(other.bounds);
  win.setFullScreen(true);
}

function createControl() {
  control = new BrowserWindow({
    width: 620, height: 820, minWidth: 420, minHeight: 600,
    backgroundColor: '#0c1016', autoHideMenuBar: true, title: 'Timer',
    webPreferences: { backgroundThrottling: false, preload: path.join(__dirname, 'preload.js') },
  });
  control.setMenuBarVisibility(false);
  control.loadFile(pageToLoad());

  // "Project to Second Screen" buttons call window.open().
  control.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      autoHideMenuBar: true, backgroundColor: '#0a1a3e', title: 'Timer projector',
      webPreferences: { backgroundThrottling: false, preload: path.join(__dirname, 'preload.js') },
    },
  }));
  control.webContents.on('did-create-window', placeProjector);
  control.on('closed', () => app.quit());
}

app.on('second-instance', () => { if (control) { control.isMinimized() && control.restore(); control.focus(); } });
app.whenReady().then(createControl);
app.on('window-all-closed', () => app.quit());
