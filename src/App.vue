<template>
  <TopBarV />
  <EditorV />
</template>

<script>
import EditorV from "./components/Editor.vue";
import TopBarV from "./components/TopBar.vue";

export default {
  name: "App",
  components: {
    EditorV,
    TopBarV,
  },
};
</script>

<style>
html,
body {
  overflow: hidden;
}
</style>
