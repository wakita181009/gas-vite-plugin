/**
 * Public API contract for gas-vite-plugin v0.2
 *
 * This file documents the TypeScript interface that users interact with.
 * It is NOT compiled — it serves as a contract reference for implementation.
 */

export interface GasPluginOptions {
  /**
   * Path to appsscript.json manifest file.
   * Resolved relative to Vite's `root`.
   * @default "src/appsscript.json"
   */
  manifest?: string;

  /**
   * Glob patterns for additional files to copy flat to the output directory.
   * Resolved relative to Vite's `root` via tinyglobby.
   * Files are copied without subdirectory structure (basename only).
   * Duplicate basenames trigger a warning; the first match wins.
   *
   * @example ["src/**/*.html", "src/**/*.css"]
   * @default []
   */
  include?: string[];

  /**
   * Function names to explicitly protect from tree-shaking.
   * These functions will be kept as top-level declarations in the output,
   * even if they are not exported from the entry point.
   *
   * Use this for functions called by GAS via string name (e.g., menu handlers,
   * time-driven trigger targets).
   *
   * @example ["processData", "onTimeTrigger"]
   * @default []
   */
  globals?: string[];

  /**
   * When `true` (default), exported functions are automatically added to the
   * tree-shake protection list. When `false`, only functions explicitly listed
   * in `globals` are protected.
   *
   * Export keyword removal always runs regardless of this setting.
   *
   * @default true
   */
  autoGlobals?: boolean;
}
