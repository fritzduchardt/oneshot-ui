const http = require("http")
const path = require("path")
const fs = require("fs")

const publicRoot = path.join(__dirname, "public")
const port = Number(process.env.PORT || 3000)

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".map": "application/json; charset=utf-8"
}

const server = http.createServer((req, res) => {
    const safePath = normalizeRequestPath(req.url)
    if (!safePath) {
        respondNotFound(res)
        return
    }

    if (safePath === "/js/config.js") {
        respondWithDynamicConfig(res)
        return
    }

    const filePath = resolveFilePath(safePath)
    serveStaticFile(filePath, res)
})

server.listen(port, () => {
    console.log(`Server listening on ${port}`)
})

function normalizeRequestPath(requestUrl) {
    if (!requestUrl) return null
    const urlPath = decodeURIComponent(requestUrl.split("?")[0])
    if (!urlPath.startsWith("/")) return null
    const normalized = path.posix.normalize(urlPath)
    if (normalized.includes("..")) return null
    return normalized === "/" ? "/index.html" : normalized
}

function resolveFilePath(urlPath) {
    return path.join(publicRoot, urlPath)
}

function serveStaticFile(filePath, res) {
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            respondNotFound(res)
            return
        }

        const ext = path.extname(filePath)
        const contentType = contentTypes[ext] || "application/octet-stream"
        res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600"
        })
        fs.createReadStream(filePath).pipe(res)
    })
}

function respondWithDynamicConfig(res) {
    const apiUrl = process.env.API_URL || "http://localhost:8082"
    const chatTimeoutMillis = Number(process.env.CHAT_TIMEOUT_MILLIS || 60000)
    const body = [
        `export const API_URL = ${JSON.stringify(apiUrl)};`,
        `export const CHAT_TIMEOUT_MILLIS = ${Number.isFinite(chatTimeoutMillis) ? chatTimeoutMillis : 60000};`
    ].join("\n")

    res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store"
    })
    res.end(body)
}

function respondNotFound(res) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
    res.end("Not Found")
}