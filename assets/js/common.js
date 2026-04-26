$(document).ready(function () {
  // add toggle functionality to abstract, award, bibtex and revisions buttons
  var toggleClasses = ["abstract", "award", "bibtex", "revisions"];
  toggleClasses.forEach(function (cls) {
    $("a." + cls).click(function () {
      var container = $(this).parent().parent();
      toggleClasses.forEach(function (other) {
        if (other === cls) {
          container.find("." + other + ".hidden").toggleClass("open");
        } else {
          container.find("." + other + ".hidden.open").toggleClass("open");
        }
      });
    });
  });
  $("a").removeClass("waves-effect waves-light");

  // bootstrap-toc
  if ($("#toc-sidebar").length) {
    // remove related publications years from the TOC
    $(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
      offset: 100,
    });
    // toc collapse control: add CSS class to force sub-navs visible
    var collapseVal = $myNav.attr("data-toc-collapse");
    if (collapseVal === "false") {
      $myNav.addClass("toc-expand-all");
    } else if (collapseVal !== "auto" && !isNaN(parseInt(collapseVal))) {
      $myNav.addClass("toc-expand-" + collapseVal);
    }
    // collapseVal === "auto": default bootstrap-toc behavior (collapse/expand on scroll)
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let jupyterTheme = determineComputedTheme();

  $(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (jupyterTheme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });

  // trigger popovers
  $('[data-toggle="popover"]').popover({
    trigger: "hover",
  });
});
