(function() {
  'use strict';

  window._bilibiliCache = window._bilibiliCache || {};

  function cacheKey(bvid, p) {
    return bvid + '-' + (p || '1');
  }

  function loadDPlayer(callback) {
    if (typeof DPlayer !== 'undefined') {
      callback();
      return;
    }
    var script = document.createElement('script');
    script.src = '/assets/js/DPlayer.min.js';
    script.onload = callback;
    script.onerror = function() {
      console.warn('Failed to load DPlayer.min.js');
    };
    document.head.appendChild(script);
  }

  function initPlayer(container, url) {
    new DPlayer({
      container: container,
      autoplay: false,
      theme: '#b7daff',
      loop: false,
      lang: 'zh-cn',
      screenshot: true,
      hotkey: true,
      preload: 'auto',
      volume: 0.7,
      mutex: true,
      video: {
        url: url,
        type: 'auto',
      },
      danmaku: false,
    });
  }

  function embedFallback(container, bvid, p) {
    container.innerHTML = '<iframe'
      + ' src="https://player.bilibili.com/player.html?bvid=' + bvid + '&p=' + p + '&high_quality=1&autoplay=0"'
      + ' style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"'
      + ' scrolling="no"'
      + ' allowfullscreen="true"'
      + '></iframe>';
  }

  function fetchVideo(bvid, p, q, callback, errback) {
    var server = window._bilibiliParseServer || '';
    var params = 'bv=' + bvid + '&p=' + p + '&q=' + q + '&format=mp4';
    var url = server + (server.indexOf('?') >= 0 ? '&' : '?') + params;

    fetch(url)
      .then(function(resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function(data) {
        if (data.url) {
          callback(data.url.replace(/^https?\:\/\//i, 'https://'));
        } else {
          errback();
        }
      })
      .catch(function(err) {
        console.warn('Failed to fetch video info:', err.message);
        errback();
      });
  }

  function loadSection(body) {
    var containers = body.querySelectorAll('.dplayer-container[data-bvid]');
    var pending = containers.length;

    if (pending === 0) return;

    loadDPlayer(function() {
      for (var i = 0; i < containers.length; i++) {
        (function(container) {
          var bvid = container.getAttribute('data-bvid');
          var p = container.getAttribute('data-p') || '1';
          var q = container.getAttribute('data-q') || '64';
          var key = cacheKey(bvid, p);

          if (window._bilibiliCache[key]) {
            // Already cached — init immediately
            initPlayer(container, window._bilibiliCache[key]);
          } else {
            // Fetch and cache
            fetchVideo(bvid, p, q, function(url) {
              window._bilibiliCache[key] = url;
              initPlayer(container, url);
            }, function() {
              embedFallback(container, bvid, p);
            });
          }
        })(containers[i]);
      }
    });
  }

  window.VideoList = {
    toggle: function(btn) {
      // btn may be wrapped by kramdown (<p>) or our own <div>
      var wrapper = btn.parentElement;
      var body = wrapper.nextElementSibling;
      if (!body || !body.classList.contains('video-section-body')) {
        body = btn.nextElementSibling; // fallback: no wrapping
      }
      if (!body || !body.classList.contains('video-section-body')) return;

      var isOpen = body.style.display === 'block';

      if (isOpen) {
        body.style.display = '';
        btn.classList.remove('open');
      } else {
        body.style.display = 'block';
        btn.classList.add('open');
        if (!body._loaded) {
          body._loaded = true;
          loadSection(body);
        }
      }
    },

    init: function() {
      var headers = document.querySelectorAll('.video-section-header');
      for (var i = 0; i < headers.length; i++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            window.VideoList.toggle(btn);
          });
        })(headers[i]);
      }
    }
  };

  window.VideoList.init();
})();
