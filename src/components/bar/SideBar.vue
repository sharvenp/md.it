<template>
    <div class="d-flex align-items-center flex-column side-flex-bar">
        <button id="explorer-button" type="button" title="Explorer" tabindex="9" :disabled="editorLocked" :class="`btn btn-${buttonColorClass} p-2 mt-2`"
            @click="toggleExplorer">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" :fill="svgFill"><path d="M760-200H320q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200ZM560-640v-200H320v560h440v-360H560ZM160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-800v200-200 560-560Z"/></svg>
        </button>
    </div>
</template>

<script>

export default {
    name: "SideBarV",
    props: {
        currentTheme: Boolean,
        editorLocked: Boolean,
        isIPCSupported: Boolean
    },
    data() {
        return {
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
        toggleExplorer() {
            if (this.editorLocked) return;
            this.$emit("toggle-explorer");
        },
    },
};
</script>
