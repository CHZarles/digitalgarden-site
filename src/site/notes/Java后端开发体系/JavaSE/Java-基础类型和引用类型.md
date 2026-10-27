---
dg-publish: true
permalink: /Java后端开发体系/JavaSE/Java-基础类型和引用类型/
---

java有基础类型和引用类型两种：
- 基本类型
	- byte ,short, int, long, float, double, char, boolean
- 引用类型
	- String、List、ArrayList、HashMap、你自己写的 User……


### 引用类型的声明方法

#### class 关键字

- class 
	- 定义对象模板，描述对象有什么状态、能做什么行为
- interface
	- 定义能力契约，规定必须能做什么，用于解耦和多态
- enum
	- 定义固定数量的实例，表示只能是这几个之一，本质是特殊类
- @interface
	- 定义注解类型，给代码贴标签，由编译器/框架/反射读取后生效
- record
	-  定义不可变数据类，自动生成构造器、访问器、equals、hashCode、toString
- 数组 []
	- 语言内置的引用类型，一排固定长度、同类型的格子





## 别的规则

一个 `.java` 文件里可有很多引用类型，不过只能有一个用 `public` 修饰

前情提要：[[Java-项目结构#类名和文件名]]
