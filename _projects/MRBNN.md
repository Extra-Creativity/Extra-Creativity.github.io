---
layout: academic_project_page
title: "Multi-feature Radiance Baking Neural Networks for Instant Volumetric Rendering"
no_nav: true
full_width: true
images:
  compare: true

card_title_size: 1.5rem
importance: 0
category: Work
description: SIGGRAPH 2026 Paper for lightning fast volumetric rendering.
img: assets/img/projects/MRBNN/rep.jpeg
languages:
  - name: C++
  - name: CUDA
  - name: Python

authors:
  - name: "Jiaming Liang"
    url: "https://extra-creativity.github.io"
    affil: [1]
  - name: "Hongliang Yuan"
    affil: [2]
  - name: "Meng Gai"
    affil: [1]
  - name: "Guoping Wang"
    affil: [1]
  - name: "Sheng Li"
    url: "https://lishengpku.github.io/"
    affil: [1]

affiliations:
  - "School of Computer Science, Peking University"
  - "Xiaomi Company"

venue: "SIGGRAPH 2026"

paper_url: "/projects/ComingSoon/"
code_url: "/projects/ComingSoon/"
supp_url: "/projects/ComingSoon/"

teaser_image: "assets/img/projects/MRBNN/teaser.jpg"
teaser_caption: "MRBNN (Ours) renders complex multi-scattering effects of dense volumes in 200 FPS for 1024 × 1024 resolution with three-channel albedo, reaching 5× speedup over the state-of-the-art (MRPNN) while preserving high visual quality (a) thanks to our compact feature sampling and network design. Moreover, our method supports not only modification of globally homogeneous albedo and phase (b), but also rendering volumes with spatially varying albedo (c) and heterogeneous phase parameters (d), which are beyond the capabilities of prior work."

bibtex: |
  Coming Soon
---

## Abstract

Photorealistic volume rendering suffers from slow convergence with traditional path tracing algorithms and poses significant challenges for real-time applications. In this paper, we present Multi-feature Radiance Baking Neural Networks (MRBNN), a neural volumetric rendering method that achieves real-time performance by leveraging analytic decomposition of scattering with an efficient learned representation. Our method reformulates in-scattering integral in Volumetric Radiance Transfer Equation to diagonal scaling operator in spherical harmonics spectrum. Building on this formulation, we propose a compact factorized representation with low-rank compression in latent space that replaces costly integration. We then introduce efficient dual-pattern feature sampling and a lightweight neural decoder for fast radiance prediction. With these dedicated designs, MRBNN achieves 4~5× speedup over the state-of-the-art while maintaining high visual fidelity. Moreover, our method addresses key limitations of prior work, including over-illumination artifacts and inability to handle volumes with spatially varying albedo or heterogeneous phase parameters. Extensive experiments demonstrate that our neural baking method can synthesize photorealistic images for complex volumes in a few milliseconds.

## Results
{:.wide}

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="/assets/img/projects/MRBNN/sparse/gt.jpg" class="img-fluid z-depth-1" %}
    <figcaption class="carousel-caption" style="font-size:0.7rem">Reference</figcaption>
    </div>
    <div class="col-sm mt-3 mt-md-0">
    {% include academic/image_compare.liquid
        image_a="/assets/img/projects/MRBNN/sparse/120.jpg"
        image_b="/assets/img/projects/MRBNN/sparse/pt-120.jpg"
        caption="Left: Our method. Right: Path tracing (120 spp)."
        caption_size="0.7rem"
    %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
    {% include academic/image_compare.liquid
        image_a="/assets/img/projects/MRBNN/sparse/120.jpg"
        image_b="/assets/img/projects/MRBNN/sparse/mrpnn-120.jpg"
        caption="Left: Our method. Right: MRPNN."
        caption_size="0.7rem"
    %}
    </div>
</div>

<div style="max-width: 768px;margin-left: auto; margin-right: auto; ">
{% include figure.liquid loading="eager" path="/assets/img/projects/MRBNN/eq-cmp.jpg" class="img-fluid z-depth-1" %}
<div class="caption"> Equal-time Comparison </div>

{% include figure.liquid loading="eager" path="/assets/img/projects/MRBNN/equal-spp.jpg" class="img-fluid z-depth-1" %}
<div class="caption"> Equal-spp Comparison </div>

{% include figure.liquid loading="eager" path="/assets/img/projects/MRBNN/close-up.jpg" class="img-fluid z-depth-1" %}
<div class="caption"> Close-up views </div>
</div>

## Supplementary Video
{:.wide}

{% include bilibili_video.liquid bvid="BV1wATu6mEZd" q=80 %}