# 51.4 PRD
Token Cache 使用 Document、Slice、Revision、Language 及精確上下文內容驗證，LRU 32 筆、2 MiB 單位預算；語法 Token 與顏色分離，避免調色盤變動重新解析。不得讓舊 Revision 覆蓋新版；保留取消與 VTE 非干預。
