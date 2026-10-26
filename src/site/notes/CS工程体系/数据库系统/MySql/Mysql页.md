---
{"dg-publish":true,"permalink":"/CS工程体系/数据库系统/MySql/Mysql页/","dg-note-properties":{}}
---

页是Innode管理数据和磁盘交互数据的基本单元，默认 16k
- 如果想要调整大小，需要保证是操作系统的页4k的整数倍
- 这个方便 innodb 和 磁盘交互的时候保持数据完整

页分为
- Undo Log 页
- Change Buffer 页
- XDES 页
- ....

不同页内的数据结构都不同


## 数据页

即存储数据表行的数据的页