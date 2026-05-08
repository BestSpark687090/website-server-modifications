import { server } from "@mercuryworkshop/wisp-js/server";
import { WebSocketServer } from "ws";
import { appendFileSync } from "node:fs";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
//server.setLogLevel(2) //  WARN log level, only logs messages like "warn: (9278db6c) received a DATA packet for a stream which doesn't exist"
const rReq = server.routeRequest;

// Static paths
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { fileURLToPath } from "url";
const _require = createRequire(import.meta.url);
let epoxyImportPath = resolve(baremuxPath + "/../../epoxy-transport/dist");
let ePath = "";
let pPrefix = "/pxy"
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
const controllerPath = dirname(_require.resolve("@mercuryworkshop/scramjet-controller/dist/controller.api.js"));
const libcurlPath = dirname(_require.resolve("@mercuryworkshop/libcurl-transport"));
let sjPrefix = "/sjp"
const fastify = Fastify({forceCloseConnections: true, trustProxy: true });
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
fastify.get(pPrefix+"/ultrav/uv.conf.js", (req, res) => {
	return res.sendFile("uv/uv.conf.js", publicPath);
});
fastify.get(pPrefix+"/ultrav/sw.js", (req, res) => {
	return res.sendFile("uv/sw.js", publicPath);
});
// Register additional static routes
fastify.register(fastifyStatic, {
	root: uvPath,
	prefix: pPrefix+"/ultrav/",
	decorateReply: false,
});
fastify.register(fastifyStatic, {
	root: epoxyImportPath,
	prefix: pPrefix+"/epoxy/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: pPrefix+"/baremux/",
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
	prefix: sjPrefix+"/scramjet/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: controllerPath,
	prefix: sjPrefix+"/controller/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: libcurlPath,
	prefix: sjPrefix+"/libcurl/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: sjPrefix+"/baremux/",
	decorateReply: false,
});

<<<<<<< HEAD
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
		return res.code(upstream.status).type("text/html").send(upstreamError(upstream.status, upstream.statusText));
=======
// Cache for /games/gn/ proxy responses (in-memory, keyed by path)
const gnCache = new Map();
const GN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const GN_BASE_URL = "https://cdn.jsdelivr.net/gh/sealiee11/gnmathstuff@main/";
const coverURL = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";

const coversCache = new Map();
const htmlCache = new Map();

fastify.get("/games/gn/covers/*", async (req, res) => {
	const subPath = req.params["*"] || "";
	const upstreamUrl = coverURL + "/" + subPath;
	const now = Date.now();
	const cached = coversCache.get(subPath);
	if (cached && now - cached.timestamp < GN_CACHE_TTL_MS) {
		res.header("Content-Type", cached.contentType);
		res.header("X-Cache", "HIT");
		return res.send(cached.body);
	}
	const upstream = await fetch(upstreamUrl);
	if (!upstream.ok) {
		return res.code(upstream.status).send(`Upstream error: ${upstream.statusText}`);
>>>>>>> 06af642249360772a1b74833d5f4a66fd7035984
	}
	const contentType = upstream.headers.get("content-type") || "application/octet-stream";
	const body = Buffer.from(await upstream.arrayBuffer());
	coversCache.set(subPath, { body, contentType, timestamp: now });
	res.header("Content-Type", contentType);
<<<<<<< HEAD
	res.header("Cache-Control", "public, max-age=600");
=======
	res.header("X-Cache", "MISS");
	return res.send(body);
});

fastify.get("/games/gn/html/*", async (req, res) => {
	const subPath = req.params["*"] || "";
	const upstreamUrl = htmlURL + "/" + subPath;
	const now = Date.now();
	const cached = htmlCache.get(subPath);
	if (cached && now - cached.timestamp < GN_CACHE_TTL_MS) {
		res.header("Content-Type", cached.contentType);
		res.header("X-Cache", "HIT");
		return res.send(cached.body);
	}
	const upstream = await fetch(upstreamUrl);
	if (!upstream.ok) {
		return res.code(upstream.status).send(`Upstream error: ${upstream.statusText}`);
	}
	const contentType = upstream.headers.get("content-type") || "application/octet-stream";
	const body = Buffer.from(await upstream.arrayBuffer());
	htmlCache.set(subPath, { body, contentType, timestamp: now });
	res.header("Content-Type", contentType);
	res.header("X-Cache", "MISS");
	return res.send(body);
});

fastify.get("/games/gn/*", async (req, res) => {
	const subPath = req.params["*"] || "";
	const upstreamUrl = GN_BASE_URL + subPath;
	const now = Date.now();
	const cached = gnCache.get(subPath);
	if (cached && now - cached.timestamp < GN_CACHE_TTL_MS) {
		res.header("Content-Type", cached.contentType);
		res.header("X-Cache", "HIT");
		return res.send(cached.body);
	}
	const upstream = await fetch(upstreamUrl);
	if (!upstream.ok) {
		return res.code(upstream.status).send(`Upstream error: ${upstream.statusText}`);
	}
	const contentType = upstream.headers.get("content-type") || "application/octet-stream";
	const body = Buffer.from(await upstream.arrayBuffer());
	gnCache.set(subPath, { body, contentType, timestamp: now });
	res.header("Content-Type", contentType);
>>>>>>> 06af642249360772a1b74833d5f4a66fd7035984
	res.header("X-Cache", "MISS");
	return res.send(body);
});

// Cache for /games/sd/ proxy responses
const sdCache = new Map();
const SD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SD_BASE_URL = "https://strongdog.com/";

fastify.get("/games/sd/*", async (req, res) => {
	const subPath = req.params["*"] || "";
	const upstreamUrl = SD_BASE_URL + subPath;
	const now = Date.now();
	const cached = sdCache.get(subPath);
	if (cached && now - cached.timestamp < SD_CACHE_TTL_MS) {
		res.header("Content-Type", cached.contentType);
<<<<<<< HEAD
		res.header("Cache-Control", "public, max-age=300");
=======
>>>>>>> 06af642249360772a1b74833d5f4a66fd7035984
		res.header("X-Cache", "HIT");
		return res.send(cached.body);
	}
	const upstream = await fetch(upstreamUrl);
	if (!upstream.ok) {
<<<<<<< HEAD
		return res.code(upstream.status).type("text/html").send(upstreamError(upstream.status, upstream.statusText));
=======
		return res.code(upstream.status).send(`Upstream error: ${upstream.statusText}`);
>>>>>>> 06af642249360772a1b74833d5f4a66fd7035984
	}
	const contentType = upstream.headers.get("content-type") || "application/octet-stream";
	const body = Buffer.from(await upstream.arrayBuffer());
	sdCache.set(subPath, { body, contentType, timestamp: now });
	res.header("Content-Type", contentType);
<<<<<<< HEAD
	res.header("Cache-Control", "public, max-age=300");
=======
>>>>>>> 06af642249360772a1b74833d5f4a66fd7035984
	res.header("X-Cache", "MISS");
	return res.send(body);
});

// expects {"username": "[username]","url": "[url]" } // It can get IP by itself I think
fastify.post("/reportURL", (req,res)=>{
	let body = req.body
	console.log(`[${new Date().toLocaleString()}]: ${body.username} visited ${body.url}, IP is ${req.ip}`)
	return res.code(204).send({"message": "Done."})
})

// Debug relay WebSocket — senders push messages, viewers receive them
const debugWss = new WebSocketServer({ noServer: true });
const debugViewers = new Set();
const debugSenders = new Set();

debugWss.on("connection", (ws, req) => {
	const isSender = new URL(req.url, "http://x").searchParams.get("role") === "sender";
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
		ws.on("close", () => { debugSenders.delete(ws); console.log("[debug] sender disconnected"); });
	} else {
		debugViewers.add(ws);
		ws.send(JSON.stringify({ type: "connected", ts: Date.now() }));
		ws.on("close", () => debugViewers.delete(ws));
	}
});

// Handling WebSocket upgrades
fastify.server.on("upgrade", (req, socket, head) => {
	// console.log(`Upgrade Request: ${socket.addListener}`);
	if (req.url.endsWith("/wisp/")) {
		rReq(req, socket, head);
	} else if (req.url && req.url.startsWith("/debug-ws")) {
		debugWss.handleUpgrade(req, socket, head, (ws) => debugWss.emit("connection", ws, req));
	} else if (req.url && req.url.startsWith(pPrefix+"/ultrav/service/")) {
		console.log(`WebSocket Upgrade URL: ${req.url}`);
	} else {
		console.log("ended socket");
		socket.end(); // Close the connection for unsupported routes
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
