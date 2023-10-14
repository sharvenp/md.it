<template>
    <div class="bottom-bar">
        <div class="d-flex align-items-center bottom-flex-bar">
            <button id="open-button" type="button" title="Open" :disabled="editorLocked" :class="`btn btn-${buttonColorClass}`"
                @click="openFile">
                <!-- <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg> -->
                <span>Open</span>
            </button>
            <button id="save-button" type="button" title="Save" v-show="isIPCSupported" :disabled="editorLocked"
            :class="`btn btn-${buttonColorClass} ms-2`" @click="saveFile">
                <!-- <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg> -->
                <span>Save</span>
            </button>
            <button id="save-as-button" type="button" title="Save As" :disabled="editorLocked" :class="`btn btn-${buttonColorClass} ms-2`"
                @click="saveAsFile">
                <!-- <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h2m3-4H9a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-1m-1 4l-3 3m0 0l-3-3m3 3V3" />
                </svg> -->
                <span>Save As</span>
            </button>
            <button type="button" id="layout-button" title="Toggle Layout" :class="`btn btn-${buttonColorClass} ms-4`" @click="cycleLayout">
                <svg v-if="currentLayout === 0" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                    fill="currentColor" class="bi bi-layout-sidebar" viewBox="0 0 16 16">
                    <path
                        d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm5-1v12h9a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H5zM4 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2V2z" />
                </svg>
                <svg v-else-if="currentLayout === 1" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                    fill="currentColor" class="bi bi-layout-sidebar-reverse" viewBox="0 0 16 16">
                    <path
                        d="M16 3a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3zm-5-1v12H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h9zm1 0h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2V2z" />
                </svg>
                <svg v-else-if="currentLayout === 2" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                    fill="currentColor" class="bi bi-layout-split" viewBox="0 0 16 16">
                    <path
                        d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm8.5-1v12H14a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8.5zm-1 0H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5.5V2z" />
                </svg>
            </button>
            <button id="spell-check-button" type="button" title="Toggle Spellcheck" :disabled="editorLocked"
                :class="`btn btn-${spellCheck ? 'success' : buttonColorClass } ms-2`" @click="toggleSpellCheck">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-spellcheck"
                    viewBox="0 0 16 16">
                    <path
                        d="M8.217 11.068c1.216 0 1.948-.869 1.948-2.31v-.702c0-1.44-.727-2.305-1.929-2.305-.742 0-1.328.347-1.499.889h-.063V3.983h-1.29V11h1.27v-.791h.064c.21.532.776.86 1.499.86zm-.43-1.025c-.66 0-1.113-.518-1.113-1.28V8.12c0-.825.42-1.343 1.098-1.343.684 0 1.075.518 1.075 1.416v.45c0 .888-.386 1.401-1.06 1.401zm-5.583 1.035c.767 0 1.201-.356 1.406-.737h.059V11h1.216V7.519c0-1.314-.947-1.783-2.11-1.783C1.355 5.736.75 6.42.69 7.27h1.216c.064-.323.313-.552.84-.552.527 0 .864.249.864.771v.464H2.346C1.145 7.953.5 8.568.5 9.496c0 .977.693 1.582 1.704 1.582zm.42-.947c-.44 0-.845-.235-.845-.718 0-.395.269-.684.84-.684h.991v.538c0 .503-.444.864-.986.864zm8.897.567c-.577-.4-.9-1.088-.9-1.983v-.65c0-1.42.894-2.338 2.305-2.338 1.352 0 2.119.82 2.139 1.806h-1.187c-.04-.351-.283-.776-.918-.776-.674 0-1.045.517-1.045 1.328v.625c0 .468.121.834.343 1.067l-.737.92z" />
                    <path
                        d="M14.469 9.414a.75.75 0 0 1 .117 1.055l-4 5a.75.75 0 0 1-1.116.061l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.908 1.907 3.476-4.346a.75.75 0 0 1 1.055-.117z" />
                </svg>
            </button>
            <button type="button" id="theme-button" title="Toggle Theme" :class="`btn btn-${buttonColorClass} ms-2`" @click="toggleTheme">
                <svg v-if="currentTheme" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                    fill="currentColor" class="bi bi-layout-sidebar" viewBox="0 0 16 16">
                    <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                    fill="currentColor" class="bi bi-layout-sidebar-reverse" viewBox="0 0 16 16">
                    <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
                </svg>
            </button>
            <button type="button" id="scroll-link-button" title="Toggle Scroll Link" :class="`btn btn-${buttonColorClass} ms-2`" @click="toggleScrollLink">
                <svg v-if="scrollLink" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" :fill="svgFill"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" :fill="svgFill"><path d="m770-302-60-62q40-11 65-42.5t25-73.5q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 57-29.5 105T770-302ZM634-440l-80-80h86v80h-6ZM792-56 56-792l56-56 736 736-56 56ZM440-280H280q-83 0-141.5-58.5T80-480q0-69 42-123t108-71l74 74h-24q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h65l79 80H320Z"/></svg>
            </button>
            <a class="logo ms-auto text-decoration-none noselect" href="https://github.com/sharvenp/md.it" target="_blank">
                <div class="d-flex">
                    <img width="40" class="p-1" src="../../public/icon.png" />
                    <p class="p-auto m-2">{{ appVersion }}</p>
                </div>
            </a>
        </div>
    </div>
</template>

<script>
import appInfo from "../../package";

export default {
    name: "ToolBarV",
    props: {
        currentLayout: Number,
        spellCheck: Boolean,
        currentTheme: Boolean,
        scrollLink: Boolean,
        editorLocked: Boolean,
        isIPCSupported: Boolean
    },
    data() {
        return {
            appVersion: appInfo.version,
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
        cycleLayout() {
            this.$emit("layout-change");
        },
        openFile() {
            if (this.editorLocked) return;
            this.$emit("open-file");
        },
        saveFile() {
            if (this.editorLocked) return;
            this.$emit("save-file");
        },
        saveAsFile() {
            if (this.editorLocked) return;
            this.$emit("save-as-file");
        },
        toggleSpellCheck() {
            if (this.editorLocked) return;
            this.$emit("toggle-spell-check");
        },
        toggleTheme() {
            if (this.editorLocked) return;
            this.$emit("toggle-theme");
        },
        toggleScrollLink() {
            if (this.editorLocked) return;
            this.$emit("toggle-scroll-link");
        }
    },
};
</script>
