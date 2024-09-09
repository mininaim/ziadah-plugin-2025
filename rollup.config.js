import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

import dotenv from "dotenv";
dotenv.config();

const excludeMockPlugin = {
  name: "exclude-mock",
  resolveId(source) {
    if (
      source.includes("MockAdapter") &&
      process.env.NODE_ENV === "production"
    ) {
      return { id: "excluded-mock-adapter", external: true };
    }
    return null;
  },
  load(id) {
    if (id === "excluded-mock-adapter") {
      return 'export class MockAdapter { constructor() { throw new Error("MockAdapter should not be used in production"); } }';
    }
    return null;
  },
};

const createConfig = (outputFile, minimize) => ({
  input: "src/index.js",
  output: {
    file: outputFile,
    format: "iife",
    sourcemap: true,
    name: "ZiadahPlugin",
    inlineDynamicImports: true,
  },
  // treeshake: {
  //   moduleSideEffects: false,
  //   propertyReadSideEffects: false,
  //   tryCatchDeoptimization: false,
  // },
  plugins: [
    resolve({
      extensions: [".js"],
    }),
    commonjs(),
    replace({
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
      "process.env.USE_MOCK_DATA": JSON.stringify(
        process.env.USE_MOCK_DATA === "true"
      ),
      preventAssignment: true,
    }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      presets: ["@babel/preset-env"],
    }),
    excludeMockPlugin,
    minimize && terser(),
  ],
  onwarn(warning, warn) {
    // Ignore certain warnings
    if (warning.code === "CIRCULAR_DEPENDENCY" || warning.code === "EVAL") {
      return;
    }
    console.warn(warning);
    warn(warning);
  },
});

export default [
  createConfig("dist/index.js", false),
  createConfig("dist/index.min.js", true),
];
