<template>
  <div class="view">
    <div class="row">
      <div class="col p-0 column divide" id="input-column">
        <textarea
          v-model="inputText"
          @input="update"
          id="input"
          class="form-control input"
        ></textarea>
      </div>
      <div class="col p-0 column" id="preview-column">
        <div v-html="compiledMarkdown" id="preview" class="preview"></div>
      </div>
    </div>
    <div class="row"><BottomBarV /></div>
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
      inputText: `
# Section 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec non risus congue, luctus erat aliquam, placerat ligula. Nunc dignissim justo non mattis suscipit. Praesent accumsan, enim nec ornare lacinia, justo arcu posuere justo, a tincidunt dui lorem porta leo. Donec sed sapien tempus, suscipit libero sed, luctus ipsum. Duis lobortis quam elit, eu fringilla nulla tempus at. Vestibulum in magna turpis. Pellentesque sapien ligula, gravida vel dapibus non, maximus id velit. Aliquam posuere turpis turpis, eu rutrum erat cursus vitae. Integer ut orci vitae purus vehicula mattis placerat at nulla. Nam imperdiet augue vitae lectus porta blandit. Vestibulum quis purus et ex scelerisque convallis. In hac habitasse platea dictumst. Nullam dictum eget nisi eu interdum.

# Section 2

Sed condimentum vehicula dui. Donec laoreet leo et neque malesuada, accumsan gravida lectus viverra. In auctor nisi a nisi dignissim ornare. Suspendisse orci odio, interdum eu tincidunt id, venenatis vitae metus. Praesent quis porta eros, sed sagittis orci. Proin vestibulum nec justo at ullamcorper. Curabitur commodo hendrerit ante. Vestibulum ut orci non justo commodo fringilla vitae non lorem. Donec a cursus odio. Ut luctus molestie odio, quis sollicitudin sem porta a. Sed tristique sollicitudin libero, quis blandit ligula posuere sit amet. Vivamus vestibulum tortor sit amet orci ullamcorper ultrices id eu sem. Ut elit est, interdum vitae lacinia eget, lacinia vitae arcu. Mauris tristique tempus quam, vel imperdiet justo tincidunt id. Cras iaculis diam sit amet mauris placerat, sit amet vehicula diam sodales. Vivamus id ex tristique, lobortis lacus quis, rutrum felis.

# Section 3

Nullam non faucibus mauris, sit amet posuere velit. Praesent nec dolor pharetra, faucibus odio id, posuere velit. Etiam in elementum tellus. Quisque porttitor laoreet cursus. Nunc vehicula aliquam tellus, sit amet scelerisque dolor eleifend congue. Proin interdum sodales erat et euismod. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Praesent ut purus id est suscipit dapibus ut non sapien. Donec lectus nulla, faucibus ullamcorper libero quis, placerat placerat eros. Aliquam feugiat non leo quis facilisis. Proin bibendum pharetra nunc, vel accumsan eros. Mauris rutrum augue urna, eu tincidunt sem elementum sit amet. Aenean non elit magna. Proin quis urna tempus, suscipit sapien quis, eleifend sapien. Suspendisse molestie quam in neque fermentum, eget volutpat metus ullamcorper.

# Section 4

Donec luctus, risus sed suscipit suscipit, est felis interdum ante, sed consequat est metus placerat nunc. Ut viverra ante ac venenatis ornare. Aliquam eget diam sit amet elit rutrum aliquam. Duis facilisis et nibh sit amet efficitur. Integer hendrerit neque sit amet odio ultrices luctus. Nam aliquam vitae nunc at imperdiet. Suspendisse faucibus egestas magna id ornare.

# Section 5

Aliquam a ex venenatis, aliquam ante non, pharetra lectus. Sed condimentum ac mauris eu finibus. Integer iaculis turpis tortor. Ut aliquet arcu nec erat rhoncus pharetra. Nam sollicitudin convallis dui, et laoreet lorem semper eu. Ut pretium accumsan accumsan. Morbi mollis arcu sit amet nunc rutrum, sed vulputate metus suscipit. Praesent pretium tincidunt eros, faucibus congue justo semper ut. Mauris leo sem, varius sit amet suscipit nec, condimentum non tortor. Phasellus in ex non dolor consequat venenatis ac nec mi.

Check this out: [google.ca](www.google.ca)
      `,
    };
  },
  computed: {
    compiledMarkdown: function () {
      return DOMPurify.sanitize(marked(this.inputText));
    },
  },
  methods: {
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
  },
};
</script>

<style scoped>
textarea {
  resize: none;
  border: none;
  outline: none;
  background-color: rgb(39, 39, 39) !important;
  color: white !important;
}

.view {
  margin: 0 12px 0 12px;
  text-align: left;
  color: white;
  background-color: rgb(39, 39, 39);
}

.divide {
  border-right: #aaa 1px solid;
}

.input {
  font-size: 14px;
  font-family: "Monaco", courier, monospace;
  width: 100%;
  height: 100%;
  padding: 20px;
  border-radius: 0 !important;
}

.preview {
  font-family: "Helvetica Neue", Arial, sans-serif;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.column {
  height: 94vh;
  overflow: auto;
}
</style>
