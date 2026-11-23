/* Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz */
// assets/theme.js
// Přepínání barevných režimů a mobilní hamburgerové menu.
(function(){
  'use strict';

  function applyTheme(theme){
    if (!theme) { theme = 'tmavy'; }
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('sudoku_theme', theme); } catch(e) {}
  }


  function markActive(theme){
    var dots = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < dots.length; i++) {
      var active = dots[i].getAttribute('data-theme-choice') === theme;
      if (active) { dots[i].classList.add('is-active'); }
      else { dots[i].classList.remove('is-active'); }
      dots[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  function initTheme(){
    var saved = 'tmavy';
    try { saved = localStorage.getItem('sudoku_theme') || 'tmavy'; } catch(e) {}
    applyTheme(saved);
    var selects = document.querySelectorAll('[data-theme-select]');
    for (var i = 0; i < selects.length; i++) {
      selects[i].value = saved;
      selects[i].onchange = function(){ applyTheme(this.value); markActive(this.value); };
    }

    var dots = document.querySelectorAll('[data-theme-choice]');
    for (var j = 0; j < dots.length; j++) {
      dots[j].onclick = function(){ applyTheme(this.getAttribute('data-theme-choice')); markActive(this.getAttribute('data-theme-choice')); };
    }
    markActive(saved);
  }

  function initMobileMenu(){
    var tops = document.querySelectorAll('.top');
    for (var i = 0; i < tops.length; i++) {
      var top = tops[i];
      var nav = top.querySelector('nav');
      if (!nav || top.querySelector('.hamburger')) { continue; }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hamburger';
      btn.setAttribute('aria-label', 'Otevřít menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span></span><span></span><span></span>';
      btn.onclick = function(){
        var parent = this.parentNode;
        var opened = parent.classList.toggle('nav-open');
        this.setAttribute('aria-expanded', opened ? 'true' : 'false');
      };
      top.insertBefore(btn, nav);
    }
  }

  function init(){ initTheme(); initMobileMenu(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
