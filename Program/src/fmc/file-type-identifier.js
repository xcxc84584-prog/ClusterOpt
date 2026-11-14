/**
 * FMC File Type Identifier. Inspects a bounded header, never decodes
 * binary content and never rejects a type by policy (yet).
 */
export class FileTypeIdentifier {
  async identify(blob, name = '') {
    if (!(blob instanceof Blob)) throw new TypeError('FTI requires Blob');
    const header = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
    const zip = header.length >= 4 && header[0] === 0x50 &&
      header[1] === 0x4b && (
        (header[2] === 3 && header[3] === 4) ||
        (header[2] === 5 && header[3] === 6) ||
        (header[2] === 7 && header[3] === 8)
      );
    if (zip) return {kind: 'ARCHIVE', format: 'ZIP', mode: 'BINARY', ehu: 'FTI_ARCHIVE_LOAD'};
    if (header.some(byte => byte === 0)) {
      return {kind: 'BINARY', format: 'UNKNOWN', mode: 'BINARY', ehu: 'FTI_BINARY_LOAD'};
    }
    try {
      const text = new TextDecoder('utf-8', {fatal: true}).decode(header.slice(0,
        header.length > 4 ? header.length - 4 : header.length));
      const cjk = /[\u3400-\u9fff\uf900-\ufaff]/u.test(text);
      return {kind: 'TEXT', format: 'UTF-8', mode: 'TEXT',
        script: cjk ? 'CJK' : 'GENERAL', ehu: 'FTI_TEXT_LOAD'};
    } catch {
      return {kind: 'UNKNOWN', format: 'UNKNOWN', mode: 'PROMPT', ehu: 'FTI_PARSE_FAILED'};
    }
  }

  /** Explicit text override: invalid UTF-8 is displayed with replacement characters. */
  forceText() {
    return {kind: 'TEXT', format: 'UTF-8-REPLACE', mode: 'FORCE_TEXT', ehu: 'FTI_FORCED_TEXT'};
  }

  /** Raw byte view remains available for recognized binary files. */
  forceBinary() {
    return {kind: 'BINARY', format: 'RAW', mode: 'BINARY', ehu: 'FTI_FORCED_BINARY'};
  }
}
