<template>
  <div class="view">
    <div class="row">
      <div
        v-if="showLeftPane"
        class="col p-0 column divide-right"
        id="input-column"
      >
        <textarea
          v-model="inputText"
          @input="update"
          ref="input"
          class="form-control input"
        ></textarea>
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
import { marked } from "marked";
import DOMPurify from "dompurify";
import BottomBarV from "./BottomBar.vue";

export default {
  name: "EditorV",
  components: {
    BottomBarV,
  },
  data() {
    return {
      inputText: `# New document

*Type something...*
`,
      currentLayout: 2,
      renderer: undefined,
      keysPressed: {},
    };
  },
  computed: {
    compiledMarkdown: function () {
      // return DOMPurify.sanitize(
      //   marked(this.inputText, { renderer: this.renderer })
      // );

      return marked(this.inputText, { renderer: this.renderer });
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

    // add hook to override targer in a tags
    DOMPurify.addHook("afterSanitizeAttributes", function (node) {
      if ("target" in node) {
        node.setAttribute("target", "_blank");
      }
    });

    // override the key handler to allow tabbing and stuff
    this.$refs.input.addEventListener(
      "keydown",
      (e) => {
        this.keysPressed[e.key] = true;
        this.keyHandler(e);
      },
      false
    );
    this.$refs.input.addEventListener(
      "keyup",
      (e) => {
        if (e.key in this.keysPressed) {
          delete this.keysPressed[e.key];
        }
        this.keyHandler(e);
      },
      false
    );
  },
  methods: {
    keyHandler(e) {
      let handled = false;

      if (this.keysPressed["Tab"]) {
        let idx = this.$refs.input.selectionStart;

        if (this.keysPressed["Shift"]) {
          if (
            idx >= 4 &&
            this.$refs.input.value.substring(idx - 4, idx) === "    "
          ) {
            // remove tab
            this.$refs.input.setRangeText("", idx - 4, idx, "end");
          }
        } else {
          // add tab
          this.$refs.input.setRangeText("    ", idx, idx, "end");
        }
        handled = true;
      }

      if (handled) e.preventDefault();
    },
    update(e) {
      this.inputText = e.target.value;

      // calculate the scroll to keep in sync
      var inputEle = this.$refs.input;
      let relativeScroll =
        (inputEle.scrollTop + inputEle.offsetHeight) / inputEle.scrollHeight;

      var previewEle = this.$refs.preview;
      previewEle.scrollTop = Math.round(
        previewEle.scrollHeight * relativeScroll - previewEle.offsetHeight
      );
    },
    onLayoutChange() {
      this.currentLayout = (this.currentLayout + 1) % 3;
    },
    onOpenFile(data) {
      this.inputText = data;
      console.log("open file");
    },
    onSaveFile() {
      // TODO
      console.log("save file");
    },
  },
};
</script>

<style scoped>
.view {
  margin: 0 12px 0 12px;
  text-align: left;
  background-color: rgb(33, 33, 33) !important;
}

.divide-right {
  border-right: rgb(48, 54, 61) 2px solid;
}
.divide-left {
  border-left: rgb(48, 54, 61) 2px solid;
}

.input {
  font-size: 14px;
  font-family: "Monaco", courier, monospace;
  width: 100%;
  height: 100%;
  padding: 20px;
  border-radius: 0 !important;
}

textarea {
  resize: none;
  border: none;
  outline: none;
  background-color: rgb(27, 27, 27) !important;
  color: white !important;
}

.preview {
  width: 100%;
  padding: 20px 20px 40px 20px;
}

.column {
  height: 94vh;
  overflow: auto;
}
</style>
