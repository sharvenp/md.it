<template>
  <EditorV />
</template>

<script>
import EditorV from "./components/Editor.vue";

export default {
  name: "App",
  components: {
    EditorV,
  },
};
</script>
<style>
html,
body {
  height: 100%;
}

h1,
h2,
h3 {
  margin-top: 20px !important;
  margin-right: 20px !important;
  width: 100%;
  border-bottom: 1px solid rgba(255, 255, 255, 0.158);
  padding-bottom: 10px;
}

p {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}

code {
  padding: 5px;
  border: 1px solid rgb(139, 139, 139);
  background-color: rgba(21, 28, 36, 0.315);
  border-radius: 3px;
}

pre {
  border: 1px solid rgb(139, 139, 139);
  border-radius: 3px;
  background-color: rgba(21, 28, 36, 0.315) !important;
  width: 100%;
  padding: 10px;
}
pre > code {
  border: none;
  background-color: none;
}

table,
th,
td {
  border: 1px solid rgba(255, 255, 255, 0.548) !important;
  border-collapse: collapse;
  padding: 5px;
}

.noselect {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
