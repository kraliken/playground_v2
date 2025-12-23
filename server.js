const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;

// Explicit path beállítás a Turbopack root directory számára
const app = next({
    dev,
    dir: path.resolve(__dirname),
    turbopack: {
        root: path.resolve(__dirname)
    }
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
}).catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
