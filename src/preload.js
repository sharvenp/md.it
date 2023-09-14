import { contextBridge, ipcRenderer } from "electron";
import IPCCommands from "./ipcCommands";

// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld("ipcRenderer", {
  call: (channel, ...args) => {
    if (IPCCommands[channel] !== undefined) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});
