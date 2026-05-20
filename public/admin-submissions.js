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
    var loginEl = document.getElementById('login-check');

    if (!user || user.email !== '2778500747@qq.com') {
      if (loginEl) loginEl.innerHTML = '<div class="card bg-base-100 shadow-md p-12 text-center"><div class="text-4xl mb-4">🔒</div><h3 class="text-lg font-semibold mb-2">无权访问</h3><a href="/admin" class="btn btn-primary mt-4">返回</a></div>';
      return;
    }

    if (loginEl) loginEl.classList.add('hidden');
    var list = document.getElementById('submissions-list');
    if (list) list.classList.remove('hidden');

    async function load() {
      var { data } = await supabase.from('tool_submissions').select('*').order('created_at', { ascending: false });
      if (!data || data.length === 0) {
        if (list) list.innerHTML = '<div class="card bg-base-100 shadow-md p-12 text-center"><div class="text-4xl mb-4">📭</div><h3 class="text-lg font-semibold mb-2">暂无提交</h3></div>';
        return;
      }

      var CAT_NAMES = {
        text: '文本生成', image: '图像生成', video: '视频生成',
        code: '编程助手', audio: '音频处理', office: '办公提效', design: '设计创意',
      };

      var html = '';
      for (var i = 0; i < data.length; i++) {
        var sub = data[i];
        var date = new Date(sub.created_at).toLocaleDateString('zh-CN');
        var catName = CAT_NAMES[sub.category] || sub.category;
        var badge = sub.status === 'pending'
          ? '<span class="badge badge-warning badge-sm">待审核</span>'
          : sub.status === 'approved'
          ? '<span class="badge badge-success badge-sm">已通过</span>'
          : '<span class="badge badge-ghost badge-sm">已拒绝</span>';
        var actions = sub.status === 'pending'
          ? '<div class="flex gap-2 mt-3"><button class="btn btn-success btn-sm" data-action="approve" data-id="' + sub.id + '">通过</button><button class="btn btn-ghost btn-sm" data-action="reject" data-id="' + sub.id + '">拒绝</button></div>'
          : '';

        html += '<div class="card bg-base-100 shadow-sm mb-4" data-id="' + sub.id + '">' +
          '<div class="card-body p-5">' +
          '<div class="flex justify-between items-start">' +
          '<div><h3 class="font-semibold">' + (sub.name || '') + '</h3>' +
          '<p class="text-sm opacity-60 mt-1">' + (sub.description || '') + '</p></div>' +
          badge + '</div>' +
          '<div class="flex gap-2 text-xs opacity-50 mt-2">' +
          '<span>' + catName + '</span>' +
          '<a href="' + (sub.website_url || '') + '" target="_blank" class="link">' + (sub.website_url || '') + '</a>' +
          '<span>' + date + '</span></div>' +
          actions + '</div></div>';
      }
      if (list) list.innerHTML = '<div class="space-y-4">' + html + '</div>';

      // Bind action buttons
      document.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = this.getAttribute('data-id');
          var action = this.getAttribute('data-action');
          var status = action === 'approve' ? 'approved' : 'rejected';
          await supabase.from('tool_submissions').update({ status: status }).eq('id', id);
          load();
        });
      });
    }

    load();
  });
})();
