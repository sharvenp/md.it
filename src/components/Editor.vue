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
          id="input"
          class="form-control input"
        ></textarea>
      </div>
      <div
        v-if="showRightPane"
        class="col p-0 column divide-left"
        id="preview-column"
      >
        <div v-html="compiledMarkdown" id="preview" class="preview"></div>
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
    var inputEle = document.getElementById("input");
    if (inputEle.addEventListener) {
      inputEle.addEventListener("keydown", this._keyHandler, false);
    } else if (inputEle.attachEvent) {
      inputEle.attachEvent("onkeydown", this._keyHandler); /* damn IE hack */
    }
  },
  methods: {
    _keyHandler(e) {
      var TABKEY = 9;
      if (e.keyCode == TABKEY) {
        this.inputText += "\t";
        if (e.preventDefault) {
          e.preventDefault();
        }
        return false;
      }
    },
    update(e) {
      this.inputText = e.target.value;

      // calculate the scroll to keep in sync
      var inputEle = document.getElementById("input");
      let relativeScroll =
        (inputEle.scrollTop + inputEle.offsetHeight) / inputEle.scrollHeight;

      var previewEle = document.getElementById("preview-column");
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
  background-color: rgb(15, 20, 27) !important;
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
  background-color: rgb(13, 17, 23) !important;
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
