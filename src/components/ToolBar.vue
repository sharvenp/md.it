<template>
  <div class="bottom-bar">
    <div class="d-flex align-items-center flex-bar">
      <button
        id="open-button"
        type="button"
        title="Open"
        :disabled="editorLocked"
        class="btn btn-dark"
        @click="openFile"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      </button>
      <button
        id="save-button"
        type="button"
        title="Save"
        :disabled="editorLocked"
        class="btn btn-dark ms-2"
        @click="saveFile"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
      </button>
      <button
        id="save-as-button"
        type="button"
        title="Save As"
        :disabled="editorLocked"
        class="btn btn-dark ms-2"
        @click="saveAsFile"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h2m3-4H9a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-1m-1 4l-3 3m0 0l-3-3m3 3V3"
          />
        </svg>
      </button>
      <button
        type="button"
        id="layout-button"
        title="Toggle Layout"
        class="btn btn-dark ms-4"
        @click="cycleLayout"
      >
        <svg
          v-if="currentLayout === 0"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          class="bi bi-layout-sidebar"
          viewBox="0 0 16 16"
        >
          <path
            d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm5-1v12h9a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H5zM4 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2V2z"
          />
        </svg>
        <svg
          v-else-if="currentLayout === 1"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          class="bi bi-layout-sidebar-reverse"
          viewBox="0 0 16 16"
        >
          <path
            d="M16 3a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3zm-5-1v12H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h9zm1 0h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2V2z"
          />
        </svg>
        <svg
          v-else-if="currentLayout === 2"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          class="bi bi-layout-split"
          viewBox="0 0 16 16"
        >
          <path
            d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm8.5-1v12H14a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8.5zm-1 0H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5.5V2z"
          />
        </svg>
      </button>
      <a
        class="logo ms-auto text-decoration-none noselect"
        href="https://github.com/sharvenp/md.it"
        target="_blank"
      >
        <div class="d-flex">
          <img width="40" class="p-1" src="../../public/icon.png" />
          <p class="p-auto m-2">{{ appVersion }}</p>
        </div></a
      >
    </div>
  </div>
</template>

<script>
import { version } from "../../package";

export default {
  name: "ToolBarV",
  props: {
    currentLayout: Number,
    editorLocked: Boolean,
  },
  data() {
    return {
      appVersion: version,
    };
  },
  methods: {
    cycleLayout() {
      this.$emit("layout-change");
    },
    openFile() {
      if (this.editorLocked) return;
      this.$emit("open-file");
    },
    saveFile() {
      if (this.editorLocked) return;
      this.$emit("save-file");
    },
    saveAsFile() {
      if (this.editorLocked) return;
      this.$emit("save-as-file");
    },
  },
};
</script>

<style scoped>
.bottom-bar {
  padding: 10px;
  background-color: rgb(23, 24, 29);
  border-top: rgb(48, 54, 61) 2px solid;
}

.flex-bar {
  height: 45px;
}

.logo {
  color: rgb(189, 185, 185);
  border: solid 1px rgb(82, 82, 82);
  border-radius: 5px;
}
</style>
