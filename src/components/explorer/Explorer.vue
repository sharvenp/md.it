<template>
    <div class="explorer container h-100">
        <div class="row explorer-file-view ">
            <div class="container p-2">
                Hello
            </div>
        </div>
        <div class="row explorer-bottom-bar">
            <div class="h-100 d-flex align-items-center justify-content-end bottom-flex-bar">
                <button id="open-folder-button-explorer" type="button" title="Open Folder" tabindex="10" v-show="isIPCSupported" :disabled="editorLocked"
                :class="`btn btn-${buttonColorClass}`" @click="openFolder">
                    <span>Open Folder</span>
                </button>
                <button id="refresh-button-explorer" type="button" title="Refresh" tabindex="11" v-show="isIPCSupported" :disabled="editorLocked"
                :class="`btn btn-${buttonColorClass} ms-auto`" @click="refresh">
                    <span>Refresh</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: "ExplorerV",
    props: {
        currentTheme: Boolean,
        editorLocked: Boolean,
        isIPCSupported: Boolean
    },
    data() {
        return {
            files: {}
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
    methods: {
        openFolder() {
            if (this.editorLocked) return;
            // TODO close current file and open new file
        },
        refresh() {
            if (this.editorLocked) return;
            // TODO get new files
        },
    },
};
</script>
