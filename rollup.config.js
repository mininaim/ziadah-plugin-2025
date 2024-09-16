import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

import dotenv from "dotenv";
dotenv.config();

const createConfig = (outputFile, minimize) => ({
  input: "src/index.js",
  output: {
    file: outputFile,
    format: "iife",
    sourcemap: true,
    name: "ZiadahPlugin",
    inlineDynamicImports: true,
  },
  plugins: [
    json(),
    resolve({
      extensions: [".js", ".json"],
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
    minimize && terser(),
  ],
  onwarn(warning, warn) {
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
