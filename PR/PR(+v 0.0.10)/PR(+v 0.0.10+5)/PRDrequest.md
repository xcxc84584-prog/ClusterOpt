# FTI / v0.0.10+5

FMC adds FileTypeIdentifier to route TEXT, BINARY and ARCHIVE/ZIP. ZIP is stored and loaded as raw Blob without decompression or UTF-8 decoding. No deny-list configured. Parsing uncertainty prompts the user to cancel or force safe binary load. The dialog shares Cluster UI styling. All FTI failures should emit EHU through OMU.
