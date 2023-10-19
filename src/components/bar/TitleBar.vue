<template>
    <div class="title-bar">
        <div class="d-flex flex-row-reverse title-flex-bar">
            <button v-if="isIPCSupported" id="close-button" type="button" title="Close" tabindex="14" :disabled="editorLocked"  @click="onClose" :class="`d-flex align-items-center justify-content-center btn btn-${buttonColorClass}`">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" :fill="svgFill"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
            </button>
            <button v-if="isIPCSupported" id="fullscreen-button" type="button" title="Expand" tabindex="13" :disabled="editorLocked" @click="toggleFullScreen" :class="`d-flex align-items-center justify-content-center me-2 btn btn-${buttonColorClass}`">
                <svg v-if="!maximized" xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" :fill="svgFill"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0 0v-560 560Z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" :fill="svgFill" class="unmaximize-icon"><path d="M320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/></svg>
            </button>
            <button v-if="isIPCSupported" id="minimize-button" type="button" title="Minimize" tabindex="12" :disabled="editorLocked" @click="onMinimize" :class="`d-flex align-items-center justify-content-center me-2 btn btn-${buttonColorClass}`">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" :fill="svgFill"><path d="M240-120v-80h480v80H240Z"/></svg>
            </button>
            <span v-if="isIPCSupported" class="file-name me-auto">
                {{ fileName }} {{ modified ? "*" : "" }}
            </span>
        </div>
    </div>
</template>

<script>
import IPCCommands from "@/ipcCommands";

export default {
    name: "TitleBarV",
    props: {
        modified: Boolean,
        changeKey: String,
        currentTheme: Boolean,
        editorLocked: Boolean,
        isIPCSupported: Boolean
    },
    data() {
        return {
            fileName: "",
            maximized: false
        };
    },
    computed: {
        buttonColorClass() {
            return this.currentTheme ? 'light' : 'dark';
        },
        svgFill() {
            return this.currentTheme ? 'black' : 'white';
        }
    },
    mounted() {
        this.updateState();
    },
    methods: {
        async ipcCallWrapper(...args) {
            // call ipcRenderer only if it is defined
            return await window.ipcRenderer?.call(...args)
        },
        async updateState() {
            if (!this.isIPCSupported) {
                return;
            }
            this.fileName = await this.ipcCallWrapper(IPCCommands.GET_FILENAME)
            this.maximized = await this.ipcCallWrapper(IPCCommands.GET_MAXIMIZED_STATE)
        },
        async onClose() {
            if (!this.isIPCSupported) {
                return;
            }
            await this.ipcCallWrapper(IPCCommands.CLOSE_APP)
        },
        async toggleFullScreen() {
            if (!this.isIPCSupported) {
                return;
            }
            if (this.maximized) {
                await this.ipcCallWrapper(IPCCommands.UNMAXIMIZE)
            } else {
                await this.ipcCallWrapper(IPCCommands.MAXIMIZE)
            }
        },
        async onMinimize() {
            if (!this.isIPCSupported) {
                return;
            }
            await this.ipcCallWrapper(IPCCommands.MINIMIZE)
        },
    },
    watch: {
        changeKey() {
            this.updateState()
        }
    }
};
</script>
