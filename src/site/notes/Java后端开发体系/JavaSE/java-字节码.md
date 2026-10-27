---
dg-publish: true
permalink: /Java后端开发体系/JavaSE/java-字节码/
---

## 查看字节码

`.class` 文件是 `JVM` 字节码，可以用 `javap` 来看它的具体内容。

### javap命令

``` bash
javap -c ...       # 查看字节码指令  
javap -p ...       # 显示 private 成员  
javap -l ...       # 显示行号和局部变量表  
javap -v ...       # 查看完整 class 文件信息，包括常量池

```

### 实战

有如下java源码
``` java
package com.example.app;  
  
public class Main {  
    public static void main(String[] args) {  
        System.out.println(new Main().test());  
    }  
  
    public int test() {  
        int a = 10;  
        int b = 20;  
        int c = a + b;  
        return c;  
    }  
}
```

运行下列指令
``` bash
mkdir -p out 
javac -d out src/com/example/app/Main.java
javap -c -p -classpath out com.example.app.Main
```

得到如下的反汇编内容
```java
Compiled from "Main.java"  
public class com.example.app.Main {  
  public com.example.app.Main();  
    Code:  
       0: aload_0  
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V  
       4: return  
  
  public static void main(java.lang.String[]);  
    Code:  
       0: getstatic     #7                  // Field java/lang/System.out:Ljava/io/PrintStream;  
       3: new           #13                 // class com/example/app/Main  
       6: dup  
       7: invokespecial #15                 // Method "<init>":()V  
      10: invokevirtual #16                 // Method test:()I  
      13: invokevirtual #20                 // Method java/io/PrintStream.println:(I)V  
      16: return  
  
  public int test();  
    Code:  
       0: bipush        10  
       2: istore_1  
       3: bipush        20  
       5: istore_2  
       6: iload_1  
       7: iload_2  
       8: iadd  
       9: istore_3  
      10: iload_3  
      11: ireturn  
}
```

### 基于栈的指令集

Java虚拟机使用的是基于栈的 **指令集架构**， 上面的 [test 函数](###实战) ，对应如下指令序列

``` java

public int test();  
  Code:  
     0: bipush        10  
     2: istore_1  
     3: bipush        20  
     5: istore_2  
     6: iload_1  
     7: iload_2  
     8: iadd  
     9: istore_3  
    10: iload_3  
    11: ireturn  
```


 bipush 10    把整数 10 压入操作数栈    
 istore_1     从栈取出整数，存入局部变量槽 1    
 iload_1      加载局部变量槽 1 的整数    
 iadd         弹出两个整数，相加，再把结果压栈     
 ireturn      返回栈顶整数

