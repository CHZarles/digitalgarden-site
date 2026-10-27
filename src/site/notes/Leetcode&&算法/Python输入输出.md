---
dg-publish: true
permalink: /Leetcode&&算法/Python输入输出/
---

#### 输入样例：

```
5
3 1 2 4 5
```

#### 输出样例：

```
1 2 3 4 5
```


```python
import sys
sys.setrecursionlimit(1000000)

input = sys.stdin.readline

n = int(input())
arr = list(map(int, input().split()))

...


sys.stdout.write(' '.join(map(str, arr)))
```
