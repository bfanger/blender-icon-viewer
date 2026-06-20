#!/usr.bin/env node
import { unlinkSync } from "node:fs";

unlinkSync("dist/icons/.gitignore");
unlinkSync("dist/svgo/.gitignore");
