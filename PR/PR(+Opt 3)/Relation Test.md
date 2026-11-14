# PR(+Opt 3) — Relation Test

| ID | Scenario | Expected |
|---|---|---|
| RT-01 | RQ PASS: set('en') | code 200; UI English; LOG |
| RT-02 | RQ FAIL: set('invalid') | code 400; locale unchanged; EHU LOG |
| RT-03 | RP PASS: subscriber notified | re-render; no document mutation |
| RT-04 | RP FAIL: storage denied | fallback; UI remains usable |

## Regression checklist
- 新增、開啟、編輯、儲存、關閉文件。
- 切換語言不改變內容與 Dirty 狀態。
- 重載偏好保留（localStorage 可用時）。
- OMU LOG 仍可透過 window.ClusterOpt.logs() 查詢。

Status: 規格與案例已建立，瀏覽器端測試尚未執行，不能標記 PASS。
