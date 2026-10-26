---
{"dg-publish":true,"permalink":"/CS工程体系/数据库系统/手写sql的思路/","dg-note-properties":{}}
---


语法不重要，抽象数据处理思维才重要


遇到一个题，先想想，如果这个表是一个excel，你会怎么做？


你想保留哪个表的全行？
	- left join
	- right join
> **要保留全部的表放左边，可能缺失的表放右边，缺了自动补 NULL。**
> `A LEFT JOIN B` = 保留 A 全部；`A RIGHT JOIN B` = 保留 B 全部。



SQL 聚合与 GROUP BY 笔记

聚合函数 vs 普通函数

| 类型       | 例子                              | 特点      | 需要 GROUP BY？ |
| -------- | ------------------------------- | ------- | ------------ |
| **聚合函数** | `COUNT` `SUM` `AVG` `MAX` `MIN` | 多行进、一行出 | 可选           |
| **普通函数** | `UPPER` `LENGTH` `ROUND` `NOW`  | 一行进、一行出 | 不需要          |

聚合函数的两种用法

```sql
-- 1. 不加 GROUP BY：整表算一个值
SELECT COUNT(*) FROM Visits;

-- 2. 加 GROUP BY：每个组算一个值
SELECT customer_id, COUNT(*)
FROM Visits
GROUP BY customer_id;
```

> 聚合函数**不强制**配 GROUP BY；不加就把整表当一个组。


用了 GROUP BY 后，SELECT 只能放

- ✅ 分组列（`customer_id`）
- ✅ 聚合函数（`COUNT(*)`）
- ❌ 普通未分组的列（会报错）


执行顺序树

```
              SELECT
                │
                ▼
             COUNT(*)            ← 对每组计数
                │
                ▼
          GROUP BY customer_id   ← 切组
                │
                ▼
      WHERE b.transaction_id IS NULL  ← 过滤行
                │
                ▼
            LEFT JOIN
             ╱     ╲
        FROM a     FROM b
```

**从下往上 = 执行顺序：**
`FROM → JOIN → WHERE → GROUP BY → COUNT → SELECT`

**关键：GROUP BY 先，COUNT 后**（先切组，再每组计数）。



NULL 判断要点

```sql
WHERE amount = NULL        -- ❌ 永远不成立
WHERE amount IS NULL       -- ✅ 正确
```

LEFT JOIN 后判断"没匹配上"：
- 用**右表主键** `b.transaction_id IS NULL` ✅
- 别用可能本身为空的列 ❌


## 表自连接

https://leetcode.cn/problems/average-time-of-process-per-machine/description/?envType=study-plan-v2&envId=sql-free-50

