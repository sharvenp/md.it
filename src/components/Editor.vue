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
          :autofocus="true"
          :indent-with-tab="true"
          :tab-size="2"
          :extensions="extensions"
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
      <BottomBarV
        :currentLayout="currentLayout"
        @layout-change="onLayoutChange"
        @open-file="onOpenFile"
        @save-file="onSaveFile"
      />
    </div>
  </div>
</template>

<script>
import { Codemirror } from "vue-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

import { marked } from "marked";
import { saveAs } from "file-saver";
import DOMPurify from "dompurify";
import BottomBarV from "./BottomBar.vue";

export default {
  name: "EditorV",
  components: {
    Codemirror,
    BottomBarV,
  },
  setup() {
    const extensions = [markdown(), oneDark];
    return {
      extensions,
    };
  },
  data() {
    return {
      inputText: `# New document

*Type something...*
`,
      currentLayout: 2,
      renderer: undefined,
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
  },
  methods: {
    onOpenFile(file) {
      const reader = new FileReader();
      reader.onload = (res) => {
        this.inputText = res.target.result;
      };
      reader.readAsText(file);
    },
    onSaveFile() {
      let blob = new Blob([this.inputText], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(blob, "untitled.md");
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
  background-color: rgb(38, 43, 51);
  color: white;
  text-align: left;
}

.column {
  height: 94vh;
  overflow: auto;
}
</style>
