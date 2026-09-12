export async function boundedRequestBytes(request: Request, maximum: number): Promise<Buffer> {
  if (Number(request.headers.get("content-length")) > maximum) throw new Error("request-too-large");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try { while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > maximum) throw new Error("request-too-large");
    chunks.push(part.value);
  } } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}
