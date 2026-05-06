---
layout: page
title: Volume Transmittance Based on Deep Reinfocement Learning
description: another project with an image 🎉
img: assets/img/6.jpg
importance: 4
category: fun
---

In the project of *Deep Reinforcement Learning* by [Prof. Zong Qinglu](https://z0ngqing.github.io/), I did some experimental trials on using RL to do volumetric transmittance. At that time, I read lots of papers regarding volumetric transmittance estimation (which is thoroughly summarized in a blog) and thought it was a viable topic. Roughly speaking, I hope to sample at better positions during estimation; the positions plus other status are seen as history, and the RL model predicts the next sample position as its action. Predictably，its performance would be quite bad since traditional statistical process can draw samples much quicklier than model prediction, and the computation cost would be much lower too. However, my objective was to validiate that whether RL dould really choose better positions, so that wasn't a real problem for me.



BTW, I did lots of interesting tasks in this course, and it's worthwhile to list them here.