---
{"dg-publish":true,"permalink":"/CS工程体系/计算机网络/ARP协议系列/ARP一个例子/","dg-note-properties":{}}
---

## ARP 是什么

ARP 协议的全称是 `Address Resolution Protocol(地址解析协议)`，它是一个通过**用于实现从 IP 地址到 MAC 地址的映射，即询问目标 IP 对应的 MAC 地址** 的一种协议。ARP 协议在 IPv4 中极其重要。

> 注意：ARP 只用于 IPv4 协议中，IPv6 协议使用的是 Neighbor Discovery Protocol，译为邻居发现协议，它被纳入 ICMPv6 中。

简而言之，ARP 就是一种解决地址问题的协议，它以 IP 地址为线索，定位下一个应该接收数据分包的主机 MAC 地址。如果目标主机不在同一个链路上，那么会查找下一跳路由器的 MAC 地址。

### ARP 的工作机制

下面我们探讨一下 ARP 的工作机制是怎样的。假设 A 和 B 位于同一链路，不需要经过路由器的转换，主机 A 向主机 B 发送一个 IP 分组，主机 A 的地址是 192.168.1.2 ，主机 B 的地址是 192.168.1.3，它们都不知道对方的 MAC 地址是啥，主机 C 和 主机 D 是同一链路的其他主机。
![Pasted image 20261003145251.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/ARP%E5%8D%8F%E8%AE%AE%E7%B3%BB%E5%88%97/Pasted%20image%2020261003145251.png)



主机 A 想要获取主机 B 的 MAC 地址，通过主机 A 会通过`广播` 的方式向以太网上的所有主机发送一个 `ARP 请求包`，这个 ARP 请求包中包含了主机 A 想要知道的主机 B 的 IP 地址的 MAC 地址。
![Pasted image 20261003145142.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/ARP%E5%8D%8F%E8%AE%AE%E7%B3%BB%E5%88%97/Pasted%20image%2020261003145142.png)



主机 A 发送的 ARP 请求包会被同一链路上的所有主机/路由器接收并进行解析。每个主机/路由器都会检查 ARP 请求包中的信息，如果 ARP 请求包中的`目标 IP 地址` 和自己的相同，就会将自己主机的 MAC 地址写入响应包返回主机 A


![Pasted image 20261003145219.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/ARP%E5%8D%8F%E8%AE%AE%E7%B3%BB%E5%88%97/Pasted%20image%2020261003145219.png)


由此，可以通过 ARP 从 IP 地址获取 MAC 地址，实现同一链路内的通信