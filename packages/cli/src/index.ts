import { defineCommand, runMain } from "citty";
import cliPkg from "../package.json" with { type: "json" };

const main = defineCommand({
  meta: {
    name: "gas-plugin",
    version: cliPkg.version,
    description: "Extensible CLI tool for Google Apps Script projects",
  },
  subCommands: {
    create: () => import("./commands/create.js").then((m) => m.default),
  },
});

runMain(main).catch(() => process.exit(1));
