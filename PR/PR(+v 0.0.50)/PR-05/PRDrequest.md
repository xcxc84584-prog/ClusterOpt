# PRDrequest — 50.5 軟換行視覺行模型

建立邏輯行到視覺行的映射，支援按需已載入的物理切片，局部 splice 與可視窗口換算；保留 textarea、MVCC/FLAG、IME、Gutter 與著色器現有正確性。瀏覽器 soft wrap 暫不啟用，待實際字寬測量、CJK/emoji、Tab、著色器/DFOM 同步後另行啟用。
