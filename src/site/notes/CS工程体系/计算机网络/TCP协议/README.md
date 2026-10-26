---
{"dg-publish":true,"permalink":"/CS工程体系/计算机网络/TCP协议/README/","dg-note-properties":{}}
---

# 本地 TCP SYN 实验

这是一个**安全、限速、仅回环地址**的 TCP 实验，不是可用于攻击其他主机的泛洪器：

- 目标地址和端口固定为 `127.0.0.1:12345`；
- 客户端最多发起 20 次连接，每次间隔 200 ms；
- 不支持命令行指定外部目标、不伪造源地址、不使用 raw socket；
- 服务端故意不调用 `accept()`，用于观察监听队列和 TCP 握手报文。

## 编译

macOS：

```sh
clang++ -std=c++17 -O2 -Wall -Wextra syn_lab.cpp -o syn_lab
```

Linux：

```sh
g++ -std=c++17 -O2 -Wall -Wextra syn_lab.cpp -o syn_lab
```

## 运行

终端 A 启动不接受连接的监听端：

```sh
./syn_lab server
```

终端 B 发起有限连接：

```sh
./syn_lab client
```

客户端使用操作系统正常 TCP 栈，因此抓包能看到类似：

```text
SYN -> SYN,ACK -> ACK
```

当监听队列已满或服务端结束后，也可能看到重传、RST 或连接超时；具体行为取决于操作系统的 TCP 参数。

## 抓包

macOS 的回环接口通常是 `lo0`：

```sh
sudo tcpdump -i lo0 -nn -tttt 'tcp port 12345'
```

也可以用 Wireshark 选择 `lo0`，显示过滤器填写：

```text
tcp.port == 12345
```

Linux 通常使用 `lo`：

```sh
sudo tcpdump -i lo -nn -tttt 'tcp port 12345'
```

## 观察点

1. TCP 三次握手中的 SYN、SYN/ACK、ACK 标志位；
2. 客户端连接未被应用层 `accept()` 处理时，内核仍可能完成握手；
3. backlog 较小时，后续连接可能出现重传或失败；
4. 这与真实 SYN flood 的关键区别是：本实验有严格的数量和速率上限，且目标只能是本机回环接口。
