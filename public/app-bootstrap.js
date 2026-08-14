// Loaded with `defer` from index.html. Replaces the inline SW-registration
// script and the two inline `onload=` handler attributes so that
// Content-Security-Policy script-src can drop 'unsafe-inline'.

// Async stylesheet swaps (previously inline onload attributes)
var fontLink = document.getElementById('google-fonts');
if (fontLink) {
  fontLink.media = 'all';
}

// Service Worker Registration (moved verbatim from the old inline script —
// non-blocking update banner, no confirm(), no console output)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (registration) {
        registration.addEventListener('updatefound', function () {
          var newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              var banner = document.createElement('div');
              banner.setAttribute('role', 'status');
              banner.style.cssText =
                'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);' +
                'background:#002B19;color:#fff;padding:12px 20px;border-radius:8px;' +
                'font:500 14px Inter,system-ui,sans-serif;z-index:10001;' +
                'box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;gap:12px;align-items:center;';
              banner.innerHTML =
                '<span>A new version is available.</span>' +
                '<button id="sw-update-btn" style="background:#FCD116;color:#002B19;border:0;' +
                'border-radius:6px;padding:6px 14px;font-weight:600;cursor:pointer;">Reload</button>';
              document.body.appendChild(banner);
              document.getElementById('sw-update-btn').addEventListener('click', function () {
                window.location.reload();
              });
            }
          });
        });
      })
      .catch(function () { /* SW registration failed — app still works */ });
  });
}
