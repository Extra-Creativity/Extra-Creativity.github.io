---
layout: post
title: shared_ptr中原子计数器如何选择memory order？
date: 2025-07-24
description: A typical application (and practice) of C++ memory order.
tags: memory-order multithreading
categories: C++
read_time: 40
toc:
  sidebar: out-left
  collapse: false
---

本文假设读者已了解memory order中所有相关术语。笔者的前一篇博客也对此进行了完整的讨论。

## 问题描述

本质上，shared_ptr的整个周期可以抽象成下面的语句：

```cpp
sharedBlock->counter.fetch_add(1, mo1); // #1: 原子计数器+1，表示自己正在使用
sharedBlock->use(); // #2: 使用这个shared_ptr的数据块，需要保证过程中不会释放
if (sharedBlock->counter.fetch_sub(1, mo2) == 1) // #3: 原子计数器-1，表示自己不再使用
    delete sharedBlock; // #4: 如果自己是最后一个拥有者，释放数据块
```

主要的问题就是`mo1`和`mo2`应该使用何种memory order，才能使得所有共享者的`#2`是安全的。对于`mo1`，由于shared_ptr暴露的接口是拷贝构造函数，要求传入的shared_ptr在调用结束前一定始终有效，也即happen before传入的shared_ptr的析构，不会出现新的#1还没进行，传入的#3已经发生并delete造成use after free。因此，构造并不需要额外的同步（或者说如果真的需要同步，也应该是用户完成的），只需要relaxed order：

```cpp
counter.fetch_add(1, std::memory_order_relaxed);
```

对于`mo2`情况更加复杂，我们下面进行更多的讨论。

## Is Relaxed Enough?

首先考虑`mo2`为relaxed order。我们本质上就是希望：对于k个共享者的`#2_1 ... #2_k`，它们都要happen before `#4_last`，即最后一个共享者对应的delete语句。特别地，我们强调：`#4_last`仅仅意味着在`counter`的modification order (MO)中，`#3_last`是最后一个发生的；但是`#3_i`并不和`#3_last`构成HB的关系（因为它们都是relaxed order），因此并不能结合SB(#2_i, #3_i)推导出HB(#2_i, #4_last)。

> 也即HB order是MO的子集，而MO不一定全是HB order。

对于非`last`的其他共享者`i`，由于relaxed order不建立SW，我们仍然只能从构造函数知道HB(#1_i, #3_j)，其中j代表构造时被拷贝的shared_ptr。结合SB(#3_j, #4_j)，我们至多只能知道HB(#1_i, #4_j)，但无法推导出#2_i与#4_last之间的HB关系。**而无HB就造成二者产生data races，在实际表现中就可能导致#4_last先发生，#2_i却仍在使用，造成use after free的问题**。

在实际的编译器重排中，我们可以理解为可能进行下面的优化：

```cpp
bool isLast = counter.fetch_sub(1, mo2) == 1; // #5
block.use(); // #6
if (isLast)
    delete sharedBlock; // #7
```

假设存在一个全局顺序，则两个线程可能发生`#5_1, #5_2, #6_2, #7_2, #6_1, #7_1`，而`#5_2`已经得到`isLast == true`了，那么`#7_2`已经进行了delete，因此造成了use after free。

> 当然，笔者强调这种假设不正确，因为多线程执行语句不保证total order，这里只是为了方便理解。

## Acquire-Release

既然relaxed并不是一个合适的order，对于RMW，一个自然的想法就是加强到acquire-release：

```cpp
if (counter.fetch_sub(1, std::memory_order_acq_rel) == 1) // #3
    delete sharedBlock; // #4
```

与relaxed不同的是，release会和读到其值的acquire产生SW的关系。因此，我们假设`#3_i, ... #3_last`在MO中是连续的，那么`#3_{i+1}`一定从`#3_i`的结果读到值，从而产生SW(#3_i, #3_{i+1}, ... #3_last)。而我们又知道对`i`到`last`中任意共享者`k`，SB(#2_k, #3_k)，再加上SB(#3_last, #4_last)，一定可以得到HB(#2_k, #4_last)，即所有使用都发生在delete前，保证了安全性。

一般地，`#3_i, ... #3_last`在MO中不一定连续，因为有可能在过程中加入新的共享者，从而中间会插入若干`#1`。然而，C++标准规定了release sequence的概念，也即一系列的RMW操作不会打断原操作的release属性，因此`#3_i, #1_i1, #1_i2, ..., #1_iN, #3_{i+1}`仍然能建立SW(#3_i, #3_{i+1})，所以仍然是正确的。

## Conditional Acquire

在上述分析中，我们其实可以观察到过强的约束：SW(#3_i, #3_{i+1}, ... #3_last)是一连串的SW关系；然而，我们本质上只需要约束出SW(#3_i, #4_last), ...就可以了，即每个#3都保证发生在最后一个delete的前面，而其他的共享者的顺序不重要。因此，我们可以把其他共享者减弱到release，而最后一个共享者则使用acquire，这样：

- 对于倒数第2个共享者，由于它release的值被最后一个acquire读到，因此二者产生了SW的关系；
- 对于倒数第3个共享者，虽然它release的值没有直接被最后一个acquire读到，但是由于序列全部是RMW操作，因此在MO中构成了以它开头的release sequence，读到倒数第2个共享者的值也能和它建立SW的关系；
- 对于再向前的共享者同理；对于插入额外的`#1`情况也仍然不会破坏release sequence。

这样就可以构成SW(#3_i, #3_last)，完美地对应于我们的同步要求，而不必构成连续的SW。然而，shared_ptr是通过RMW知道谁是最后一个共享者的，而我们又要根据这一结果确定RMW的order，这变成了循环依赖。因此，我们只能在RMW已经进行结束并进入`if`块之后，再施加这种额外的约束：

```cpp
if (counter.fetch_sub(1, std::memory_order_release) == 1) // #3
{
    counter.load(std::memory_order_acquire); // #new
    delete sharedBlock; // #4
}
```

这样，#new进行的acquire read读到的是最后一个共享者的release write；同时根据与之前相同的原理，其他共享者的release write一直到最后一个共享者的release write构成release sequence，因此#new仍然与它们构成SW的关系。故而，我们最终建立了SW(#3_i, #new), ...的关系，而SB(#2_i, #3_i) && SB(#new, #4)，于是总是有HB(#2_i, #4)，成功地避免了data races及use after free的问题。

当然，我们也可以使用acquire fence来建立这样的关系：

```cpp
if (counter.fetch_sub(1, std::memory_order_release) == 1) // #3
{
    std::atomic_thread_fence(std::memory_order_acquire); // #new
    delete sharedBlock; // #4
}
```

分析上大同小异：

- 对于最后一个共享者会执行fence，于是我们首先可以假想给最后一个共享者的`#3`加上了acquire order，按照之前的分析，这时会产生SW(#3_i, #3_last)；
- 然而fence本身是从自己开始加SW，因此实际的SW是SW(#3_i, #new)；再结合SB(#2_i, #3_i) && SB(#new, #4)，得到HB(#2_i, #4)。

不过fence建立的是一种全局的影响，因此开销一般比load要大一些。

## ISA Comparison

理论上，根据我们施加的约束大小，我们可以对三种方法的性能进行排序：

Conditional acquire load > Conditional acquire fence > acquire release

但是在实际的指令生成中，由于编译器优化过于保守、指令集不严格对应理论模型等原因，有可能并不能排布出这种性能顺序的指令。我们以x86-64和ARM64为例：

### x86-64

对于x86，由于所有的RMW一定都能保证acquire-release顺序，因此这些优化应该并没有什么用。观察生成指令，我们甚至可以发现实际性能应当是Conditional acquire load < Conditional acquire fence = acquire release，这是由于编译器的优化失误；对于acquire-release，生成的指令如下：

```nasm
  lock sub DWORD PTR cnt[rip], 1
  jne .L18
  mov rdi, QWORD PTR p[rip]
  test rdi, rdi
  je .L18
  mov esi, 4
  jmp operator delete(void*, unsigned long)
.L18:
  ret
```

而对于acquire load，编译器并不会把`#new`这个实际上没用的load给优化掉，因此多了一次`mov`：

```nasm
  lock sub DWORD PTR cnt[rip], 1
  je .L9
.L1:
  ret
.L9:
  mov eax, DWORD PTR cnt[rip] ; THIS LOAD IS USELESS
  mov rdi, QWORD PTR p[rip]
  test rdi, rdi
  je .L1
  mov esi, 4
  jmp operator delete(void*, unsigned long)
```

而我们改成acquire fence之后，这条load又消失了，因为编译器又识别出来这个fence在这里没有作用，x86的RMW已经加上了这种顺序，于是fence变成了no-op。

### ARM64

对于ARM，我们可以看到指令被如实地进行了翻译；对acquire-release：

```nasm
  add x1, x1, :lo12:.LANCHOR0
  bl __aarch64_ldadd4_acq_rel ; 这里是一个acq_rel
  cmp w0, 1
  bne .L20
  adrp x0, .LANCHOR0
  add x1, x0, :lo12:.LANCHOR0
  ldr x0, [x1, 8]
  cbz x0, .L20
  ldp x29, x30, [sp], 16
  mov x1, 4
  b operator delete(void*, unsigned long)
.L20:
  ldp x29, x30, [sp], 16
  ret
```

对于acquire load：

```nasm
  add x1, x1, :lo12:.LANCHOR0
  bl __aarch64_ldadd4_rel ; 这里是一个release
  cmp w0, 1
  beq .L10
.L1:
  ldp x29, x30, [sp], 16
  ret
.L10:
  adrp x0, .LANCHOR0
  add x1, x0, :lo12:.LANCHOR0
  ldar w0, [x1]           ; 这里是一个acquire load
  ldr x0, [x1, 8]
  cbz x0, .L1
  ldp x29, x30, [sp], 16
  mov x1, 4
  b operator delete(void*, unsigned long)
```

对于acquire fence：

```nasm
  add x1, x1, :lo12:.LANCHOR0
  bl __aarch64_ldadd4_rel ; 这里是一个release
  cmp w0, 1
  beq .L19
.L11:
  ldp x29, x30, [sp], 16
  ret
.L19:
  adrp x0, .LANCHOR0
  dmb ishld               ; 这里是一个acquire fence，也就没有了ldar
  add x1, x0, :lo12:.LANCHOR0
  ldr x0, [x1, 8]
  cbz x0, .L11
  ldp x29, x30, [sp], 16
  mov x1, 4
  b operator delete(void*, unsigned long)
```

当然具体的性能还是取决于在执行时哪种指令排布最快。


可以在compiler explorer上看如上结果：https://godbolt.org/z/xPT9xM8nG。

## 实际实现中的使用情况

一般的标准库，如MS-STL、libstdc++和libc++使用的都是acquire-release RMW；[boost](https://www.boost.org/doc/libs/1_78_0/doc/html/atomic/usage_examples.html#boost_atomic.usage_examples.example_reference_counters.implementation)中曾记录使用acquire fence；笔者未找到acquire load的实际使用例子，但是在[stackoverflow](https://stackoverflow.com/q/49112732/15582103)中发现了2018年已有人提出这种使用的正确性，并进行了指令的对比。本文的指令对比是受该帖启发补充的。

关于x86指令的特殊性，仍然可以看[stackoverflow](https://stackoverflow.com/a/61720630/15582103)；对于conditional fence相比于acquire-release RMW可能的性能区别，依然可以看[stackoverflow](https://stackoverflow.com/a/73028656/15582103)。笔者在此就不进行赘述了。

## 后记

笔者在上一篇文章中讨论了一下memory order相关的理论，在relaxed order这一节中，原本是以`std::shared_ptr`举例，写下了“shared_ptr的原子计数器只需要原子性，构造递增析构递减”；后来mervyn233@B站 指出了这里的错误，即析构函数应该使用`acq_rel`进行递减。在仔细思考之后，笔者深以为然，修改了文章的相关部分；同时想出应该可以使用conditional acquire的实现方式，与`acq_rel`在不同平台各有性能优势。后经查证，这种方式也确实有使用，因此补充一篇文章进行分析。