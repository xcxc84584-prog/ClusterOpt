# Opt 8 — ArcD / OCDA

## 3.1 Object List
| ID | Object | 職責 |
|---|---|---|
| OBJ-OLR | OverloadRestorer (MVCC SubObject 規劃) | 工作區持久化、Undo/Redo、位置恢復 |
| OBJ-LTREE | LineTree | Fenwick Tree 前綴行數與定位 |
| OBJ-WINDOW | WindowLoader | 需求窗口載入及鄰近切片回收 |
| OBJ-SL | SliceLoader | 實體 Blob 範圍載入 |
| OBJ-FMC | FMC | 已載入切片、WTF/MVCC |

## 3.2 Property List
| ID | Property | 共用對象 |
|---|---|---|
| P-DOC | DOCUMENT_STATUS | UI / Monitor |
| P-PROGRESS | STORAGE_PROGRESS | UI / Storage |
| P-WTF | WTF_LEASE | FMC / FU / MVCCU（尚未接入 Editor） |
| P-POS | EDITOR_POSITION | Editor / OLR（目前局部 Map，尚未註冊全域） |

## 3.3 Event Chain
- USER.Edit → Documents.Update → OLR.Record → OLR.Save (IndexedDB)。
- USER.Reload → OLR.RestoreAll → Documents.Create → Editor.Refresh → RestorePosition。
- USER.Scroll → CapturePosition → OLR.Save。
- API.LoadSliceWindow → SL.Attach → WindowLoader.LoadWindow → FMC.Register/Read。

## 3.4 EHU List
| ID | 情境 | 處理 |
|---|---|---|
| E-01 | IndexedDB 無法使用或額度不足 | EHU LOG，現有編輯不應中斷 |
| E-02 | 載入切片失敗 | 回傳錯誤 Response |
| E-03 | 舊 Viewport 回傳 | 409，避免更新過期窗口 |
| E-04 | WTF 競爭 | 尚待編輯器整合，不得宣稱完成 |

## 3.5 Relationship Test
參照 Relation Test.md，尚未執行瀏覽器驗證。

## Dependency
Editor → OLR、Documents；WindowLoader → SL → FMC；OLR IndexedDB 依賴瀏覽器儲存權限。
