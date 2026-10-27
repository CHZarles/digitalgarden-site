---
dg-publish: true
permalink: /Java后端开发体系/JavaSE/Java-项目结构/
---

## 1.项目结构

```
ProjectName
├── src/  
│   └── com/  
│       └── example/  
│           └── app/  
│               └── Main.java  
├── out/
├── .idea/  
├── JavaIntro.iml  
└── .gitignore

```
- src 下面放置 .java 源码, 不同的java文件有属于自己的包
- out 下放置 **经过编译** 后的 .class 字节码 （详见，[编译与运行](##编译与运行)）

## 2.目录和包名
Main.java 在目录 `src/com/example/app` 下面，那么这个文件的包名就是 `com.example.app`

``` java
package com.example.app;  
  
public class Main {  
	...  
}

```
这个类的完整名称是 `com.example.app.Main`


## 3.类名和文件名

如果类是 `public`,  文件名必须和包名一致。

一个 `.java` 文件里面可以有很多类，但是只能有一个 `public` 的顶层类。


## 4.java 程序的入口

所有拥有 `public static void main(String[] args)` 方法的公有类，都可以成为java程序的入口。比如：

```java
public class Main {  
    public static void main(String[] args) {  

    }    
}
```



## 5 .编译
`javac -d out src/com/example/app/Main.java `
- javac：Java 编译器  
- -d out：将编译产物放入 out  
- 最后一个参数：要编译的源文件

编译后的产物是.class 文件 
![Pasted image 20260904152601.png](/img/user/Java后端开发体系/JavaSE/img/Pasted image 20260904152601.png)

## 6. 运行
`java -cp out com.example.app.Main  `
- java：启动 JVM  
- -cp out：告诉 JVM 去 out 目录寻找类  
- com.example.app.Main：要运行的完整类名

