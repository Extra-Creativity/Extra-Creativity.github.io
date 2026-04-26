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
        },{id: "nav-blogs",
          title: "Blogs",
          description: "",
          section: "Navigation",
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
        },{id: "post-不是你怎么变来变去的-详解c-memory-order理论模型",
        
          title: "不是你怎么变来变去的：详解C++ Memory Order理论模型",
        
        description: "Theoretical model of C++ memory order.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/MemoryOrder/";
          
        },
      },{id: "projects-coming-soon",
          title: 'Coming Soon...',
          description: "",
          section: "Projects",handler: () => {
              window.location.href = "/projects/ComingSoon/";
            },},{id: "projects-modern-c-basics",
          title: 'Modern C++ Basics',
          description: "A free online course originally for PKU sophomore undergraduate, including most of important features from C++11 to C++23.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/ModernCppBasics/";
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
