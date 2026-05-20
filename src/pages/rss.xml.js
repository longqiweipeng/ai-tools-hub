import rss from '@astrojs/rss';

const posts = [
  { slug: 'ai-writing-tools-guide', title: '2025 年最好的 AI 写作工具推荐', date: '2025-05-15', desc: '深度评测 ChatGPT、Claude、Kimi 等主流 AI 写作工具' },
  { slug: 'ai-ppt-generator-comparison', title: 'AI PPT 生成工具横向对比', date: '2025-05-12', desc: '对比 Gamma、WPS AI 等 AI PPT 工具的功能和价格' },
  { slug: 'free-ai-tools-2025', title: '2025 年免费 AI 工具大全', date: '2025-05-10', desc: '精选 10 款好用的免费 AI 工具' },
  { slug: 'ai-coding-assistant-review', title: 'AI 编程助手怎么选？', date: '2025-05-08', desc: 'Copilot vs Cursor vs Windsurf 深度对比' },
  { slug: 'deepseek-vs-chatgpt', title: 'DeepSeek 对比 ChatGPT：谁更强？', date: '2025-05-05', desc: '国产 AI 黑马 DeepSeek 与 ChatGPT 的全面对比' },
];

export function GET() {
  return rss({
    title: 'AI 工具箱 - 最新文章',
    description: 'AI 工具评测、对比和使用教程',
    site: 'https://ai-tools-hub-an7.pages.dev',
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.date),
      description: post.desc,
      link: `/blog/${post.slug}/`,
    })),
  });
}
