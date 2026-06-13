---
layout: post
title: "[C++26 Reflection] Implement C# <code>operator?.</code> in C++"
date: 2026-06-11
description: May the NULL be with you.
tags: reflection
categories: C++
read_time: 20
llm_translation: true
toc:
  sidebar: out-left
  collapse: false
---

TL;DR: Using C++26 reflection, I implemented the following functionality:

```c++
// Originally in C++ (the actual names are usually much longer)
if (p && p->q && p->q->r)
    p->q->r->DoSomething();
// Now it can be written as
NullCollapse{ p }->q->r->DoSomething();
// Similar to C#'s
p?.q?.r?.DoSomething();
```

And when `p, q, r` are all pointers, the generated assembly is identical from `-O1` to `-O3` on GCC 16.1, meaning that there is zero performance overhead. See source code on [GitHub](https://github.com/Extra-Creativity/FreeAccess/blob/main/include/FreeAccess/NullCollapse.hpp).

> **Preface:** I've been very busy recently, so it has been a while since my last blog post. Still, I carved out some time to write code I'm genuinely interested in, especially around C++26 reflection. Two weeks ago, I finished a simple implementation that accesses class members (including private members, overloaded member functions, etc.) via strings; last Sunday I added the functionality described in this post. Due to time constraints, I can't write a full blog post explaining the entire library in detail (and this library has plenty of room for improvement). Also, all the code was "hand-crafted" because AI hallucinates badly on C++26 reflection.
>
> If you enjoyed this post, feel free to [like/favorite/bookmark it on Zhihu](https://zhuanlan.zhihu.com/p/2047072160833861455)!

## Problem Setup

If we want to directly use syntax like `p?.q`, regular operators won't cut it. For example, if we tried to use `operator|`:

```c++
p | q | r | DoSomething(); // q/r/DoSomething are undefined
```

The best alternative would be using strings, like `p | "q"`, but that breaks IDE autocompletion — neither intuitive nor convenient. Therefore, the most ergonomic approach is via `operator->`.

First, let's review how `operator->` works. Essentially, it calls recursively until it returns a raw pointer. For example, for `unique_ptr`:

```c++
template<typename T>
class unique_ptr
{
    T* ptr_;
public:
    T* operator->() const { return ptr_; }
};
```

When we use `->`, it's equivalent to:

```c++
std::unique_ptr<P> p{ new P };
p->q; // equivalent to: (p.operator->())->q;
```

If `unique_ptr` itself doesn't return a raw pointer yet, it continues calling `operator->` on its return value until it finally encounters a raw pointer.

That leaves two core issues:

1. How to construct a class `NullCollapse<T>` such that `NullCollapse<T>{ p }->q` is equivalent to `p->q` when `p` is not `nullptr`, and equivalent to `nullptr` when `p` is `nullptr`;
2. How to make `NullCollapse` propagate through the chain.

## Core Ideas

### Issue 1

For the first problem, clearly we can't just return `p`, since it might be `nullptr` — the compiled `p->q` would still dereference a null pointer. We therefore need a member inside `NullCollapse` that we return a pointer *to*, so it's always non-null.

Let's first assume a simple case:

```c++
struct S { int* i; };
```

One straightforward approach is to construct a class like this using reflection:

```c++
// Using pointer-to-member, type is int* S::*
struct SIProxy { decltype(&S::ptr) i = &S::ptr; };
struct NullCollapse { S* s; SIProxy proxy; };
```

`NullCollapse` can have an `SIProxy`, and return its pointer. However, while this pointer dereferences to an `i`, the semantics don't match `s->i`. It only gives us:

```c++
s->*(NullCollapse{}->i)
```

Naturally, we can put `s` directly into `SIProxy`:

```c++
struct SIProxy { S* s; decltype(&S::ptr) i; };
```

Then we can implement `operator int*`:

```c++
operator int*() { return s ? &(s->*i) : nullptr; }
```

Now we can get the equivalent of `s->i`:

```c++
int* ptr = NullCollapse{ s }->i;
// equivalent to
int* ptr = s ? s->i : nullptr;
```

The only limitation is that we can't use `auto` for `ptr`'s type. Alternatively, we could provide a separate `Unwrap` function, and those who insist on `auto` can write `NullCollapse{ s }->i.UnWrap()`. And when there are many members, we can use:

```c++
struct Proxy
{
    struct SIProxy { /* ... */} i;
    // Suppose S also has Q* q as a member
    struct SQProxy { /* ... */} q;
} proxy;
```

Then `operator->` can return `&proxy`.

### Issue 2

We want to chain `->` continuously, so we need to propagate `NullCollapse`. Naturally, we can add `operator->` to `Proxy` and have it return `NullCollapse`:

```c++
NullCollapse<Q*> operator->() { return Unwrap(); }
```

We construct a new `NullCollapse<int*>` with the freshly unwrapped pointer. Let's trace through:

```c++
NullCollapse{ s }->q->i2;
```

After decomposition, it's equivalent to:

```c++
// First ->
NullCollapse<S*> s1{ s };
NullCollapse<S*>::Proxy* proxy = s1.operator->();
NullCollapse<S*>::SQProxy q0 = proxy->q;
// Second -> yields NullCollapse<Q*>, then back to the above two steps
NullCollapse<Q*> q1 = q0.operator->();
NullCollapse<Q*>::Proxy* proxy2 = q1.operator->();
NullCollapse<S*>::SQProxy i2 = proxy2->i2;
```

This achieves the reconstruction of `NullCollapse` on each subsequent `->`.

### Optimization

If a class has ten data members, we'd need ten member proxies, with each storing the same pointer ten times. We also need to assign them uniformly in the constructor. While the compiler might optimize it away somehow, it's rather ugly. Ideally, all members should share a single `S*`. Additionally, each Proxy stores a pointer-to-member, but that pointer is fixed per member. There is no need to waste stack space storing it in the class.

Let's analyze the second problem because it's easier to solve. There are two options:

1. Use `static constexpr auto` as a member;
2. Pass it as a template parameter.

Since the current reflection `define_aggregate` doesn't support static members, the second option is the natural choice:

```c++
template<typename From, auto Member>
class SafeProxy { From* from; };
```

Now the challenge becomes how to make all `SafeProxy`s share a single pointer. That seems impossible...

...right? But if you've ever seen the classic Linux pattern `container_of`:

```c++
#define container_of(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))
```

Given the address of a member, we can infer the address of the enclosing struct. How does this relate to our problem?

Exactly, we can deduce the address of `NullCollapse` from the address of `Proxy`:

```c++
template<typename From, auto Member, std::size_t ByteOffset>
class SafeProxy
{
    auto GetFrom() { return *(From**)((char*)(this) - ByteOffset); }
    // Replace all uses of From* from with GetFrom()
};
```

We've now turned every class into an empty class. Using `no_unique_address`, we can collapse them all together, making the aggregate `Proxy` class effectively empty too. We successfully achieve the goal!

> **Note:** Strictly speaking, some would argue that code like `container_of` is undefined behavior in C++. Since C++17, pointer to a member is not reachable from pointers to other members. But this constraint seems overly strict, and there's a proposal to make this well-defined (see [Make idiomatic usage of `offsetof` well-defined](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2025/p3407r1.html#problem-data-members-are-not-reachable-from-other-data-members-except-the-first)).
{: .block-tip }

## Prototype Implementation

To summarize, the whole flow breaks down into a few steps. Let's assume all members are pointers, and use the following struct as our running example:

```c++
struct S { int* i; Q* q; };
```

Since everything is a pointer, we'll use `NullCollapse<S>` to represent `S*`:

1. Define a `NullCollapse` class:

   ```c++
   template<typename T, std::meta::access_context AccessContext = std::meta::access_context::current()>
   class NullCollapse
   {
       // Impl is our Proxy class; we'll define it later
       class Impl;
   
       T* ptr_;
       Impl impl_;
   
   public:
       NullCollapse(T* ptr) : ptr_{ ptr } { }
       auto operator->() { return &impl_; }
   };
   ```

2. Define a `SafeProxy` class (annotations show the concrete instantiation for our example `S`):

   ```c++
   // e.g., SafeProxy<S, &S::q>
   template<typename From, auto Member, std::size_t ByteOffset, std::meta::access_context AccessContext>
   class SafeProxy
   {
       // To == Q
       using To = std::remove_reference_t<decltype(*std::invoke(Member, std::declval<From>()))>;
       // Retrieve Safe<S>'s S* ptr_
       auto GetFrom() { return *(From**)((char*)(this) - ByteOffset); }
   public:
       // Get its member q
       auto Unwrap() { auto ptr = GetFrom(); return ptr ? ptr->*Member : nullptr; }
       // For chaining, construct a new NullCollapse<Q>
       NullCollapse<To, AccessContext> operator->() { return { Unwrap() }; }
   };
   ```

3. Define `Impl` inside `NullCollapse<T>`, wrapping each member of `T` in a `SafeProxy`:

   ```c++
   template<typename T, std::meta::access_context AccessContext, std::size_t ByteOffset>
   consteval auto GenerateDataMembersSafeImpl()
   {
       std::vector<std::meta::info> infos;
       template for (constexpr auto memberInfo : define_static_array(
           nonstatic_data_members_of(^^T, AccessContext)))
       {
           // Wrap each member in SafeProxy
           infos.push_back(data_member_spec(
               substitute(^^SafeProxy, 
                          { ^^T, std::meta::reflect_constant(&[:memberInfo:]), 
                           std::meta::reflect_constant(ByteOffset), 
                           reflect_constant(AccessContext) }), 
               // Use the same name as the member, with no_unique_address
               { .name = identifier_of(memberInfo), .no_unique_address = true })
           );
       }
       return infos;
   }
   ```

   Then we complete the `Impl` definition inside `NullCollapse`:

   ```c++
   // Helper struct matching NullCollapse's layout to find the impl offset
   struct Anchor { void* ptr; struct Empty {} e; };
   
   template<typename T, std::meta::access_context AccessContext = std::meta::access_context::current()>
   class NullCollapse
   {
       class Impl;
       // Note: offset_of is in std::meta, but std::meta::info itself enables ADL
       // so we omit the std::meta qualifier
       static constexpr auto Offset = offset_of(^^Anchor::e).bytes;
       consteval
       {
           define_aggregate(^^Impl, GenerateDataMembersSafeImpl<T, AccessContext, Offset>());
           // Assuming offset is 8, for NullCollapse<S> this is equivalent to:
           /* class Impl
              {
                  SafeProxy<int, &S::i, 8, AccessContext> i;
                  SafeProxy<Q, &S::q, 8, AccessContext> q;
              } impl;
           */
       }
       
       // Unchanged from here onward
       T* ptr_;
       Impl impl_;
   
   public:
       NullCollapse(T* ptr) : ptr_{ ptr } { }
       auto operator->() { return &impl_; }
   };
   ```

And that's it! There are only less than 50 lines of code total, pretty simple, right?

We can verify this prototype on [Compiler Explorer](https://godbolt.org/z/v5rEE4MWj):

```c++
struct A { int* ptr = new int{ 1 }; };
struct B { A* a = nullptr; };

void Func1(B* b)
{
    if (auto result = NullCollapse{ b }->a->ptr.Unwrap())
        std::println("YESSSSSSSSS! {}", *result);
}

void Func2(B* b)
{
    if (b)
    {
        auto p = b->a;
        if (p)
        {
            auto p2 = p->ptr;
            if (p2)
            {
                std::println("YESSSSSSSSS! {}", *p2);
            }
        }
    }
}
```

The generated assembly is identical. What a resounding success!

{% include figure.liquid loading="eager" path="https://pica.zhimg.com/v2-e0c7bde132826fa8dedc34074d071dfa_1440w.jpg" class="img-fluid rounded z-depth-1" %}

## Extensions Beyond the Prototype

The core of this post is understanding the prototype above, so I'll only briefly cover generalizations:

1. **Non-pointer members**: The prototype assumes all members are pointers, but real classes have all sorts of member types. In the actual implementation, I unified member types into pointers by adding an `UnwrapPointerTraits`. For regular members, it will take its address; and pointers are specialized to use the value directly. If you want types like `std::optional<T>` to behave like pointers, you can add further specializations.

2. **Member functions**: The prototype doesn't handle member functions. Assuming we can enumerate all functions (a complex topic that deserves another blog post), we just need to wrap the return type in `NullCollapse`. For example:

   ```c++
   struct S { Q GetObject() { /* */ }; };
   // Then our function becomes NullCollapse<Q> GetObject() { }
   ```

   So `NullCollapse{ s }->GetObject()` yields `Q*`, returning `nullptr` when `s` itself is `nullptr`. However, lifetime-sensitive readers will immediately spot the issue: where is `Q` stored? If stored in a local variable, its pointer would obviously dangle. So `NullCollapse<Q>` must store `Q` in-place within itself, unlike `NullCollapse<Q*>`.

   But this still easily causes lifetime issues:

   ```c++
   if (int* result = NullCollapse{ s }->GetObject()->i2)
       std::println("{}", *result);
   ```

   When the assignment to `result` completes and the statement ends, `NullCollapse<Q>` is destroyed and `result` is still dangling. We can leverage a C++23 feature to keep all intermediate variables valid: the lifetime of temporaries in range-based for initializers is extended until the loop ends:

   ```c++
   // NullCollapse<Q> returned here has its lifetime extended
   for (int* result : std::views::single(NullCollapse{ s }->GetObject()->i2))
   {
       if (result)
           std::println("{}", *result);
   }
   ```

   However, after implementing this, I found that only when the function itself returns a pointer does the generated assembly match normal code. Otherwise for normal object, worse assembly is produced. Looking at the assembly, it actually performs the address offset calculation and loads `Q*` from it. Whether this can be overcome is yet to be investigated.

   > Also, I haven't handled functions returning references yet.

3. **Base classes**: Currently, base class members are not traversed.

4. **Value categories**: Pointers pointing to lvalues vs. rvalues aren't handled yet. The wrapper should account for different value categories when dereferencing members.

## Afterword

I originally planned to name this class `Safe`, but felt it suggested misleading lifetime guarantees, so I renamed it to `NullCollapse`.

I'm about to start the fall recruitment season and currently interning as a game engine engineer at Tencent. However, I'm not limiting my future job to game engine roles. Check my homepage for details and feel free to reach out if the offer is competitive :-).
