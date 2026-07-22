---
layout: post
title: 分层抽样与蒙特卡洛积分方法
date: 2024-05-22
description: Analysis of stratified sampling in Monte Carlo method, which is widely used in Graphics.
tags: probability
categories: Math Graphics
toc:
  sidebar: out-left
  collapse: 3
---

最近在恶补PBRT，看到分层抽样（2.2.1）感觉写的非常不明白，尤其是在降低方差的证明上，找了很多资料来理解，这篇文章主要是写一下原理。

## 定义

设随机变量$X$的采样域为$\Lambda$，其上分割$\Lambda_i$无重叠且覆盖$\Lambda$，称$\Lambda_i$为一个层。设随机变量$W$也定义在$\Lambda$上，则在以下两个前提的基础上可以进行分层抽样：

- $\forall \Lambda_j$, $P(W\in\Lambda_j)$可以容易地进行计算。一种简单的方式是不妨取$W$服从均匀分布，则$P(W\in \Lambda_j)$就是当前分层的"体积"占整个域的"体积"的比例。
- $$X_i=(X|W\in\Lambda_i)$$ 是容易进行采样的；换言之，每一层内部应该是容易抽样的。为了导致方差的减小，通常需要 $X$ 和 $W$ 不独立。

不妨定义示性函数设$I=i\text{ if }W\in\Lambda_i$，则$P(I=i)=P(W\in\Lambda_i)$。**分层抽样就是对$\hat X=\sum_i P_iX_i$，用采样来估计层内的随机变量$X_i$的期望，再以$\hat X$的期望作为随机变量$X$的期望的估计**。

也就是：

$$E(X)=\sum_iP(I=i)E(X|I=i)$$

**证明**：由期望定义有

$$E(X)=\int xp(x) dx,\quad E(X|I=i)=\int xp(x|I=i)dx$$

由全概率公式：

$$P(X\leq x)=\sum_i P(X\leq x|I=i)P(I=i)$$

对$x$求导即有：

$$p(x)=\sum_i p(x|I=i)P(I=i)$$

于是：

$$E(X)=\int xp(x)dx=\int x\sum_i p(x|I=i)P(I=i) dx=\sum_iP(I=i)E(X|I=i)$$

不妨写作$E(X)=\sum_i P_iE(X_i)$。由前提1，$P_i$容易计算；由前提2，每一层的期望是容易计算的，于是就可以计算出$E(X)$，因此这种估计是正确且可行的。

> 蒙特卡洛积分的分层抽样估计即是对Estimator $$F$$ ，$$E(F(X))=\sum_iP(I=i)E(F(X)|I=i)$$ 。这个式子和上面的推导原理是相同的，后面的结论中把 $$X$$ 换成 $$F$$ 也都成立，我们就直接用 $$X$$ 了。

## 条件期望随机变量

在证明方差的更优性之前，需要先引入条件期望随机变量的概念。可以注意到对固定的$i$，$E(X|I=i)$是常数；于是对于变化的$i\in\{1,\cdots,n\}$，$E(X|I=i)$就构成了新的离散型随机变量$\tilde I$。我们不妨将$\tilde I$直接写作$E(X|I)$。

**定理1**：对随机变量$X,Y$，其中$Y$为离散型随机变量，$E(E(X|Y))=E(X)$。

**证明**：$E(E(X|Y))= \sum_yP(Y = y)E(X|Y = y)$，这就是分层抽样处的式子，也就等于$E(X)$。或者说分层抽样实际上就应用了这个定理。

**定理2（全方差公式）**：对随机变量$X,Y$，其中$Y$为离散型随机变量，$D(X)=E(D(X|Y))+D(E(X|Y))$。

**证明**：首先推导一下条件方差与条件期望的关系。

$$
\begin{aligned}
D(X|Y=y)&=\int (x-E(X|Y=y))^2p(x|Y=y)dx\\
&=\int x^2p(x|Y=y)dx+E^2(X|Y=y)\int p(x|Y=y)dx\\
&\quad-2E(X|Y=y)\int xp(x|Y=y)dx\\
&=E(X^2|Y=y)+E^2(X|Y=y)-2E^2(X|Y=y)\\
&=E(X^2|Y=y)-E^2(X|Y=y)
\end{aligned}
$$

对任意取值$y$上式都成立，也即：

$$D(X|Y)=E(X^2|Y)-E^2(X|Y)$$

于是：

$$E(D(X|Y))=E(E(X^2|Y))-E(E^2(X|Y))$$
$$D(E_X(X|Y))=E(E^2(X|Y))-E^2(E(X|Y))$$

于是：

$$E(D(X|Y))+D(E(X|Y))=E(E(X^2|Y))-E^2(E(X|Y))$$

又由定理1，$E(E(X^2|Y))=E(X^2)$, $E(E(X|Y))=E(X)$，故：

$$E(D(X|Y))+D(E(X|Y))=E(X^2)-E^2(X)=D(X)$$

证毕。

## 分层抽样对蒙特卡洛积分的方差贡献

**定理**：设总抽样数为$n$，分层抽样$\sum_i n_i=n$；若让$n_i=nP_i$（即抽样数量与$W\in \Lambda_i$的概率成正比），则蒙特卡洛积分的方差不会增加。

**证明**：先把这个命题用不等式表示出来。

- 对于非分层抽样，设$X_i$为$X$的简单随机抽样，就得到$D(\hat X)=D(\sum X_i/n)$，由于样本$X_i$独立同分布，因此也就等于$\frac{1}{n^2}\sum D(X_i)=\frac{1}{n}D(X)$。
- 对于分层抽样，设$X_{i,j}$为层内随机变量$X_i$的简单随机抽样，于是$D(\hat X)=D(\sum_i P_i\frac{1}{n_i}\sum_j^{n_i} X_{i,j})$；注意到$X_{i,j}$互相独立，因此$D(\hat X)=\sum_i P_i^2 \frac{1}{n_i}D(X_i)=\frac{1}{n}\sum_i P_i D(X_i)$。

因此命题即是证明$D(X)\geq \sum_i P_iD(X_i)$。

由全方差公式，$D(X)=E(D(X|I))+D(E(X|I))\geq E(D(X|I))$，而$E(D(X|I))$就是$\sum_i P_iD(X_i)$，于是证毕。

**方差不变条件**：当且仅当$D(E(X|I))=0$，由离散型随机变量方差的定义即：

$$\frac{1}{n}(E(X|I=i)-E(E(X|I)))^2=\frac{1}{n}(E(X_i)-E(X))^2=0$$

**即每一层的均值都相等时不变，否则方差一定会降低**。这也就是为什么当分布不明晰时分层越多越好，因为这更可能会使层的均值大幅变动，而分层少则更可能趋向于均值。

## 补充

上述抽样数量虽然保证了方差不增，但并不是最优解。考虑约束优化问题：

$$\min_{n_j} \sum_{j=1}^m \frac{p_j^2\sigma_j^2}{n_j},\ where\ \sum_{j=1}^m{n_j}=n$$

显然可以通过拉格朗日乘子法来解决，定义：

$$F(n_1,\cdots, n_m, \lambda)=\sum_{j=1}^m \frac{p_j^2\sigma_j^2}{n_j}+\lambda(\sum_{j=1}^m{n_j}-n)$$

即解方程$\partial F/\partial n_j=0$且$\partial F/\partial\lambda=0$，即：

$$
\begin{cases}
p_j^2\sigma_j^2=\lambda n_j^2 & for\ j\in\{1,\cdots,m\}\\
\sum_j n_j=n
\end{cases}
$$

容易解得最优抽样数量选择方法为：

$$n_j=\left(\frac{p_j\cdot \sigma_j}{\sum_{j=1}^m p_j\sigma_j}\right)n$$

得到的最小方差为：

$$\frac{\left(\sum_{j=1}^m p_j\sigma_j\right)^2}{n}$$