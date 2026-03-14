export interface WebpackCompiler {
  options: {
    context?: string;
    output: { path?: string };
  };
  hooks: {
    afterEmit: {
      tapAsync: (name: string, cb: (compilation: unknown, callback: () => void) => void) => void;
    };
  };
}

export interface GasPluginOptions {
  /**
   * Path to appsscript.json manifest file.
   * Resolved relative to the project root.
   * @default "src/appsscript.json"
   */
  manifest?: string;

  /**
   * Glob patterns for additional files to copy flat to the output directory.
   * Resolved relative to the project root via tinyglobby.
   * Files are copied without subdirectory structure (basename only).
   * Duplicate basenames trigger a warning; the first match wins.
   *
   * @default []
   */
  include?: string[];

  /**
   * Function names to explicitly protect from tree-shaking.
   * These functions will be kept as top-level declarations in the output,
   * even if they are not exported from the entry point.
   *
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
