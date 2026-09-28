// Desktop shell. The app itself is Timer.html; it downloads newer builds from the
// hosted site on its own (see the update script in index.html), so this shell only
// needs re-releasing if the shell changes.
const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

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
    webPreferences: { backgroundThrottling: false },
  });
  control.setMenuBarVisibility(false);
  control.loadFile(path.join(__dirname, 'app', 'Timer.html'));

  // "Project to Second Screen" buttons call window.open().
  control.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      autoHideMenuBar: true, backgroundColor: '#0a1a3e', title: 'Timer projector',
      webPreferences: { backgroundThrottling: false },
    },
  }));
  control.webContents.on('did-create-window', placeProjector);
  control.on('closed', () => app.quit());
}

app.on('second-instance', () => { if (control) { control.isMinimized() && control.restore(); control.focus(); } });
app.whenReady().then(createControl);
app.on('window-all-closed', () => app.quit());
