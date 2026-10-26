---
{"dg-publish":true,"permalink":"/CS工程体系/计算机网络/HTTP协议系列/TODO：如何减少重复传输？（缓存机制）/","dg-note-properties":{}}
---



**核心问题：如何避免不必要的网络往返？**

这是你已经接触的领域，但放在整体脉络中，它是**性能优化的核心支点**：

Table

|维度|要点|
|:--|:--|
|**缓存位置**|私有缓存（浏览器）vs 共享缓存（CDN/代理）|
|**新鲜度**|`max-age`、`Expires`、启发式缓存|
|**验证机制**|`ETag`（优先级高）+ `If-None-Match` vs `Last-Modified` + `If-Modified-Since`|
|**强制策略**|`no-cache`（要验证）、`no-store`（不存）、`immutable`（永不变）|
|**缓存破坏**|文件名哈希 + 长期缓存，是工程最佳实践|

> 💡 **关键认知**：缓存不是"存不存"的二元问题，而是** freshness → validation → fetch **的三阶段决策流程。