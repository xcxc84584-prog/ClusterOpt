# ArcD — 50.2

Event Chain: USER beforeinput -> NewlineEditIntent.Request.deriveEditIntent -> UI stores intent + LINE_EDIT_DELTA -> browser native textarea edit -> UI input -> EditPath.Request.applyKnownPatch -> MicroSliceDocument.replace -> PieceTree LF counts -> VirtualFileSession.edit -> FLAG/MVCC -> dirty/recovery -> Response. If intent absent, invalid, or local context mismatch, EditPath.reconcile full diff fallback. On exception OMU error EHU and original commit path remains.

Properties: EDIT_RANGE, LINE_EDIT_DELTA. OCDA new object NewlineEditIntent; 40 total. Permission: pure parser does not mutate documents or acquire leases. No SendTo(). Input events are hints, not trusted authorization. Native textarea owns IME/undo.
