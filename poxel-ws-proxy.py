#!/usr/bin/env python3
"""
WebSocket proxy using curl_cffi (Chrome TLS fingerprint) to bypass Cloudflare.
Protocol with Node: length-prefixed binary frames on stdin/stdout.
  stdout (to Node): 4-byte big-endian length + payload
  stdin  (from Node): 4-byte big-endian length + payload
Env vars: WS_URL, WS_ORIGIN, WS_UA, WS_COOKIE
"""
import asyncio, os, struct, sys

async def main():
    from curl_cffi.requests import AsyncSession

    url    = os.environ["WS_URL"]
    origin = os.environ.get("WS_ORIGIN", "https://poxel.io")
    ua     = os.environ.get("WS_UA", "")
    cookie = os.environ.get("WS_COOKIE", "")

    headers = {"Origin": origin}
    if ua:     headers["User-Agent"] = ua
    if cookie: headers["Cookie"] = cookie

    loop = asyncio.get_running_loop()

    def write_to_node(data: bytes):
        sys.stdout.buffer.write(struct.pack(">I", len(data)) + data)
        sys.stdout.buffer.flush()

    async def stdin_reader(ws):
        while True:
            hdr = await loop.run_in_executor(None, sys.stdin.buffer.read, 4)
            if len(hdr) < 4:
                break
            plen = struct.unpack(">I", hdr)[0]
            payload = await loop.run_in_executor(None, sys.stdin.buffer.read, plen)
            if len(payload) < plen:
                break
            await ws.send_bytes(payload)

    async with AsyncSession() as s:
        try:
            async with s.ws_connect(url, headers=headers, impersonate="chrome120", verify=False) as ws:
                stdin_task = asyncio.create_task(stdin_reader(ws))
                async for msg in ws:
                    write_to_node(bytes(msg.content))
                stdin_task.cancel()
        except Exception as e:
            sys.stderr.write(f"[poxel-ws-proxy] error: {e}\n")
            sys.exit(1)

asyncio.run(main())
