<template>
    <div class="view">
        <div class="row">
            <TitleBarV
                :key="`${titleBarKey}`"
                :changeKey="`${titleBarKey}`"
                :modified="modified"
                :editorLocked="editorLocked"
                :current-theme="currentTheme"
                :isIPCSupported="isIPCSupported"
            />
        </div>
        <div class="row">
            <splitpanes class="default-theme">
                <pane v-if="showLeftPane">
                    <div id="editor-col" class="p-0 column">
                        <codemirror v-model="inputText"
                        :style="{
                            width: '100%',
                            height: '100%',
                        }"
                        placeholder=""
                        :autofocus="true"
                        :indent-with-tab="true"
                        :tab-size="2"
                        :extensions="codemirrorExtensions"
                        :disabled="editorLocked"
                        @ready="handleReady"
                        @change="onInputUpdate" />
                    </div>
                </pane>
                <pane v-if="showRightPane">
                    <div id="view-col" class="p-0 column" ref="viewer">
                        <div v-html="compiledMarkdown" class="preview"></div>
                    </div>
                </pane>
            </splitpanes>
        </div>
        <div class="row">
            <ToolBarV
                :editorLocked="editorLocked"
                :currentLayout="currentLayout"
                :spellCheck="spellCheck"
                :currentTheme="currentTheme"
                :scrollLink="scrollLink"
                :isIPCSupported="isIPCSupported"
                @toggle-spell-check="onSpellCheckToggle"
                @layout-change="onLayoutChange"
                @open-file="onOpenFile"
                @save-file="onSaveFile"
                @save-as-file="onSaveAsFile"
                @toggle-theme="onThemeToggle"
                @toggle-scroll-link="onScrollLinkToggle"
            />
        </div>
    </div>
</template>

<script>
import { shallowRef } from "vue";
import { Codemirror } from "vue-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorSelection, Transaction, Text } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

import { Splitpanes, Pane } from "splitpanes";

import MarkdownIt from 'markdown-it';
import MarkdownItInjectLineNumbers from "markdown-it-inject-linenumbers";
import MarkdownitSup from 'markdown-it-sup';
import MarkdownitCheckbox from 'markdown-it-task-checkbox';
import MarkdownitSub from 'markdown-it-sub';
import MarkdownitEmoji from 'markdown-it-emoji';

import DOMPurify from "dompurify";

import ToolBarV from "./ToolBar.vue";
import TitleBarV from "./TitleBar.vue";
import IPCCommands from "@/ipcCommands";

import { debounce } from "debounce";

export default {
    name: "EditorV",
    components: {
        Codemirror,
        TitleBarV,
        ToolBarV,
        Splitpanes,
        Pane,
    },
    data() {
        return {
            inputText: "",
            titleBarKey: "",
            modified: false,
            currentLayout: 2,
            currentTheme: false,
            scrollLink: true,
            spellCheck: false,
            editorLocked: false,
            fileOpened: false,
            renderer: undefined,
            md: undefined,
            scrollMap: undefined,
            scrollLock: [false, false],
            isIPCSupported: false
        };
    },
    setup() {
        let createCustomKeyMod = (mod, key, insertChar) => {
            let handler = ({ state, dispatch }) => {
                const changes = state.changeByRange((range) => {
                    const isAppliedBefore =
                        state.sliceDoc(range.from - insertChar.length, range.from) ===
                        insertChar;
                    const isAppliedAfter =
                        state.sliceDoc(range.to, range.to + insertChar.length) ===
                        insertChar;
                    const changes = [];

                    changes.push(
                        isAppliedBefore
                            ? {
                                from: range.from - insertChar.length,
                                to: range.from,
                                insert: Text.of([""]),
                            }
                            : {
                                from: range.from,
                                insert: Text.of([insertChar]),
                            }
                    );

                    changes.push(
                        isAppliedAfter
                            ? {
                                from: range.to,
                                to: range.to + insertChar.length,
                                insert: Text.of([""]),
                            }
                            : {
                                from: range.to,
                                insert: Text.of([insertChar]),
                            }
                    );

                    const extendBefore = isAppliedBefore
                        ? -insertChar.length
                        : insertChar.length;
                    const extendAfter = isAppliedAfter
                        ? -insertChar.length
                        : insertChar.length;

                    return {
                        changes,
                        range: EditorSelection.range(
                            range.from + extendBefore,
                            range.to + extendAfter
                        ),
                    };
                });
                dispatch(
                    state.update(changes, {
                        scrollIntoView: true,
                        annotations: Transaction.userEvent.of("input"),
                    })
                );
                return true;
            };
            return [
                {
                    key: `${mod}-${key.toUpperCase()}`,
                    run: handler,
                },
                {
                    key: `${mod}-${key.toLowerCase()}`,
                    run: handler,
                },
            ];
        };

        const codemirrorView = shallowRef();
        const handleReady = (payload) => {
            codemirrorView.value = payload.view
        }

        const extensions = [
            markdown(),
            EditorView.lineWrapping,
            keymap.of([
                ...createCustomKeyMod("Mod", "b", "**"),
                ...createCustomKeyMod("Mod", "e", "_"),
                ...createCustomKeyMod("Mod", "k", "`"),
                ...createCustomKeyMod("Mod-Shift", "d", "~~"),
            ]),
        ];
        return {
            extensions,
            handleReady,
            codemirrorView
        };
    },
    computed: {
        compiledMarkdown: function () {
            return DOMPurify.sanitize(
                this.md?.render(this.inputText) ?? ""
            );
        },
        showLeftPane() {
            return this.currentLayout === 1 || this.currentLayout === 2;
        },
        showRightPane() {
            return this.currentLayout === 0 || this.currentLayout === 2;
        },
        codemirrorExtensions() {
            return this.currentTheme ? this.extensions : [...this.extensions, oneDark]
        }
    },
    created() {
        this.isIPCSupported = window.ipcRenderer !== undefined && window.ipcRenderer !== null;
    },
    async beforeMount() {
        // pull data if there is any
        // this is used for cases where the user opens file with the "Open with" context menu option
        let data = await this.ipcCallWrapper(IPCCommands.GET_OPEN_DATA);
        if (data !== undefined && data[1] !== undefined) {
            this.inputText = data[0];
            this.fileOpened = false;
            this.modified = false;
            this.ipcCallWrapper(IPCCommands.SET_MODIFIED, false, this.inputText);
        }

        let userPreferences = await this.getPreferences();
        this.currentLayout = userPreferences?.currentLayout ?? 2;
        this.spellCheck = userPreferences?.spellCheck ?? false;
        this.currentTheme = userPreferences?.currentTheme ?? false;
        this.scrollLink = userPreferences?.scrollLink ?? true;

        // enable spellcheck
        this.updateSpellCheck();

        // update theme
        this.updateTheme();

        // setup listeners
        this.setupListeners();
    },
    mounted() {

        // setup markdown-it and add plugins
        this.md = new MarkdownIt({
            linkify: true,
        }).use(MarkdownitSup)
            .use(MarkdownItInjectLineNumbers)
            .use(MarkdownitSub)
            .use(MarkdownitEmoji)
            .use(MarkdownitCheckbox, {
                disabled: false,
            });

        // add hook to override target in anchor tags
        DOMPurify.addHook("afterSanitizeAttributes", function (node) {
            if ("target" in node) {
                node.setAttribute("target", "_blank");
            }
        });
    },
    methods: {
        /**
         * Helper Functions
        */
        async ipcCallWrapper(...args) {
            // call ipcRenderer only if it is defined
            return await window.ipcRenderer?.call(...args)
        },
        setupListeners() {

            // override the ctrl+s key combo
            document.onkeydown = async (e) => {
                let prevent = false;
                if (e.ctrlKey) {
                    if (e.code === "KeyO") {
                        // open file
                        await this.onOpenFile();
                        prevent = true;
                    } else if (e.code === "KeyS") {
                        if (e.shiftKey) {
                            // save as
                            await this.onSaveAsFile();
                            prevent = true;
                        } else {
                            // save
                            await this.onSaveFile();
                            prevent = true;
                        }
                    } else if (e.code === "Tab") {
                        // focus open button (escape editor focus)
                        document.getElementById("open-button").focus();
                        prevent = true;
                    }
                }

                if (prevent) {
                    e.preventDefault();
                }
            };

            // setup resize listener
            addEventListener("resize", () => {
                this.titleBarKey = Math.random().toString(); // Update the title bar
                this.scrollMap = undefined;
            });

            // setup scroll listeners
            this._setupScrollEventListeners();
        },
        /**
         * Scroll Functions
        */
        _setupScrollEventListeners() {

            let viewFunc = debounce(
                (event) => {
                    this.syncEditorScroll(event);
                }, 50);

            let editorFunc = debounce(
                (event) => {
                    this.syncViewerScroll(event);
                }, 50);

            // remove scroll event handlers
            this.$refs.viewer?.removeEventListener('scroll', viewFunc);
            this.codemirrorView.scrollDOM?.removeEventListener('scroll', editorFunc)

            // setup scroll event handler
            this.$refs.viewer?.addEventListener('scroll', viewFunc, false)
            this.codemirrorView.scrollDOM?.addEventListener('scroll', editorFunc, false)
        },
        resetScroll() {
            let viewer = this.$refs.viewer;
            if (viewer) {
                viewer.scrollTop = 0;
            }
            let editorScroller = this.codemirrorView.scrollDOM;
            if (editorScroller) {
                editorScroller.scrollTop = 0;
            }
        },
        buildScrollMap() {
            let editor = this.codemirrorView.scrollDOM;
            let preview = this.$refs.viewer
            if (!editor || !preview) {
                return;
            }

            let offset = preview.scrollTop - preview.offsetTop;
            let _scrollMap = new Array(this.codemirrorView.state.doc.lines).fill(0);
            let editorLines = this.codemirrorView.state.doc.children.map(x => x.text).flat(1);
            editorLines.forEach((str, i) => {
                if (i === 0) {
                    _scrollMap[i] = 0;
                    return;
                }

                if (str.length === 0) {
                    _scrollMap[i] = _scrollMap[i - 1] + 1;
                    return;
                }

                let offsetTop = document.querySelector(`[data-source-line="${i}"]`)?.offsetTop;
                if (offsetTop !== undefined) {
                    _scrollMap[i] = Math.floor(offsetTop + offset);
                } else {
                    _scrollMap[i] = _scrollMap[i - 1] + 1;
                }
            });

            this.scrollMap = _scrollMap;
        },
        syncEditorScroll(event) {
            if ((event && !event.target.matches(":hover")) || !this.scrollLink) {
                return;
            }

            // sync editor
            if (!this.scrollMap) {
                this.buildScrollMap();
            }
            let preview = this.$refs.viewer;
            let editorScroller = this.codemirrorView.scrollDOM;

            if (!preview || !editorScroller || this.scrollMap.length < 1) {
                return;
            }

            let el;
            let min = Number.MAX_VALUE;
            let els = document.querySelectorAll('[data-source-line]');
            for (let i = 0; i < els.length; i++) {
                let top = Math.abs(els[i].getBoundingClientRect().top);
                if (top < min) {
                    min = top;
                    el = els[i];
                }
            }
            let lineNo = parseInt(el?.dataset.sourceLine ?? 0);
            editorScroller.scrollTop = lineNo * this.codemirrorView.defaultLineHeight;

            // lock the scroller of the editor until animation is complete
            this.scrollLock[1] = true;
            editorScroller?.addEventListener('scrollend', () => {
                // release lock
                this.scrollLock[1] = false;
            }, { once: true })

        },
        syncViewerScroll(event) {
            if ((event && !event.target.matches(":hover")) ||
                (event && event.target.matches(":hover") && this.scrollLock[1]) ||
                !this.scrollLink) {
                return;
            }

            // sync preview
            if (!this.scrollMap) {
                this.buildScrollMap();
            }
            let preview = this.$refs.viewer;
            let editorScroller = this.codemirrorView.scrollDOM;

            if (!preview || !editorScroller) {
                return;
            }

            let editorTopHeight = this.codemirrorView.lineBlockAtHeight(editorScroller.scrollTop).from;
            let topLineNo = this.codemirrorView.state.doc.lineAt(editorTopHeight).number
            preview.scrollTop =  this.scrollMap[topLineNo - 1];

            // lock the scroller of the viewer until animation is complete
            this.scrollLock[0] = true;
            preview?.addEventListener('scrollend', () => {
                // release lock
                this.scrollLock[0] = false;
            }, { once: true })
        },
        /**
         * On Change Functions
        */
        onInputUpdate() {
            if (this.fileOpened) {
                this.fileOpened = false;
                this.modified = false;
                this.ipcCallWrapper(IPCCommands.SET_MODIFIED, false, this.inputText);
            } else {
                this.modified = true;
                this.ipcCallWrapper(IPCCommands.SET_MODIFIED, true, this.inputText);
            }
            this.scrollMap = undefined;
        },
        /**
         * IO Functions
        */
        async onOpenFile() {
            if (this.editorLocked) {
                return;
            }
            this.editorLocked = true;

            if (this.isIPCSupported) {
                // use IPC to handle open file
                let data = await this.ipcCallWrapper(IPCCommands.OPEN_FILE);
                if (data !== undefined) {
                    this.fileOpened = true;
                    this.inputText = data;

                    this.resetScroll();
                    this.scrollMap = undefined;
                }
            } else {
                // use browser to handle open file
                let inputEl = document.createElement('input');
                inputEl.type = 'file';
                inputEl.accept = ".txt,.md"
                inputEl.style.display = "none";
                inputEl.onchange = () => {
                    let files = Array.from(inputEl.files);
                    if (files.length > 0) {
                        let file = files[0];
                        let reader = new FileReader();
                        reader.readAsText(file);
                        reader.onload = () => {
                            this.fileOpened = true;
                            this.inputText = reader.result;

                            this.resetScroll();
                            this.scrollMap = undefined;

                            this.titleBarKey = Math.random().toString(); // Update the title bar
                            this.modified = false;
                            this.editorLocked = false;
                        }
                        inputEl.remove();
                    }
                };
                inputEl.oncancel = () => {
                    this.modified = false;
                    this.editorLocked = false;
                }
                inputEl.click();
            }

            if (this.isIPCSupported) {
                this.titleBarKey = Math.random().toString(); // Update the title bar
                this.modified = false;
                this.editorLocked = false;
            }
        },
        async onSaveFile() {
            if (this.editorLocked) {
                return;
            }
            this.editorLocked = true;

            if (this.isIPCSupported) {
                // use IPC to handle save file
                let result = await this.ipcCallWrapper(IPCCommands.SAVE_FILE, this.inputText);
                if (result === 2) {
                    // there is no existing file to save
                    // so we defer to save-as file instead
                    this.editorLocked = false;
                    await this.onSaveAsFile();
                } else if (result === 0) {
                    this.modified = false;
                    this.ipcCallWrapper(IPCCommands.SET_MODIFIED, false);
                }
            } else {
                // defer to save as
                this.editorLocked = false;
                this.onSaveAsFile();
            }


            this.editorLocked = false;
        },
        async onSaveAsFile() {
            if (this.editorLocked) {
                return;
            }

            this.editorLocked = true;

            if (this.isIPCSupported) {
                // use IPC to handle save file
                let result = await this.ipcCallWrapper(
                    IPCCommands.SAVE_AS_FILE,
                    this.inputText
                );
                if (result === 0) {
                    this.modified = false;
                    this.ipcCallWrapper(IPCCommands.SET_MODIFIED, false, this.inputText);
                }
            } else {
                // use browser to handle save file
                let fileBlob = new Blob([this.inputText], { type: 'text/plain' });
                let fileNameToSaveAs = "file.md";

                let downloadLink = document.createElement("a");
                downloadLink.download = fileNameToSaveAs;
                downloadLink.innerHTML = "Download File";
                downloadLink.style.display = "none";
                if (window.webkitURL != null) {
                    // Chrome allows the link to be clicked without actually adding it to the DOM.
                    downloadLink.href = window.webkitURL.createObjectURL(fileBlob);
                } else {
                    // Firefox requires the link to be added to the DOM before it can be clicked.
                    downloadLink.href = window.URL.createObjectURL(fileBlob);
                    downloadLink.onclick = () => {
                        downloadLink.remove();
                        this.editorLocked = false;
                    }
                    document.body.appendChild(downloadLink);
                }

                downloadLink.click();
            }

            this.editorLocked = false;
        },
        /**
         * Tool Bar Functions
        */
        onLayoutChange() {
            this.currentLayout = (this.currentLayout + 1) % 3;

            if (this.currentLayout === 2) {
                this.$nextTick(() => {
                    // set up scroll listeners again
                    this._setupScrollEventListeners();
                });
                this.syncViewerScroll();
            } else if (this.currentLayout > 0) {
                this.$nextTick(() => {
                    // set spell check
                    this.updateSpellCheck();
                });
            }

            this.updatePreferences();
        },
        onSpellCheckToggle() {
            this.spellCheck = !this.spellCheck;
            this.updateSpellCheck();
            this.updatePreferences();
        },
        onThemeToggle() {
            this.currentTheme = !this.currentTheme
            this.updateTheme();
            this.updatePreferences();
        },
        onScrollLinkToggle() {
            this.scrollLink = !this.scrollLink
            if (this.scrollLink) {
                this.syncViewerScroll();
            }
            this.updatePreferences();
        },
        updateSpellCheck() {
            let el = this.codemirrorView.contentDOM;
            if (el) {
                el.spellcheck = this.spellCheck;
            }
        },
        updateTheme() {
            if (this.currentTheme) {
                document.documentElement.className = "light-theme";
            } else {
                document.documentElement.className = "dark-theme";
            }
        },
        async getPreferences() {
            if (this.isIPCSupported) {
                // get preferences from file
                return await this.ipcCallWrapper(IPCCommands.GET_PREFERENCES)
            } else {
                // get from local storage
                return JSON.parse(localStorage?.getItem("preferences"));
            }
        },
        updatePreferences() {
            let preferences = {
                currentLayout: this.currentLayout,
                spellCheck: this.spellCheck,
                currentTheme: this.currentTheme,
                scrollLink: this.scrollLink
            };
            if (this.isIPCSupported) {
                // set preferences to file
                this.ipcCallWrapper(IPCCommands.SET_PREFERENCES, preferences);
            } else {
                // set preferences to local storage
                localStorage?.setItem('preferences', JSON.stringify(preferences))
            }
        },
    },
};
</script>
