/* eslint-disable @typescript-eslint/no-var-requires */

// https://www.tiny.cloud/docs/tinymce/6/react-pm-host/
const fs = require("fs-extra");
const path = require("path");
const topDir = __dirname;
fs.emptyDirSync(path.join(topDir, "public", "tinymce"));
fs.copySync(
  path.join(topDir, "node_modules", "tinymce"),
  path.join(topDir, "public", "tinymce"),
  { overwrite: true },
);
/* eslint-enable @typescript-eslint/no-var-requires */
