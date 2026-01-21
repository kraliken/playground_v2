const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

console.log("Starting Next.js server");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", port);

const app = next({
    dev,
    dir: __dirname,
});

const handle = app.getRequestHandler();

app
    .prepare()
    .then(() => {
        createServer((req, res) => {
            try {
                const parsedUrl = parse(req.url, true);
                handle(req, res, parsedUrl);
            } catch (err) {
                console.error("Request handling error:", err);
                res.statusCode = 500;
                res.end("Internal Server Error");
            }
        }).listen(port, hostname, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
    })
    .catch((err) => {
        console.error("❌ Failed to start Next.js server");
        console.error(err);
        process.exit(1);
    });
