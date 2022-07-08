import { contextBridge, ipcRenderer } from "electron";

// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld("ipcRenderer", {
  call: (channel, ...args) => {
    let validChannels = [
      "MARK_EDITED",
      "OPEN_FILE",
      "SAVE_FILE",
      "SAVE_AS_FILE",
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});
