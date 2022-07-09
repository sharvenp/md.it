<template>
  <div class="view">
    <div class="row">
      <div
        v-if="showLeftPane"
        class="col p-0 column divide-right"
        id="input-column"
      >
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
      <div
        v-if="showRightPane"
        class="col p-0 column divide-left"
        ref="preview"
      >
        <div v-html="compiledMarkdown" class="preview"></div>
      </div>
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
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

import { marked } from "marked";
import DOMPurify from "dompurify";
import ToolBarV from "./ToolBar.vue";

export default {
  name: "EditorV",
  components: {
    Codemirror,
    ToolBarV,
  },
  data() {
    return {
      //       inputText: `# New document

      // *Type something...*
      // `,
      inputText: `# Buggy

## Pitch

Web app where users can upload debugging problems in some language and other users try to debug it by highlighting the problematic lines.

## Details

- Main page has list of all problems

  - Sort by trending, top, new
  - User cannot solve the same problem again

- Adding a new problem

  - Text editor - paste code here
  - Select language
  - Highlight problematic lines
    - Add optional comments
  - What about multi-file programs (like Java classes and C modules)
    - Put them all in the same file
    - Max line count of 1000

- Solving a problem

  - User can highlight lines and submit
  - App gives them feedback on right/wrong
  - Keeps track of attempts
  - User can choose to show the answer
  - User can upvote/downvote posts (can only do this after solving it)
  - User can report post if answer seems incorrect
    - OC might receive warning/ban after admin reviews it

- Profile view
  - Users can see other user's profiles
    - Username
    - Bio
    - Avatar
    - List of solved problems

## Types of debugging problems

- Runtime error

- Wrong output

  - Defined input/output cases
  - Expected output
  - Actual output

- Race conditions
- Memory leaks
- Security vulnerabilities

`,
      currentLayout: 2,
      editorLocked: false,
      fileOpened: false,
      renderer: undefined,
    };
  },
  setup() {
    const extensions = [markdown(), oneDark];
    return {
      extensions,
    };
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
        window.ipcRenderer.call("SET_MODIFIED", false);
      } else {
        window.ipcRenderer.call("SET_MODIFIED", true);
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
  background-color: rgb(40, 44, 52);
}

.divide-right {
  border-right: rgb(48, 54, 61) 2px solid;
}
.divide-left {
  border-left: rgb(48, 54, 61) 2px solid;
}

.preview {
  width: 100%;
  height: auto;
  min-height: 100%;
  padding: 20px 20px 40px 20px;
  /* background-color: rgb(40, 44, 52); */
  color: white;
  text-align: left;
}

.column {
  /* adjust height for the bottom bar */
  height: calc(100vh - 67px);
  overflow: auto;
}
</style>
