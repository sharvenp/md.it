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
import copy from "copy-to-clipboard";

const TAB_SIZE = 4;
const MAX_HISTORY_SIZE = 100;

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
      history: [],
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

    // listen for key presses and handle them accordingly
    this.$refs.input.addEventListener(
      "keydown",
      (e) => {
        this.keysPressed[e.key] = true;
        this.keyInterceptor(e);
      },
      false
    );
    this.$refs.input.addEventListener(
      "keyup",
      (e) => {
        if (e.key in this.keysPressed) {
          delete this.keysPressed[e.key];
        }
        this.keyInterceptor(e);
      },
      false
    );
    window.onblur = () => {
      this.keysPressed = {};
    };
  },
  methods: {
    keyInterceptor(e) {
      let intercepted = false;
      let textValue = this.$refs.input.value;
      let textLines = this.$refs.input.value
        .substr(0, this.$refs.input.selectionStart)
        .split("\n");
      let lineIdx = textLines.length - 1;
      let allLines = this.$refs.input.value.split("\n");

      if (this.keysPressed["Tab"]) {
        // insert tab character (TAB_SIZE spaces)

        this.pushHistory();

        let idx = this.$refs.input.selectionStart;
        let tab = " ".repeat(TAB_SIZE); // tab is made of spaces

        if (this.keysPressed["Shift"]) {
          // shift + tab removes tab
          // check if tab can be removed
          if (
            idx >= TAB_SIZE &&
            textValue.substring(idx - TAB_SIZE, idx) === tab
          ) {
            // remove tab
            this.$refs.input.setRangeText("", idx - TAB_SIZE, idx, "end");
          }
        } else {
          // add tab
          this.$refs.input.setRangeText(tab, idx, idx, "end");
        }
        intercepted = true;
      }

      if (this.keysPressed["Control"]) {
        let startIdx = this.$refs.input.selectionStart;
        let endIdx = this.$refs.input.selectionEnd;

        if (this.keysPressed["b"]) {
          // bold
          this.pushHistory();

          this.$refs.input.setRangeText("**", startIdx, startIdx, "end");
          this.$refs.input.setRangeText("**", endIdx + 2, endIdx + 2, "end"); // need to add 2 to account for the asteriks added
          intercepted = true;
        } else if (this.keysPressed["i"]) {
          // italics
          this.pushHistory();

          this.$refs.input.setRangeText("*", startIdx, startIdx, "end");
          this.$refs.input.setRangeText("*", endIdx + 1, endIdx + 1, "end"); // need to add 1 to account for the asteriks added
          intercepted = true;
        } else if (this.keysPressed["c"] || this.keysPressed["x"]) {
          if (startIdx === endIdx) {
            this.pushHistory();

            // copy line
            copy(allLines[lineIdx] + "\n\n"); // copy to clipboard
            if (this.keysPressed["x"]) {
              // cut line
              allLines.splice(lineIdx, 1);
              this.$refs.input.value = allLines.join("\n");

              // reposition the cursor
              let stringLength = 0;
              for (
                let i = 0;
                i < Math.min(0, Math.max(lineIdx, allLines.length - 1));
                i++
              ) {
                stringLength += allLines[i].length + 1; // add 1 for new line
              }
              this.$refs.input.setSelectionRange(stringLength, stringLength);
            }
            intercepted = true;
          }
        } else if (this.keysPressed["z"]) {
          // undo
          if (this.history.length > 0) {
            const lastText = this.history.shift();
            this.$refs.input.value = lastText;
          }
        }
      }

      if (this.keysPressed["Alt"]) {
        // move line up or down
        let direction = this.keysPressed["ArrowUp"]
          ? -1
          : this.keysPressed["ArrowDown"]
          ? 1
          : 0;
        if (direction !== 0) {
          if (
            lineIdx + direction >= 0 &&
            lineIdx + direction <= allLines.length - 1
          ) {
            // move the line
            const line = allLines.splice(lineIdx, 1)[0];
            allLines.splice(lineIdx + direction, 0, line);
            this.$refs.input.value = allLines.join("\n");

            // reposition the cursor
            let stringLength = 0;
            for (let i = 0; i < lineIdx + direction; i++) {
              stringLength += allLines[i].length + 1; // add 1 for new line
            }

            const newCursorIdx = this.$refs.input.value.indexOf(
              line,
              stringLength
            );
            this.$refs.input.setSelectionRange(newCursorIdx, newCursorIdx);
          }

          intercepted = true;
        }
      }

      if (intercepted) {
        e.preventDefault(); // prevent default keystroke behavior
        this.update();
      }
    },
    update() {
      this.inputText = this.$refs.input.value;

      // calculate the scroll to keep in sync
      var inputEle = this.$refs.input;
      let relativeScroll =
        (inputEle.scrollTop + inputEle.offsetHeight) / inputEle.scrollHeight;

      var previewEle = this.$refs.preview;
      previewEle.scrollTop = Math.round(
        previewEle.scrollHeight * relativeScroll - previewEle.offsetHeight
      );
    },
    onOpenFile(data) {
      this.inputText = data;
      console.log("open file");
    },
    onSaveFile() {
      // TODO
      console.log("save file");
    },
    pushHistory() {
      this.history.push(this.inputText);
      if (this.history.length > MAX_HISTORY_SIZE) {
        this.history.shift();
      }
    },
    onLayoutChange() {
      this.currentLayout = (this.currentLayout + 1) % 3;
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
