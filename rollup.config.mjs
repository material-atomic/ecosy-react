import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import path from "path";
import { glob } from "glob";

// Get all TypeScript files in src, excluding test files
const inputFiles = glob.sync("src/**/*.{ts,tsx}", {
  ignore: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}", "**/vitest.setup.ts"],
});

// Create input object with file names as keys and paths as values
const input = inputFiles.reduce((acc, file) => {
  const relativePath = path.relative("src", file);
  const key = relativePath.replace(path.extname(relativePath), "");
  acc[key] = file;
  return acc;
}, {});

// External packages — don't bundle dependencies
const external = [
  /^@ecosy\//,
  /^react/,
];

/* There is no tslib here, and that is the fix rather than an omission.
 *
 * At target ES2017 TypeScript downlevels object rest — `const { a, ...rest }`
 * — into `__rest`, and with preserveModules rollup then emits tslib as a chunk
 * at "./node_modules/tslib/tslib.es6.mjs": a path inside the published package
 * that npm prune, pnpm's strict layout and bundler file-tracing all have leave
 * to remove. Keeping tslib external avoided that, at the cost of a runtime
 * dependency for one helper.
 *
 * ES2020 emits the rest spread natively, so the helper is never generated and
 * there is nothing to resolve. It stops short of the ES2022 that @ecosy/orm
 * uses on purpose: that one is server-only on Node >=18, while this ships to
 * browsers, and ES2020 already covers every engine React 19 runs on. */

// Minification configuration
const minifyOptions = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ["console.log", "console.info", "console.debug"],
  },
  mangle: true,
};

// CommonJS build
const cjsConfig = {
  input,
  external,
  output: {
    dir: "dist",
    format: "cjs",
    entryFileNames: "[name].js",
    chunkFileNames: "[name].js",
    exports: "named",
    preserveModules: true,
    preserveModulesRoot: "src",
    interop: "auto",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
      rootDir: "src",
    }),
    terser(minifyOptions),
  ],
};

// ESM build
const esmConfig = {
  input,
  external,
  output: {
    dir: "dist",
    format: "esm",
    entryFileNames: "[name].mjs",
    exports: "named",
    preserveModules: true,
    preserveModulesRoot: "src",
    interop: "auto",
    generatedCode: {
      symbols: true,
    },
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
      declarationMap: false,
      declarationDir: undefined,
      rootDir: "src",
    }),
    terser(minifyOptions),
  ],
};

export default [cjsConfig, esmConfig];
