# PR(+Opt 3) — Plan

## Technical approach
1. 以獨立 ES Module 實作 LANGUAGE 黑箱物件，私有 locale 與 listeners。
2. 公開 get/set/t/subscribe 契約；不讓其他物件直接改寫內部 locale。
3. 以字典翻譯 UI 字串；保持使用者文件內容不變。
4. 將偏好儲存於 localStorage，失敗時可正常使用。
5. 保留根目錄 GitHub Pages 入口，Program/ 存放新物件。

## Risks
- 舊程式碼存在硬編碼文案：逐一替換並進行 UI 回歸測試。
- 瀏覽器儲存遭封鎖：降級為記憶體偏好。
- 網站重載快取：強制重新整理驗證。

## References
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Internationalization
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang
- https://google.github.io/styleguide/jsguide.html
