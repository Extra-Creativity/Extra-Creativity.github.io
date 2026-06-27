---
layout: post
title: 【C++26 Reflection】在C++中实现C# <code>operator?.</code>
date: 2026-06-11
description: May the NULL be with you.
tags: reflection
categories: C++
read_time: 20
toc:
  sidebar: out-left
  collapse: false
---

省流：通过C++26的反射，笔者实现了下面的功能：

```c++
// 原先在C++中的代码（实际代码中写的名字要长的多）
if (p && p->q && p->q->r)
    p->q->r->DoSomething();
// 现在可以写为
NullCollapse{ p }->q->r->DoSomething();
// 类似于C#中的
p?.q?.r?.DoSomething();
```

同时在`p, q, r`全部为指针时，在gcc 16.1测试下`-O1`到`-O3`下产生的汇编是完全一致的，没有性能损失。源码见[Github](https://github.com/Extra-Creativity/FreeAccess/blob/main/include/FreeAccess/NullCollapse.hpp)。

> 前言：笔者近一段时间非常忙，所以很久没有更新博客，不过还是空出了一段时间来写自己感兴趣的代码，尤其是关于C++26的反射。在两周前，笔者完成了一个简单的通过字符串访问类成员（包括私有成员、重载等）的代码；上周日又加上了这篇博客的功能。但是由于时间有限，笔者暂时不能完整写下整个库原理的博客（而且这个库本身有很大改进空间）。另外，全部代码为笔者匠心手作，因为ai写C++26反射的幻觉巨大，所以全部是古法手敲的（
> 
> 如果你喜欢这篇文章，可以在[知乎](https://zhuanlan.zhihu.com/p/2047072160833861455)上点赞/喜欢/收藏！

## 问题构造

如果我们希望用户直接使用形如`p?.q`的语法，使用一般的运算符肯定是不行的，例如如果我们想使用`operator|`：

```c++
p | q | r | DoSomething(); // q/r/DoSomething是没有定义的
```

最好的情况下只能使用字符串，如`p | "q"`，但是用户用起来就没法IDE自动提词，既不直观又很麻烦。因此，最便捷的方法一定是通过`operator->`来完成。

在此之前，我们可以先复习一下`operator->`的使用方式；本质上，它会递归调用直到返回裸指针，例如`unique_ptr`：

```c++
template<typename T>
class unique_ptr
{
    T* ptr_;
public:
    T* operator->() const { return ptr_; }
};
```

当用户使用`->`时，等价于：

```c++
std::unique_ptr<P> p{ new P };
p->q; // 等价于：(p.operator->())->q;
```

如果`unique_ptr`本身返回的还不是裸指针，那么会继续调用其返回对象的`operator->`，直到最后遇到一个裸指针。

那么现在就剩下两个核心问题：

1. 如何构造一个类`NullCollapse<T>`，使得`NullCollapse<T>{ p }->q`当`p`不是`nullptr`时等价于`p->q`，而当`p`为`nullptr`时等价于`nullptr`；
2. 如何使得`NullCollapse`传递下去。

## 核心思路

### Issue 1

对于第一个问题，显然我们不能直接返回`p`，因为它可能是`nullptr`，返回后编译出来的`p->q`还是在解引用空指针；我们因此要考虑在`NullCollapse`中具有一个成员，返回它的指针，这样总是非空的。

我们先假设一个简单的case：

```c++
struct S { int* i; };
```

一种简单的思路是，我们可以利用反射构造出来这样的类：

```c++
// 使用指向成员的指针，类型为int* S::*
struct SIProxy { decltype(&S::ptr) i = &S::ptr; };
struct NullCollapse { S* s; SIProxy proxy; };
```

`NullCollapse`可以具有一个`SIProxy`，然后返回它的指针。然而，这个指针虽然可以解引用到一个`i`，但是`NullCollapse{ s }->i`和`s->i`表达的语义不一致，现在这种只能做到：

```c++
s->*(NullCollapse{}->i)
```

那么自然，我们可以想到把`s`直接放到`SIProxy`中：

```c++
struct SIProxy { S* s; decltype(&S::ptr) i; };
```

那么我们就可以完成`operator int*`：

```c++
operator int*() { return s ? &(s->*i) : nullptr; }
```

这样用户就可以正常得到等价的`s->i`了：

```c++
int* ptr = NullCollapse{ s }->i;
// 等价于
int* ptr = s ? s->i : nullptr;
```

当然唯一的限制就是`ptr`的类型不能写`auto`了，我们可以单独提供一个`Unwrap`的函数，如果用户一定要写auto可以用`NullCollapse{ s }->i.UnWrap()`。如果有很多成员的话，我们可以：

```c++
struct Proxy
{
    struct SIProxy { /* ... */} i;
    // 我们这里假设S有另一个Q* q作为成员。
    struct SQProxy { /* ... */} q;
} proxy;
```

然后`operator->`返回`&proxy`就可以了，看起来还算完美！

### Issue 2

我们希望连续地进行`->`，所以要把`NullCollapse`传递下去；那么自然，我们可以通过给`Proxy`加上`operator->`，并使它返回`NullCollapse`：

```c++
NullCollapse<Q*> operator->() { return Unwrap(); }
```

我们用一个新的指针构造了一个`NullCollapse<int*>`；仔细考察一下：

```c++
NullCollapse{ s }->q->i2;
```

拆解下来就等价于下面的步骤：

```c++
// 对于第一个->
NullCollapse<S*> s1{ s };
NullCollapse<S*>::Proxy* proxy = s1.operator->();
NullCollapse<S*>::SQProxy q0 = proxy->q;
// 对于第二个->，得到NullCollapse<Q*>后本质上回到上面的两步
NullCollapse<Q*> q1 = q0.operator->();
NullCollapse<Q*>::Proxy* proxy2 = q1.operator->();
NullCollapse<S*>::SQProxy i2 = proxy2->i2;
```

这样就做到了`NullCollapse`在下一个`->`的重新构建。

### 优化

我们可以发现，如果一个类有十个成员变量，那么就要有十个成员的Proxy，就要同一个指针存十份，在构造函数里统一赋值。虽然可能可以指望编译器somehow给它优化掉，但是这确实很丑陋，最好我们可以所有成员共享一个`S*`。同时，每个Proxy还要存一个指向成员的指针，但是这个指针对每个成员是固定的，没有必要占用栈空间存在类里。

我们先来分析第二个更好解决的问题；有两种方案：

1. 使用`static constexpr auto`作为成员；
2. 把它作为模板函数的参数。

由于目前反射的`define_aggregate`并不支持静态成员，因此自然可以选择第二种方式：

```c++
template<typename From, auto Member>
class SafeProxy { From* from; };
```

那么现在的任务就是变成怎么把所有的`SafeProxy`都共有一个指针。这看起来好像不太可能。。

对吗？但如果你曾经看过Linux的一个经典pattern `container_of`：

```c++
#define container_of(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))
```

也就是我们知道一个成员的地址，可以推断出包括它的结构体的地址。那么这和我们的问题有什么关系呢？

诶，没错，我们可以从`Proxy`的地址推断出它所在的`NullCollapse`的位置：

```c++
template<typename From, auto Member, std::size_t ByteOffset>
class SafeProxy
{
    auto GetFrom() { return *(From**)((char*)(this) - ByteOffset); }
    // 之后原来使用From* from的位置改用GetFrom()就可以了。
};
```

于是我们非常完美地把每个类都变成了空类；我们可以使用`no_unique_address`来把它们全都坍缩到一起，这样汇总起来的`Proxy`类仍然可视作空类，成功达成了我们的目标。

> 注：如果严格分析，有些人会认为形如`container_of`的代码在C++中是undefined behavior，因为理论上来说从C++17开始两个成员指针之间是不可达的。但是这个约束太严格了，所以有提案提出应当让这段代码不是UB（见[Make idiomatic usage of `offsetof` well-defined](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2025/p3407r1.html#problem-data-members-are-not-reachable-from-other-data-members-except-the-first)）。
{: .block-tip }

## 原型实现

总结来说，我们整个流程分为几步；我们先假设所有成员都是指针，后面的例子都以下面的结构体为例：

```c++
struct S { int* i; Q* q; };
```

由于全部是指针，我们直接用`NullCollapse<S>`代表`S*`：

1. 定义一个`NullCollapse`类：

   ```c++
   template<typename T, std::meta::access_context AccessContext = std::meta::access_context::current()>
   class NullCollapse
   {
       // 这个Impl就是我们前面的Proxy类；我们先不管它的定义
       class Impl;
   
       T* ptr_;
       Impl impl_;
   
   public:
       NullCollapse(T* ptr) : ptr_{ ptr } { }
       auto operator->() { return &impl_; }
   };
   ```

2. 定义一个`SafeProxy`类（注释中为例子）：

   ```c++
   // 例如：SafeProxy<S, &S::q>
   template<typename From, auto Member, std::size_t ByteOffset, std::meta::access_context AccessContext>
   class SafeProxy
   {
       // To == Q
       using To = std::remove_reference_t<decltype(*std::invoke(Member, std::declval<From>()))>;
       // 得到Safe<S>中的S* ptr_;
       auto GetFrom() { return *(From**)((char*)(this) - ByteOffset); }
   public:
       // 得到其成员q
       auto Unwrap() { auto ptr = GetFrom(); return ptr ? ptr->*Member : nullptr; }
       // 如果要连续解引用，我们就构造新的NullCollapse<Q>
       NullCollapse<To, AccessContext> operator->() { return { Unwrap() }; }
   };
   ```

3. 在`NullCollapse<T>`中定义其`Impl`，其中`T`的每个成员包装为`SafeProxy`：

   ```c++
   template<typename T, std::meta::access_context AccessContext, std::size_t ByteOffset>
   consteval auto GenerateDataMembersSafeImpl()
   {
       std::vector<std::meta::info> infos;
       template for (constexpr auto memberInfo : define_static_array(
           nonstatic_data_members_of(^^T, AccessContext)))
       {
           // 每个成员包装为SafeProxy
           infos.push_back(data_member_spec(
               substitute(^^SafeProxy, 
                          { ^^T, std::meta::reflect_constant(&[:memberInfo:]), 
                           std::meta::reflect_constant(ByteOffset), 
                           reflect_constant(AccessContext) }), 
               // 使用和成员相同的名字，并且用no_unique_address装饰
               { .name = identifier_of(memberInfo), .no_unique_address = true })
           );
       }
       return infos;
   }
   ```

   随后我们补全`NullCollapse`对`Impl`进行定义的部分：

   ```c++
   // 我们使用和NullCollapse layout相同的类来寻找impl的offset。
   struct Anchor { void* ptr; struct Empty {} e; };
   
   template<typename T, std::meta::access_context AccessContext = std::meta::access_context::current()>
   class NullCollapse
   {
       class Impl;
       // 注意这里offset_of是std::meta中的函数，但是反射信息std::meta::info本身会进行ADL
       // 所以我们省略了函数的std::meta
       static constexpr auto Offset = offset_of(^^Anchor::e).bytes;
       consteval
       {
           define_aggregate(^^Impl, GenerateDataMembersSafeImpl<T, AccessContext, Offset>());
           // 我们假设offset为8，这里对于NullCollapse<S>就等价于定义了下面的成员：
           /* class Impl
              {
                  SafeProxy<int, &S::i, 8, AccessContext> i;
                  SafeProxy<Q, &S::q, 8, AccessContext> q;
              } impl;
           */
       }
       
       // 从这里开始的代码没有变化
       T* ptr_;
       Impl impl_;
   
   public:
       NullCollapse(T* ptr) : ptr_{ ptr } { }
       auto operator->() { return &impl_; }
   };
   ```

然后就完成了！加起来实际不到50行代码，是不是非常简单~

我们可以对这个原型在[Compiler Explorer](https://godbolt.org/z/v5rEE4MWj)上验证一下：

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

可以发现产生的汇编一模一样，大成功：

{% include figure.liquid loading="eager" path="https://pica.zhimg.com/v2-e0c7bde132826fa8dedc34074d071dfa_1440w.jpg" class="img-fluid rounded z-depth-1" %}

## 从原型的扩展

文章的核心是理解上面的原型实现，扩展到一般情况就略讲一下。我们主要要克服以下问题：

1. 我们在原型里假设了所有的成员都是指针，但实际上的类会有各种成员。因此在实际实现中可以把成员类型统一变为指针；我增加了一个`UnwrapPointerTraits`，对一般的成员取它的地址，特化指针取自己的值。如果有些类型想要类似指针的处理（例如`std::optional<T>`），可以接着加特化。

2. 原型里没有考虑成员函数；我们先假设可以得到所有的函数（这是一个复杂的问题，之后会放到另一个博客讲原理），那么只需要把返回类型也使用`NullCollapse`包装就可以了。例如：

   ```c++
   struct S { Q GetObject() { /* */}; };
   // 那么我们的函数使用NullCollapse<Q> GetObject() { } 就可以了
   ```

   这样`NullCollapse{ s }->GetObject()`得到的就是`Q*`，当`s`本身是`nullptr`时返回`nullptr`就可以了。但是，对生命周期敏感的读者一眼就能发现：`Q`是存在哪里呢？如果把返回值存在局部变量里，它的指针明显会悬垂指针。所以我们`NullCollapse<Q>`是要把`Q` in place地存在自己里面的，而不像`NullCollapse<Q*>`一样。

   但但是，这其实仍然容易引起生命周期的问题：

   ```c++
   if (int* result = NullCollapse{ s }->GetObject()->i2)
       std::println("{}", *result);
   ```

   在对`result`的赋值结束时，语句结束，于是`NullCollapse<Q>`仍然会析构，所以`result`仍然是悬垂指针。不过我们可以利用C++23引入的特性来保持所有中间变量的有效性：range-based for的initializer中临时变量生命周期会统一延长到循环结束：

   ```c++
   // 这里返回的NullCollapse<Q>会延长生命周期
   for (int* result : std::views::single(NullCollapse{ s }->GetObject()->i2))
   {
       if (result)
           std::println("{}", *result);
   }
   ```

   但但但是，我实现完之后，发现只有当函数本身返回指针时和正常代码产生的汇编是一样的，否则会产生更差的汇编。看汇编是真的执行了地址的offset后load上来了`Q*`，具体能不能克服还有待考察。

   > 此外，函数返回引用的情况我也还没写。

3. 基类的处理：目前还没有遍历基类的成员。

4. 左右值的情况：目前还没有处理指针本身指向的是左值或者右值，应该在包装中使得解引用成员值类别不同的情况。

## 后记
本来这个类打算叫`Safe`的，但是感觉有生命周期上的误导性，所以改成了`NullCollapse`。

笔者马上要开始秋招找工作了，目前在腾讯游戏引擎岗实习，但工作不限于只找游戏岗；详细信息可以看个人主页，待遇优厚者可以联系我，base北京优先，待遇相近的情况下WLB者优先:-)。