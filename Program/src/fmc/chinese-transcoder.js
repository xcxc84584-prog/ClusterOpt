/**
 * Converts a legacy Chinese byte stream to UTF-8 for the UTF-8-only FMC.
 * TextDecoder streaming preserves multibyte characters across byte chunks.
 * The original Blob remains immutable; the converted Blob is used by the editor.
 */
export async function transcodeToUtf8(blob, encoding, onProgress = () => {}) {
  if (!['Big5','GBK','GB18030'].includes(encoding)) {
    throw new RangeError('Unsupported source encoding');
  }
  const decoder = new TextDecoder(encoding.toLowerCase(), {fatal: true});
  const encoder = new TextEncoder();
  const parts = [];
  const size = 256 * 1024;
  for (let offset = 0; offset < blob.size; offset += size) {
    const bytes = new Uint8Array(
      await blob.slice(offset, Math.min(blob.size, offset + size)).arrayBuffer()
    );
    const decoded = decoder.decode(bytes, {stream: true});
    if (decoded) parts.push(encoder.encode(decoded));
    onProgress({completed: Math.min(offset + size, blob.size), total: blob.size});
  }
  const tail = decoder.decode();
  if (tail) parts.push(encoder.encode(tail));
  return new Blob(parts, {type:'text/plain;charset=utf-8'});
}
