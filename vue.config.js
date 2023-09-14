const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  publicPath:  process.env.NODE_ENV === 'production' ? '/md.it/' : '/',
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
        fileAssociations: [
          {
            ext: ["txt", "md"],
            name: "Markdown File",
            role: "Editor",
          },
        ],
      },
    },
  },
});
