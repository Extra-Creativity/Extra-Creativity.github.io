---
layout: page
title: Simple Ray-Tracing Based Renderer
description: A naive CPU-based ray-tracing renderer accelerated by OpenMP.
img: assets/img/projects/covers/RTRender.png
importance: 2
category: Fun
github: https://github.com/Extra-Creativity/Ray-tracing-based-Renderer
languages:
  - name: C++
---

I implemented a CPU-based ray-tracing renderer as the third project of PKU CGI course. I implement simple geometry, material and Monte-Carlo estimation. Though it's quite naive and slow, this project made me get a rough understanding of how ray tracing works.

{% include figure.liquid loading="eager" path="assets/img/projects/covers/RTRender.png" class="img-fluid z-depth-1" %}

> BTW, this project made me realize the importance of numeric precision. When I used `float`, the scene above showed weird result; using `double` fixed it immediately.