import path from "path";
import { readFileSync, existsSync } from "fs";

/**
 * Serve SVG & PNG icons from release/datafiles/ at /icons/<name>.svg
 */
export default function () {
  const iconsDir = path.resolve("../release/datafiles/icons_svg");
  const cursorsDir = path.resolve("../release/datafiles/cursors");
  const convertedDir = path.resolve("../release/datafiles/icons_converted");
  const convertedSvgDir = path.resolve(
    "../release/datafiles/icons_converted_svg",
  );

  return {
    name: "icons",

    configureServer(server) {
      server.middlewares.use("/icons", (req, res, next) => {
        if (req.method !== "GET") {
          return next();
        }
        const filename = req.url.slice(1);

        const filepath = path.join(
          filename.endsWith(".png")
            ? convertedDir
            : filename.startsWith("cursor_")
              ? cursorsDir
              : filename.slice(0, -4).includes(".")
                ? convertedSvgDir
                : iconsDir,
          filename,
        );

        if (!existsSync(filepath)) {
          res.statusCode = 404;
          res.end(filepath + " not found");
          return;
        }
        res.setHeader(
          "Content-Type",
          filename.endsWith(".svg") ? "image/svg+xml" : "image/png",
        );
        res.end(readFileSync(filepath));
      });
    },
  };
}
