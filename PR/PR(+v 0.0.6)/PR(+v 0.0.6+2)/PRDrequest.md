# PR(v0.0.6+2) — 需求
1. 實作前先查詢公開專案、技術文件與程式編寫守則。
2. 程式採一致格式、單一物件模組、清楚命名，避免過長單行。
3. 專案根目錄分離 Program、全域屬性清單.md、PR；補丁 PR 放在對應母版資料夾下。
4. 全域屬性由註冊器共享，例如 LANGUAGE、UI_PALETTE、DOCUMENT_STATUS。
5. OMU 的 LOOP 只保存 START、ERROR、EHU、END；非 LOOP 的一般 LOG 照常保存。
