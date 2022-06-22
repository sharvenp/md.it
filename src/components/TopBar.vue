<template>
  <div class="top-bar fixed-bottom">
    <div class="d-flex">
      <button type="button" class="btn btn-dark">Open</button>
      <button type="button" class="btn btn-dark ms-2">Save</button>
      <button type="button" class="btn btn-dark ms-5" @click="cycleLayoyt">
        <svg
          v-if="currentLayout === 0"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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
          width="16"
          height="16"
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
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-layout-split"
          viewBox="0 0 16 16"
        >
          <path
            d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm8.5-1v12H14a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8.5zm-1 0H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5.5V2z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "TopBarV",
  data() {
    return {
      currentLayout: 2,
    };
  },
  methods: {
    cycleLayoyt() {
      this.currentLayout = (this.currentLayout + 1) % 2;
    },
  },
};
</script>

<style scoped>
.top-bar {
  padding: 10px;
  background-color: rgb(26, 25, 25);
}
</style>
