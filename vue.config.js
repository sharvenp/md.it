const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      builderOptions: {
        productName: "md.it",
        nsis: {
          installerIcon: "public/favicon.ico",
          uninstallerIcon: "public/favicon.ico",
          uninstallDisplayName: "md.it",
          shortcutName: "md.it",
          artifactName: "md.it.${ext}",
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          license: "LICENSE",
        },
      },
    },
  },
});
