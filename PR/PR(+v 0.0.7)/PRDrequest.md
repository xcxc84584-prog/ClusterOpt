# Opt 7 — PRDrequest

- 所有文件以切片存取；SL 決定註冊及銷毀，FMC 只管理已載入切片。
- FMC 包含 FU、MVCCU、Request API、Response。
- FMCU 根據使用者需求取得切片。
- 每個切片最多一個有效 WTF，並維護 MVCC 版本。
- 文件同步狀態及儲存進度以底部進度條視覺化。
- 每次實作前參考網路專案與程式編寫守則。
