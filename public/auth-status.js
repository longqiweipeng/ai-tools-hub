(function () {
  var SUPABASE_URL = 'https://qnqsqdzjljqibteqobhf.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucXNxZHpqbGpxaWJ0ZXFvYmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzA0OTEsImV4cCI6MjA5NDg0NjQ5MX0.cmi25_P0sHKZyDbrGajs7cib2Iq5bRIg2ejX9mhsL6k';

  function render(user) {
    var c = document.getElementById('auth-status');
    if (!c) return;

    c.textContent = '';

    if (user) {
      var letter = (user.email ? user.email[0] : 'U').toUpperCase();
      var dd = document.createElement('div');
      dd.className = 'dropdown dropdown-end';

      var btn = document.createElement('button');
      btn.className = 'btn btn-ghost btn-sm avatar placeholder';
      btn.tabIndex = 0;

      var inner = document.createElement('div');
      inner.className = 'bg-primary text-neutral-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold';
      inner.textContent = letter;
      btn.appendChild(inner);
      dd.appendChild(btn);

      var ul = document.createElement('ul');
      ul.tabIndex = 0;
      ul.className = 'dropdown-content menu menu-sm mt-3 z-50 p-2 shadow bg-base-100 rounded-box w-48';

      var pages = [
        { h: '/dashboard', t: '个人中心' },
        { h: '/dashboard/favorites', t: '我的收藏' },
        { h: '/membership', t: '会员服务' },
      ];
      for (var i = 0; i < pages.length; i++) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = pages[i].h;
        a.textContent = pages[i].t;
        li.appendChild(a);
        ul.appendChild(li);
      }

      var sli = document.createElement('li');
      sli.appendChild(document.createElement('hr'));
      ul.appendChild(sli);

      var lli = document.createElement('li');
      var lo = document.createElement('button');
      lo.className = 'text-error';
      lo.textContent = '退出登录';
      lo.onclick = function () {
        supabase.auth.signOut().then(function () {
          window.location.href = '/';
        });
      };
      lli.appendChild(lo);
      ul.appendChild(lli);

      dd.appendChild(ul);
      c.appendChild(dd);
    } else {
      var a = document.createElement('a');
      a.href = '/login';
      a.className = 'btn btn-primary btn-sm';
      a.textContent = '登录';
      c.appendChild(a);
    }
  }

  var supabase;
  function init() {
    var s = document.createElement('script');
    s.src = SUPABASE_URL.replace('/rest/v1', '') + '/supabase.js';
    s.onload = function () {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      supabase.auth.getUser().then(function (r) { render(r.data.user); });
      supabase.auth.onAuthStateChange(function () {
        supabase.auth.getUser().then(function (r) { render(r.data.user); });
      });
    };
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
