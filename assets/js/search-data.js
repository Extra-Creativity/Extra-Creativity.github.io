// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "About",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-news",
          title: "News",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/news/";
          },
        },{id: "dropdown-中文",
              title: "中文",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/blog/";
              },
            },{id: "dropdown-english",
              title: "English",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/blog/";
              },
            },{id: "nav-publications",
          title: "Publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "A collection of interesting projects I&#39;ve engaged in.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "post-c-26-reflection-在c-中实现c-lt-code-gt-operator-lt-code-gt",
        
          title: "【C++26 Reflection】在C++中实现C# &lt;code&gt;operator?.&lt;/code&gt;",
        
        description: "May the NULL be with you.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/NullCollapse/";
          
        },
      },{id: "post-不是你怎么变来变去的-详解c-memory-order理论模型",
        
          title: "不是你怎么变来变去的：详解C++ Memory Order理论模型",
        
        description: "Theoretical model of C++ memory order.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/MemoryOrder/";
          
        },
      },{id: "post-和体渲染爆了-一文看懂exponential-media-transmittance-estimation",
        
          title: "和体渲染爆了：一文看懂Exponential Media Transmittance Estimation",
        
        description: "Thorough review and analysis to volumetric transmittance estimation",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/TrEst/";
          
        },
      },{id: "posts_en-c-26-reflection-implement-c-operator-in-c",
          title: '[C++26 Reflection] Implement C# operator?. in C++',
          description: "May the NULL be with you.",
          section: "Posts_en",handler: () => {
              window.location.href = "/blog/en/2026/NullCollapse/";
            },},{id: "projects-towards-rotation-invariant-point-cloud-classification",
          title: 'Towards Rotation-Invariant Point Cloud Classification',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/projects/10_project/";
            },},{id: "projects-dip-project",
          title: 'DIP-Project',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/projects/11_project/";
            },},{id: "projects-embedded-system-project",
          title: 'Embedded System Project',
          description: "EasyRender",
          section: "Projects",handler: () => {
              window.location.href = "/projects/12_project/";
            },},{id: "projects-coming-soon",
          title: 'Coming Soon...',
          description: "",
          section: "Projects",handler: () => {
              window.location.href = "/projects/ComingSoon/";
            },},{id: "projects-easyrender",
          title: 'EasyRender',
          description: "OptiX-based high-performance Renderer",
          section: "Projects",handler: () => {
              window.location.href = "/projects/EasyRender/";
            },},{id: "projects-fight-the-lord",
          title: 'Fight The Lord',
          description: "&quot;Fight The Lord 2&quot; (斗地主) poker &quot;AI&quot; gamer program.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/FightTheLord/";
            },},{id: "projects-multi-feature-radiance-baking-neural-networks-for-instant-volumetric-rendering",
          title: 'Multi-feature Radiance Baking Neural Networks for Instant Volumetric Rendering',
          description: "SIGGRAPH 2026 Paper for lightning fast volumetric rendering.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/MRBNN/";
            },},{id: "projects-miscellaneous",
          title: 'Miscellaneous',
          description: "Labs on ICS, Operating System, Network and Architecture.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/Misc/";
            },},{id: "projects-modern-c-basics",
          title: 'Modern C++ Basics',
          description: "A free online course originally for PKU sophomore undergraduate, including most of important features from C++11 to C++23.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/ModernCppBasics/";
            },},{id: "projects-nogo",
          title: 'NoGo',
          description: "&quot;NoGo&quot; (不围棋) chess program. My first project since I majored in computer science.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/NoGo/";
            },},{id: "projects-openglframework",
          title: 'OpenGLFramework',
          description: "My first framework on OpenGL to implement rendering algorithms.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/OpenGLFramework/";
            },},{id: "projects-volume-transmittance-estimation-based-on-deeprl",
          title: 'Volume Transmittance Estimation Based on DeepRL',
          description: "Experimental project to use deep reinforcement learning in rendering problem.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/RLVolumeTr/";
            },},{id: "projects-simple-ray-tracing-based-renderer",
          title: 'Simple Ray-Tracing Based Renderer',
          description: "A naive CPU-based ray-tracing renderer accelerated by OpenMP.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/RTRender/";
            },},{id: "projects-raft-consensus-algorithm",
          title: 'Raft consensus algorithm',
          description: "another without an image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/Raft/";
            },},{id: "projects-sound-renderer",
          title: 'Sound Renderer',
          description: "A visual renderer with sound simulation for SIGGRAPH 2022 Labs Session.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/SoundRender/";
            },},{id: "projects-sysy-compiler",
          title: 'SysY compiler',
          description: "Project of Compiler Principles, together with a C++ highlighter (for fun!)",
          section: "Projects",handler: () => {
              window.location.href = "/projects/SysY/";
            },},{id: "projects-unity-animation-and-physics-implementation",
          title: 'Unity Animation and Physics Implementation',
          description: "PKU CGI Labs, implement DQS, fluid simulation, etc.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/Unity_CGI/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%6C%69%61%6E%67%6A%69%61%6D%69%6E%67@%73%74%75.%70%6B%75.%65%64%75.%63%6E", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/Extra-Creativity", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
