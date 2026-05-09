---
layout: page
title: OpenGLFramework
description: My first framework on OpenGL to implement rendering algorithms.
img: assets/img/projects/OpenGLFramework/PCSS.png
importance: 1
category: Fun
github: https://github.com/Extra-Creativity/OpenGLFramework
languages:
  - name: C++
---

After I completed the tutorial [LearnOpenGL](https://learnopengl.com/), I felt that it was quite inconvenient to use and there also existed some bad practice in code. Therefore, I spent some time to encapsulate OpenGL, optimized the framework and equipped it with many tests and documents. Based on this project, I implemented PCSS, VSSM and simple SSR (screen-space reflection).

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/OpenGLFramework/Hard Shadow.png" title="Hard shadow" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/OpenGLFramework/PCF.png" title="PCF" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/OpenGLFramework/PCSS.png" title="PCSS" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="row justify-content-sm-center">
    <div class="col-sm-5 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/projects/OpenGLFramework/SSR.jpg" title="Simple SSR" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-7 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/projects/OpenGLFramework/switch.gif" title="Scene Switch" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Effects made by this framework.
</div>

This framework has these advantages:

1. Faster loading speed: The most common code for OpenGL framework is in [learnOpenGL](https://github.com/JoeyDeVries/LearnOpenGL), so we benchmark the total cost of creating Window, loading models, loading shaders and establishing the camera of ours and learnOpenGL's.

   |                      | Windows 10 | Ubuntu 20.04 |
   | -------------------- | ---------- | ------------ |
   | LearnOpenGL, release | 3.26205s   | 1.93490s     |
   | Ours, v1.0, release  | 0.72038s   | 0.645622s    |
   | Ours, v1.1, release  | 0.662553s  | 0.521885s*   |
   
   > *: Since v1.3, sometimes it can be even as low as ~0.35 seconds. For windows, it's quite unsteady and basically 0.75s on average.

   Note that our CPU is Intel Core i7, GPU is NVIDIA GTX 1650 and the model has 61434 vertices and 20478 facets. It indicates that we make it at least four to five times faster than the baseline in the latest version.

2. Easier-to-use interface: We wrap the OpenGL code in RAII style, hiding trivial and boring inner details for the most common features. You can dive into writing proper shaders.

3. One-stop dependencies installation: It's widely known that OpenGL needs a bunch of dependencies which disturbs users a lot. Through XMake, we make it quite easy.

4. Support UTF-8 path : learnOpenGL may only supports ASCII path; we support UTF-8 path. In fact, the example model has textures that have Chinese characters.

5. File-based configuration: we support `.ini` configuration file format, so you can load them in run time and minimize the re-compilation when you want to change them.

6. Dynamic vertex attribute configuration: besides the most basic components of vertex attributes(i.e. normals and texture coordinates), we allow the user to add attributes as much as they like. For example, in the example of `NormalMap`, we need tangent and bitangent in attributes, which can be easily extended by:

   ```c++ 
   struct VertAttribWithTan
   {
   	glm::vec3 normalCoord;
   	glm::vec2 textureCoord;
   	glm::vec3 tanCoord;
   	glm::vec3 bitanCoord;
   };
   
   BEGIN_REFLECT(VertAttribWithTan)
   REFLECT(1, float, normalCoord) // layout, primitive type, name
   REFLECT(2, float, textureCoord)
   REFLECT(3, float, tanCoord)
   REFLECT(4, float, bitanCoord)
   END_REFLECT(4) // max considered layout.
   ```

   After this, the only function that needs to be defined is how to copy attributes from the `aiMesh` of assimp. This is dramatically easy compared with writing lots of `glVertexAttribPointer` manually, as many other frameworks have to do.

7. Easy and safe configuration for framebuffer.

> Note: despite these advantages, this project is still a toy project and can further evolve in my current view. It needs to be re-designed and refactored to be more intuitive and convenient.