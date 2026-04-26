---
layout: post
title: 不是你怎么变来变去的：详解C++ Memory Order理论模型
date: 2025-07-19
description: Theoretical model of C++ memory order.
tags: Memory-order Multithreading
categories: C++
read_time: 60
toc:
  sidebar: out-left
  collapse: false
---

> 前言：本文希望从C++标准规定的理论模型出发，在尽量不泄露任何抽象的情况下构建出完整的memory order理论模型。换言之，本文并不是从各种底层实现的角度（例如编译器如何重排、使用ISA中何种原子指令、体系结构如何支持，等等）去本末倒置地进行解释；相反，本文希望可以从原理推论出一些底层实现的原因。由于感觉网络上大部分材料并不是从这种角度出发，因此笔者决定写一篇新的文章，从理论模型完全理解memory order，进而指明这种模型从C++11到C++26进行了怎样的演进、为何会进行这样的演进。
>
> 如果你喜欢这篇文章，可以在[知乎](https://zhuanlan.zhihu.com/p/1911798716026826993)上点赞/喜欢/收藏！

## About History

C++之父Bjarne Stroustrup在HoPL4论文中曾说：

> 最开始，我想大多数委员都小瞧了这个问题。我们知道Java有一个很好的内存模型，并曾希望采用它。令我感觉好笑的是，来自Intel和IBM的代表坚决地否定了这一个想法；他们指出，如果在C++中采用Java内存模型，那么Java虚拟机的速度将至少减半。因此，为了保持Java的性能，我们不得不为C++采用一个复杂得多的模型。可以想见而且讽刺的是，C++此后因为有一个比Java更复杂的内存模型而受到批评。

Memory order本身是一个学术界还在争论的话题。自H.J. Boehm在2008年的PLDI上发表论文，奠定了今天C++内存模型的基础后，学术界不断地对这一内存模型进行改进，试图减少其带来的各种问题。虽然C++委员会常常是保守派，但是在内存模型的问题上却仍然在其不完美时就引入到了C++11的标准中，并随着后续学术界的研究发展而不断完善标准。甚至可以说，C++是并行内存模型的急先锋。本文希望带你一探究竟！

> 我想这多亏了Boehm几十年如一日的坚持，每当学术界有新的重要动态时，Boehm就会发出新的标准提案。

## Preface

在并行编程普及之前，编译器、处理器设计等等已经进行了非常长时间的发展，引入了各种加速和优化的手段和技术。于是，写好的代码与实际的执行顺序并不是一一对应的：

- 编译器或JIT会进行非常激进的优化，生成打乱与化简后的汇编；
- 处理器会进行乱序执行和投机执行，打乱二进制代码的实际执行顺序；
- 每个处理器可能拥有自己的cache，不同的处理器看到的内存内容未必一致；等等

在串行程序中，这些优化完全不是问题，因为用户的可见结果是确定的，每层抽象维持这种可见结果的正确即可；但在并行程序中，由于线程可能随时读取任何地址，这些针对单线程可见性的抽象就会失效，因此各层又需要打上新的补丁。为了统一现有的各种并行程序的行为，C++使用了memory model来进行抽象，并给出了三种order模型：

- Sequentially Consistent (seq_cst)；
- Acquire-Release (acq_rel)；
- Relaxed (relaxed).

> 事实上还存在一种Consume-Release模型，但是这种模型（1）没有编译器实现成功利用它进行加速（2）进一步增加了理论模型的复杂度，因此各个编译器**始终将其加强为Acquire-Release模型**（这种加强甚至记录在了C++标准里），同时Consume-Release模型在C++26也被彻底deprecated。我们不会讲述这种模型，只会在后面的术语流变里提到。

## Basics

### Overview

memory model中存在几条基本关系：

1. Modification Order (MO)：对**单个原子变量**，所有线程看到的修改顺序完全一致，这种顺序称为modification order。由于读操作不产生side effects，我们也可以假想对单个原子变量的所有操作具有一个特定的顺序。

   根据这一原理，推断下面的伪代码中是否会出现`r1 == 1 && r2 == 2 && r3 == 2 && r4 == 1`：

   ```c++
   -- Initially --
   std::atomic<int> x{0};
   
   -- Thread 1 --
   x.store(1);
   
   -- Thread 2 --
   x.store(2);
   
   -- Thread 3 --
   int r1 = x.load();
   int r2 = x.load();
   
   -- Thread 4 --
   int r3 = x.load();
   int r4 = x.load();
   ```

   答案是不能，因为`r1 == 1 && r2 == 2`代表`1`是一个比`2`旧的值，而`r3 == 2 && r4 == 1`代表`2`是一个比`1`旧的值，二者不可能出现在一种MO里。

2. Sequenced-before（SB）：在同一线程中，如果操作A在操作B之前发生，则称A is sequenced-before B。例如一个非常简单的例子：

   ```c++
   a = 1;
   b = 2; // 'a = 1' is sequenced before 'b = 2'
   ```

   同一语句中也可能会有sequenced-before的关系，例如逗号表达式：

   ```c++
   a = 1, b = 2; // 'a = 1' is sequenced before 'b = 2'
   ```

   在C++17中增加了一些新的规定，例如`a @= b`中b一定先evaluate，然后a再evaluate，于是下面的语句也有sequenced-before的关系：

   ```c++
   b += ++b; // '++b' is sequenced before 'b +=' since C++17; UB before C++17.
   ```

   当然并不是所有的语句都进行了规定，此时也就不具有sequenced-before的关系：

   ```c++
   a = b++ + b; // b++和b没有sequenced-before的关系，不知道谁先发生，a的值是UB。
   ```

   再比如函数参数：

   ```c++
   int a() { return std::puts("a"); }
   int b() { return std::puts("b"); }
   int c() { return std::puts("c"); }
    
   void z(int, int, int) {} 
   z(a(), b(), c()); // all 6 permutations of output are allowed
   ```

   不过C++17规定每个函数参数的evaluate不能overlap，介于unsequenced和sequenced之间，称为indeterminately sequenced；这种规定有一些好处，但这是另一个话题，我们不再赘述了。**总之，sequenced-before规定了单线程中哪些操作先发生，哪些操作后发生**。

3. Happens-before（HB）：在多线程中由happens-before规定某种顺序；我们称A happens-before B，如果：
   + A is sequenced-before B（同一线程的情况）；
   + A ***synchronizes with*** B（多线程的情况）；
   + A happens-before X, and X happens-before B（具有传递性）。


   **Memory order规定的主要就是哪些操作与哪些操作产生synchronize-with的关系（我们后面简写为SW）**。特别地，不是所有的操作之间一定都有happens-before的关系。

   那么happens-before的“某种顺序”到底产生何种效果呢？具体地，

   + 对于同一非原子变量的操作A和B，若A happens-before B，且中间没有其他修改，则A的效果对B可见；反之，如果操作A和B之间没有happens-before的关系（!HB(A, B) && !HB(B, A)），则产生**data races**，UB；
   + 对于原子变量，除了上述可见性外，还额外地规定HB的顺序应当是MO的一部分。特别地，如果操作A和B之间没有happens-before的关系，则虽然原子变量的原子性导致没有data races，但并不确定MO中谁先谁后；或者说若!HB(A, B)，则B的效果允许对A可见。

可能读者看到这里，并不太明白为什么要进行这些规定；我们用后面的模型与实例来逐步引导进行理解。

> 注：我们这里进行了一些简化，事实上：
>
> 1. MO只是对写操作规定一个统一的顺序，在标准中，读操作是根据四种coherence来规定一致性的；但我们上述解释和这种coherence应当是等价的。
> 2. 还存在一些其他的关系，例如strongly happens-before等等，不同的C++版本这些概念也有流变，为了尽可能降低理解负担，我们在后面再讨论这些问题。**现在暂时先认为只有SB，HB和SW的关系就够了**。

### Sequentially Consistent

按照生活常识，两个事件的发生顺序总是确定的，与观测者无关 —— 也即“真相只有一个”。类似地，作为假设最强的模型，SC模型也规定了：

- 所有的SC操作具有一个total order，与观察线程无关。

除此之外，SC规定了以下的SW关系：

- 对于同一原子变量的两个SC操作A和B，若B读到了A存储的值，则A synchronizes with B。同时，SW导致的顺序应当是全局顺序的一部分。

二者共同构成了SC的抽象。以下面的程序为例：

```c++
std::atomic<bool> x{false}, y{false};
std::atomic<int> z{0};

void write_x() { x.store(true); }
void write_y() { y.store(true); }
void read_x_then_y()
{
    while (!x.load());
    if (y.load())
        ++z;
}
void read_y_then_x()
{
    while (!y.load());
    if (x.load())
        ++z;
}

int main()
{
    { // 等四个线程全部结束。
        std::jthread a{ write_x }, b{ write_y }, c{ read_x_then_y }, 
                     d{ read_y_then_x };
    }
    assert(z.load() != 0);
}
```

这里`assert`是正确的，即`z.load() != 0`一定成立。由于SC规定了total order，则`x.store`和`y.store`一定有一个先发生；我们不妨假设`x.store`先发生，于是：

+ 对于`read_y_then_x`，只有`y.load()`读到`true`之后才会继续，此时与`y.store`产生了SW的关系（于是在total order中，`y.store`发生在成功的`y.load`之前）；同时由于`x.store`在`y.store`之前发生，而`x.load()`在`y.load()`之后发生，因此全局顺序一定为`x.store()->y.store()->y.load()->x.load()`，故`x.load()`一定读到`true`，此时`++z`一定发生。
+ 对于`read_x_then_y`，只有`x.load()`读到`true`之后才会继续，此时与`x.store`产生了SW的关系（于是在total order中，`x.store`发生在成功的`x.load`之前）；但是由于`y.store`在`x.store`之后发生，因此`if (y.load())`可能成功可能失败。因此，`z`为1或者2。

对于`y.store`先发生同理，是对称的情况。**可以注意到，`x.store`和`y.store`之间是没有HB的关系的，它们的先后顺序完全是由一致的total order强加的**。例如，对于`read_y_then_x`，我们只知道`SB(y.load(), x.load())`和`SW(y.store(), y.load())`，并没有`x.store`和`y.store`的直接关系。

### Acquire-Release Model

SC作为最强的模型，其开销也会相对更大；较之弱一级的模型即是Acquire-Release Model。具体地：

+ 只有读操作可以是acquire操作，只有写操作可以是release操作；
+ 对于同一原子变量的release操作A和acquire操作B，若B读到了A存储的值，则A synchronizes with B。
+ **不存在一个total order**。

再举一个例子：

```c++
std::atomic<std::string*> ptr{ nullptr };
int data = 0;

// Thread 1
void producer()
{
    std::string* p = new std::string("Hello"); // #0
    data = 42;                                 // #1
    ptr.store(p, std::memory_order_release);   // #2
}

// Thread 2
void consumer()
{
    std::string* p2;
    while (!(p2 = ptr.load(std::memory_order_acquire))); // #3
    assert(*p2 == "Hello"); // #4
    assert(data == 42);     // #5
}
```

那么`#4`和`#5`是一定正确的。首先，只有`#3`读到了`#2`存储的值才能继续，因此SW(#2, #3)，从而HB(#2, #3)；则：

+ 对于`#4`，由于SB(#0, #2) && HB(#2, #3) && SB(#3, #4)，而SB也是HB，因此根据HB的传递性得到HB(#0, #4)。因此#0的效果对#4可见。
+ 对于`#5`，同理由于HB(#1, #2) && HB(#2, #3) && HB(#3, #5)，根据HB的传递性得到HB(#1, #5)。因此#1的效果对#5可见。

虽然`p`和`data`都是非原子变量，但是由于多线程的操作间推导出了HB关系，因此没有data races。

那么没有total order的影响是什么呢？我们倒退回原来的程序：

```c++
std::atomic<bool> x{false}, y{false};
std::atomic<int> z{0};

void write_x() { x.store(true, std::memory_order_release); } // #0
void write_y() { y.store(true, std::memory_order_release); } // #1
void read_x_then_y()
{
    while (!x.load(std::memory_order_acquire)); // #2
    if (y.load(std::memory_order_acquire))      // #3
        ++z;
}
void read_y_then_x()
{
    while (!y.load(std::memory_order_acquire)); // #4
    if (x.load(std::memory_order_acquire))      // #5
        ++z;
}
```

这时`z.load()`就有可能为0了，因为`x.store`和`y.store`不存在HB的关系；我们只能知道HB(#0, #2)、HB(#1, #4)、SB(#2, #3)、SB(#4, #5)，但是没有一个完整的HB链条让我们推导出HB(#0, #5)或HB(#1, #3)一定成立其一。

我们再举一个传递性的例子：

```c++
int data = 0;
std::atomic<bool> sync1{ false },sync2{ false };

void thread_1()
{
    data = 442;                                    // #0
    sync1.store(true,std::memory_order_release);   // #1
}

void thread_2()
{    
    while(!sync1.load(std::memory_order_acquire)); // #2
    sync2.store(true,std::memory_order_release);   // #3
}

void thread_3()
{
    while(!sync2.load(std::memory_order_acquire)); // #4
    assert(data == 442);                           // #5
}
```

那么`#5`也一定是正确的。与之前相同的逻辑，我们知道SW(#1, #2)，SW(#3, #4)，于是通过SB(#0, #1) && SW(#1, #2) && SB(#2, #3) && SW(#3, #4) && SB(#4, #5)，我们得到HB(#0, #5)。

acquire-release的理论模型隐式地迫使编译器减少重排优化。最一般地，任何一个acquire操作B都有可能和某一个release操作A产生SW关系；如果编译器把B之后的语句段S1重排到B之前，或者把A之前的语句段S2重排到A之后，那么都会导致S1可能无法观察到S2的side effects。换句话说，acquire和release操作都隐式地引入了**单向的barrier**：

+ 所有产生可被观察到side effects的操作都不能被重排到release操作后面；
+ 所有可能依赖side effects的操作都不能被重排到acquire操作前面。

直观上来说，acquire-release很像构成了某种critical section（lock & unlock），里面的代码不能向上越过lock或向下越过unlock。

> 所以，compiler barrier是理论模型的结果，而不是理论模型的本质。例如，不依赖于side effects的操作是可能重排的，比如`int r = 1; r++;`这种完全local的结果。

### Relaxed

最弱的模型就是relaxed order，它的原子操作之间不产生任何SW关系，只有原子性。我们先看一个acquire-release的例子：

```c++
std::atomic<int> x{0}, y{0};

void read_y_then_write_x(int& r1)
{
    r1 = y.load(std::memory_order_acquire); // #1
    x.store(r1, std::memory_order_release); // #2
}

void read_x_then_write_y(int& r2)
{
    r2 = x.load(std::memory_order_acquire); // #3
    y.store(42, std::memory_order_release); // #4
}

int main()
{
    int r1 = 0, r2 = 0;
    std::jthread{ read_y_then_write_x, std::ref(r1) }, 
                { read_x_then_write_y, std::ref(r2) };
    assert(!(r1 == 42 && r2 == 42));
}
```

这里这个assert是正确的；首先不妨假设`r1 == 42`，则#1从#4读到值，于是SW(#4, #1)；又由SB(#3, #4)、SB(#1, #2)，可以得到HB(#3, #2)，因此#2的效果对#3不可见，故`r2 == 0`一定成立。对于`r2 == 42`是对称的情况，总之二者不可能全是42。

如果我们换成relaxed model：

```c++
std::atomic<int> x{0}, y{0};

void read_y_then_write_x(int& r1)
{
    r1 = y.load(std::memory_order_relaxed); // #1
    x.store(r1, std::memory_order_relaxed); // #2
}

void read_x_then_write_y(int& r2)
{
    r2 = x.load(std::memory_order_relaxed); // #3
    y.store(42, std::memory_order_relaxed); // #4
}
```

二者就可以都是42了，因为两个线程之间没有任何SW关系，也就建立不了HB关系；而对于原子变量，只要没有HB(A, B)，那么B的效果就允许对A可见。因此，既然HB(#1, #4)和HB(#3, #2)都不成立，这两个store的效果也就都可以对load可见。

有几点要强调一下：

1. 不存在total order的约束，也就是说我们不能把并行程序理解成多线程语句满足单线程语句顺序并随机穿插的顺序流。在这个程序中的任意一种的total order都不可能使得二者同时为42。在实际实现中，由于没有SW的约束，编译器可以重排颠倒#3和#4。 
2. 单个原子变量的MO约束不违反这一过程。下面是两个变量的MO：

   ```c++
   // x: 0 r1
   // y: 0 42
   ```

   `y.load`中可以安排在`y.store`后面，于是`r1 == 42`可以成立；`x.load`可以安排在`x.store`后面，于是`r2 == r1`可以成立，于是二者允许同时为42。

我们再来看一个比较复杂的例子；简单来说这个程序里有三个原子变量，有三个线程分别递增其中一个原子变量，并读取所有的原子变量；有两个线程只读取所有的原子变量；最后主线程把它们读取到的状态打印出来：

```c++
std::atomic<int> x{0}, y{0}, z{0};
std::atomic<bool> start{false};

constexpr unsigned int loop_num = 10;
struct ValueStatus { int x, y, z; };

using ValueContainer = std::array<ValueStatus, loop_num>;

void increment(std::atomic<int>* var, ValueContainer* values)
{
    start.wait(false);
    for (unsigned int i = 0; i < loop_num; i++)
    {
        values[i].x = x.load(std::memory_order_relaxed);
        values[i].y = y.load(std::memory_order_relaxed);
        values[i].z = z.load(std::memory_order_relaxed);
        
        var->store(i + 1, std::memory_order_relaxed);
    }
}

void read_status(ValueContainer* values)
{
    start.wait(false);
    for (unsigned int i = 0; i < loop_num; i++)
    {
        values[i].x = x.load(std::memory_order_relaxed);
        values[i].y = y.load(std::memory_order_relaxed);
        values[i].z = z.load(std::memory_order_relaxed);
    }
}

int main()
{
    std::array<ValueContainer, 5> values;
    {
        std::jthread a{ increment, &x, &values[0] }, b{ increment, &y, &values[1] }, c{ increment, &z, &values[2] };
        std::jthread d{ read_status, &values[3] }, e{ read_status, &values[4] };
        
        start.store(true);
        start.notify_all();        
    }
    
    for (const auto& cont: values)
    {
        std::print("[");
        for (auto val : cont)
            std::print("({}, {}, {}) ", val.x, val.y, val.z);
        std::println("]");
    }
}
```

这个程序只能保证两点：

1. 由于单个线程的SB关系，每个线程自己递增的变量读取出来也一定是逐个递增的，这和一个普通变量在循环里递增再读出来是一样的；
2. 由于单个原子变量的MO约束，其他变量读取出来保证是一个非递减的序列。也就是说，在一个线程中读取到了变量的一个值之后，之后的读不可能再回溯读到之前的值。

例如一种允许的输出是：

```
[(0,0,0),(1,0,0),(2,0,0),(3,0,0),(4,0,0),(5,7,0),(6,7,8),(7,9,8),(8,9,8),(9,9,10),]
[(0,0,0),(0,1,0),(0,2,0),(1,3,5),(8,4,5),(8,5,5),(8,6,6),(8,7,9),(10,8,9),(10,9,10),]
[(0,0,0),(0,0,1),(0,0,2),(0,0,3),(0,0,4),(0,0,5),(0,0,6),(0,0,7),(0,0,8),(0,0,9),]
[(1,3,0),(2,3,0),(2,4,1),(3,6,4),(3,9,5),(5,10,6),(5,10,8),(5,10,10),(9,10,10),(10,10,10),]
[(0,0,0),(0,0,0),(0,0,0),(6,3,7),(6,5,7),(7,7,7),(7,8,7),(8,8,7),(8,8,9),(8,8,9),]
```

由于relaxed model不存在SW关系，很多时候会出现非常奇怪的结果，所以需要很谨慎地使用。通常来说，要么relaxed操作配合其他同步操作使用（例如acquire-release建立了某种SW关系），要么用在仅仅需要原子性的地方（例如std::shared_ptr中使用原子变量作为内部计数器，在use_count()中通常就是用relaxed load；而在析构函数中为了防止use after free通常使用acquire-release）。

## Advanced Topics

### Overview

C++的memory model构成了一个自洽的公理化体系，统一了现有程序的抽象，形式化描述了data races等现象。这种公理化在程序中就像一组线性规划的不等式，它们构成了一个取值范围，任何符合这一范围的程序行为都是合理的，从而给编译器、处理器等等留下了优化空间。然而，也正是这种公理化描述埋下了一个个问题，我们在后面会引入一些新的知识，然后一一进行讨论。

### RMW operations

我们首先简单介绍一下Read-Modify-Write（RMW）操作。对于下面的程序：

```c++
std::atomic<int> a{ 0 };
// 假设有两个线程同时运行这个函数。
void increment()
{
    for (int i = 0; i < 10000; i++)
        a++;
}
```

则原子变量是可以保证最终`a += 20000`的，而普通变量就会产生data races，需要锁进行保护。但是事实上，`a++`是包含了三步的：

- Read: 读出原来的a；
- Modify: 对读出来的数据+1；
- Write: 将数据写回a。

假如说读出和写回实际上是可以拆开的，那么就算二者都可以保持原子性，也不能保证整体的原子性（例如线程1和线程2同时读出2，+1，再写回的都是3，而不是变为4）。因此，RMW虽然可以同时指定read和write的memory order，但本身是整体不可分的。同时，RMW要求read出的值是MO中最新的值。

对RMW操作的memory order的指定结果实际为：

```c++
a.fetch_add(1, std::memory_order_seq_cst); // read和write都是seq_cst
a.fetch_add(1, std::memory_order_acq_rel); // read是acquire，write是release
a.fetch_add(1, std::memory_order_acquire); // read是acquire，write是relaxed
a.fetch_add(1, std::memory_order_release); // read是relaxed，write是release
a.fetch_add(1, std::memory_order_relaxed); // read和write都是relaxed
```

特别地，CAS（Compare-and-set）是一种特殊的RMW操作：

```c++
a.compare_exchange_strong(T& expected, T desired, ...) -> bool; // 先不管后面的参数
```

也即对于原子变量`a`，首先读出来其值`v`与`expected`进行比较，如果相同，则把`desired`写回`a`（于是构成一个RMW操作），并返回`true`；否则把`v`写回`expected`（于是仅仅构成load操作），并返回`false`。因此，这个方法可以提供两个memory order：

```c++
(std::memory_order success, std::memory_order failure);
```

其中`success`代表了RMW的order，`failure`代表了load的order。如果只提供`success`，那么`failure`会采用`success`中read的order（例如`success`使用`memory_order_release`，则`failure`会采用`relaxed`）。

举一个和之前比较像的例子：

```c++
int data = 0;
std::atomic<int> sync{0};

void thread_1()
{
    data = 442;                                       // #0
    sync.store(1, std::memory_order_release);         // #1
}

void thread_2()
{
    int expected = 1;
    while(!sync.compare_exchange_strong(expected, 2,  // #2
                                        std::memory_order_acq_rel))
        expected = 1; // 失败时expected会写回sync的值0，要重新比较还要恢复回去。
    assert(data == 442); // #3
}

void thread_3()
{
    while(sync.load(std::memory_order_acquire) != 2); // #4
    assert(data == 442);                              // #5
}
```

这里`#3`是正确的，是因为SB(#0, #1) && SB(#2, #3)，而由于`#2`的acquire读到了`#1`的release，因此SW(#1, #2)，因此HB(#0, #3)；同时`#5`也是正确的，因为`#4`的acquire读到了`#2`的release，于是SW(#2, #4)，再加上SB(#4, #5)，于是最终HB(#0, #5)。

### Release Sequence

我们观察下面的代码：

```c++
std::vector<int> items;
std::atomic<int> readySize{0};

void Producer()
{
    int size = 10;
    for (int i = 0; i < size; i++)
        items.push_back(i); // #0
    readySize.store(10, std::memory_order_release); // #1
}

void Consumer()
{
    while (true)
    {
        int idx = readySize.fetch_sub(1, std::memory_order_acquire); // #2
        if (idx <= 0) {
            wait_for_random_time();
            continue;
        }
        else {
            int item = items[idx - 1]; // #3
            Process(item);
        }
    }
}
```

假如说只有一个producer和一个consumer，那么上述代码是正确的；当第一次`idx > 0`时，代表它读到了`#1`存下的新值，因此SW(#1, #2)；再加上SB(#0, #1)和SB(#2, #3)，就可以得到HB(#0, #3)，从而consumer读到值的时候，producer已经产生了值。而再之后的`fetch_sub`由于在同一线程里，SB的关系使得后续的读也都是对的。

然而，如果有一个producer和两个consumer，事情就发生了变化。对于第一个看到`idx > 0`的consumer线程，和前面的流程一样是正确的；但是对于第二个consumer，`#2`读到的值并不来自于`#1`，而是来自于另一个consumer线程RMW后的结果。而我们RMW中又是`memory_order_acquire`，也即write是relaxed的，因此就无法和acquire read建立SW(#2_1, #2_2)，从而也就无法推导处HB(#0, #3_2)。**也就是说，按照之前的规定，一旦有多个consumer，就只有一个是能保证看到producer存下来的值**。

解决这个问题的最简单方式就是`#2`换成`acq_rel`，这样就release write和acquire read可以建立SW(#2_1, #2_2)。然而代价就是性能会有损失，至少acquire只需要引入单向的barrier，而acquire release要引入双向的barrier。

为了解决这个矛盾，C++引入了**Release sequence**的概念。我们直接引用一下标准的原文：

1. A *release sequence* headed by a release operation A on an atomic object M is a maximal contiguous sub-sequence of side effects in the modification order of M, where the first operation is A, and every subsequent operation is an atomic read-modify-write operation.

   （在原子变量M上的release操作A开头的release sequence是指：在M的MO上第一个操作是A，并且之后的每个操作都是RMW操作，构成的最长连续副作用子序列）

2. An atomic operation A that performs a release operation on an atomic object M synchronizes with an atomic operation B that performs an acquire operation on M and takes its value from any side effect in the release sequence headed by A.

   （对于在原子变量M上的release操作A，如果有一个由A开头的release sequence，使得一个acquire操作B读到的值来自于这个release sequence中的某一步，则SW(A, B)）。

换言之，release操作仿佛可以通过一连串的RMW操作维持住其release属性（**不论RMW有什么memory order**），直到有一个新的write操作打断这一过程。在我们上面的例子中，第二个consumer的RMW是从第一个consumer的RMW读到的，构成了`#0 release -> #2_1 RMW -> #2_2 RMW`的release sequence，而`#2_2`的acquire读取到的是这个release sequence中的值，故仍能和`#0`产生SW关系，维持了正确性。

> 当然，这里不必中间只有一个`#2_1 RMW`，有可能在第二个consumer执行前，第一个consumer已经多次RMW，但是中间由于没有其他write，仍然能构成release sequence。

然而，Release sequence并不能代替`acq_rel`的order，因为`acq_rel`引入的是SW(#2_1, #2_2)，而release sequence只能引入SW(#0, #2_2)，后者是比前者弱的。我们再一次修改之前的例子：

```c++
int data = 0;
std::atomic<int> sync{0};

void thread_1()
{
    data = 442;                                       // #0
    sync.store(1, std::memory_order_release);         // #1
}

void thread_2()
{
    int expected = 1;
    while(!sync.compare_exchange_strong(expected, 2,  // #2
                                        std::memory_order_relaxed))
        expected = 1;
    assert(data == 442); // #3
}

void thread_3()
{
    while(sync.load(std::memory_order_acquire) != 2); // #4
    assert(data == 442);                              // #5
}
```

注意我们把`#2`从之前的`acq_rel`改成了`relaxed`；在`acq_rel`下，#3和#5都是正确的；但是改为`relaxed`之后，就只有`#5`正确了。这是因为：

+ 首先`#1 release -> #2 RMW`构成了release sequence；
+ 对于`#5`，由于`#4`是acquire read，且从`#2`的RMW结果读到值，因此和`#1`构成了SW关系；于是SB(#0, #1) && SW(#1, #4) && SB(#4, #5)可以推出HB(#0, #5)，结果正确。
+ 对于`#3`，由于`#2`**不是acquire read**，因此不能推导出SW(#1, #2)，故没有HB(#0, #3)；由于也没有HB(#3, #0)，因此#3产生data races。

> 当然，按照之前的原理，这里`#2`改成`acq`也是对的。

### Release Sequence: Before C++20

事实上，在C++20之前，操作A开头的release sequence除了RMW外，还可以包含进行A的线程的后续写操作。之所以C++11包含了这一点，是考虑到下面的代码：

```c++
int y = 0;
std::atomic<int> x{0};

void thread_1()
{
    y = 1;                                 // #1
    x.store(1, std::memory_order_release); // #2
    x.store(3, std::memory_order_relaxed); // #3
}

void thread_2()
{
    if (x.load(std::memory_order_acquire) == 3) // #4
        assert(y == 1);                    // #5
}
```

当`#5`执行时，`#4`一定已经满足，也即`#4`需要从`#3`加载值；但是`#3`本身是relaxed write，不能和acquire read建立SW关系，也就还是推导不出来HB(#1, #5)。但是直觉上来看，`#2`是release write，而`#3`发生在`#2`后面，所以建立SW(#2, #4)看起来很自然，很符合直觉。

然而这种直觉会破坏掉另一种直觉。POPL 2015的一篇论文指出，如果我们再加一个线程，那么release sequence就有可能被破坏掉：

```c++
void thread_3() { x.store(2, std::memory_order_relaxed); } // #6
```

如果`#6`在MO中夹在`#2`和`#3`之间，那么release sequence就会被打断，于是`#5`又不对了。我们仅仅是引入了一个不建立任何SW关系的relaxed操作，却神奇地破坏了另外两个线程的HB关系，这更加地反直觉。这篇论文设计了很复杂的加强memory model的方式，而C++20则选择只保留RMW，把这个情况规避掉。这其实算一个breaking change，因为这样仅有两个线程的代码在理论上也是错误的了。

### Out-of-thin-air Problem

我们说过，memory model本质上是一组公理化约束，像不等式一样，满足条件的解都是允许出现的；我们之前还说过，relaxed model可能导致很令人惊讶的结果：

```c++
std::atomic<int> x{0}, y{0};

void read_y_then_write_x(int& r1)
{
    r1 = y.load(std::memory_order_relaxed); // #1
    x.store(r1, std::memory_order_relaxed); // #2
}

void read_x_then_write_y(int& r2)
{
    r2 = x.load(std::memory_order_relaxed); // #3
    y.store(42, std::memory_order_relaxed); // #4
}
```

这里`r1 == 42 && r2 == 42`是允许的，因为它不建立任何SW关系，并且不违反两个原子变量的MO：

```c++
// x: 0 r1
// y: 0 42
```

那么我们把上面的代码改一改，这时候`r1 == 42 && r2 == 42`还有可能吗？

```c++
std::atomic<int> x{0}, y{0};

void read_y_then_write_x(int& r1)
{
    r1 = y.load(std::memory_order_relaxed); // #1
    if (r1 == 42)
        x.store(r1, std::memory_order_relaxed); // #2
}

void read_x_then_write_y(int& r2)
{
    r2 = x.load(std::memory_order_relaxed); // #3
    if (r2 == 42)
        y.store(42, std::memory_order_relaxed); // #4
}
```

虽然我们增加了两个非原子操作，但是两个线程仍然没有建立SW关系，所以`r1 == 42 && r2 == 42`仍然是满足所有公理约束（这里即是仍能满足MO），是一组合法的解。然而，这个结果是和逻辑的因果律是矛盾的。我们假设`#2`会发生，那么就要构造下面的“前提条件逻辑序列”（即这里箭头代表"requires"）：

+ `#2`发生 → `r1 == 42` →  `#1 `load的是42 → `#4`发生 → `r2 == 42` → `#3` load的是42 → `#2`发生。

也就是说，`#2`发生的前提，是`#2`已经发生了，这完全是循环论证（begging the question）！通过假设结果正确，推导出结果正确，这是不符合逻辑的。memory model允许的解在逻辑上不允许，这种悖论就称为Out-of-thin-air problem（无中生有）。

假如我们允许Out-of-thin-air problem在理论模型中出现，那么下面更吓人的例子也可以让`r1 == 42 && r2 == 42`：

```c++
std::atomic<int> x{ 0 }, y{ 0 };

void thread_1()
{
    int r1 = x.load(std::memory_order_relaxed);
    y.store(r1, std::memory_order_relaxed);
}

void thread_2()
{
    int r2 = y.load(std::memory_order_relaxed);
    x.store(r2, std::memory_order_relaxed);
}
```

因为我们同样可以假设`r1` load上来的是42，然后自洽地推出`x,y,r1,r2`全是42，这是一组合法的解。当然，这仍然是在循环论证，因为没有一个42的起点来源，仍然在无中生有。

然而，Out-of-thin-air problem在学术界仍然是一个正在研究的问题：

+ 我们如何在memory model中形式化地描述这一问题？
+ 编译器能否直接检测出这种问题？
+ 能否以某种高效的方式规避这个问题？

有很多的paper都尝试去描述或解决这个问题，在某种方案广泛接受之前，C++用一种非常模糊的方式陈述了上述问题：

+ Implementations should ensure that no “out-of-thin-air” values are computed that circularly depend on their own computation.

当然，由于现在的处理器向上的抽象都不会违反因果律（就不会凭空产生42），因此这是一条防御性的规定。

> 比如如果设计一种投机执行的处理器直接猜`r1 = 42`然后通过验证确定这是不是满足的，就可能违反这一规定。

### Memory Model Conflict

我们说过sequential consistent model保证一个total order，而acquire-release和relaxed model都没有这种保证。那如果我们把这些操作混合起来呢？例如对于下面的代码：

```c++
// Thread 1:
x.store(1, std::memory_order_seq_cst); // A
y.store(1, std::memory_order_release); // B
// Thread 2:
r1 = y.fetch_add(1, std::memory_order_seq_cst); // C
r2 = y.load(std::memory_order_relaxed); // D
// Thread 3:
y.store(3, std::memory_order_seq_cst); // E
r3 = x.load(std::memory_order_seq_cst); // F
```

假设初始`x == 0 &&& y == 0`，有没有可能`r1 == 1 && r2 == 3 && r3 == 0`呢？我们先在seq_cst的total order里进行分析：

+ 为了让`r1 == 1 && r2 == 3`，C需要读到`y == 1`，而`D`需要读到`y == 3`；假设E在C前面，那么之后没有操作能够让`y`回到3，因此在total order中必然先C后E；
+ 为了让`r3 == 0`，F需要读到`x == 0`，因此必须发生在A前面；
+ 而我们知道SB(E, F)。

因此，上述链条导致A,C,E,F四个seq_cst的操作的total order一定是C → E → F → A。

接下来我们分析HB关系（特别地，seq_cst本身也可以建立acq_rel的SW关系）：

+ 为了让`r1 == 1`，C就要从B读到值，因此SW(B, C)；根据SB(A, B)和SB(C, D)，我们于是得到HB(A, B, C, D)的链条。

+ 而对于`r2 == 3`，只要在MO中D在E的后面即可；`r3 == 0`则要求F在A的前面。我们可以构建下面的MO让二者满足：

  ```c++
  // x: Init -> F -> A
  // y: B -> C -> E -> D
  ```

然而上述分析隐藏了一组矛盾：

+ 在total order中，C → E → F → A，即“C发生在A前面”；
+ 在HB order中，HB(A, B, C, D)，似乎“A发生在C前面”。

在C++20之前不允许这种矛盾，或者说要求HB order是total order的一个子集，因此`r1 == 1 && r2 == 3 && r3 == 0`是一组非法解。然而，Power和ARM的部分CPU却允许出现这种情况；为了最大化优化（而不是让编译器使用更强的指令），C++选择引入strongly-happens-before（SHB）的关系；我们称A strongly-happens-before B，如果：

+ A is sequenced-before B（同一线程的情况）；
+ A synchronizes with B, and **both A and B are sequentially consistent atomic operations**（多线程的情况1：SW建立SHB只能是双方都是seq_cst）；
+ A is sequenced-before X, X happens-before Y, and Y is sequenced-before B（多线程情况2：SHB通过SB-HB-SB建立）；
+ A strongly-happens-before X, and X strongly-happens-before B（具有传递性）。

**只有SHB order才要求是total order的一个子集**。在我们前面的例子中，虽然建立了SW(B, C)，但是B不是seq_cst操作，因此SHB(B, C)不成立；我们只能建立：

+ SHB(A, B)，SHB(C, D)，因为二者都是SB；
+ SHB(A, D)，因为SB(A, B) && HB(B, C) && SB(C, D)。但是由于D本身不是seq_cst操作，因此并不出现在total order中。

总之我们不能打通SHB(A, C)，因此SHB和total order就不再矛盾了，允许了`r1 == 1 && r2 == 3 && r3 == 0`出现。

### Happens-before Revision: from C++11 to C++26

事实上我们以上说的术语解释都是C++26的修订结果，因为C++26对consume operation进行了deprecate。整个术语的流变可以用下面一张图总结：

{% include figure.liquid loading="eager" path="https://pica.zhimg.com/v2-6cb6c1c9e5fdb004efe8ede6f52281c8_1440w.jpg" class="img-fluid rounded z-depth-1" %}
图源：我自己的课件（ 

所以实际上C++11的strongly-happens-before并不是C++20 & 26的strongly-happens-before，但是由于consume operation总是加强成acquire operation，因此这并不会在实际的推理中增加难度。我们完全可以用C++26的术语去推理C++11的原子操作是否逻辑正确。

### Fence

有些时候，我们可能不希望使用显式的原子变量来进行同步；fence就是为了解决这个问题引入的global barrier：

```c++
std::atomic_thread_fence(memory_order);
```

它某种程度上全局地施加了指定的memory order。具体地：

+ 对一个release fence，仿佛对**接下来的所有atomic write**加了release的memory order；但是如果建立了SW关系，则是和fence这条语句建立SW；
+ 对一个acquire fence，仿佛对**之前的所有atomic read**加了acquire的memory order；但是如果建立了SW关系，则是和fence这条语句建立SW；

几种order对应的fence如下，很直观，直接照抄了：

+ When `order == std::memory_order_relaxed`, there are no effects.
+ When `order == std::memory_order_acquire` or `order == std::memory_order_consume`, is an acquire fence.
+ When `order == std::memory_order_release`, is a release fence.
+ When `order == std::memory_order_acq_rel`, is both a release fence and an acquire fence.
+ When `order == std::memory_order_seq_cst`, is a sequentially-consistent ordering acquire fence and release fence.

举个例子，我们有一组待准备的数据，准备好之后写一个atomic bool表示自己准备好了；另一方通过这个flag来决定读不读：

```c++
constexpr int num_mailboxes = 32;
std::atomic<bool> mailbox_receiver[num_mailboxes]{};
std::string mailbox_data[num_mailboxes];

void Writer(int i)
{
    mailbox_data[i] = compute(i);                                     // #1
    mailbox_receiver[i].store(true, std::memory_order_release);       // #2
}

void Reader()
{
    for (int i = 0; i < num_mailboxes; ++i)
    {
        if (std::mailbox_receiver[i].load(std::memory_order_relaxed)) // #3
        {
            std::atomic_thread_fence(std::memory_order_acquire);      // #4
            do_work(mailbox_data[i]);                                 // #5
        }
    }
}

int main()
{
    std::jthread writer_threads[num_mailboxes];
    for (int i = 0; i < num_mailboxes; i++)
    {
        writer_threads[i] = std::jthread{ Writer, i };
    }
    std::jthread reader_thread{ Reader };
    return 0;
}
```

当`#3`是`true`的时候，说明它从`#2`读到了值；虽然它是relaxed load，但是由于`#4`是一个acquire fence，因此假设`#3`是一个acquire load，则二者可以建立SW关系。但同时我们说，这种假定关系推导出的SW实际上发生在fence上，因此实际上建立的是SW(#2, #4)（而非SW(#2, #3)）。

但是SW(#2, #4)就够了！配合SB(#1, #2) && SB(#4, #5)，我们就可以推导出HB(#1, #5)，因此`#5`是一个安全的读。

> 当然，这种global的影响的开销一般比普通的原子变量操作要高一些。

## 参考文献

有一些写的是名字，有一些写的是姓氏，有一些全写了，不是很规范。

1. [Thriving in a Crowded and Changing World: C++ 2006–2020 \| HOPL4](https://www.stroustrup.com/hopl20main-p5-p-bfc9cd4--final.pdf), Bjarne Stroustrup.
2. [Foundations of the C++ concurrency memory model \| PLDI 2008](https://dl.acm.org/doi/10.1145/1375581.1375591), Boehm & Adve.
3. [Common Compiler Optimisations are Invalid in the C11 Memory Model and what we can do about it \| POPL 2015](https://people.mpi-sws.org/~viktor/papers/popl2015-c11comp.pdf), Viktor et.al.
4. [A concurrency semantics for relaxed atomics that permits optimisation and avoids thin-air executions \| POPL 2016](https://dl.acm.org/doi/10.1145/2837614.2837616), Jean & Peter.
5. [An Initial Study of Two Approaches to Eliminating Out-of-Thin-Air Results](https://escholarship.org/content/qt2vm546k1/qt2vm546k1.pdf?t=po904h), Peizhao Ou.
6. [Repairing sequential consistency in C/C++11 \| PLDI 2017](https://dl.acm.org/doi/10.1145/3062341.3062352), Lahav et.al.
7. [P0668R5: Revising the C++ memory model](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0668r5.html)
8. [P0982R1: Weaken release sequences](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0982r1.html)
9. C++ standard draft: [atomics.order](https://eel.is/c++draft/atomics.order), [intro.multithread](https://eel.is/c++draft/intro.multithread).
10. Cppreference: [std::memory_order](https://cppreference.com/w/cpp/atomic/memory_order.html), [Multi-threaded executions and data races](https://cppreference.com/w/cpp/language/multithread.html).
11. C++ Concurrency in Action, 2nd. ed., Anthony Williams. Chapter 5.

## 后记

笔者自几年之前开始了解到Memory Order相关的问题至今，已经阅读了许多的材料（不论是Herb很有名的atomic weapon，还是知乎上很多高赞文章），虽然每篇材料都解决了一部分的疑惑，但是总有一些不能理解的地方。最近笔者的C++课程要讲到这一部分，觉得是时候把这一切全部都搞明白了，于是从C++标准的精神出发，从头梳理了所有的知识点，最终完成了一个自洽的理论，可以系统解释相关的问题。这是笔者朝着精进C++迈出的又一大步，写作本文也就更有了酣畅淋漓之感。

与诸位共勉。
