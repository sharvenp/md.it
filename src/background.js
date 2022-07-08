"use strict";

import { app, protocol, shell, dialog, BrowserWindow, ipcMain } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import * as path from "path";
// import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    title: "md.it",
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const fs = require("fs");

  // helpers
  const saveFile = (path, data) => {
    fs.writeFile(path, data, () => {});
  };
  const loadFile = (path, opts) => {
    return fs.readFileSync(path, opts);
  };
  let lastOpenPath = undefined;

  // ipcMain handlers
  ipcMain.handle("MARK_EDITED", () => {
    let currTitle = win.getTitle();
    if (currTitle.length > 0 && currTitle.slice(-1) !== "*") {
      win.setTitle(currTitle + "*");
    }
  });

  ipcMain.handle("OPEN_FILE", async () => {
    let result = await dialog.showOpenDialog(null, {
      openFile: true,
      openDirectory: false,
      multiSelections: false,
      showHiddenFiles: false,
      filters: [{ name: "Markdown", extensions: ["md", "txt"] }],
    });
    let data = undefined;
    if (!result.canceled && result.filePaths.length > 0) {
      const path = require("path");
      try {
        data = loadFile(result.filePaths[0], {
          encoding: "utf8",
          flag: "r",
        });
        lastOpenPath = result.filePaths[0];
        let fn = path.basename(result.filePaths[0]);
        win.setTitle(fn);
      } catch {
        // do nothing
      }
    }
    return data;
  });

  const saveAsHandler = async (event, data) => {
    let savePath = await dialog.showSaveDialogSync(null, {
      showHiddenFiles: false,
      filters: [{ name: "Markdown", extensions: ["md", "txt"] }],
    });
    if (savePath) {
      const path = require("path");
      try {
        saveFile(savePath, data);
        lastOpenPath = savePath;
        let fn = path.basename(savePath);
        win.setTitle(fn);
      } catch {
        // do nothing
      }
    }
  };

  ipcMain.handle("SAVE_FILE", async (event, data) => {
    if (lastOpenPath) {
      const path = require("path");
      try {
        saveFile(lastOpenPath, data);
        let fn = path.basename(lastOpenPath);
        win.setTitle(fn);
      } catch {
        // do nothing
      }
    } else {
      // defer the save as handler instead
      saveAsHandler(event, data);
    }
  });

  ipcMain.handle("SAVE_AS_FILE", saveAsHandler);

  win.removeMenu();
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.on("page-title-updated", (event) => event.preventDefault());

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
