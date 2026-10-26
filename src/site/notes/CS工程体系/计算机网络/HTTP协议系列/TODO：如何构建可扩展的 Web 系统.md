---
{"dg-publish":true,"permalink":"/CS工程体系/计算机网络/HTTP协议系列/TODO：如何构建可扩展的 Web 系统/","dg-note-properties":{}}
---




**核心问题：如何用 HTTP 设计好 API 和系统？**

- **状态码语义**：2xx（成功）、3xx（重定向）、4xx（客户端错）、5xx（服务端错）的精确使用场景
    
- **RESTful 设计**：资源命名、状态码选择、HATEOAS（可选）
    
- **认证授权**：Basic、Bearer Token（JWT）、Cookie-Session 模式在 HTTP 层的实现差异
    
- **跨域（CORS）**：预检请求（`OPTIONS`）、`Access-Control-*` 头部的协作逻辑
    
- **调试工具**：curl、浏览器 DevTools Network 面板、Wireshark（抓包）、Charles/Fiddler（代理）
    

> 💡 **关键认知**：HTTP 是 Web 的"操作系统接口"，设计良好的 HTTP 接口决定了系统的可维护性和可扩展性。