# Plan

參考舊版 https://github.com/xcxc84584-prog/Cluster 中 BASE/style.css、link_plugin_CEXP/explorer-ui.js 與 plugin_CEXP/explorer-core.js：dock sidebar、folder tree、lazy handle traversal、open editors。此版本以獨立 EXPLORER ES module 重建，不複製舊版 IndexedDB roots schema。

搜尋只涵蓋已開啟文件、根節點及已展開讀取的子節點；不會自動掃描整個大型資料夾。目錄 handle 暫存於記憶體，重新載入後需重新選取資料夾。保留本地優先與無資料庫伺服器架構。
