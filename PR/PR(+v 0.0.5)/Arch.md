# Cluster Opt 5 — 架構設計書（Arch.md）
版本：Opt 5｜語言：繁體中文

## 1. 目標
實作內部優先、外部優先，以及逐文件同步狀態。外部優先時外部檔案為準，捨棄未儲存編輯；內部優先時保留編輯器內容。此功能僅在取得可持續讀取的 FileSystemFileHandle 時支援外部變更檢測。

## 2. 物件清單
| 物件 | 職責 |
|---|---|
| GlobalPropertyRegistry | 註冊、讀取、修改及訂閱全域屬性 |
| Documents | 私有文件資料、revision、替換外部內容、保存 |
| FileManager | 開啟、讀取與儲存檔案 |
| ExternalChangeMonitor | 監測外部變化、比較內容、執行優先權政策 |
| SyncStatus | 各 DocumentID 的狀態及訂閱通知 |
| IDE_UI_BASE | 顯示目前分頁的同步狀態 |
| LANGUAGE | 全域語言 |
| OMU/EHU | 記錄操作與錯誤 |

## 3. 屬性
- STORAGE_PRIORITY：全域 internal/external，預設 internal。
- DOCUMENT_STATUS：全域可查詢服務，但狀態按 DocumentID 獨立儲存。
- LANGUAGE：全域語言。
- UI_PALETTE：全域色盤，預設 dark；此版先註冊，不實作主題切換。
- DOCUMENT_REVISION：單文件編輯版本。
- FILE_HANDLE：受權限控制的外部檔案控制代碼。
- EXTERNAL_SNAPSHOT：最近一次讀取的外部內容。

## 4. 全域屬性規則
所有物件共用的屬性，如語言、系統 UI 色盤、文件狀態檢測等，必須由 GlobalPropertyRegistry 統一註冊。
1. 全域屬性採單一資料來源，不得維護互不一致的副本。
2. 物件經公開 Property/Request/Response 契約讀取或修改。
3. 共用讀取權限不等於共用寫入權限。
4. 變更通知須發送給訂閱物件。
5. DOCUMENT_STATUS 依 DocumentID 獨立，不得把單一文件同步狀態套用全部文件。
6. 失敗必須回報 EHU 與 LOG，並維持黑箱隔離。

## 5. 狀態機
| 狀態 | 色彩 | 意義 |
|---|---|---|
| SYNCED | 綠 #22C55E | 已確認編輯器與最新讀取的外部內容一致 |
| DIVERGED | 黃 #EAB308 | 內部與外部內容不同 |
| ERROR | 紅 #EF4444 | 讀取、權限或寫入失敗 |
| LOADING | 藍 #3B82F6 | 正在檢查外部文件 |
| UNVERIFIED | 灰 #64748B | 無持續存取權限，無法證實同步 |

## 6. 事件鏈
- 開啟檔案 → FileManager.openWithHandle → Documents.create → Monitor.watch → SyncStatus.SYNCED → UI。
- 編輯文件 → Documents.update → Monitor.onEdit → SyncStatus.DIVERGED → UI。
- 外部覆蓋 + external → Monitor.checkNow → Documents.replaceFromExternal → SyncStatus.SYNCED → UI。
- 外部覆蓋 + internal → Monitor.checkNow → 保留 Documents → SyncStatus.DIVERGED → UI。
- 讀取失敗 → EHU/OMU → SyncStatus.ERROR → UI。
- 儲存 → FileManager.save → Documents.setSaved → Monitor.watch → UI。
- 切換分頁 → UI.refresh → SyncStatus.get(DocumentID) → UI。
- 切換優先權 → GlobalPropertyRegistry.set → Monitor.checkAll。

## 7. 實作限制
- Chrome/Edge 等支援 File System Access API 的瀏覽器可透過 showOpenFilePicker 取得檔案控制代碼。
- 一般 input file 僅有一次性快照，狀態應為 UNVERIFIED。
- 監測採每 2.5 秒輪詢與視窗 focus 檢查，不保證即時。
- 網頁不能繞過使用者的檔案存取授權。
- UI_PALETTE 尚未有色盤切換功能。

## 8. Relationship Test
| ID | 測試 | 預期 |
|---|---|---|
| RT-01 | 開啟可監測文件 | 綠 |
| RT-02 | 編輯可監測文件 | 黃 |
| RT-03 | 外部優先，磁碟覆蓋 | 編輯器更新，綠 |
| RT-04 | 內部優先，磁碟覆蓋 | 保留編輯，黃 |
| RT-05 | 讀取權限失敗 | 紅，OMU EHU |
| RT-06 | 外部讀取中 | 藍 |
| RT-07 | 無 File Handle | 灰 |
| RT-08 | 切換文件 | 狀態按文件獨立 |
| RT-09 | 儲存完成 | 綠或灰，視可監測性 |
| RT-10 | 優先權切換 | 套用新政策 |
| RT-11 | 關閉文件後監測 | 不再更新已關閉文件 |
| RT-12 | 語言切換 | 不破壞同步功能 |

測試狀態：尚未在真實瀏覽器執行，不得標示 PASS。
