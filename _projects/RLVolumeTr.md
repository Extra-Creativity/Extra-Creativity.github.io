---
layout: page
title: Volume Transmittance Estimation Based on DeepRL
card_title_size: 1.25rem
description: Experimental project to use deep reinforcement learning in rendering problem.
img: assets/img/projects/covers/RLVolumeTr.svg
importance: 3
category: Fun
github: https://github.com/Extra-Creativity/RLVolumeTr
languages:
  - name: C++
  - name: CUDA
  - name: Python
---

In the project of *Deep Reinforcement Learning* by [Prof. Lu Zongqing](https://z0ngqing.github.io/), I did some experimental trials on using RL to do volumetric transmittance. At that time, I read lots of papers regarding volumetric transmittance estimation (which is thoroughly summarized in a blog) and thought it was a viable topic. Roughly speaking, I hoped to sample at better positions during estimation; the positions plus other status were seen as history, and the RL model predicted the next sample position as its action. Predictably，its performance would be quite bad since traditional statistical process could draw samples much quicklier than model prediction, and the computation cost would be much lower too. However, my objective was to validiate that whether RL could really choose better positions under my history settings, so that wasn't a real problem for me.

{% include figure.liquid loading="eager" path="assets/img/projects/covers/RLVolumeTr.svg" class="img-fluid z-depth-1" %}

BTW, I did lots of interesting tasks in this course, and it's worthwhile to list them here.