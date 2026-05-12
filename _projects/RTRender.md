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

I implemented a CPU-based ray-tracing renderer as the third project of PKU CGI course. This renderer contained simple geometry, material and Monte-Carlo estimation. Though it was quite naive and slow, this project made me get a rough understanding of how ray tracing works.

<div style="max-width: 768px; margin: 0 auto;">
{% include figure.liquid loading="eager" path="assets/img/projects/covers/RTRender.png" class="z-depth-1" %}
</div>

> BTW, this project made me realize the importance of numeric precision. When I used `float`, the scene above showed weird result; using `double` fixed it immediately.