# Plan

參考官方 VS Code language configuration：https://code.visualstudio.com/api/language-extensions/language-configuration-guide 與 C++/HTML language-configuration.json。參考 autoClosingPairs、autoCloseBefore、onEnterRules(indentOutdent)、indentationRules。

注意：VS Code 的 C++ <> 主要是 surroundingPairs，而非所有位置自動閉合。本版依使用者明確需求將 <> 設為一般自動閉合。空白展開 {} 是 ClusterOpt 的擴充；VS Code 常見行為為 Enter 展開。
