---
layout: post
title: Stratified Sampling and Monte Carlo Integration
date: 2024-05-22
description: Analysis of stratified sampling in Monte Carlo method, which is widely used in Graphics.
tags: probability
categories: Math Graphics
llm_translation: true
toc:
  sidebar: out-left
  collapse: 3
---

Recently I've been cramming PBRT, and I found the explanation of stratified sampling (Section 2.2.1) quite unclear, especially the proof of variance reduction. I looked up many resources to understand it. This article mainly explains the principles.

## Definition

Let the sampling domain of a random variable $$X$$ be $$\Lambda$$, partitioned into non-overlapping subsets $$\Lambda_i$$ that cover $$\Lambda$$; each $$\Lambda_i$$ is called a stratum. Let the random variable $$W$$ also be defined on $$\Lambda$$. Stratified sampling can be performed based on the following two prerequisites:

- For any $$\Lambda_j$$, $$P(W\in\Lambda_j)$$ can be easily computed. A simple approach is to let $$W$$ follow a uniform distribution, so that $$P(W\in \Lambda_j)$$ is the ratio of the "volume" of the current stratum to the "volume" of the entire domain.
- $$X_i=(X|W\in\Lambda_i)$$ is easy to sample; in other words, each stratum should be easy to sample from. To achieve variance reduction, $$X$$ and $$W$$ typically need to be dependent.

Define the indicator variable $$I=i\text{ if }W\in\Lambda_i$$, so that $$P(I=i)=P(W\in\Lambda_i)$$. **Stratified sampling uses $$\hat X=\sum_i P_iX_i$$, estimating the expectation of the random variable $$X_i$$ within each stratum via sampling, and then using the expectation of $$\hat X$$ as the estimate of the expectation of the random variable $$X$$.**

That is:

$$E(X)=\sum_iP(I=i)E(X|I=i)$$

**Proof**: From the definition of expectation we have:

$$E(X)=\int xp(x) dx,\quad E(X|I=i)=\int xp(x|I=i)dx$$

By the law of total probability:

$$P(X\leq x)=\sum_i P(X\leq x|I=i)P(I=i)$$

Differentiating with respect to $$x$$ gives:

$$p(x)=\sum_i p(x|I=i)P(I=i)$$

Thus:

$$E(X)=\int xp(x)dx=\int x\sum_i p(x|I=i)P(I=i) dx=\sum_iP(I=i)E(X|I=i)$$

We can write $$E(X)=\sum_i P_iE(X_i)$$. By prerequisite 1, $$P_i$$ is easy to compute; by prerequisite 2, the expectation within each stratum is easy to compute. Hence $$E(X)$$ can be evaluated, making this estimator correct and feasible.

> The stratified sampling estimator for Monte Carlo integration is the Estimator $$F$$, where $$E(F(X))=\sum_iP(I=i)E(F(X)|I=i)$$. This relation is based on the same principle as the derivation above. In the following discussion, all results hold if we replace $$X$$ with $$F$$, so we will continue using $$X$$ directly.

## Conditional Expectation Random Variable

Before proving the optimality of variance, we need to introduce the concept of conditional expectation random variables. Note that for a fixed $$i$$, $$E(X|I=i)$$ is a constant. Thus, for varying $$i\in\{1,\cdots,n\}$$, $$E(X|I=i)$$ forms a new discrete random variable $$\tilde I$$. We can simply write $$\tilde I$$ as $$E(X|I)$$.

**Theorem 1**: For random variables $$X,Y$$ where $$Y$$ is a discrete random variable, $$E(E(X|Y))=E(X)$$.

**Proof**: $$E(E(X|Y))= \sum_yP(Y = y)E(X|Y = y)$$, which is exactly the expression from stratified sampling, and therefore equals $$E(X)$$. In other words, stratified sampling is essentially an application of this theorem.

**Theorem 2 (Law of Total Variance)**: For random variables $$X,Y$$ where $$Y$$ is a discrete random variable, $$D(X)=E(D(X|Y))+D(E(X|Y))$$.

**Proof**: First, let's derive the relationship between conditional variance and conditional expectation.

$$
\begin{aligned}
D(X|Y=y)&=\int (x-E(X|Y=y))^2p(x|Y=y)dx\\
&=\int x^2p(x|Y=y)dx+E^2(X|Y=y)\int p(x|Y=y)dx\\
&\quad-2E(X|Y=y)\int xp(x|Y=y)dx\\
&=E(X^2|Y=y)+E^2(X|Y=y)-2E^2(X|Y=y)\\
&=E(X^2|Y=y)-E^2(X|Y=y)
\end{aligned}
$$

The above holds for any value $$y$$, i.e.:

$$D(X|Y)=E(X^2|Y)-E^2(X|Y)$$

Thus:

$$E(D(X|Y))=E(E(X^2|Y))-E(E^2(X|Y))$$
$$D(E_X(X|Y))=E(E^2(X|Y))-E^2(E(X|Y))$$

Therefore:

$$E(D(X|Y))+D(E(X|Y))=E(E(X^2|Y))-E^2(E(X|Y))$$

By Theorem 1, $$E(E(X^2|Y))=E(X^2)$$ and $$E(E(X|Y))=E(X)$$, so:

$$E(D(X|Y))+D(E(X|Y))=E(X^2)-E^2(X)=D(X)$$

Q.E.D.

## Variance Contribution of Stratified Sampling to Monte Carlo Integration

**Theorem**: Let the total number of samples be $$n$$, with stratified sampling using $$\sum_i n_i=n$$. If we set $$n_i=nP_i$$ (i.e., the number of samples is proportional to the probability of $$W\in \Lambda_i$$), then the variance of the Monte Carlo integral does not increase.

**Proof**: Let's first express this proposition as an inequality.

- For non-stratified sampling, let $$X_i$$ be simple random samples of $$X$$. Then $$D(\hat X)=D(\sum X_i/n)$$. Since the samples $$X_i$$ are independent and identically distributed, this equals $$\frac{1}{n^2}\sum D(X_i)=\frac{1}{n}D(X)$$.
- For stratified sampling, let $$X_{i,j}$$ be simple random samples of the within-stratum random variable $$X_i$$. Then $$D(\hat X)=D(\sum_i P_i\frac{1}{n_i}\sum_j^{n_i} X_{i,j})$$. Since the $$X_{i,j}$$ are mutually independent, $$D(\hat X)=\sum_i P_i^2 \frac{1}{n_i}D(X_i)=\frac{1}{n}\sum_i P_i D(X_i)$$.

Therefore the proposition is equivalent to proving $$D(X)\geq \sum_i P_iD(X_i)$$.

By the law of total variance, $$D(X)=E(D(X|I))+D(E(X|I))\geq E(D(X|I))$$, and $$E(D(X|I))$$ is precisely $$\sum_i P_iD(X_i)$$. This completes the proof.

**Variance invariance condition**: The variance remains unchanged if and only if $$D(E(X|I))=0$$. By the definition of variance for a discrete random variable:

$$\frac{1}{n}(E(X|I=i)-E(E(X|I)))^2=\frac{1}{n}(E(X_i)-E(X))^2=0$$

**That is, the variance is unchanged only when all strata have equal means; otherwise, the variance is guaranteed to decrease.** This is why, when the distribution is not well understood, more strata are generally better — this tends to create larger variations in stratum means, whereas fewer strata are more likely to result in similar means.

## Supplementary Notes

Although the above sampling allocation guarantees non-increasing variance, it is not optimal. Consider the constrained optimization problem:

$$\min_{n_j} \sum_{j=1}^m \frac{p_j^2\sigma_j^2}{n_j},\ where\ \sum_{j=1}^m{n_j}=n$$

This can be solved using the Lagrange multiplier method. Define:

$$F(n_1,\cdots, n_m, \lambda)=\sum_{j=1}^m \frac{p_j^2\sigma_j^2}{n_j}+\lambda(\sum_{j=1}^m{n_j}-n)$$

Solving $$\partial F/\partial n_j=0$$ and $$\partial F/\partial\lambda=0$$ gives:

$$
\begin{cases}
p_j^2\sigma_j^2=\lambda n_j^2 & for\ j\in\{1,\cdots,m\}\\
\sum_j n_j=n
\end{cases}
$$

The optimal sample allocation is easily found as:

$$n_j=\left(\frac{p_j\cdot \sigma_j}{\sum_{j=1}^m p_j\sigma_j}\right)n$$

The resulting minimum variance is:

$$\frac{\left(\sum_{j=1}^m p_j\sigma_j\right)^2}{n}$$
