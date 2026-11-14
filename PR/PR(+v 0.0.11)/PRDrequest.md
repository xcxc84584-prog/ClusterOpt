# ClusterOpt v0.0.11 — FlagUnit requirements
- USER input is never blocked by an AGENT lease; USER edit atomically revokes AGENT WTF and every ORF on the same slice.
- AGENT reads require an OnlyReadFLAG; multiple ORFs coexist only while there is no WTF.
- An AGENT with revoked WTF/ORF cannot commit or return an authorized read; EHU is emitted.
- AGENT conflicts return deferred status; bounded retry is available.
- Releasing/revoking flags never deletes MVCC/OLR content.
- Existing 60-second initial lease and 50-second renewal threshold retained; only one renewal, 120 seconds from renewal.
