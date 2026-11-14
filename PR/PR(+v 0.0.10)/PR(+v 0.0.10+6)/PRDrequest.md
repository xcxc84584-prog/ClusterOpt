# v0.0.10+6 FTI editable binary
FTI does not restrict edit permissions. ZIP and arbitrary binary content must appear in the editor even as garbled characters. Editing must preserve unmodified bytes and reject non-representable characters at save, never silently corrupt original bytes.
