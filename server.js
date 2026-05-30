import { server, logging } from "@mercuryworkshop/wisp-js/server";
import { WebSocketServer, WebSocket } from "ws";
import { appendFileSync, existsSync } from "node:fs";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
logging.set_level(logging.WARN);
//server.setLogLevel(2) //  WARN log level, only logs messages like "warn: (9278db6c) received a DATA packet for a stream which doesn't exist"
const rReq = server.routeRequest;
const rot13 = (str) =>
    str.replace(/[a-zA-Z]/g, (c) => {
        const b = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
    });

// Static paths
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import crypto from "crypto";
import { fileURLToPath } from "url";
const _require = createRequire(import.meta.url);
let epoxyImportPath = resolve(baremuxPath + "/../../epoxy-transport/dist");
let ePath = "";
let pPrefix = "/pxy";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
//import * as controller from '@mercuryworkshop/scramjet-controller';
//const controllerPath = controller.config.scramjetPath;
const libcurlPath = dirname(
    _require.resolve("@mercuryworkshop/libcurl-transport"),
);
let sjPrefix = "/sjp";
const fastify = Fastify({ forceCloseConnections: true, trustProxy: true });
// Register static files
// fastify.register(fastifyStatic, {
// 	root: publicPath,
// 	prefix: pPrefix,
// 	decorateReply: false,
// });
fastify.register(fastifyStatic, {
    root: publicPath,
    prefix: pPrefix,
    decorateReply: false,
});
fastify.register(fastifyStatic, {
    root: "/app/BestSpark687090", // This probably isn't a good idea but too bad
    decorateReply: true,
});
// Serve UV config file
fastify.get(pPrefix + "/ultrav/uv.conf.js", (req, res) => {
    return res.sendFile("uv/uv.conf.js", publicPath);
});
fastify.get(pPrefix + "/ultrav/sw.js", (req, res) => {
    return res.sendFile("uv/sw.js", publicPath);
});
// Register additional static routes
fastify.register(fastifyStatic, {
    root: uvPath,
    prefix: pPrefix + "/ultrav/",
    decorateReply: false,
});
fastify.register(fastifyStatic, {
    root: epoxyImportPath,
    prefix: pPrefix + "/epoxy/",
    decorateReply: false,
});

fastify.register(fastifyStatic, {
    root: baremuxPath,
    prefix: pPrefix + "/baremux/",
    decorateReply: false,
});

// Scramjet stuff
fastify.register(fastifyStatic, {
    root: "/app/scramjet-proxy/public",
    prefix: sjPrefix,
    decorateReply: false,
});

fastify.register(fastifyStatic, {
    root: scramjetPath,
    prefix: sjPrefix + "/scramjet/",
    decorateReply: false,
});

//fastify.register(fastifyStatic, {
//	root: controllerPath,
//	prefix: sjPrefix+"/controller/",
//	decorateReply: false,
//});

fastify.register(fastifyStatic, {
    root: libcurlPath,
    prefix: sjPrefix + "/libcurl/",
    decorateReply: false,
});

fastify.register(fastifyStatic, {
    root: baremuxPath,
    prefix: sjPrefix + "/baremux/",
    decorateReply: false,
});

//#region games
// WARNING: claude code written code up ahead. i was way too lazy to do this myself, so I just asked claude to do it \\

// Add Content-Encoding: gzip for pre-compressed Unity .unityweb files
fastify.addHook("onSend", (req, reply, payload, done) => {
    if (req.url.includes(".unityweb")) reply.header("Content-Encoding", "gzip");
    done(null, payload);
});

const upstreamError = (status, msg) =>
    `<!DOCTYPE html><html><body style="background:#111;color:#fff;font-family:sans-serif;padding:2rem"><b>${status}</b> ${msg}</body></html>`;

// Covers proxy for gn-math game thumbnails
const coversCache = new Map();
const COVERS_TTL_MS = 10 * 60 * 1000; // 10 minutes
const coverURL = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";

fastify.get("/games/gn/covers/*", async (req, res) => {
    // */
    const subPath = req.params["*"] || "";
    const now = Date.now();
    const cached = coversCache.get(subPath);
    if (cached && now - cached.timestamp < COVERS_TTL_MS) {
        res.header("Content-Type", cached.contentType);
        res.header("Cache-Control", "public, max-age=600");
        res.header("X-Cache", "HIT");
        return res.send(cached.body);
    }
    const upstream = await fetch(coverURL + "/" + subPath);
    if (!upstream.ok) {
        return res
            .code(upstream.status)
            .type("text/html")
            .send(upstreamError(upstream.status, upstream.statusText));
    }
    const contentType =
        upstream.headers.get("content-type") || "application/octet-stream";
    const body = Buffer.from(await upstream.arrayBuffer());
    coversCache.set(subPath, { body, contentType, timestamp: now });
    res.header("Content-Type", contentType);
    res.header("Cache-Control", "public, max-age=600");
    res.header("X-Cache", "MISS");
    return res.send(body);
});

// StrongDog
const sdCache = new Map();
const SD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SD_BASE_URL = "https://strongdog.com/";

fastify.get("/games/sd-img/*", async (req, res) => {
    // */
    const subPath = req.params["*"] || "";
    const upstreamUrl = SD_BASE_URL + rot13(subPath);
    const now = Date.now();
    const cached = sdCache.get("img:" + subPath);
    if (cached && now - cached.timestamp < SD_CACHE_TTL_MS) {
        res.header("Content-Type", cached.contentType);
        res.header("Cache-Control", "public, max-age=300");
        res.header("X-Cache", "HIT");
        return res.send(cached.body);
    }
    const upstream = await fetch(upstreamUrl);
    if (!upstream.ok) {
        return res
            .code(upstream.status)
            .type("text/html")
            .send(upstreamError(upstream.status, upstream.statusText));
    }
    const contentType =
        upstream.headers.get("content-type") || "application/octet-stream";
    const body = Buffer.from(await upstream.arrayBuffer());
    sdCache.set("img:" + subPath, { body, contentType, timestamp: now });
    res.header("Content-Type", contentType);
    res.header("Cache-Control", "public, max-age=300");
    res.header("X-Cache", "MISS");
    return res.send(body);
});
function fromNodeHeaders(nodeHeaders) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(nodeHeaders)) {
        if (value !== undefined) {
            if (Array.isArray(value)) {
                value.forEach((v) => headers.append(key, v));
            } else {
                headers.append(key, value);
            }
        }
    }
    return headers;
}
// Uhhhhhh...
const rawBodyParser = function (request, payload, done) {
    let data = [];
    payload.on("data", (chunk) => data.push(chunk));
    payload.on("end", () => {
        done(null, Buffer.concat(data));
    });
};
fastify.addContentTypeParser("application/json", rawBodyParser);
fastify.addContentTypeParser("*", rawBodyParser);
const STRIP_REQUEST_HEADERS = new Set([
    "host",
    "cdn-loop",
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "cf-visitor",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "via",
    "sec-fetch-dest",
    "sec-fetch-mode",
    "sec-fetch-site",
    "sec-fetch-user",
    "sec-gpc",
]);

const HOP_BY_HOP = new Set([
    "connection",
    "keep-alive",
    "transfer-encoding",
    "te",
    "upgrade",
    "proxy-authorization",
    "proxy-authenticate",
    "trailer",
    "content-length",
]);

fastify.get("/narrow-maps-config", (req, res) => {
    return res.redirect("/games/sd/narrow-maps-config");
});

fastify.all("/games/sd/*", async (req, res) => {
    const subPath = req.params["*"] || "";

    // Serve local file if it exists
    const localFile = `/app/BestSpark687090/games/sd/${subPath}`;
    if (existsSync(localFile))
        return res.sendFile(`games/sd/${subPath}`, "/app/BestSpark687090");
    if (subPath.endsWith("logoo.png"))
        return res.sendFile("games/sd/logoo.png", "/app/BestSpark687090");

    // Forward request upstream
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const upstreamUrl = SD_BASE_URL + subPath + qs;

    // Cache GET responses
    if (req.method === "GET") {
        const cacheKey = upstreamUrl;
        const now = Date.now();
        const cached = sdCache.get(cacheKey);
        if (cached && now - cached.timestamp < SD_CACHE_TTL_MS) {
            for (const [key, value] of Object.entries(cached.headers))
                res.header(key, value);
            res.header("X-Cache", "HIT");
            return res.code(cached.status).send(cached.body);
        }
    }
    const headers = fromNodeHeaders(req.headers);

    for (const key of STRIP_REQUEST_HEADERS) headers.delete(key);
    headers.delete("content-length");

    if (subPath.includes("tetr")) {
        headers.set("origin", "https://tetr.io");
        headers.set("referer", "https://tetr.io/");
        console.log("using new one from gitig");
    }
    // if (upstreamUrl.includes("krunker-seek-game")) {
    //     upstreamUrl.replace(/\?hostname=[a-z.\- 0-9]/g, "?hostname=krunker.io");
    // }
    const hasBody = req.method !== "GET" && req.method !== "HEAD";

    const upstream = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: hasBody ? req.body : undefined,
    }).catch((err) => {
        console.error("[sd proxy] fetch failed:", upstreamUrl, err);
        throw err;
    });
    // Forward upstream headers, skipping hop-by-hop
    for (const [key, value] of upstream.headers.entries()) {
        if (!HOP_BY_HOP.has(key.toLowerCase())) {
            res.header(key, value);
        }
    }
    for (const cookie of upstream.headers.getSetCookie()) {
        res.header("set-cookie", cookie);
    }
    if (!upstream.ok && upstream.status != 403) {
        const errBody = await upstream.text().catch(() => "(unreadable)");
        console.log(`upstream ${upstream.status} for ${upstreamUrl}:`, errBody);
        return res
            .code(upstream.status)
            .type("text/html")
            .send(upstreamError(upstream.status, upstream.statusText));
    }
    res.header("Access-Control-Allow-Origin", "*");
    const body = Buffer.from(await upstream.arrayBuffer());
    if (req.method === "GET" && upstream.ok) {
        const cachedHeaders = {};
        for (const [key, value] of upstream.headers.entries())
            if (!HOP_BY_HOP.has(key.toLowerCase())) cachedHeaders[key] = value;
        cachedHeaders["Access-Control-Allow-Origin"] = "*";
        sdCache.set(upstreamUrl, {
            body,
            headers: cachedHeaders,
            status: upstream.status,
            timestamp: Date.now(),
        });
        res.header("X-Cache", "MISS");
    }
    res.code(upstream.status);
    return res.send(body);
});

// BestSpark's Retro Games
// technically i did write this code but its literally just copying and pasting mostly
const BRGCache = new Map();
const BRG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 day cache time. Do you seriously think it's gonna change that much?
// actually ykw screw it 7 day cache time
// This probably isn't the BEST idea to do here but i'll deal with the consequences later on
const BRG_BASE_URL =
    "https://raw.githubusercontent.com/BestSpark687090/nes-emulator/refs/heads/main/urls/";
fastify.get("/games/brg/*", async (req, res) => {
    const subPath = req.params["*"] || "";
    const upstreamUrl = BRG_BASE_URL + rot13(subPath);
    const now = Date.now();
    const cached = BRGCache.get(subPath);
    if (cached && now - cached.timestamp < BRG_CACHE_TTL_MS) {
        res.header("Content-Type", cached.contentType);
        res.header("Cache-Control", "public, max-age=300");
        res.header("X-Cache", "HIT");
        return res.send(cached.body);
    }
    const upstream = await fetch(upstreamUrl);
    if (!upstream.ok) {
        return res
            .code(upstream.status)
            .type("text/html")
            .send(upstreamError(upstream.status, upstream.statusText));
    }
    const contentType =
        upstream.headers.get("content-type") || "application/octet-stream";
    const body = Buffer.from(await upstream.arrayBuffer());
    BRGCache.set(subPath, { body, contentType, timestamp: now });
    res.header("Content-Type", contentType);
    res.header("Cache-Control", "public, max-age=300");
    res.header("X-Cache", "MISS");
    return res.send(body);
});

// expects {"username": "[username]","url": "[url]" } // It can get IP by itself I think
fastify.post("/reportURL", (req, res) => {
    let body = req.body;
    console.log(
        `[${new Date().toLocaleString()}]: ${body.username} visited ${body.url}, IP is ${req.ip}`,
    );
    return res.code(204).send({ message: "Done." });
});

// More Claude Code mess. Don't really worry about this, this was just to debug what was going wrong with the games \\
// Basically i made 2 separate claude instances talk to eachother in a way- i had 1 set up on the web, playing through them on a diff pc \\
// Then I had a claude code instance open with access to the code so it could know what to fix \\
// Debug relay WebSocket — senders push messages, viewers receive them
const debugWss = new WebSocketServer({ noServer: true });
const debugViewers = new Set();
const debugSenders = new Set();

debugWss.on("connection", (ws, req) => {
    const isSender =
        new URL(req.url, "http://x").searchParams.get("role") === "sender";
    if (isSender) {
        debugSenders.add(ws);
        console.log("[debug] sender connected");
        ws.on("message", (data) => {
            const text = data.toString();
            const line = `[${new Date().toISOString()}] ${text}\n`;
            console.log("[debug]", text);
            appendFileSync("/home/bestspark/gh/debug/messages.log", line);
            for (const v of debugViewers) {
                if (v.readyState === 1) v.send(text);
            }
        });
        ws.on("close", () => {
            debugSenders.delete(ws);
            console.log("[debug] sender disconnected");
        });
    } else {
        debugViewers.add(ws);
        ws.send(JSON.stringify({ type: "connected", ts: Date.now() }));
        ws.on("close", () => debugViewers.delete(ws));
    }
});

// end claude code mess for real. yes, for real. For real for real. For real for real for real. For real for real for real for real. \\
fastify.register(fastifyStatic, {
    root: "/app/ports/",
    prefix: "/games/ports/",
    decorateReply: false,
});
//#endregion games
// Handling WebSocket upgrades
function createHandlers(clientWs, proxy) {
    const queue = [];
    let proxyReady = false;

    clientWs.on("message", (data, isBinary) => {
        if (proxyReady) {
            proxy.send(data, { binary: isBinary });
        } else {
            queue.push({ data, isBinary });
        }
    });

    proxy.on("open", () => {
        proxyReady = true;
        for (const msg of queue) proxy.send(msg.data, { binary: msg.isBinary });
        queue.length = 0;
    });

    proxy.on("message", (data, isBinary) => {
        if (clientWs.readyState === WebSocket.OPEN)
            clientWs.send(data, { binary: isBinary });
    });

    proxy.on("error", (e) => {
        console.error("proxy error:", e);
        clientWs.terminate();
    });

    clientWs.on("error", (e) => {
        console.error("client error:", e);
        proxy.terminate();
    });

    proxy.on("close", (code, reason) => clientWs.terminate());
    clientWs.on("close", () => {
        if (proxy.readyState === WebSocket.OPEN) proxy.terminate();
    });

    process.on("uncaughtException", (e) => console.error("uncaught:", e));
    process.on("unhandledRejection", (e) =>
        console.error("unhandled rejection:", e),
    );
}
const wss = new WebSocketServer({ noServer: true });
fastify.server.on("upgrade", (req, socket, head) => {
    let handled = false;
    // console.log(`Upgrade Request: ${socket.addListener}`);
    if (req.url.endsWith("/wisp/")) {
        handled = true;
        rReq(req, socket, head);
    } else if (req.url && req.url.startsWith("/debug-ws")) {
        handled = true;
        debugWss.handleUpgrade(req, socket, head, (ws) =>
            debugWss.emit("connection", ws, req),
        );
    } else if (req.url && req.url.startsWith(pPrefix + "/ultrav/service/")) {
        handled = true;
        console.log(`WebSocket Upgrade URL: ${req.url}`);
    }
    // StrongDog tetr.io WS handling
    if (req.url.startsWith("/ribbon-spool/")) {
        handled = true;
        // Extract the target URL after /ribbon-spool/
        const path = req.url.replace("/ribbon-spool/", "");
        const targetUrl = `wss://${path}`;
        const protocol = req.headers["sec-websocket-protocol"];

        wss.handleUpgrade(req, socket, head, (clientWs) => {
            const proxy = new WebSocket(
                targetUrl,
                protocol ? protocol.split(",").map((p) => p.trim()) : [],
                {
                    headers: {
                        "sec-websocket-protocol": protocol,
                        "user-agent": req.headers["user-agent"],
                        cookie: req.headers["cookie"],
                        origin: "https://tetr.io", // override this
                    },
                },
            );

            createHandlers(clientWs, proxy);
        });
    }
    if (
        req.url.startsWith("/narrow-matchmaking") ||
        req.url.startsWith("/narrow-ws/") ||
        req.url.startsWith("/zombs-zr/") ||
        req.url.startsWith("/zombs-eggs/") ||
        req.url.startsWith("/dbaiws/")
    ) {
        handled = true;
        // console.log("we narrow as heck twin")
        // forward to wss://strongdog.com/narrow-matchmaking/
        const targetUrl = `wss://strongdog.com${req.url}`;
        wss.handleUpgrade(req, socket, head, (clientWs) => {
            const proxy = new WebSocket(targetUrl, {
                headers: {
                    // forward selected request headers
                    "user-agent": req.headers["user-agent"],
                    cookie: req.headers["cookie"],
                    "sec-websocket-extensions":
                        req.headers["sec-websocket-extensions"],
                    "sec-websocket-key": req.headers["sec-websocket-key"],
                    "sec-websocket-version":
                        req.headers["sec-websocket-version"],
                    origin: req.headers["origin"],
                },
            });

            createHandlers(clientWs, proxy);
        });
    }
    if (!handled) {
        console.log("guh?");
        socket.end();
    }
});

// Start the server
const port = parseInt(process.env.PORT) || 8080;
fastify.listen({
    port: port,
    host: "0.0.0.0",
});
// Graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("Shutting down server...");
    debugWss.close();
    fastify.close(() => process.exit(0));
}
export default { fastify };
