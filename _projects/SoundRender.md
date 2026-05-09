---
layout: page
title: Sound Renderer
description: A visual renderer with sound simulation for SIGGRAPH 2022 Labs Session.
img: assets/img/projects/covers/SoundRenderer.png
importance: 2
category: Work
github: https://github.com/hellojxt/SoundRender
languages:
  - name: C++
  - name: CUDA
---

We ([Jin Xutong](https://hellojxt.github.io/), [Lang Qinglin](https://github.com/AbsoluteQ) and I) made a visual and sound renderer to use in SIGGRAPH 2022 Labs Session for NeuralSound (<a href="https://hellojxt.github.io/NeuralSound/">[Jin et.al. 2022]</a>). When a primitive is clicked, its modal analysis will be triggered and vibration result is then filled into audio buffer so users can hear sound. NeuralSound is used to precompute modal data and acoustic maps for the material and model very quickly (hundreds of milliseconds to achieve accuracy of traditional methods in several seconds).

I'm sorry that I only find a low-quality recording; it may be updated when I have spare time to record a new one (and please contact me if you really want it :-)).

{% include bilibili_video.liquid bvid="BV1sXRrB8ErE" p=7 q=32 %}