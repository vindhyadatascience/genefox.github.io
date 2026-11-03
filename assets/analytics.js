(function () {
  "use strict";
  var GA_MEASUREMENT_ID = "G-QBL2LHE992";
  var configured = /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== "G-" + "XXXXXXXXXX";
  var key = "gf-analytics-consent";
  var choice = null;

  function track(name, params) {
    if (configured && typeof window.gtag === "function") {
      window.gtag('event', name, params);
    }
  }

  function storeRedirect(platform, url) {
    var done = false;
    function go() {
      if (!done) { done = true; location.replace(url); }
    }
    if (!configured || typeof window.gtag !== "function") { go(); return; }
    window.gtag('event', 'store_redirect', {platform: platform, transport_type: 'beacon', event_callback: go});
    setTimeout(go, 300);
  }
  window.GeneFoxAnalytics = {track: track, storeRedirect: storeRedirect};
  if (!configured) { return; }

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH']});
  gtag('consent', 'default', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
  try { choice = localStorage.getItem(key); } catch (e) { choice = null; }
  if (choice !== 'granted' && choice !== 'denied') { choice = null; }
  if (choice) {
    gtag('consent', 'update', {analytics_storage:choice, ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
  }
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);

  function ready() {
    var style = document.createElement('style');
    style.textContent = '.gf-cookie-banner{position:fixed;z-index:9999;bottom:0;left:0;right:0;box-sizing:border-box;background:#1B2547;color:#E7E9F5;padding:16px;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 -2px 12px rgba(0,0,0,.3)}.gf-cookie-inner{max-width:1100px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.gf-cookie-banner p{color:#E7E9F5;margin:0;flex:1 1 240px}.gf-cookie-banner a{color:#D57BBA;text-decoration:underline}.gf-cookie-actions{display:flex;gap:10px;flex-wrap:wrap}.gf-cookie-actions button{font:inherit;color:#E7E9F5;background:#1B2547;border:1px solid #D57BBA;border-radius:6px;padding:8px 20px;cursor:pointer}.gf-cookie-actions button:hover{background:#B53694}.gf-cookie-banner :focus-visible,.gf-cookie-link:focus-visible{outline:3px solid #D57BBA;outline-offset:3px}.gf-cookie-link{font:inherit;color:#9AA2C4;text-decoration:underline;background:none;border:0;padding:0;cursor:pointer}.gf-cookie-link:hover{color:#D57BBA}@media(prefers-reduced-motion:reduce){.gf-cookie-banner *{transition:none;animation:none}}';
    document.head.appendChild(style);
    var banner = document.createElement('div');
    banner.className = 'gf-cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie choices');
    banner.innerHTML = '<div class="gf-cookie-inner"><p>GeneFox uses Google Analytics on this website only. <a href="/privacy/#analytics">Learn more</a>.</p><div class="gf-cookie-actions"><button type="button" data-gf-choice="granted">Accept</button><button type="button" data-gf-choice="denied">Reject</button></div></div>';
    banner.hidden = !!choice;
    banner.addEventListener('click', function (event) {
      var value = event.target.getAttribute('data-gf-choice');
      if (value !== 'granted' && value !== 'denied') { return; }
      try { localStorage.setItem(key, value); } catch (e) {}
      gtag('consent', 'update', {analytics_storage:value});
      banner.hidden = true;
    });
    document.body.appendChild(banner);
    var footer = document.querySelector('footer .foot-legal') || document.querySelector('footer');
    if (footer) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'gf-cookie-link'; button.textContent = 'Cookie settings';
      button.addEventListener('click', function () { banner.hidden = false; });
      footer.appendChild(button);
    }
  }
  document.addEventListener('click', function (event) {
    var el = event.target;
    while (el && el !== document) {
      if (el.getAttribute) {
        if (el.hasAttribute('data-ga-event') && el.getAttribute('data-ga-event') === 'cli_download') { track('cli_download', {}); }
        if (el.hasAttribute('data-copy-install')) {
          try { if (navigator.clipboard && navigator.clipboard.writeText) { var result = navigator.clipboard.writeText(el.getAttribute('data-copy-install') || el.textContent); if (result && result.catch) { result.catch(function () {}); } } } catch (e) {}
          track('cli_install_copy', {});
        }
      }
      el = el.parentNode;
    }
  });
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ready); } else { ready(); }
})();
