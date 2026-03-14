import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cliPkg from "../../package.json" with { type: "json" };
import { initGit } from "./git.js";
import { renderFile } from "./render.js";
import { BIOME_VERSION, getBundler, getTemplate } from "./templates.js";
import type { RenderContext, ScaffoldOptions } from "./types.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const deps = cliPkg.devDependencies as Record<string, string>;
const TEMPLATES_DIR = resolve(currentDir, "../templates");

/** Copy a directory recursively, renaming `_`-prefixed files to dot-prefixed. */
async function copyTemplateDir(
  srcDir: string,
  destDir: string,
  context: RenderContext,
): Promise<void> {
  const entries = await readdir(srcDir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const parentDir = entry.parentPath;
    const relPath = join(parentDir, entry.name).slice(srcDir.length + 1);
    let destName = relPath;
    // Strip .tmpl suffix (e.g., biome.json.tmpl → biome.json)
    if (destName.endsWith(".tmpl")) {
      destName = destName.slice(0, -5);
    }
    // Rename _-prefixed files to .-prefixed (e.g., _gitignore → .gitignore)
    const base = basename(destName);
    if (base.startsWith("_")) {
      destName = join(dirname(destName), `.${base.slice(1)}`);
    }
    await renderFile(join(srcDir, relPath), join(destDir, destName), context);
  }
}

/** Build the render context from scaffold options. */
function buildContext(options: ScaffoldOptions): RenderContext {
  const template = getTemplate(options.template);
  const bundler = getBundler(options.bundler);
  if (!(template && bundler)) {
    throw new Error(`Invalid template "${options.template}" or bundler "${options.bundler}"`);
  }

  return {
    projectName: options.projectName,
    bundlerConfigFile: bundler.configFile,
    bundlerImport: bundler.importPath,
    buildCommand: bundler.buildCommand,
    oauthScopes: JSON.stringify(template.oauthScopes),
    globals: JSON.stringify(template.globals),
    year: new Date().getFullYear().toString(),
  };
}

/** Generate package.json for the scaffolded project. */
async function generatePackageJson(options: ScaffoldOptions, destDir: string): Promise<void> {
  const bundler = getBundler(options.bundler);
  if (!bundler) throw new Error(`Unknown bundler: ${options.bundler}`);

  const pkg: Record<string, unknown> = {
    name: options.projectName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      build: bundler.buildCommand,
    },
    devDependencies: {
      "@types/google-apps-script": deps["@types/google-apps-script"] ?? "^1.0.0",
      typescript: deps.typescript ?? "^5.8.0",
      ...bundler.devDependencies,
    },
  };

  if (options.clasp) {
    (pkg.scripts as Record<string, string>).push = "clasp push";
    (pkg.scripts as Record<string, string>).deploy = "clasp push && clasp deploy";
  }

  await writeFile(join(destDir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
}

/** Generate appsscript.json manifest. */
async function generateManifest(options: ScaffoldOptions, destDir: string): Promise<void> {
  const template = getTemplate(options.template);
  if (!template) throw new Error(`Unknown template: ${options.template}`);

  const manifest: Record<string, unknown> = {
    dependencies: {},
    exceptionLogging: "STACKDRIVER",
    runtimeVersion: "V8",
  };

  if (template.oauthScopes.length > 0) {
    manifest.oauthScopes = template.oauthScopes;
  }

  if (options.template === "webapp") {
    manifest.webapp = {
      access: "MYSELF",
      executeAs: "USER_DEPLOYING",
    };
  }

  await writeFile(
    join(destDir, "appsscript.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf-8",
  );
}

/** Generate clasp configuration files. */
async function generateClaspFiles(options: ScaffoldOptions, destDir: string): Promise<void> {
  const claspJson = {
    scriptId: options.scriptId || "<your-script-id>",
    rootDir: "dist",
  };
  await writeFile(join(destDir, ".clasp.json"), `${JSON.stringify(claspJson, null, 2)}\n`, "utf-8");

  const claspIgnore = `node_modules/
src/
*.ts
!appsscript.json
`;
  await writeFile(join(destDir, ".claspignore"), claspIgnore, "utf-8");
}

/** Generate biome.json with schema version derived from package.json. */
async function generateBiomeConfig(destDir: string): Promise<void> {
  const biome = {
    $schema: `https://biomejs.dev/schemas/${BIOME_VERSION}/schema.json`,
    formatter: {
      indentStyle: "space",
      indentWidth: 2,
      lineWidth: 100,
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
      },
    },
  };
  await writeFile(join(destDir, "biome.json"), `${JSON.stringify(biome, null, 2)}\n`, "utf-8");
}

/** Generate bundler config file for the selected bundler and template. */
async function generateBundlerConfig(
  options: ScaffoldOptions,
  destDir: string,
  context: RenderContext,
): Promise<void> {
  const bundler = getBundler(options.bundler);
  const template = getTemplate(options.template);
  if (!(bundler && template)) return;

  const configTemplatePath = join(TEMPLATES_DIR, "bundler-configs", bundler.configFile);
  if (existsSync(configTemplatePath)) {
    // Build template-aware context with include/globals for this specific template
    const templateContext: RenderContext = {
      ...context,
      includeHtml: template.hasHtml ? '    include: ["src/**/*.html"],' : "",
      globalsConfig:
        template.globals.length > 0 ? `    globals: ${JSON.stringify(template.globals)},` : "",
      autoGlobals: template.globals.length > 0 ? "    autoGlobals: true," : "",
    };
    await renderFile(configTemplatePath, join(destDir, bundler.configFile), templateContext);
  }
}

/** Run the full scaffolding pipeline. */
export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const { targetDir } = options;
  const context = buildContext(options);

  // Create target directory
  await mkdir(targetDir, { recursive: true });

  // Copy shared template files (tsconfig, biome, README, etc.)
  const sharedDir = join(TEMPLATES_DIR, "shared");
  if (existsSync(sharedDir)) {
    await copyTemplateDir(sharedDir, targetDir, context);
  }

  // Copy template-specific source files
  const template = getTemplate(options.template);
  if (template) {
    const templateDir = join(TEMPLATES_DIR, template.sourceDir);
    if (existsSync(templateDir)) {
      await copyTemplateDir(templateDir, targetDir, context);
    }
  }

  // Generate biome.json (version from package.json)
  await generateBiomeConfig(targetDir);

  // Generate package.json (programmatic, not from template)
  await generatePackageJson(options, targetDir);

  // Generate appsscript.json
  await generateManifest(options, targetDir);

  // Generate bundler config
  await generateBundlerConfig(options, targetDir, context);

  // Generate clasp files if requested
  if (options.clasp) {
    await generateClaspFiles(options, targetDir);
  }

  // Git init + .gitignore
  await initGit(targetDir);

  // Install dependencies
  if (options.installDeps) {
    execSync(`${options.packageManager} install`, {
      cwd: targetDir,
      stdio: "inherit",
    });
  }
}
