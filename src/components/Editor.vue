<template>
  <div class="view">
    <div class="row vh-100">
      <div class="col p-0 divide">
        <textarea v-model="inputText" @input="update" class="input"></textarea>
      </div>
      <div class="col p-0">
        <div v-html="compiledMarkdown" class="preview overflow-auto"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from "marked";

export default {
  name: "EditorV",
  data() {
    return {
      inputText: "*Enter text here...*",
    };
  },
  computed: {
    compiledMarkdown: function () {
      return marked(this.inputText, { sanitize: true });
    },
  },
  methods: {
    update(e) {
      this.inputText = e.target.value;
    },
  },
};
</script>

<style scoped>
textarea {
  resize: none;
}

.view {
  margin: 0 12px 0 12px;
}

.divide {
  border-right: #aaa 1px solid;
}

.input {
  background-color: #333;
  color: white;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: "Monaco", courier, monospace;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.preview {
  background-color: #333;
  color: white;
  text-align: left;
  margin: 0;
  width: 100%;
  height: 100%;
  font-family: "Helvetica Neue", Arial, sans-serif;
  padding: 20px;
}
</style>
