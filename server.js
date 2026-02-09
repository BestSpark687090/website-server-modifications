import { server } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { resolve } from "node:path";
const rReq = server.routeRequest;

// Static paths
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
// import { epoxyPath } from "./node_modules/@mercuryworkshop/epoxy-transport/lib/index.cjs";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
let epoxyImportPath = resolve(baremuxPath + "/../../epoxy-transport/dist");
let ePath = "";
let pPrefix = "/proxy"
const fastify = Fastify();
// Register static files
fastify.register(fastifyStatic, {
	root: publicPath,
  prefix: pPrefix,
	decorateReply: false,
});
fastify.register(fastifyStatic, {
	root: "/srv/http/BestSpark687090", // This probably isn't a good idea but too bad
	decorateReply: true,
});
// Serve UV config file
fastify.get(pPrefix+"/uv/uv.config.js", (req, res) => {
	return res.sendFile("uv/uv.config.js", publicPath);
});

// Register additional static routes
fastify.register(fastifyStatic, {
	root: uvPath,
	prefix: pPrefix+"/uv/",
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

// Handling WebSocket upgrades
fastify.server.on("upgrade", (req, socket, head) => {
	// console.log(`Upgrade Request: ${socket.addListener}`);
	if (req.url.endsWith("/wisp/")) {
		rReq(req, socket, head);
	} else if (req.url && req.url.startsWith(pPrefix+"/uv/service/")) {
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
	fastify.close(() => process.exit(0));
}
export default { fastify };
