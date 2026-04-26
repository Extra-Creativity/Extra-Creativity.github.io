---
layout: page
title: Modern C++ Basics
title_zh: 现代C++基础
description: A free online course originally for PKU sophomore undergraduate, including most of important features from C++11 to C++23. 
description_zh: 原为面向北大大二本科生的免费在线课程，包含了C++11到C++23的大多数重要特性。
importance: 1
category: Course
bilingual: true
github: https://github.com/Extra-Creativity/Modern-Cpp-Basics
github_stars: Extra-Creativity/Modern-Cpp-Basics
project_url: https://github.com/Extra-Creativity/Modern-Cpp-Basics/blob/main
slides_url: /assets/repo/Modern-Cpp-Basics
languages:
  - name: C++
---

<div class="lang-en" markdown="1">

### Important Preface
---
1. Though titled as "Basics", it dives into difficult parts (e.g. implementation algorithms of containers) and has many prerequisites, meaning that it's not for programming freshman. 
2. I speak Chinese in online videos and homework, and (mostly) use English in slides.
3. This course is allowed to be reposted as long as the course link and my name are explicitly noted there. To be accurate, this course uses CC-BY-NC-SA 4.0.
4. Because this is my first course, there definitely exist many problems in course scheduling, homework and online videos. Therefore, it's not your fault if you feel difficult to follow, and you may learn other courses.

## About This Course
---
C++ is the premier choice for high-performance, low-latency programming, widely adopted in performance-critical scenarios such as high-frequency trading, game engines, and deep learning frameworks. However, in many universities, C++ curricula often stop at C++98 and fall short of modern engineering practices. As C++ continues to evolve, modern C++ has introduced a wealth of new features that significantly improve developer productivity and code safety. Therefore, this course will comprehensively and systematically cover major features from C++11 to C++23, with in-depth analysis of selected topics. We hope to equip students with the foundational ability to read production-level code, understand performance trade-offs, and write safe, idiomatic C++.

> Note: This course is originally designed for PKU sophomore undergraduates, so it is structured to build upon knowledge they have already acquired. For example, topics like containers and algorithms are covered very early.

## Prerequisites
---
Computer Science: For PKU undergraduates, you're supposed to pass Introduction to Computation (A), Practice of Programming in C & C++ (or Practice of Software Design), Introduction to Computer Systems (ICS), Data Structure and Algorithm (A). Or equivalently, you need to understand:

1. C++ Fundamentals
    - Basic types, arrays, structs, functions, pointers, enums, operators
    - Basic OOP: classes, ctor/dtor, inheritance, polymorphism, this pointer
    - Function/operator overloading, copy ctor/assignment
    - Template basics, STL containers, lvalue references
    - Basic I/O: cin/cout
2. Computer Systems Basics: learn Computer Systems: A Programmer's Perspective (CSAPP). CMU has online course for this book, and see [CSDIY](https://csdiy.wiki/en/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%B3%BB%E7%BB%9F%E5%9F%BA%E7%A1%80/CSAPP/) for details. 
3. Data Structure and Algorithm Basics: any basic data structure course. Personally, I recommend learning Data Structure from Deng Junhui in Tsinghua Unviersity (including [Volume I](https://next.xuetangx.com/course/THU08091000384/29593888) and [Volume II](https://next.xuetangx.com/course/THU08091002048/29593461), and in Chinese!). The provided link is 2026 course on XuetangX, and this course will be renewed every year. So if the link above corresponds to a paid course, just search "数据结构" on that platform to find latest free one.

English: CET4 is enough.

## Course Schedule
---
- Overall schedule: 16 chapters total, 150 min each on average (equivalent to 3-credit course)
- Homework: Code examples and homework provided after each lecture. Since lecture 5, most of homework is provided with answers.
- Others: Online course is taught in Chinese while slides are in English. Errata and supplementary will be given in comments of the video or homework (in Chinese), so don't forget to check them.

## Syllabus
---
The online videos are uploaded to [bilibili](https://space.bilibili.com/18874763/lists/2192185).

| Lecture | Topic | Resources |
|------|----------|------|
| 1 | Intro | [Slides]({{page.slides_url}}/01-Intro/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E7%AE%80%E4%BB%8B%EF%BC%88%E6%96%B0%EF%BC%89.pdf) / [Homework]({{page.project_url}}/01-Intro/README.md) |
| 2 | Basics Review & Extension | [Slides]({{page.slides_url}}/02-Basics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%9F%BA%E7%A1%80%E5%A4%8D%E4%B9%A0%E4%B8%8E%E6%89%A9%E5%B1%95.pdf) / [Homework]({{page.project_url}}/02-Basics/README.md) |
| 3 | Container | [Slides]({{page.slides_url}}/03-Containers/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%AE%B9%E5%99%A8%EF%BC%8Cranges%E4%B8%8E%E7%AE%97%E6%B3%95%20-%20Part1.pdf)  / [Homework]({{page.project_url}}/03-Containers/README.md) |
| 4 | Ranges & Algorithms | [Slides]({{page.slides_url}}/04-Ranges%20%26%20Algorithms/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%AE%B9%E5%99%A8%EF%BC%8Cranges%E4%B8%8E%E7%AE%97%E6%B3%95%20-%20Part2.pdf)  / [Homework]({{page.project_url}}/04-Ranges%20%26%20Algorithms/README.md) |
| 5 | Lifetime & Type Safety | [Slides]({{page.slides_url}}/05-Lifetime%20%26%20Type%20Safety/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%B8%8E%E7%B1%BB%E5%9E%8B%E5%AE%89%E5%85%A8.pdf) / [Homework]({{page.project_url}}/05-Lifetime%20%26%20Type%20Safety/README.md) |
| 6 | Programming in Mutiple Files | [Slides]({{page.slides_url}}/06-Programming%20in%20Multiple%20Files/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%A4%9A%E6%96%87%E4%BB%B6%E7%BC%96%E7%A8%8B.pdf) / [Homework]({{page.project_url}}/06-Programming%20in%20Multiple%20Files/README.md) |
| 7 | Error Handling | [Slides]({{page.slides_url}}/07-Error%20Handling/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86.pdf) / [Homework]({{page.project_url}}/07-Error%20Handling/README.md) |
| 8 | String & Stream | [Slides]({{page.slides_url}}/08-String%20%26%20Stream/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E6%B5%81%E4%B8%8E%E5%AD%97%E7%AC%A6%E4%B8%B2.pdf) / [Homework]({{page.project_url}}/08-String%20%26%20Stream/README.md) |
| 9 | Move Semantics Basics | [Slides]({{page.slides_url}}/09-Move%20Semantics%20Basics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20Move%20Semantics%20Basics.pdf) / [Homework]({{page.project_url}}/09-Move%20Semantics%20Basics/README.md) |
| 10 | Value Category and Move Semantics | [Slides]({{page.slides_url}}/10-Value%20Category%20and%20Move%20Semantics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%80%BC%E5%88%86%E7%B1%BB%E4%B8%8E%E7%A7%BB%E5%8A%A8%E8%AF%AD%E4%B9%89.pdf) / [Homework]({{page.project_url}}/10-Value%20Category%20and%20Move%20Semantics/README.md) |
| 11 | Template Basics and Move Semantics | [Slides]({{page.slides_url}}/11-Template%20Basics%20and%20Move%20Semantics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E6%A8%A1%E6%9D%BF%E5%9F%BA%E7%A1%80%E4%B8%8E%E7%A7%BB%E5%8A%A8%E8%AF%AD%E4%B9%89.pdf) / [Homework]({{page.project_url}}/11-Template%20Basics%20and%20Move%20Semantics/README.md) |
| 12 | Advanced Template | [Slides]({{page.slides_url}}/12-Advanced%20Template/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E6%A8%A1%E6%9D%BF%E8%BF%9B%E9%98%B6.pdf) / [Homework]({{page.project_url}}/12-Advanced%20Template/README.md) |
| 13 | Multithreading | [Slides]({{page.slides_url}}/13-Multithreading/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%A4%9A%E7%BA%BF%E7%A8%8B%EF%BC%88%E6%96%B0%EF%BC%89.pdf) / [Homework]({{page.project_url}}/13-Multithreading/README.md) |
| 14 | Advanced Concurrency | [Slides]({{page.slides_url}}/14-Advanced%20Concurrency/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%B9%B6%E5%8F%91%E8%BF%9B%E9%98%B6.pdf) / [Homework]({{page.project_url}}/14-Advanced%20Concurrency/README.md) |
| 15 | Memory Management | [Slides]({{page.slides_url}}/15-Memory%20Management/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86.pdf) / [Homework]({{page.project_url}}/15-Memory%20Management/README.md) |
| 16 | Supplmentary and Summary | [Slides]({{page.slides_url}}/16-Supplementary%20and%20Summary/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E8%A1%A5%E5%85%85%E4%B8%8E%E6%80%BB%E7%BB%93.pdf) / [Homework]({{page.project_url}}/16-Supplementary%20and%20Summary/README.md) |
{:.table .table-sm .table-reseponsive}

## Recommended Tools
---
- [Cpp Conference](https://www.youtube.com/@CppCon): lectures on C++.
- [cppreference](https://en.cppreference.com): wiki on C++.
- [C++ standard draft](https://eel.is/c++draft/).
- [Compiler Explorer](https://godbolt.org): check assembly, compilation and execution results online on different compilers.
- [cppinsights](https://cppinsights.io): unveal real code behind syntax sugar.
- [Quick C++ Benchmark](https://quick-bench.com): online performance profiling.
- English communities like stackoverflow.
- Chinese communities like Zhihu, bilibili and cnblogs.

## Acknowledgement
---
Thanks for [Gu Yu](https://guyutongxue.site/), my senior in PKU, proofread‌s part of the slides.

</div>

<div class="lang-zh" markdown="1">

### 重要通知
---
1. 尽管本课程名字中含有“基础”二字，但实际上探究了C++中许多困难的部分（如容器的实现算法）并具有先修要求，因此并不适合编程新手。
2. 我在视频和作业中使用中文，而在PPT中使用英文。
3. 本课程允许转载，只需要注明该视频的出处和我的名字。准确说，课程使用CC-BY-NC-SA 4.0协议。
4. 由于这是我第一次讲课，因此必然在课程编排、作业及授课过程等存在不合理的情况，如果觉得学不下去并不一定是你的问题，可以再参考其他课程。

## 课程介绍
---
C++是高性能、低延时编程语言的不二之选，广泛应用于高频交易、游戏引擎、深度学习框架等各种性能敏感场景。然而，在许多学校的课程中，对C++的教授主要停止于C++98的知识，不符合一般工程的实践。随着C++的不断演进，现代C++已经提供了大量的新特性，使得编写C++更加容易。因此，本课程将全面而系统地介绍C++11到C++23的重大特性，并深入其中的一部分进行剖析，希望可以使得学生初步具备读懂工程代码、理解性能权衡、懂得如何安全编写C++的能力。

> 注：由于本意为方便北大大二本科生学习，因此课程的组织是先从本科生此时已经学习过的C++知识进行深入的（例如，把容器和算法的部分放到了非常前面的部分）。

## 课程先修要求
---
【计算机】：对于北大学生，要求先修计算概论（A）、程序设计实习（或软件设计实践）、计算机系统导论（ICS）、数据结构与算法。等价地，这需要先掌握如下知识：
1. C++ 基础
    - 基本类型、数组、结构体、函数、指针、枚举、运算符
    - 基本 OOP：类、构造函数/析构函数、继承、多态、this 指针
    - 函数重载、运算符重载、拷贝构造/赋值
    - 模板基础、容器、左值引用
    - 基本 IO：cin/cout

2. 计算机系统基础：已学习 Computer Systems: A Programmer's Perspective (CSAPP)。本书存在CMU的网课，详情可见[CSDIY](https://csdiy.wiki/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%B3%BB%E7%BB%9F%E5%9F%BA%E7%A1%80/CSAPP)。

3. 数据结构与算法基础：任何基础的数据结构课程均可；本人推荐清华大学邓俊辉老师的数据结构课程（分为[上](https://next.xuetangx.com/course/THU08091000384/29593888)和[下](https://next.xuetangx.com/course/THU08091002048/29593461)两部分）。提供的链接是学堂在线2026年课程的链接，该课程每年都会免费翻新出来；如果点进去发现已经收费了，可以在平台搜索“数据结构”来找到最新年度的免费课程。

【英语】：四级水平即可。

## 课时安排
---
【课时】：共安排 16 章节的课程，每节平均两个半小时（3学分课程），但具体时间随着内容复杂程度变化。

【作业】：每章后会提供习题及示例代码，全部是编程任务；自第五章开始，每章提供部分或全部习题的答案。

【其它】：中文授课，英文课件；每节课的评论区及作业可能会出现纠错或补充，注意查看。

## 课程大纲与讲义
---
课程视频上传于[bilibili](https://space.bilibili.com/18874763/lists/2192185)。

| 讲座 | 主题 | 资料 |
|------|----------|------|
| 1 | 课程简介 | [课件]({{page.slides_url}}/01-Intro/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E7%AE%80%E4%BB%8B%EF%BC%88%E6%96%B0%EF%BC%89.pdf) / [作业]({{page.project_url}}/01-Intro/README.md) |
| 2 | 基础复习与扩展 | [课件]({{page.slides_url}}/02-Basics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%9F%BA%E7%A1%80%E5%A4%8D%E4%B9%A0%E4%B8%8E%E6%89%A9%E5%B1%95.pdf) / [作业]({{page.project_url}}/02-Basics/README.md) |
| 3 | 容器 | [课件]({{page.slides_url}}/03-Containers/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%AE%B9%E5%99%A8%EF%BC%8Cranges%E4%B8%8E%E7%AE%97%E6%B3%95%20-%20Part1.pdf)  / [作业]({{page.project_url}}/03-Containers/README.md) |
| 4 | Ranges与算法 | [课件]({{page.slides_url}}/04-Ranges%20%26%20Algorithms/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%AE%B9%E5%99%A8%EF%BC%8Cranges%E4%B8%8E%E7%AE%97%E6%B3%95%20-%20Part2.pdf)  / [作业]({{page.project_url}}/04-Ranges%20%26%20Algorithms/README.md) |
| 5 | 生命周期与类型安全 | [课件]({{page.slides_url}}/05-Lifetime%20%26%20Type%20Safety/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%B8%8E%E7%B1%BB%E5%9E%8B%E5%AE%89%E5%85%A8.pdf) / [作业]({{page.project_url}}/05-Lifetime%20%26%20Type%20Safety/README.md) |
| 6 | 多文件编程 | [课件]({{page.slides_url}}/06-Programming%20in%20Multiple%20Files/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%A4%9A%E6%96%87%E4%BB%B6%E7%BC%96%E7%A8%8B.pdf) / [作业]({{page.project_url}}/06-Programming%20in%20Multiple%20Files/README.md) |
| 7 | 错误处理 | [课件]({{page.slides_url}}/07-Error%20Handling/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86.pdf) / [作业]({{page.project_url}}/07-Error%20Handling/README.md) |
| 8 | 字符串与流 | [课件]({{page.slides_url}}/08-String%20%26%20Stream/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E6%B5%81%E4%B8%8E%E5%AD%97%E7%AC%A6%E4%B8%B2.pdf) / [作业]({{page.project_url}}/08-String%20%26%20Stream/README.md) |
| 9 | 移动语义基础 | [课件]({{page.slides_url}}/09-Move%20Semantics%20Basics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20Move%20Semantics%20Basics.pdf) / [作业]({{page.project_url}}/09-Move%20Semantics%20Basics/README.md) |
| 10 | 值分类与移动语义 | [课件]({{page.slides_url}}/10-Value%20Category%20and%20Move%20Semantics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%80%BC%E5%88%86%E7%B1%BB%E4%B8%8E%E7%A7%BB%E5%8A%A8%E8%AF%AD%E4%B9%89.pdf) / [作业]({{page.project_url}}/10-Value%20Category%20and%20Move%20Semantics/README.md) |
| 11 | 模板基础与移动语义 | [课件]({{page.slides_url}}/11-Template%20Basics%20and%20Move%20Semantics/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E6%A8%A1%E6%9D%BF%E5%9F%BA%E7%A1%80%E4%B8%8E%E7%A7%BB%E5%8A%A8%E8%AF%AD%E4%B9%89.pdf) / [作业]({{page.project_url}}/11-Template%20Basics%20and%20Move%20Semantics/README.md) |
| 12 | 模板进阶 | [课件]({{page.slides_url}}/12-Advanced%20Template/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E6%A8%A1%E6%9D%BF%E8%BF%9B%E9%98%B6.pdf) / [作业]({{page.project_url}}/12-Advanced%20Template/README.md) |
| 13 | 多线程 | [课件]({{page.slides_url}}/13-Multithreading/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%A4%9A%E7%BA%BF%E7%A8%8B%EF%BC%88%E6%96%B0%EF%BC%89.pdf) / [作业]({{page.project_url}}/13-Multithreading/README.md) |
| 14 | 并发进阶 | [课件]({{page.slides_url}}/14-Advanced%20Concurrency/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%B9%B6%E5%8F%91%E8%BF%9B%E9%98%B6.pdf) / [作业]({{page.project_url}}/14-Advanced%20Concurrency/README.md) |
| 15 | 内存管理 | [课件]({{page.slides_url}}/15-Memory%20Management/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86.pdf) / [作业]({{page.project_url}}/15-Memory%20Management/README.md) |
| 16 | 补充与总结 | [课件]({{page.slides_url}}/16-Supplementary%20and%20Summary/%E7%8E%B0%E4%BB%A3C%2B%2B%E5%9F%BA%E7%A1%80%20-%20%E8%A1%A5%E5%85%85%E4%B8%8E%E6%80%BB%E7%BB%93.pdf) / [作业]({{page.project_url}}/16-Supplementary%20and%20Summary/README.md) |
{:.table .table-sm .table-reseponsive}

## 推荐工具
---
- [Cpp Conference](https://space.bilibili.com/110213/video)：C++讲座分享；提供的链接为bilibili转载。
- [cppreference](https://en.cppreference.com)：C++百科
- [C++标准草案](https://eel.is/c++draft/)
- [Compiler Explorer](https://godbolt.org)：在线查看多个编译器汇编代码/编译结果/执行结果。
- [cppinsights](https://cppinsights.io)：查看代码去语法糖结果
- [Quick C++ Benchmark](https://quick-bench.com)：在线性能测试
- stackoverflow 等英文学习社区
- 知乎 / bilibili / 博客园等中文学习社区

## 鸣谢
---
感谢[谷雨](https://guyutongxue.site/)学长对部分课件内容进行了校对。

</div>