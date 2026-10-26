---
{"dg-publish":true,"permalink":"/CS工程体系/计算机网络/HTTP协议系列/TODO：利用HTTP报文表达意图/","dg-note-properties":{}}
---


第二层：报文如何表达意图？（头部与内容协商）

**核心问题：如何精确描述请求和响应的元信息？**

- **通用头**：`Date`、`Connection`、`Via`
- **请求头**：`Accept-*` 系列（内容协商）、`User-Agent`、`Referer`、`Authorization`
- **响应头**：`Server`、`Location`（重定向核心）
- **内容协商**：`Accept-Language`、`Accept-Encoding`（gzip/br）如何工作
- **实体头**：`Content-Type`、`Content-Length`、`Transfer-Encoding: chunked`

> 💡 **关键认知**：头部是 HTTP 的"元数据层"，掌握头部才能理解缓存、安全、性能优化的底层机制。