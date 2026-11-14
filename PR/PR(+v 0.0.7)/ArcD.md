# Opt 7 — ArcD（OCDA）

## 3.1 Object List
| ID | Object | 類型 | 主要職責 |
|---|---|---|---|
| OBJ-FMC | FileManagementCore | Core | Loaded Slice Registry 與 Request/Response |
| OBJ-FU | FlagUnit | Protected | WTF 租約與 FencingToken |
| OBJ-MVCC | MVCCUnit | Protected | 已提交版本與衝突驗證 |
| OBJ-SL | SliceLoader | Service | Byte-range 載入、註冊、卸載 |
| OBJ-SPT | StorageProgressTracker | Service | OperationID 進度與狀態 |
| OBJ-UI | SyncProgressBar | UI | 進度條與文字視覺化 |

## 3.2 Property List
| ID | Property | 說明 | 共用對象 |
|---|---|---|---|
| P-STATUS | DOCUMENT_STATUS | 文件同步狀態 | UI、Monitor |
| P-PROGRESS | STORAGE_PROGRESS | 儲存操作進度 | UI、Storage |
| P-PALETTE | UI_PALETTE | 系統色盤 | 所有 UI |
| P-LANGUAGE | LANGUAGE | 介面語言 | 所有 UI |

## 3.3 Event Chain
SAVE Request → StorageProgressTracker.start → DOCUMENT_STATUS.SAVING → FileManager.save → StorageProgressTracker.update/finish → DocumentSyncState → UI progress Response。

## 3.4 EHU List
| ID | 情境 | EHU | LOG |
|---|---|---|---|
| E-01 | WTF 重複取得 | 409 | ERROR |
| E-02 | WTF 過期 | 403/409 | EHU |
| E-03 | MVCC BaseVersion 衝突 | 409 | EHU |
| E-04 | Storage 寫入失敗 | ERROR、保留 Dirty | EHU |
| E-05 | SL 無效範圍 | 416 | ERROR |

## 3.5 Relationship Test
參見 Relation Test.md；測試尚未完成。

## Dependency
FMC→FU/MVCCU（Protected）；SL→FMC（註冊契約）；UI→Global Properties（訂閱）。FMCU 尚未接入。

## OCDA
Public Request/Response 與 Private Program 分離；OMU/EHU 不得被 LOOP 正常 LOG 壓縮規則吞掉。
