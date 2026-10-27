---
dg-publish: true
permalink: /Leetcode&&算法/总结梳理/dp-线性动态规划/
---
`dp[i]` 只表示“前 i 个 / 长度 i 的最优”，且只依赖 `<i` 的状态。CLRS 视角就是：子问题构成一条链，按拓扑序从小到大算。


**思考模板**

- 定义：
	- `dp[i]` 到底代表什么？含不含 `i` 本身？
- 转移：
	- 到 `i` 的最后一步决策是什么？
- 初始化：
	- `dp[0]、dp[1]` 最小值是多少？
- 顺序：
	- `i` 从小到大，算 `i` 时依赖项都 ready 了吗？
- 答案：
	- 是 `dp[n]` 还是 `max(dp[...])`？




###  枚举决策

```python
for i in range(2, n+1):
    for j in range(i):  # 枚举最后/第一步切在哪
        dp[i] = max(dp[i], 由dp[j]推来的候选)
```




25. 剪绳子 
	1. 这题的转移范式有点坑，并非真正的最优子结构
		1. dp[i] = max(dp[i] , max(j , dp[j]) * max( dp[i - j] ,  i - j) )
		
