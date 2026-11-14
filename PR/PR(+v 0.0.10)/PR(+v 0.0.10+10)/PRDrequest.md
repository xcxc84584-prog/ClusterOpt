# v0.0.10+10

1. Closing B must automatically restore and load surviving A, not leave its editor empty.
2. FTI forced loading must open in text mode rather than binary byte view. Invalid UTF-8 displays replacement characters. Unedited original slices preserve raw bytes on save; edited slices may be re-encoded.
