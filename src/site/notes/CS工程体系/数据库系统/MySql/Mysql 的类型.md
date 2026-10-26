---
{"dg-publish":true,"permalink":"/CS工程体系/数据库系统/MySql/Mysql 的类型/","dg-note-properties":{}}
---

```bash
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| product_id  | int     |
| low_fats    | enum    |
| recyclable  | enum    |
+-------------+---------+
```

`product_id` 是该表的主键（具有唯一值的列）。

low_fats 是枚举类型，取值为以下两种 ('Y', 'N')，其中 'Y' 表示该产品是低脂产品，'N' 表示不是低脂产品。

recyclable 是枚举类型，取值为以下两种 ('Y', 'N')，其中 'Y' 表示该产品可回收，而 'N' 表示不可回收。

