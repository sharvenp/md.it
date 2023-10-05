<template>
    <div class="view">
        <div class="row">
            <TitleBarV
                :key="titleBarKey"
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
                        <codemirror v-model="inputText" :style="{
                            width: '100%',
                            height: '100%',
                        }" placeholder="Type something..." :autofocus="true" :indent-with-tab="true" :tab-size="2"
                            :extensions="codemirrorExtensions" :disabled="editorLocked" @change="onUpdate" />
                    </div>
                </pane>
                <pane v-if="showRightPane">
                    <div id="view-col" class="p-0 column">
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
                :current-theme="currentTheme"
                :isIPCSupported="isIPCSupported"
                @toggle-spell-check="onSpellCheckToggle"
                @layout-change="onLayoutChange"
                @open-file="onOpenFile"
                @save-file="onSaveFile"
                @save-as-file="onSaveAsFile"
                @toggle-theme="onThemeToggle"
            />
        </div>
    </div>
</template>

<script>
import { Codemirror } from "vue-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorSelection, Transaction, Text } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

import { Splitpanes, Pane } from "splitpanes";

import MarkdownIt from 'markdown-it';
import MarkdownitSup from 'markdown-it-sup';
import MarkdownitCheckbox from 'markdown-it-task-checkbox';
import MarkdownitSub from 'markdown-it-sub';
import MarkdownitEmoji from 'markdown-it-emoji';

import DOMPurify from "dompurify";

import ToolBarV from "./ToolBar.vue";
import TitleBarV from "./TitleBar.vue";
import IPCCommands from "@/ipcCommands";

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
            spellCheck: false,
            editorLocked: false,
            fileOpened: false,
            renderer: undefined,
            md: undefined,
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
        };
    },
    computed: {
        compiledMarkdown: function () {
            return DOMPurify.sanitize(
                this.md?.render(this.preProcessText(this.inputText)) ?? ""
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

        // enable spellcheck
        this.updateSpellCheck();

        // update theme
        this.updateTheme();
    },
    mounted() {

        // setup markdown-it and add plugins
        this.md = new MarkdownIt({
            linkify: true,
        }).use(MarkdownitSup)
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
    },
    updated() {
        this.$nextTick(() => {
            this.updateSpellCheck();
        });
    },
    methods: {
        preProcessText(text) {
            // pre-process the text before rendering

            // nothing for now
            return text;
        },
        async ipcCallWrapper(...args) {
            // call ipcRenderer only if it is defined
            return await window.ipcRenderer?.call(...args)
        },
        onUpdate() {
            if (this.fileOpened) {
                this.fileOpened = false;
                this.modified = false;
                this.ipcCallWrapper(IPCCommands.SET_MODIFIED, false, this.inputText);
            } else {
                this.modified = true;
                this.ipcCallWrapper(IPCCommands.SET_MODIFIED, true, this.inputText);
            }
        },
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
                        var reader = new FileReader();
                        reader.readAsText(file);
                        reader.onload = () => {
                            this.fileOpened = true;
                            this.inputText = reader.result;
                        }
                        inputEl.remove();
                    }
                };
                inputEl.click();
            }

            this.titleBarKey = Math.random().toString(); // Update the title bar
            this.modified = false;
            this.editorLocked = false;
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
                var fileBlob = new Blob([this.inputText], { type: 'text/plain' });
                var fileNameToSaveAs = "file.md";

                var downloadLink = document.createElement("a");
                downloadLink.download = fileNameToSaveAs;
                downloadLink.innerHTML = "Download File";
                downloadLink.style.display = "none";
                if (window.webkitURL != null) {
                    // Chrome allows the link to be clicked without actually adding it to the DOM.
                    downloadLink.href = window.webkitURL.createObjectURL(fileBlob);
                } else {
                    // Firefox requires the link to be added to the DOM before it can be clicked.
                    downloadLink.href = window.URL.createObjectURL(fileBlob);
                    downloadLink.onclick = () => downloadLink.remove();
                    document.body.appendChild(downloadLink);
                }

                downloadLink.click();
            }

            this.editorLocked = false;
        },
        onLayoutChange() {
            this.currentLayout = (this.currentLayout + 1) % 3;
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
        updateSpellCheck() {
            let el = document.getElementsByClassName("cm-content")[0];
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
                currentTheme: this.currentTheme
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
