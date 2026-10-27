---
dg-publish: true
permalink: /Leetcode&&算法/总结梳理/dfs-网格上的约束路径问题/
---

```python

DIRS = [(1,0),(-1,0),(0,1),(0,-1)]

def grid_search(grid):
    if not grid or not grid[0]:
        return False
    m, n = len(grid), len(grid[0])

    def is_start(i, j):  # 外层谁能当起点？
        ...

    def is_goal(i, j, extra):  # 什么算走到头？extra如k/步数/累积值 (optional)
        ...

    def is_valid(ni, nj, extra):  # 下一步合法？越界/重访/规则
        return (0 <= ni < m and 0 <= nj < n
                and not used[ni][nj]
                and ...)

    def dfs(i, j, extra):
        if is_goal(i, j, extra):
            return True
        # option 剪枝
		
            
        used[i][j] = True          # apply
        for di, dj in DIRS:
            ni, nj = i+di, j+dj
            if not is_valid(ni, nj, extra):
                continue
            if dfs(ni, nj, next_extra(extra, ni, nj)):
                return True
        used[i][j] = False         # undo，路径私有关键
        return False

    used = [[False]*n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            if is_start(i, j) and dfs(i, j, start_extra(i, j)):
                return True
    return False
    
    
```



23. 矩阵中的路径 https://www.acwing.com/problem/content/21/
24. 机器人的运动范围 https://www.acwing.com/problem/content/22/
	1. 这题不涉及终点
