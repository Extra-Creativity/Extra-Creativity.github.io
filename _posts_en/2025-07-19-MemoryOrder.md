---
layout: post
title: "Detailed Explanation of the C++ Memory Order Theoretical Model"
date: 2025-07-19
description: Wait, why do you change frequently?
tags: memory-order multithreading
categories: C++
read_time: 60
llm_translation: true
toc:
  sidebar: out-left
  collapse: false
---

> **Preface:** This article aims to build a complete theoretical model of memory order starting from the theoretical model specified by the C++ standard, without leaking any abstraction as much as possible. In other words, this article does not explain things backwards from various low-level implementation perspectives (e.g., how compilers reorder, what ISA atomic instructions are used, how the architecture supports them, etc.); instead, it hopes to deduce the reasons for some low-level implementations from first principles. Since I feel that most materials available online do not take this approach, I decided to write a new article to fully understand memory order from its theoretical model, and further clarify how this model has evolved from C++11 to C++26 and why such evolution was necessary.
>
> If you enjoy this article, feel free to [like/favorite/bookmark it on Zhihu](https://zhuanlan.zhihu.com/p/1911798716026826993)!

## About History

C++ creator Bjarne Stroustrup once said in his HoPL4 paper:

> At first, I think most committee members underestimated this problem. We knew Java had a good memory model and had hoped to adopt it. To my amusement, representatives from Intel and IBM firmly rejected this idea; they pointed out that if the Java memory model were adopted in C++, the speed of Java virtual machines would at least halve. Therefore, to maintain Java's performance, we had to adopt a much more complex model for C++. Predictably and ironically, C++ has since been criticized for having a more complex memory model than Java.

Memory order itself is still a topic of debate in academia. Since H.J. Boehm's paper at PLDI 2008 laid the foundation for today's C++ memory model, academia has continuously worked on improving this model, trying to reduce the various problems it introduces. Although the C++ committee is often conservative, on the topic of memory models they introduced it into the C++11 standard even before it was perfect, and have continuously refined the standard as academic research progressed. It could even be said that C++ is a pioneer in parallel memory models. This article aims to take you on a deep dive!

> I think this is thanks to Boehm's decades of persistence — whenever there is an important new development in academia, Boehm issues a new standard proposal.

## Preface

Before parallel programming became widespread, compilers and processor designs had already undergone a very long period of development, introducing various techniques for acceleration and optimization. As a result, the written code does not correspond one-to-one with the actual execution order:

- Compilers or JITs perform very aggressive optimizations, generating reordered and simplified assembly;
- Processors perform out-of-order execution and speculative execution, disrupting the actual execution order of binary code;
- Each processor may have its own cache, and different processors may see different memory contents; etc.

In serial programs, these optimizations are not a problem at all — the user-visible result is deterministic, and each layer of abstraction only needs to maintain the correctness of this visible result. However, in parallel programs, since threads may read any address at any time, these abstractions designed for single-thread visibility break down, requiring new patches at each layer. To unify the behavior of various existing parallel programs, C++ uses a memory model for abstraction and provides three ordering models:

- Sequentially Consistent (seq_cst);
- Acquire-Release (acq_rel);
- Relaxed (relaxed).

> In fact, there also exists a Consume-Release model, but (1) no compiler implementation has managed to successfully use it for acceleration, and (2) it further increases the complexity of the theoretical model. Therefore, all compilers **have always strengthened it to the Acquire-Release model** (this strengthening is even documented in the C++ standard), and the Consume-Release model was fully deprecated in C++26. We will not discuss this model, only mention it in the terminology evolution section later.

## Basics

### Overview

There are several fundamental relationships in the memory model:

1. **Modification Order (MO)**: For **a single atomic variable**, all threads see the same modification order, which is called the modification order. Since read operations produce no side effects, we can also imagine that all operations on a single atomic variable have a specific order.

   Based on this principle, determine whether `r1 == 1 && r2 == 2 && r3 == 2 && r4 == 1` can occur in the following pseudocode:

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

   The answer is no, because `r1 == 1 && r2 == 2` means `1` is an older value than `2`, while `r3 == 2 && r4 == 1` means `2` is an older value than `1`; the two cannot coexist in a single MO.

2. **Sequenced-before (SB)**: Within the same thread, if operation A occurs before operation B, then A is sequenced-before B. For example, a very simple case:

   ```c++
   a = 1;
   b = 2; // 'a = 1' is sequenced before 'b = 2'
   ```

   The same statement may also have sequenced-before relationships, such as the comma expression:

   ```c++
   a = 1, b = 2; // 'a = 1' is sequenced before 'b = 2'
   ```

   C++17 added some new rules, e.g., in `a @= b`, `b` is always evaluated first, then `a` is evaluated, so the following statement also has a sequenced-before relationship:

   ```c++
   b += ++b; // '++b' is sequenced before 'b +=' since C++17; UB before C++17.
   ```

   Of course, not all statements are specified in this way, and in those cases there is no sequenced-before relationship:

   ```c++
   a = b++ + b; // b++ and b have no sequenced-before relationship, unknown which happens first, the value of a is UB.
   ```

   Another example is function arguments:

   ```c++
   int a() { return std::puts("a"); }
   int b() { return std::puts("b"); }
   int c() { return std::puts("c"); }
    
   void z(int, int, int) {} 
   z(a(), b(), c()); // all 6 permutations of output are allowed
   ```

   However, C++17 specifies that the evaluation of each function parameter cannot overlap, placing them between unsequenced and sequenced — this is called indeterminately sequenced. This rule has some benefits, but that's a topic for another discussion. **In summary, sequenced-before specifies which operations happen first and which happen later within a single thread.**

3. **Happens-before (HB)**: In multithreaded contexts, happens-before specifies a certain order. We say A happens-before B if:
   - A is sequenced-before B (same thread);
   - A ***synchronizes with*** B (multithreaded case);
   - A happens-before X, and X happens-before B (transitivity).

   **Memory order mainly specifies which operations establish synchronize-with relationships (we'll abbreviate as SW going forward).** In particular, not all operations necessarily have a happens-before relationship between them.

   So what effect does the "certain order" of happens-before produce? Specifically:

   - For operations A and B on the same non-atomic variable, if A happens-before B and there are no other modifications in between, then A's effect is visible to B. Conversely, if there is no happens-before relationship between A and B (!HB(A, B) && !HB(B, A)), this creates a **data race**, which is UB.
   - For atomic variables, in addition to the above visibility rule, it is further specified that the HB order should be part of the MO. Specifically, if there is no happens-before relationship between A and B, then while the atomicity of atomic variables prevents data races, it is uncertain which comes first in the MO; or rather, if !HB(A, B), then B's effect is allowed to be visible to A.

Readers may not yet understand why these rules are necessary; we will gradually guide understanding through the models and examples that follow.

> **Note:** We have simplified things here. In reality:
>
> 1. MO only specifies a uniform order for write operations; in the standard, the consistency of read operations is specified through four coherence requirements. However, our explanation above should be equivalent to this coherence.
> 2. There exist other relationships, such as strongly happens-before, etc. These concepts have also evolved across different C++ versions. To minimize the cognitive burden, we will discuss these issues later. **For now, just consider that only SB, HB, and SW relationships exist.**

### Sequentially Consistent

According to common sense, the order of occurrence of two events is always deterministic and independent of the observer; that is, "there is only one truth." Similarly, as the strongest model, SC specifies:

- All SC operations have a single total order, independent of the observing thread.

In addition, SC specifies the following SW relationship:

- For two SC operations A and B on the same atomic variable, if B reads the value stored by A, then A synchronizes with B. Additionally, the order introduced by SW should be part of the global total order.

Together, these two rules constitute the abstraction of SC. Take the following program as an example:

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
    { // Wait for all four threads to finish.
        std::jthread a{ write_x }, b{ write_y }, c{ read_x_then_y }, 
                     d{ read_y_then_x };
    }
    assert(z.load() != 0);
}
```

Here the `assert` is correct, i.e., `z.load() != 0` always holds. Since SC specifies a total order, `x.store` and `y.store` must have one that happens first. Let's assume `x.store` happens first:

+ For `read_y_then_x`, it only proceeds after `y.load()` reads `true`, establishing SW with `y.store` (so in the total order, `y.store` occurs before the successful `y.load`). Since `x.store` occurs before `y.store`, and `x.load()` occurs after `y.load()`, the global order must be `x.store() -> y.store() -> y.load() -> x.load()`, so `x.load()` must read `true`, and `++z` must occur.
+ For `read_x_then_y`, it only proceeds after `x.load()` reads `true`, establishing SW with `x.store` (so in the total order, `x.store` occurs before the successful `x.load`). However, since `y.store` occurs after `x.store`, `if (y.load())` may succeed or fail. Therefore, `z` is either 1 or 2.

The case where `y.store` happens first is symmetric. **Note that there is no HB relationship between `x.store` and `y.store`; their order is entirely imposed by the consistent total order.** For example, for `read_y_then_x`, we only know `SB(y.load(), x.load())` and `SW(y.store(), y.load())` — there is no direct relationship between `x.store` and `y.store`.

### Acquire-Release Model

SC, being the strongest model, has comparatively higher overhead. The model one level weaker is the Acquire-Release model. Specifically:

+ Only read operations can be acquire operations, and only write operations can be release operations.
+ For a release operation A and an acquire operation B on the same atomic variable, if B reads the value stored by A, then A synchronizes with B.
+ **There is no single total order.**

Let's look at another example:

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

Then `#4` and `#5` are guaranteed to be correct. First, only when `#3` reads the value stored by `#2` can it proceed, so SW(#2, #3), thus HB(#2, #3). Then:

+ For `#4`, since SB(#0, #2) && HB(#2, #3) && SB(#3, #4), and SB is also HB, through the transitivity of HB we get HB(#0, #4). Therefore, the effect of #0 is visible to #4.
+ For `#5`, similarly, HB(#1, #2) && HB(#2, #3) && HB(#3, #5), through transitivity we get HB(#1, #5). Therefore, the effect of #1 is visible to #5.

Although `p` and `data` are both non-atomic variables, since an HB relationship has been derived between the multithreaded operations, there is no data race.

So what is the impact of not having a total order? Let's go back to the original program:

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

Now `z.load()` could potentially be 0, because there is no HB relationship between `x.store` and `y.store`. We can only know HB(#0, #2), HB(#1, #4), SB(#2, #3), SB(#4, #5), but there is no complete HB chain allowing us to deduce that either HB(#0, #5) or HB(#1, #3) must hold.

Let's look at another example demonstrating transitivity:

```c++
int data = 0;
std::atomic<bool> sync1{ false }, sync2{ false };

void thread_1()
{
    data = 442;                                    // #0
    sync1.store(true, std::memory_order_release);   // #1
}

void thread_2()
{    
    while (!sync1.load(std::memory_order_acquire)); // #2
    sync2.store(true, std::memory_order_release);   // #3
}

void thread_3()
{
    while (!sync2.load(std::memory_order_acquire)); // #4
    assert(data == 442);                           // #5
}
```

Then `#5` is also guaranteed to be correct. Using the same logic as before, we know SW(#1, #2) and SW(#3, #4). So through SB(#0, #1) && SW(#1, #2) && SB(#2, #3) && SW(#3, #4) && SB(#4, #5), we get HB(#0, #5).

The acquire-release theoretical model implicitly forces compilers to reduce reordering optimizations. Most generally, any acquire operation B may establish SW with some release operation A; if the compiler reorders a statement segment S1 that comes after B to before B, or reorders a statement segment S2 that comes before A to after A, then S1 might not be able to observe S2's side effects. In other words, acquire and release operations implicitly introduce **one-way barriers**:

+ All operations that produce observable side effects cannot be reordered to after the release operation;
+ All operations that may depend on side effects cannot be reordered to before the acquire operation.

Intuitively, acquire-release is somewhat like forming a critical section (lock & unlock), where code inside cannot move up past the lock or down past the unlock.

> Therefore, compiler barriers are a consequence of the theoretical model, not the essence of the theoretical model. For example, operations that don't depend on side effects can still be reordered, such as completely local results like `int r = 1; r++;`.

### Relaxed

The weakest model is the relaxed order, where atomic operations do not create any SW relationships and only atomicity is guaranteed. Let's first look at an acquire-release example:

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

Here the assert is correct. First, assume `r1 == 42`, then #1 reads from #4, so SW(#4, #1). And since SB(#3, #4) and SB(#1, #2), we get HB(#3, #2). Therefore, #2's effect is not visible to #3, so `r2 == 0` must hold. The case where `r2 == 42` is symmetric — in any case, both cannot be 42.

If we switch to the relaxed model:

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

Then both can be 42, because there is no SW relationship between the two threads, so no HB relationship can be established. For atomic variables, as long as there is no HB(A, B), B's effect is allowed to be visible to A. Therefore, since neither HB(#1, #4) nor HB(#3, #2) holds, the effects of both stores can be visible to the loads.

A few points to emphasize:

1. There is no constraint from a total order, meaning we cannot understand parallel programs as sequential flows where multithreaded statements satisfy single-thread ordering with random interleaving. No possible total order in this program could make both equal to 42 simultaneously. In actual implementation, without SW constraints, the compiler can reorder and swap #3 and #4.
2. The MO constraint of individual atomic variables is not violated by this process. Here are the MOs for the two variables:

   ```c++
   // x: 0 r1
   // y: 0 42
   ```

   `y.load` can be placed after `y.store`, so `r1 == 42` can hold; `x.load` can be placed after `x.store`, so `r2 == r1` can hold, thus both are allowed to be 42 simultaneously.

Let's look at a more complex example. In short, this program has three atomic variables, three threads each increment one atomic variable and read all atomic variables, two threads only read all atomic variables, and finally the main thread prints out the states they read:

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

This program can only guarantee two things:

1. Due to each thread's SB relationships, the variable that each thread increments itself must appear sequentially increasing, just like incrementing and reading a normal variable in a loop.
2. Due to the MO constraint of single atomic variables, the values read for other variables are guaranteed to be non-decreasing. That is, once a thread reads a certain value for a variable, subsequent reads cannot go back to an earlier value.

For example, one allowed output is:

```
[(0,0,0),(1,0,0),(2,0,0),(3,0,0),(4,0,0),(5,7,0),(6,7,8),(7,9,8),(8,9,8),(9,9,10),]
[(0,0,0),(0,1,0),(0,2,0),(1,3,5),(8,4,5),(8,5,5),(8,6,6),(8,7,9),(10,8,9),(10,9,10),]
[(0,0,0),(0,0,1),(0,0,2),(0,0,3),(0,0,4),(0,0,5),(0,0,6),(0,0,7),(0,0,8),(0,0,9),]
[(1,3,0),(2,3,0),(2,4,1),(3,6,4),(3,9,5),(5,10,6),(5,10,8),(5,10,10),(9,10,10),(10,10,10),]
[(0,0,0),(0,0,0),(0,0,0),(6,3,7),(6,5,7),(7,7,7),(7,8,7),(8,8,7),(8,8,9),(8,8,9),]
```

Since the relaxed model has no SW relationships, it can often produce very surprising results, so it needs to be used very carefully. Typically, relaxed operations are either used in conjunction with other synchronization operations (e.g., acquire-release establishing some SW relationship), or used in places where only atomicity is needed (e.g., `std::shared_ptr` uses atomic variables as internal reference counters, and `use_count()` typically uses relaxed loads; while destructors use acquire-release to prevent use-after-free).

## Advanced Topics

### Overview

C++'s memory model forms a self-consistent axiomatic system that unifies the abstractions of existing programs and formally describes phenomena such as data races. This axiomatic model is like a set of linear programming constraints in a program, defining a range of possible values — any program behavior that falls within this range is valid, thereby leaving room for optimization by compilers and processors. However, it is precisely this axiomatic description that has planted various issues. We will introduce some new concepts and then discuss them one by one.

### RMW Operations

Let's first briefly introduce Read-Modify-Write (RMW) operations. For the following program:

```c++
std::atomic<int> a{ 0 };
// Assume two threads run this function simultaneously.
void increment()
{
    for (int i = 0; i < 10000; i++)
        a++;
}
```

The atomic variable guarantees that `a` will ultimately be `+= 20000`, while a regular variable would create a data race and require a lock for protection. However, in reality, `a++` consists of three steps:

- Read: read the original a;
- Modify: add 1 to the read value;
- Write: write the value back to a.

If reading and writing could be separated, even if both operations individually maintain atomicity, the overall operation would not be atomic (e.g., thread 1 and thread 2 both read 2, add 1, and write back 3, instead of the value becoming 4). Therefore, although RMW can specify the memory order for both read and write separately, the operation itself is indivisible. At the same time, RMW requires that the value read is the most recent value in the MO.

The memory order specification for RMW operations actually translates to:

```c++
a.fetch_add(1, std::memory_order_seq_cst); // both read and write are seq_cst
a.fetch_add(1, std::memory_order_acq_rel); // read is acquire, write is release
a.fetch_add(1, std::memory_order_acquire); // read is acquire, write is relaxed
a.fetch_add(1, std::memory_order_release); // read is relaxed, write is release
a.fetch_add(1, std::memory_order_relaxed); // both read and write are relaxed
```

In particular, CAS (Compare-and-Set) is a special type of RMW operation:

```c++
a.compare_exchange_strong(T& expected, T desired, ...) -> bool; // ignoring the remaining parameters for now
```

That is, for atomic variable `a`, first read its value `v` and compare it with `expected`; if they match, write `desired` back to `a` (thus forming an RMW operation) and return `true`; otherwise, write `v` back to `expected` (thus forming only a load operation) and return `false`. Therefore, this method can accept two memory orders:

```c++
(std::memory_order success, std::memory_order failure);
```

Where `success` represents the order of the RMW, and `failure` represents the order of the load. If only `success` is provided, `failure` will use the read order from `success` (for example, if `success` uses `memory_order_release`, then `failure` will use `relaxed`).

Here's an example similar to one we saw earlier:

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
    while (!sync.compare_exchange_strong(expected, 2,  // #2
                                        std::memory_order_acq_rel))
        expected = 1; // On failure, expected gets written back with sync's value (0), so we need to reset it to 1 for the next compare.
    assert(data == 442); // #3
}

void thread_3()
{
    while (sync.load(std::memory_order_acquire) != 2); // #4
    assert(data == 442);                              // #5
}
```

Here `#3` is correct because SB(#0, #1) && SB(#2, #3), and since #2's acquire reads #1's release, SW(#1, #2), therefore HB(#0, #3). Meanwhile `#5` is also correct because #4's acquire reads #2's release, so SW(#2, #4), and adding SB(#4, #5), we ultimately get HB(#0, #5).

### Release Sequence

Let's examine the following code:

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

If there is only one producer and one consumer, the above code is correct. When `idx > 0` is first encountered, it means it has read the new value stored by #1, so SW(#1, #2). Adding SB(#0, #1) and SB(#2, #3), we get HB(#0, #3), so when the consumer reads the value, the producer has already produced it. Subsequent `fetch_sub` operations, being in the same thread and having SB relationships, make subsequent reads correct as well.

However, if there is one producer and two consumers, things will change. For the first consumer thread that sees `idx > 0`, the process is the same as before and is correct. But for the second consumer, the value read by #2 does not come from #1, but from the RMW result of another consumer thread. And in our RMW, we used `memory_order_acquire`, meaning the write is relaxed, so SW(#2_1, #2_2) cannot be established, and consequently HB(#0, #3_2) cannot be derived. **In other words, according to the previous rules, once there are multiple consumers, only one of them can be guaranteed to see the value stored by the producer.**

The simplest way to solve this problem is to change #2 to `acq_rel`, so that the release write and acquire read can establish SW(#2_1, #2_2). However, the cost is a performance penalty — acquire only requires a one-way barrier, while acquire-release requires a two-way barrier.

To resolve this conflict, C++ introduced the concept of **Release sequence**. Let's directly quote from the standard:

1. A *release sequence* headed by a release operation A on an atomic object M is a maximal contiguous sub-sequence of side effects in the modification order of M, where the first operation is A, and every subsequent operation is an atomic read-modify-write operation.

2. An atomic operation A that performs a release operation on an atomic object M synchronizes with an atomic operation B that performs an acquire operation on M and takes its value from any side effect in the release sequence headed by A.

In other words, a release operation can seemingly maintain its release property through a chain of RMW operations (**regardless of the memory order of those RMWs**), until a new write operation breaks the chain. In our example above, the second consumer's RMW reads from the first consumer's RMW, forming the release sequence `#0 release -> #2_1 RMW -> #2_2 RMW`, and #2_2's acquire read reads from this release sequence, so it can still establish an SW relationship with #0, maintaining correctness.

> Of course, there doesn't have to be just one `#2_1 RMW` in between. It's possible that the first consumer performs multiple RMWs before the second consumer executes, but as long as there are no other writes in between, a release sequence is still formed.

However, Release sequence cannot replace the `acq_rel` order, because `acq_rel` introduces SW(#2_1, #2_2), while release sequence only introduces SW(#0, #2_2) — the latter is weaker than the former. Let's modify the previous example again:

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
    while (!sync.compare_exchange_strong(expected, 2,  // #2
                                        std::memory_order_relaxed))
        expected = 1;
    assert(data == 442); // #3
}

void thread_3()
{
    while (sync.load(std::memory_order_acquire) != 2); // #4
    assert(data == 442);                              // #5
}
```

Note that we changed #2 from `acq_rel` to `relaxed`. Under `acq_rel`, both #3 and #5 are correct. But after changing to `relaxed`, only `#5` is correct. This is because:

+ First, `#1 release -> #2 RMW` forms a release sequence.
+ For `#5`, since #4 is an acquire read and reads from #2's RMW result, it establishes an SW relationship with #1. Therefore, SB(#0, #1) && SW(#1, #4) && SB(#4, #5) gives HB(#0, #5), so the result is correct.
+ For `#3`, since #2 **is not an acquire read**, SW(#1, #2) cannot be derived, so there is no HB(#0, #3). And since there is also no HB(#3, #0), #3 has a data race.

> Of course, according to previous principles, changing #2 to `acq` would also work.

### Release Sequence: Before C++20

In fact, before C++20, the release sequence headed by operation A could also include subsequent write operations from the same thread as A, in addition to RMW operations. C++11 included this to accommodate the following code:

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

When #5 executes, #4 must already be satisfied, meaning #4 needs to load from #3. But #3 itself is a relaxed write and cannot establish an SW relationship with an acquire read, so HB(#1, #5) still cannot be derived. However, intuitively, since #2 is a release write and #3 occurs after #2, establishing SW(#2, #4) seems natural and intuitive.

However, this intuition breaks another intuition. A POPL 2015 paper pointed out that if we add another thread, the release sequence could be broken:

```c++
void thread_3() { x.store(2, std::memory_order_relaxed); } // #6
```

If #6 is inserted between #2 and #3 in the MO, the release sequence would be broken, and #5 would no longer be correct. We've introduced that a relaxed operation doesn't establish any SW relationship, yet it magically breaks the HB relationship of two other threads, which is very counterintuitive. This paper designed a very complex way to strengthen the memory model, while C++20 chose to keep only RMW, sidestepping this issue. This is actually a breaking change, because even the two-thread-only code becomes theoretically incorrect.

### Out-of-thin-air Problem

We've said that the memory model is essentially a set of axiomatic constraints, like inequalities — any solution satisfying the constraints is allowed. We also mentioned earlier that the relaxed model can lead to surprising results:

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

Here `r1 == 42 && r2 == 42` is allowed because it doesn't establish any SW relationship and doesn't violate the MO of the two atomic variables:

```c++
// x: 0 r1
// y: 0 42
```

Now let's modify the code slightly. Is `r1 == 42 && r2 == 42` still possible?

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

Although we've added two non-atomic operations, there is still no SW relationship between the two threads, so `r1 == 42 && r2 == 42` still satisfies all axiomatic constraints (specifically, it still satisfies the MO) and is a valid solution. However, this result contradicts logical causality. Let's assume #2 occurs; then we need to construct the following "prerequisite logical chain" (where arrows represent "requires"):

+ #2 occurs -> `r1 == 42` -> #1 loads 42 -> #4 occurs -> `r2 == 42` -> #3 loads 42 -> #2 occurs.

In other words, the prerequisite for #2 to occur is that #2 has already occurred — this is completely circular reasoning (begging the question)! Deriving a result by assuming the result is already true is logically invalid. A solution that the memory model allows but logic forbids is called the Out-of-thin-air problem.

If we allowed the Out-of-thin-air problem to exist in the theoretical model, then the following even more alarming example could also have `r1 == 42 && r2 == 42`:

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

Because we can similarly assume that `r1` loads 42, and then self-consistently deduce that `x, y, r1, r2` are all 42 — this is a valid set of solutions. Of course, this is still circular reasoning because there is no source of 42 — it's still out of thin air.

However, the Out-of-thin-air problem is still an active research topic in academia:

+ How do we formally describe this problem in the memory model?
+ Can compilers directly detect this problem?
+ Can this problem be avoided in an efficient way?

Many papers have attempted to describe or solve this problem. Before a widely accepted solution emerges, C++ addresses the above issue in a very vague way:

+ Implementations should ensure that no "out-of-thin-air" values are computed that circularly depend on their own computation.

Of course, since current processor abstractions don't violate causality (i.e., they won't conjure 42 out of thin air), this is a defensive provision.

> For example, if one designed a speculative execution processor that directly guesses `r1 = 42` and then verifies whether this holds, it could violate this provision.

### Memory Model Conflict

We said that the sequentially consistent model guarantees a total order, while acquire-release and relaxed models do not. What happens when we mix these operations? For example, consider the following code:

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

Assume initially `x == 0 && y == 0`. Is it possible to have `r1 == 1 && r2 == 3 && r3 == 0`? Let's first analyze within the seq_cst total order:

+ For `r1 == 1 && r2 == 3`, C needs to read `y == 1`, while D needs to read `y == 3`. If E comes before C, then there would be no subsequent operation to bring y back to 3, so in the total order, C must come before E.
+ For `r3 == 0`, F needs to read `x == 0`, so it must occur before A.
+ And we know SB(E, F).

Therefore, the above chain results in the total order of the four seq_cst operations A, C, E, F being C -> E -> F -> A.

Next, let's analyze the HB relationships (in particular, seq_cst can also establish the SW relationships of acq_rel):

+ For `r1 == 1`, C must read from B, so SW(B, C). Given SB(A, B) and SB(C, D), we get the HB(A, B, C, D) chain.
+ For `r2 == 3`, it's sufficient that D comes after E in the MO. For `r3 == 0`, it requires F to come before A. We can construct the following MOs to satisfy both:

  ```c++
  // x: Init -> F -> A
  // y: B -> C -> E -> D
  ```

However, the above analysis hides a contradiction:

+ In the total order, C -> E -> F -> A, meaning "C occurs before A".
+ In the HB order, HB(A, B, C, D) seems to suggest "A occurs before C".

Before C++20, this contradiction was not allowed — that is, HB order was required to be a subset of the total order, so `r1 == 1 && r2 == 3 && r3 == 0` was an invalid set of solutions. However, some Power and ARM CPUs allowed this situation. To maximize optimization (rather than forcing compilers to use stronger instructions), C++ chose to introduce the strongly-happens-before (SHB) relationship. We say A strongly-happens-before B if:

+ A is sequenced-before B (same thread case);
+ A synchronizes with B, **and both A and B are sequentially consistent atomic operations** (multithreaded case 1: SW establishes SHB only when both are seq_cst);
+ A is sequenced-before X, X happens-before Y, and Y is sequenced-before B (multithreaded case 2: SHB is established through SB-HB-SB);
+ A strongly-happens-before X, and X strongly-happens-before B (transitivity).

**Only the SHB order is required to be a subset of the total order.** In our previous example, although SW(B, C) is established, B is not a seq_cst operation, so SHB(B, C) does not hold. We can only establish:

+ SHB(A, B), SHB(C, D), since both are SB;
+ SHB(A, D), because SB(A, B) && HB(B, C) && SB(C, D). However, since D itself is not a seq_cst operation, it does not appear in the total order.

In summary, we cannot establish SHB(A, C), so SHB and the total order no longer conflict, allowing `r1 == 1 && r2 == 3 && r3 == 0` to occur.

### Happens-before Revision: from C++11 to C++26

In fact, the terminology explanations we've given above are the result of C++26 revisions, because C++26 deprecated the consume operation. The entire evolution of terminology can be summarized in the following diagram:

{% include figure.liquid loading="eager" path="https://pica.zhimg.com/v2-6cb6c1c9e5fdb004efe8ede6f52281c8_1440w.jpg" class="img-fluid rounded z-depth-1" %}
<div class="caption"> Source: My own course slides</div>

So, in practice, C++11's strongly-happens-before is not the same as C++20 & 26's strongly-happens-before. However, since the consume operation is always strengthened to an acquire operation, this doesn't add difficulty to actual reasoning. We can safely use C++26 terminology to reason about whether C++11 atomic operations are logically correct.

### Fence

Sometimes we may not want to use explicit atomic variables for synchronization. Fences were introduced to solve this problem, providing a global barrier:

```c++
std::atomic_thread_fence(memory_order);
```

It globally applies the specified memory order to some extent. Specifically:

+ For a release fence, it's as if **all subsequent atomic writes** have the release memory order; but if an SW relationship is established, it's established with the fence statement itself.
+ For an acquire fence, it's as if **all previous atomic reads** have the acquire memory order; but if an SW relationship is established, it's established with the fence statement itself.

The fences corresponding to various orders are as follows, quite intuitive (directly quoted):

+ When `order == std::memory_order_relaxed`, there are no effects.
+ When `order == std::memory_order_acquire` or `order == std::memory_order_consume`, is an acquire fence.
+ When `order == std::memory_order_release`, is a release fence.
+ When `order == std::memory_order_acq_rel`, is both a release fence and an acquire fence.
+ When `order == std::memory_order_seq_cst`, is a sequentially-consistent ordering acquire fence and release fence.

For example, we have a set of data to prepare. After preparation, write an atomic bool to signal readiness. Another side checks this flag to decide whether to read:

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

When #3 is `true`, it means it has read the value from #2. Although it's a relaxed load, since #4 is an acquire fence, we assume #3 is an acquire load, and the two can establish an SW relationship. But at the same time, as we said, the SW relationship derived from this assumption actually occurs on the fence, so what's actually established is SW(#2, #4) (rather than SW(#2, #3)).

But SW(#2, #4) is enough! Combined with SB(#1, #2) && SB(#4, #5), we can derive HB(#1, #5), so #5 is a safe read.

> Of course, the overhead of this global effect is generally higher than that of ordinary atomic variable operations.

## References

Some references use given names, some use surnames, some use full names — not very consistent.

1. [Thriving in a Crowded and Changing World: C++ 2006–2020 | HOPL4](https://www.stroustrup.com/hopl20main-p5-p-bfc9cd4--final.pdf), Bjarne Stroustrup.
2. [Foundations of the C++ concurrency memory model | PLDI 2008](https://dl.acm.org/doi/10.1145/1375581.1375591), Boehm & Adve.
3. [Common Compiler Optimisations are Invalid in the C11 Memory Model and what we can do about it | POPL 2015](https://people.mpi-sws.org/~viktor/papers/popl2015-c11comp.pdf), Viktor et.al.
4. [A concurrency semantics for relaxed atomics that permits optimisation and avoids thin-air executions | POPL 2016](https://dl.acm.org/doi/10.1145/2837614.2837616), Jean & Peter.
5. [An Initial Study of Two Approaches to Eliminating Out-of-Thin-Air Results](https://escholarship.org/content/qt2vm546k1/qt2vm546k1.pdf?t=po904h), Peizhao Ou.
6. [Repairing sequential consistency in C/C++11 | PLDI 2017](https://dl.acm.org/doi/10.1145/3062341.3062352), Lahav et.al.
7. [P0668R5: Revising the C++ memory model](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0668r5.html)
8. [P0982R1: Weaken release sequences](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0982r1.html)
9. C++ standard draft: [atomics.order](https://eel.is/c++draft/atomics.order), [intro.multithread](https://eel.is/c++draft/intro.multithread).
10. Cppreference: [std::memory_order](https://cppreference.com/w/cpp/atomic/memory_order.html), [Multi-threaded executions and data races](https://cppreference.com/w/cpp/language/multithread.html).
11. C++ Concurrency in Action, 2nd. ed., Anthony Williams. Chapter 5.

## Afterword

Since first learning about Memory Order-related issues several years ago, I have read a great deal of material (whether Herb's famous "atomic weapon" talk or many high-voted articles on Zhihu). Although each piece of material resolved some of my doubts, there were always aspects I couldn't fully grasp. Recently, my C++ course was about to cover this topic, and I felt it was time to thoroughly understand everything. So I started from the spirit of the C++ standard, organized all the knowledge points from scratch, and finally developed a self-consistent theory that can systematically explain related issues. This is another major step forward in my pursuit of mastering C++, and writing this article gave me a truly exhilarating feeling.

Forge ahead on this journey!
