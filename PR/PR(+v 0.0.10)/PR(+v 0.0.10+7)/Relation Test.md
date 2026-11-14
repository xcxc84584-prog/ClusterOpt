# Relation Tests — browser validation pending

- center 0 protects 0 and 1, center last protects last and previous.
- moving from center 5 to 9 retires clean 4,5,6, retains 8,9,10.
- dirty / unpersisted MVCC cannot be retired.
- OLR recovery protected slice cannot be retired.
- active WTF lease prevents retirement.
- concurrent neighbor loads must not leave stale resident slices.
- successful save releases persisted protection; save failure preserves it.
- line index remains available after unloading content.
