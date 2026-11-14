# PRD v0.0.16

修正使用者實際操作時 <> 不自動配對及 {} 內 Enter 不縮排。根因候選：僅攔截 keydown，無法涵蓋部分輸入法、軟鍵盤與其他 beforeinput 路徑。新增 beforeinput 整合，維持 keydown 路徑。
