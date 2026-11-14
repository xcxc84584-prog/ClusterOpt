# Plan
Use reversible byte-to-U+0000..U+00FF mapping for first 256 KiB. Preserve untouched tail Blob without decoding. Convert edited byte view back to raw bytes on save. Restore binary workspace state via OLR. References: MDN Blob.slice and FileSystemWritableFileStream, Google engineering code review guidance.
