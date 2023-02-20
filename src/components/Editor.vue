<template>
  <div class="view">
    <div class="row">
      <splitpanes class="default-theme">
        <pane v-if="showLeftPane">
          <div id="editor-col" class="p-0 column">
            <codemirror
              v-model="inputText"
              :style="{
                width: '100%',
                height: '100%',
              }"
              placeholder="Type something..."
              :autofocus="true"
              :indent-with-tab="true"
              :tab-size="2"
              :extensions="extensions"
              :disabled="editorLocked"
              @change="onUpdate"
            />
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
        @layout-change="onLayoutChange"
        @open-file="onOpenFile"
        @save-file="onSaveFile"
        @save-as-file="onSaveAsFile"
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

import { marked } from "marked";
import DOMPurify from "dompurify";
import ToolBarV from "./ToolBar.vue";

export default {
  name: "EditorV",
  components: {
    Codemirror,
    ToolBarV,
    Splitpanes,
    Pane,
  },
  data() {
    return {
      inputText: "",
      currentLayout: 2,
      editorLocked: false,
      fileOpened: false,
      renderer: undefined,
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
      oneDark,
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
  async created() {
    // pull data if there is any
    // this is used for cases where the user opens file with the "Open with" context menu option
    let data = await window.ipcRenderer.call("GET_OPEN_DATA");
    if (data[1] !== undefined) {
      this.fileOpened = true;
      this.inputText = data[0];
    }
  },
  computed: {
    compiledMarkdown: function () {
      return DOMPurify.sanitize(
        marked(this.inputText, { renderer: this.renderer })
      );
    },
    showLeftPane() {
      return this.currentLayout === 1 || this.currentLayout === 2;
    },
    showRightPane() {
      return this.currentLayout === 0 || this.currentLayout === 2;
    },
  },
  mounted() {
    // override the anchor tag generator to open links in new tab
    this.renderer = new marked.Renderer();
    this.renderer.link = function (href, title, text) {
      return (
        '<a target="_blank" href="' +
        href +
        '" title="' +
        title +
        '">' +
        text +
        "</a>"
      );
    };

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
  methods: {
    onUpdate() {
      if (this.fileOpened) {
        this.fileOpened = false;
        window.ipcRenderer.call("SET_MODIFIED", false, this.inputText);
      } else {
        window.ipcRenderer.call("SET_MODIFIED", true, this.inputText);
      }
    },
    async onOpenFile() {
      if (this.editorLocked) return;

      this.editorLocked = true;
      let data = await window.ipcRenderer.call("OPEN_FILE");
      if (data !== undefined) {
        this.fileOpened = true;
        this.inputText = data;
      }
      this.editorLocked = false;
    },
    async onSaveFile() {
      if (this.editorLocked) return;

      this.editorLocked = true;
      let result = await window.ipcRenderer.call("SAVE_FILE", this.inputText);
      if (result === 2) {
        // there is no existing file to save
        // so we defer to save-as file instead
        this.editorLocked = false;
        await this.onSaveAsFile();
      } else if (result === 0) {
        window.ipcRenderer.call("SET_MODIFIED", false);
      }
      this.editorLocked = false;
    },
    async onSaveAsFile() {
      if (this.editorLocked) return;

      this.editorLocked = true;
      let result = await window.ipcRenderer.call(
        "SAVE_AS_FILE",
        this.inputText
      );
      if (result === 0) {
        window.ipcRenderer.call("SET_MODIFIED", false);
      }
      this.editorLocked = false;
    },
    onLayoutChange() {
      this.currentLayout = (this.currentLayout + 1) % 3;
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Fira+Mono&display=swap");

.cm-editor * {
  font-family: "Fira Mono", monospace;
}

.view {
  margin: 0 12px 0 12px;
}

.preview {
  width: 100%;
  height: auto;
  min-height: 100%;
  padding: 20px 20px 40px 20px;
  color: white;
  text-align: left;
  background-color: rgb(40, 44, 52) !important;
}

.column {
  /* adjust height for the bottom bar */
  height: calc(100vh - 67px);
  overflow: auto;
}

.splitpanes--vertical > .splitpanes__splitter {
  border: none !important;
  width: 10px !important;
  background-color: rgb(48, 54, 61) !important;
}
</style>
