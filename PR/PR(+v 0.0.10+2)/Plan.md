# Plan

- 追蹤編輯器目前文件 ID，避免相同文件 refresh 覆蓋 gutter。
- 保存完成後依 revision 與 file handle 判定 SYNCED。
- 使用 FileSystemHandle.isSameEntry 判斷是否同一文件；無 handle 時採名稱退化策略。
- 版本更新並執行關係測試。
