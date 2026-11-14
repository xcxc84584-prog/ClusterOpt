# Plan — v0.0.11
1. Implement synchronous per-slice WTF/ORF arbitration with fencing epoch and lease ownership.
2. Make USER edits preemptive; AGENT writes exclusive and non-preemptive.
3. Validate ORF before and after MVCC read, and WTF immediately before commit.
4. Bind AGENT/USER gateways to a trusted caller identity; bounded defer/backoff for reads.
5. Publish revoke/deny events through EHU and OMU.
6. Preserve SliceLoader retirement guards for active WTF and ORF.
7. Add Node tests and GitHub Actions CI; validate actual browser and remote gateway authentication separately.
