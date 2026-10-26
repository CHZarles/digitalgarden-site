---
{"dg-publish":true,"permalink":"/CS工程体系/数据库系统/MySql/Sql题目训练/","dg-note-properties":{}}
---


### safe equal

```sql
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
| referee_id  | int     |
+-------------+---------+
```

在 SQL 中，id 是该表的主键列。该表的每一行表示一个客户的 id、姓名以及推荐他们的客户的 id。找出以下客户的姓名：

1. **被任何** `id != 2` 的用户推荐。
2. **没有被** 任何用户推荐。

以 **任意顺序** 返回结果表。结果格式如下所示。

```sql
SELECT name
FROM customer
WHERE NOT referee_id <=> 2;
```

