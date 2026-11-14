# Plan

- Inspect bounded file header, identify ZIP magic and obvious binary content before text loader.
- Route binary to read-only document window and byte-preserving save.
- Add accessible native dialog and palette-aware CSS.
- Record FTI errors through OMU.
- Validate ZIP round-trip with SHA-256, unknown encoding, corrupt ZIP, huge ZIP, and restore/reload before release.

References: https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer ; https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ ; https://google.github.io/eng-practices/
