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
@import url("https://fonts.googleapis.com/css2?family=Open+Sans&display=swap");

#app {
  font-family: "Open Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  background-color: rgb(40, 44, 52);
}

html,
body {
  height: 100%;
  background-color: rgb(23, 24, 29);
}

h1,
h2,
h3 {
  font-weight: bold;
  margin-top: 20px !important;
  margin-right: 20px !important;
  width: 100%;
  border-bottom: 1px solid rgba(255, 255, 255, 0.158);
  padding-bottom: 10px;
}

h3 {
  border: none !important;
}

p {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}

code {
  padding: 2px;
  margin: 2px;
  border: 1px solid rgb(139, 139, 139);
  background-color: rgba(58, 71, 85, 0.315);
  color: white !important;
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
  background-color: transparent;
}

blockquote {
  background-color: transparent;
  margin: 1.5rem;
  padding-left: 1rem;
  border-left: solid rgba(255, 255, 255, 0.4) 2px;
  width: 100%;
}
blockquote > * {
  color: rgba(255, 255, 255, 0.4) !important;
}

table,
th,
td {
  border: 1px solid rgba(255, 255, 255, 0.548) !important;
  border-collapse: collapse;
  padding: 10px;
}

table {
  border: 2px solid rgba(255, 255, 255, 0.548) !important;
}

.task-list > .task-list-item {
  list-style-type: none;
  pointer-events:none
}

.task-list-item input {
  margin-left: -1.3rem;
}

.task-list-item label {
  padding-left: 0.5rem;
}

.noselect {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* custom scrollbar */
::-webkit-scrollbar {
  width: 20px;
  background-color: rgb(40, 44, 52);
}

::-webkit-scrollbar-corner {
  background: rgba(0, 0, 0, 0);
}

::-webkit-scrollbar-track {
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(78, 81, 97, 0.2);
  border-radius: 20px;
  border: 6px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(128, 128, 128, 0.2);
}
</style>
