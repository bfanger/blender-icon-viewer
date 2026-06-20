#!/usr.bin/env node
import { execSync, type ExecSyncOptions } from "node:child_process";
const options: ExecSyncOptions = { cwd: "dist", stdio: "inherit" };

execSync("git init -b gh-deploy", options);
execSync("git add .", options);
execSync('git commit -m "deploy"', options);
execSync(
  "git push -f git@github.com:bfanger/blender-icon-viewer.git gh-deploy:gh-pages",
  options,
);
