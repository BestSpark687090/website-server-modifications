// This file overwrites the stock UV config.js

self.__uv$config = {
  prefix: "/proxy/uv/service/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/proxy/uv/uv.handler.js",
  client: "/proxy/uv/uv.client.js",
  bundle: "/proxy/uv/uv.bundle.js",
  config: "/proxy/uv/uv.config.js",
  sw: "/proxy/uv/uv.sw.js",
};
