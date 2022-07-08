import { contextBridge, ipcRenderer } from "electron";

// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => {
    let validChannels = ["SAVE_SWP"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  call: (channel, ...args) => {
    let validChannels = ["LOAD_SWP", "SAVE_SWP"];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});
