---
layout: page
title: "Unity Animation and Physics Implementation"
description: PKU CGI Labs, implement DQS, fluid simulation, etc. 
img: assets/img/projects/covers/CGI.png
importance: 1
category: Fun
languages:
  - name: C#
---
In PKU Computer Generated Imagery course taught by [Prof. Liu Libin](https://libliu.info/), I implemented many algorithms on animation and physics simulation in Unity. In traditional graphics courses, rendering is covered most while other graphics topics are just quickly skimmed. By contrast, this course concentrated on animation and physics simulation, which was a really good supplementary and broadened my horizons. I learnt a lot in the course and trials, and I extend my sincere gratitude to Prof. Liu Libin.

The sub-projects are as follows (some were not recorded at that time), all run on GTX 1650:

{% include bilibili_video_section_header.liquid title="Animation transition" %}
<div class="video-section-body">
<div class="row">
    <div class="col-sm mt-2 mt-md-0">
        {% include bilibili_video.liquid bvid="BV1sXRrB8ErE" p=1 defer=true %}
        <div class="caption"> Simple Interpolation like Catmull-Rom. </div>
    </div>
    <div class="col-sm mt-2 mt-md-0">
        {% include bilibili_video.liquid bvid="BV1sXRrB8ErE" p=2 defer=true %}
        <div class="caption"> A BVH loader to control character's joint action. </div>
    </div>
</div>
By combining these two basic parts, I also implement smooth character pose transition (instead of an immediate movement). This homework was not recorded at that time so no video is shown here (I may do it in the future).
</div>

{% include bilibili_video_section_header.liquid title="Inverse Kinetics" %}
<div class="video-section-body">
I implement inverse kinetics (IK) in two ways: by heuristic algorithm and by Jacobian. This was not recorded at that time either, and may be added when I have spare time.
</div>

{% include bilibili_video_section_header.liquid title="Skinning" %}
<div class="video-section-body">
I implement Dual Quaternion Skinning (DQS), which to some extent overcomes typical artifacts of Linear Blending Skinning (LBS) like candy-wrapper problem.
{% include bilibili_video.liquid bvid="BV1sXRrB8ErE" p=3 defer=true %}
</div>

{% include bilibili_video_section_header.liquid title="Physics Simulation (Simple Cloth, Elastic body and Fluid)" %}
<div class="video-section-body">
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include bilibili_video.liquid bvid="BV1sXRrB8ErE" p=4 defer=true %}
        <div class="caption"> Cloth </div>
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include bilibili_video.liquid bvid="BV1sXRrB8ErE" p=5 defer=true %}
        <div class="caption"> Elastic body </div>
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include bilibili_video.liquid bvid="BV1sXRrB8ErE" p=6 defer=true %}
        <div class="caption"> Fluid </div>
    </div>
</div>

<div markdown="1">
These results are implemented as follows:

1. Cloth: by Mass-Spring system.
2. Elastic body: by Finite Element Method (FEM).
3. Fluid: by Smoothed-Particle Hydrodynamics (SPH). The container bottom uses a high punishment to particles (i.e. when particles try to go out of container boundary, a large opposite force will be applied) to mimic boiling water.
</div>

</div>

> For PKU student: It seems that Prof. Liu Libin doesn't offer this course anymore, and I feel that it's really a pity. However, he has new courses and I believe they're worth a try!

<script src="{{ '/assets/js/bilibili-video-list.js' | relative_url }}"></script>