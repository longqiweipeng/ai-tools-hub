(function () {
  var SB_URL = 'https://qnqsqdzjljqibteqobhf.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucXNxZHpqbGpxaWJ0ZXFvYmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzA0OTEsImV4cCI6MjA5NDg0NjQ5MX0.cmi25_P0sHKZyDbrGajs7cib2Iq5bRIg2ejX9mhsL6k';

  function loadSupabase(callback) {
    if (window.supabase) {
      callback(window.supabase.createClient(SB_URL, SB_KEY));
      return;
    }
    var s = document.createElement('script');
    s.src = SB_URL + '/supabase.js';
    s.onload = function () { callback(window.supabase.createClient(SB_URL, SB_KEY)); };
    document.head.appendChild(s);
  }

  loadSupabase(async function (supabase) {
    var user = (await supabase.auth.getUser()).data?.user;
    var el = document.getElementById('login-check');
    if (!el) return;

    if (!user || user.email !== '2778500747@qq.com') {
      el.innerHTML = '<div class="card bg-base-100 shadow-md p-12 text-center"><div class="text-4xl mb-4">🔒</div><h3 class="text-lg font-semibold mb-2">无权访问</h3><a href="/" class="btn btn-primary mt-4">返回首页</a></div>';
      return;
    }

    el.classList.add('hidden');
    document.getElementById('admin-content').classList.remove('hidden');

    var { count } = await supabase.from('tool_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    document.getElementById('pending-count').textContent = (count || 0) + ' 个待审核';
  });
})();
