# ArcD

## Objects
- FMC.FileTypeIdentifier: identify(blob,name), forceBinary()
- BinaryDocument: Blob, type, file handle, read-only state
- FileManager: route by FTI result
- UI.Dialog.FTI: modal cancel / force binary
- OMU: Identify, Parse, BinarySave EHU

## Routing
Open → FTI → TEXT: VirtualFileSession / ARCHIVE or BINARY: BinaryDocument / UNKNOWN: Dialog → Cancel or ForceBinary.

BinarySave → FileSystemWritableFileStream.write(Blob) → close → SYNCED.
