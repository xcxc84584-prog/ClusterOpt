# Architecture
FTI: classify only. BinaryDocument: editable first 256 KiB byte view, raw tail, dirty state. Editor: edits permitted. FMC save: strict byte mapping, Blob tail stream, original file preserved until writable close. OLR: persist preview and source handle/blob when available. No ZIP decompression.
