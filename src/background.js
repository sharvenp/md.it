"use strict";

/* global __static */

import { app, protocol, shell, dialog, BrowserWindow, ipcMain } from "electron";
import windowStateKeeper from "electron-window-state";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import * as path from "path";

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800,
  });
  const win = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: "md.it",
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, "preload.js"),
      icon: path.join(__static, "icon.png"),
    },
  });

  mainWindowState.manage(win);

  const fs = require("fs");

  // helpers
  const saveFile = (filePath, data) => {
    fs.writeFileSync(filePath, data, () => {});
  };
  const loadFile = (filePath, opts) => {
    return fs.readFileSync(filePath, opts);
  };
  let lastOpenPath = undefined;
  let lastFileName = "untitled.md";
  let lastModified = false;
  let dataBackup = "";

  // ipcMain handlers
  ipcMain.handle("SET_MODIFIED", (event, modified, data = undefined) => {
    if (modified) {
      win.setTitle(lastFileName + "*");
    }
    if (!modified) {
      win.setTitle(lastFileName);
    }
    lastModified = modified;
    if (data !== undefined) {
      dataBackup = data;
    }
  });

  ipcMain.handle("OPEN_FILE", () => {
    let result = dialog.showOpenDialogSync(null, {
      openFile: true,
      openDirectory: false,
      multiSelections: false,
      showHiddenFiles: false,
      filters: [{ name: "Markdown", extensions: ["md", "txt"] }],
    });
    let data = undefined;
    if (result && result.length > 0) {
      try {
        data = loadFile(result[0], {
          encoding: "utf8",
          flag: "r",
        });
        lastOpenPath = result[0];
        lastFileName = path.basename(result[0]);
        win.setTitle(lastFileName);
      } catch {
        // do nothing
      }
    }
    return data;
  });

  const saveFileHandler = (event, data) => {
    if (lastOpenPath) {
      try {
        saveFile(lastOpenPath, data);
        lastFileName = path.basename(lastOpenPath);
        win.setTitle(lastFileName);
        return 0;
      } catch {
        return 1;
      }
    } else {
      return 2;
    }
  };

  const saveAsFileHandler = (event, data) => {
    let filePath = dialog.showSaveDialogSync(null, {
      showHiddenFiles: false,
      filters: [{ name: "Markdown", extensions: ["md", "txt"] }],
    });
    if (filePath) {
      try {
        saveFile(filePath, data);
        lastOpenPath = filePath;
        lastFileName = path.basename(filePath);
        win.setTitle(lastFileName);
        return 0;
      } catch (e) {
        return 1;
      }
    }
    return 2;
  };

  ipcMain.handle("SAVE_FILE", saveFileHandler);
  ipcMain.handle("SAVE_AS_FILE", saveAsFileHandler);

  win.removeMenu();

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.on("page-title-updated", (event) => event.preventDefault());

  win.on("close", (event) => {
    if (lastModified) {
      let response = dialog.showMessageBoxSync(null, {
        type: "question",
        buttons: ["Save", "Quit"],
        title: "Confirm",
        message: "You have unsaved changes. Are you sure you want to quit?",
        cancelId: -1,
      });

      if (response === -1) {
        event.preventDefault();
      }

      if (response === 0) {
        let res = 2;
        if (lastOpenPath) {
          res = saveFileHandler(undefined, dataBackup);
        } else {
          res = saveAsFileHandler(undefined, dataBackup);
        }
        if (res !== 0) {
          event.preventDefault();
        }
      }
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    // if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   try {
  //     await installExtension(VUEJS3_DEVTOOLS);
  //   } catch (e) {
  //     console.error("Vue Devtools failed to install:", e.toString());
  //   }
  // }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
