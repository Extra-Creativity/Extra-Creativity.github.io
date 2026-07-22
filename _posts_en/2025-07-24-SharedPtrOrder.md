---
layout: post
title: "How to Choose the Memory Order for shared_ptr's Atomic Counter?"
date: 2025-07-24
description: A typical application (and practice) of C++ memory order.
tags: memory-order multithreading
categories: C++
read_time: 40
llm_translation: true
toc:
  sidebar: out-left
  collapse: false
---

This article assumes the reader is already familiar with all related terminology of memory order. My previous blog post also provides a complete discussion on this topic.

## Problem Description

In essence, the entire lifecycle of shared_ptr can be abstracted into the following statements:

```cpp
sharedBlock->counter.fetch_add(1, mo1); // #1: Atomic counter +1, indicating this thread is using it
sharedBlock->use(); // #2: Use the data block of this shared_ptr, must ensure it won't be freed during use
if (sharedBlock->counter.fetch_sub(1, mo2) == 1) // #3: Atomic counter -1, indicating this thread is no longer using it
    delete sharedBlock; // #4: If this is the last owner, free the data block
```

The main question is what memory order `mo1` and `mo2` should use to ensure that `#2` is safe for all sharers. For `mo1`, since the interface exposed by shared_ptr is the copy constructor, which requires that the passed shared_ptr remains valid until the call completes. That is, it happens before the destruction of the passed shared_ptr, and there will be no situation where the new `#1` hasn't occurred yet while the passed `#3` has already happened and caused a use-after-free. Therefore, the constructor does not need additional synchronization (or if synchronization is truly needed, it should be the user's responsibility), and only relaxed order is needed:

```cpp
counter.fetch_add(1, std::memory_order_relaxed);
```

The situation for `mo2` is more complex, and we will discuss it further below.

## Is Relaxed Enough?

First, consider `mo2` as relaxed order. Essentially, what we want is: for k sharers' `#2_1 ... #2_k`, they all must happen before `#4_last`, i.e., the delete statement corresponding to the last sharer. In particular, we emphasize: `#4_last` only means that in the modification order (MO) of `counter`, `#3_last` is the last to occur; however, `#3_i` does not have an HB (happens-before) relationship with `#3_last` (since they are both relaxed order), so we cannot combine SB(#2_i, #3_i) to derive HB(#2_i, #4_last).

> In other words, HB order is a subset of MO, and not all of MO is necessarily HB order.

For non-`last` sharers `i`, since relaxed order does not establish SW (synchronizes-with), we can only know from the constructor that HB(#1_i, #3_j), where j represents the shared_ptr being copied during construction. Combining with SB(#3_j, #4_j), we can at most deduce HB(#1_i, #4_j), but cannot derive the HB relationship between #2_i and #4_last. **Without HB, this creates data races between the two, which in practice may cause `#4_last` to happen first while `#2_i` is still in use, leading to a use-after-free problem.**

In actual compiler reordering, we can understand it as possibly performing the following optimization:

```cpp
bool isLast = counter.fetch_sub(1, mo2) == 1; // #5
block.use(); // #6
if (isLast)
    delete sharedBlock; // #7
```

Assuming there exists a global order, two threads might execute `#5_1, #5_2, #6_2, #7_2, #6_1, #7_1`, and `#5_2` would have already obtained `isLast == true`, so `#7_2` would have already performed the delete, thus causing a use-after-free.

> Of course, the author emphasizes that this assumption is incorrect, because multi-threaded execution does not guarantee a total order. This is only for ease of understanding.

## Acquire-Release

Since relaxed order is not suitable, a natural idea for an RMW is to strengthen it to acquire-release:

```cpp
if (counter.fetch_sub(1, std::memory_order_acq_rel) == 1) // #3
    delete sharedBlock; // #4
```

Unlike relaxed order, release will establish an SW relationship with the acquire that reads its value. Therefore, assuming `#3_i, ... #3_last` are consecutive in MO, then `#3_{i+1}` must read the value from `#3_i`'s result, thus establishing SW(#3_i, #3_{i+1}, ... #3_last). And we know that for any sharer `k` from `i` to `last`, SB(#2_k, #3_k), together with SB(#3_last, #4_last), we can certainly derive HB(#2_k, #4_last) — that is, all uses occur before the delete, guaranteeing safety.

In general, `#3_i, ... #3_last` may not be consecutive in MO, because new sharers may be added in the process, inserting several `#1` in between. However, the C++ standard defines the concept of a release sequence, meaning that a series of RMW operations does not break the release property of the original operation. Therefore, `#3_i, #1_i1, #1_i2, ..., #1_iN, #3_{i+1}` can still establish SW(#3_i, #3_{i+1}), so it remains correct.

## Conditional Acquire

In the above analysis, we can observe an overly strong constraint: SW(#3_i, #3_{i+1}, ... #3_last) is a chain of SW relationships. However, what we fundamentally need is only to establish SW(#3_i, #4_last), etc. — that is, each `#3` is guaranteed to happen before the last delete, while the ordering among other sharers is not important. Therefore, we can weaken the other sharers to release, and only the last sharer uses acquire. This way:

- For the second-to-last sharer, since its released value is read by the last sharer's acquire, the two establish an SW relationship;
- For the third-to-last sharer, although its released value is not directly read by the last sharer's acquire, because all operations in the sequence are RMW operations, they form a release sequence in MO starting from it. Reading the value from the second-to-last sharer can also establish an SW relationship with it;
- The same applies to sharers further back; inserting additional `#1` operations also does not break the release sequence.

This allows us to establish SW(#3_i, #3_last), perfectly matching our synchronization requirement without needing a continuous chain of SW. However, shared_ptr determines who the last sharer is through the RMW itself, and we would need to know this result to decide the RMW's order — creating a circular dependency. Therefore, we can only apply this additional constraint after the RMW has completed and we enter the `if` block:

```cpp
if (counter.fetch_sub(1, std::memory_order_release) == 1) // #3
{
    counter.load(std::memory_order_acquire); // #new
    delete sharedBlock; // #4
}
```

In this way, the acquire read at `#new` reads the value written by the last sharer's release write. Meanwhile, based on the same principle as before, the release writes of other sharers up to the last sharer's release write form a release sequence, so `#new` still establishes SW relationships with them. Hence, we ultimately establish SW(#3_i, #new), ... relationships, and since SB(#2_i, #3_i) && SB(#new, #4), we always have HB(#2_i, #4), successfully avoiding data races and the use-after-free problem.

Of course, we can also use an acquire fence to establish this relationship:

```cpp
if (counter.fetch_sub(1, std::memory_order_release) == 1) // #3
{
    std::atomic_thread_fence(std::memory_order_acquire); // #new
    delete sharedBlock; // #4
}
```

The analysis is largely similar:

- For the last sharer, the fence will be executed, so we can first imagine adding acquire order to the last sharer's `#3`. Following the previous analysis, this would produce SW(#3_i, #3_last);
- However, the fence itself establishes SW starting from itself, so the actual SW is SW(#3_i, #new). Combined with SB(#2_i, #3_i) && SB(#new, #4), we obtain HB(#2_i, #4).

That said, a fence establishes a global effect, so its overhead is generally larger than that of a load.

## ISA Comparison

Theoretically, based on the strength of constraints we impose, we can rank the performance of the three approaches:

Conditional acquire load > Conditional acquire fence > acquire release

However, in actual instruction generation, due to overly conservative compiler optimizations and instruction sets that do not strictly correspond to the theoretical model, this performance ordering may not be achievable. Let's take x86-64 and ARM64 as examples:

### x86-64

For x86, since all RMW operations inherently guarantee acquire-release ordering, these optimizations should be largely useless. Looking at the generated instructions, we can even observe that the actual performance ordering may be conditional acquire load < conditional acquire fence = acquire release, due to compiler optimization shortcomings. For acquire-release, the generated instructions are:

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

For acquire load, the compiler does not optimize away the actually useless `#new` load, resulting in an extra `mov`:

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

When we switch to acquire fence, this load disappears again, because the compiler recognizes that the fence has no effect here — x86's RMW already provides this ordering, so the fence becomes a no-op.

### ARM64

For ARM, we can see the instructions are faithfully translated. For acquire-release:

```nasm
  add x1, x1, :lo12:.LANCHOR0
  bl __aarch64_ldadd4_acq_rel ; This is an acq_rel
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

For acquire load:

```nasm
  add x1, x1, :lo12:.LANCHOR0
  bl __aarch64_ldadd4_rel ; This is a release
  cmp w0, 1
  beq .L10
.L1:
  ldp x29, x30, [sp], 16
  ret
.L10:
  adrp x0, .LANCHOR0
  add x1, x0, :lo12:.LANCHOR0
  ldar w0, [x1]           ; This is an acquire load
  ldr x0, [x1, 8]
  cbz x0, .L1
  ldp x29, x30, [sp], 16
  mov x1, 4
  b operator delete(void*, unsigned long)
```

For acquire fence:

```nasm
  add x1, x1, :lo12:.LANCHOR0
  bl __aarch64_ldadd4_rel ; This is a release
  cmp w0, 1
  beq .L19
.L11:
  ldp x29, x30, [sp], 16
  ret
.L19:
  adrp x0, .LANCHOR0
  dmb ishld               ; This is an acquire fence, no ldar
  add x1, x0, :lo12:.LANCHOR0
  ldr x0, [x1, 8]
  cbz x0, .L11
  ldp x29, x30, [sp], 16
  mov x1, 4
  b operator delete(void*, unsigned long)
```

Of course, actual performance still depends on which instruction arrangement runs fastest at execution time.

You can view the above results on Compiler Explorer: <https://godbolt.org/z/xPT9xM8nG>.

## Usage in Actual Implementations

Common standard libraries such as MS-STL, libstdc++, and libc++ all use acquire-release RMW. [Boost](https://www.boost.org/doc/libs/1_78_0/doc/html/atomic/usage_examples.html#boost_atomic.usage_examples.example_reference_counters.implementation) has recorded the use of acquire fence in the past. The author has not found a real-world example of acquire load, but on [StackOverflow](https://stackoverflow.com/q/49112732/15582103) it was noted as early as 2018 that someone had proposed the correctness of this approach and compared the instructions. The instruction comparison in this article was inspired by and supplemented from that post.

Regarding the peculiarities of x86 instructions, you can also check [StackOverflow](https://stackoverflow.com/a/61720630/15582103). For the potential performance differences between conditional fence and acquire-release RMW, see [StackOverflow](https://stackoverflow.com/a/73028656/15582103). The author will not elaborate further here.

## Afterword

In my previous article discussing memory order theory, the section on relaxed order originally used `std::shared_ptr` as an example, stating that "shared_ptr's atomic counter only needs atomicity — increment on construction, decrement on destruction." Later, mervyn233@Bilibili pointed out the error, namely that the destructor should use `acq_rel` for the decrement. After careful thought, I agreed deeply and revised the relevant parts of the article. At the same time, it occurred to me that a conditional acquire implementation could be used, each having performance advantages over `acq_rel` on different platforms. Upon further investigation, this approach indeed has been used in practice, hence this supplementary analysis article.
