"""
AI 工具评测视频生成器
基于 deng_jiaxian_video 项目的 MoviePy + Pillow 管道
用法: python scripts/generate_tool_reviews.py [tool_slug]
     不传参则生成所有工具的预览视频
"""

import sys, os, json

# 将现有视频项目加入路径
VIDEO_PROJ = os.path.join(os.path.dirname(__file__), '..', '..', 'deng_jiaxian_video')
sys.path.insert(0, os.path.abspath(VIDEO_PROJ))

# 视频输出目录
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'videos')
os.makedirs(OUTPUT_DIR, exist_ok=True)

from moviepy import (
    VideoClip, CompositeVideoClip, concatenate_videoclips,
    AudioClip, vfx
)
import numpy as np

# 复用现有项目模块
from effects import make_gradient_bg, make_star_field, make_solid_bg
from scenes import _render_text_pillow, _text_clip, FONT_TITLE, FONT_BODY, W, H
from audio import SAMPLE_RATE

# ============================================================
# 工具数据（精简版，与 tools.json 同步）
# ============================================================
TOOLS = [
    {"slug": "chatgpt", "name": "ChatGPT", "category": "文本生成", "rating": 4.8,
     "features": ["对话式交互", "多语言支持", "代码生成", "文件分析", "DALL-E 集成"],
     "colors": [(10, 168, 120), (6, 128, 90)]},
    {"slug": "claude", "name": "Claude", "category": "文本生成", "rating": 4.7,
     "features": ["超长上下文", "深度分析", "代码能力", "文件上传", "安全可控"],
     "colors": [(120, 80, 200), (80, 50, 160)]},
    {"slug": "deepseek", "name": "DeepSeek", "category": "文本生成", "rating": 4.8,
     "features": ["深度推理", "数学能力", "代码生成", "长文本处理", "开源模型"],
     "colors": [(30, 100, 200), (20, 60, 140)]},
    {"slug": "midjourney", "name": "Midjourney", "category": "图像生成", "rating": 4.7,
     "features": ["文生图", "图生图", "风格控制", "高清输出", "社区画廊"],
     "colors": [(200, 80, 160), (140, 40, 100)]},
    {"slug": "cursor", "name": "Cursor", "category": "编程助手", "rating": 4.7,
     "features": ["AI 驱动编辑器", "代码补全", "智能重构", "多文件编辑", "终端集成"],
     "colors": [(40, 180, 220), (20, 120, 160)]},
    {"slug": "elevenlabs", "name": "ElevenLabs", "category": "音频处理", "rating": 4.7,
     "features": ["语音合成", "声音克隆", "多语言", "语音转语音", "有声书制作"],
     "colors": [(220, 160, 40), (180, 120, 20)]},
]

FPS = 24

# ============================================================
# 场景函数
# ============================================================

def scene_name_card(tool, duration=7):
    """工具名称 + 分类（开场）"""
    bg = make_star_field(W, H, duration, num_stars=80, fps=FPS)

    cards = [
        (tool["name"], 0.5, FONT_TITLE, 100, (255, 255, 255), ('center', H//2 - 80)),
        (tool["category"], 3, FONT_BODY, 45, (180, 180, 200), ('center', H//2 + 30)),
        ("AI 工具评测", 5, FONT_BODY, 30, (120, 120, 140), ('center', H//2 + 90)),
    ]

    clips = [bg]
    for text, start, font, size, color, pos in cards:
        clips.append(_text_clip(
            text, font, size, color, pos, start, duration - start,
            fade_in=0.6, fade_out=0.4, shadow=True
        ))

    return CompositeVideoClip(clips, size=(W, H))


def scene_features(tool, duration=10):
    """功能特点列表（逐条显示）"""
    bg = make_gradient_bg(W, H, duration, [tool["colors"][0], tool["colors"][1]], fps=FPS)

    clips = [bg]

    # 标题
    clips.append(_text_clip(
        "核心功能", FONT_TITLE, 55, (255, 255, 255),
        ('center', 120), 0, duration, fade_in=0.5, fade_out=0.3, shadow=True
    ))

    # 功能列表：每条间隔 1.5 秒出现
    feats = tool["features"]
    start_y = 280
    step = 110
    for i, feat in enumerate(feats):
        t_start = 1.0 + i * 1.5
        bullet = f"  {i+1}. {feat}"
        clips.append(_text_clip(
            bullet, FONT_BODY, 42, (220, 220, 240),
            ('center', start_y + i * step), t_start, duration - t_start,
            fade_in=0.4, fade_out=0.2, shadow=False
        ))

    return CompositeVideoClip(clips, size=(W, H))


def scene_rating(tool, duration=5):
    """评分 + 结尾"""
    bg = make_gradient_bg(W, H, duration,
                          [(10, 10, 40), tool["colors"][1]], fps=FPS)

    stars = "★" * int(round(tool["rating"])) + "☆" * (5 - int(round(tool["rating"])))
    rating_text = f"{tool['rating']} / 5.0"

    clips = [bg]
    clips.append(_text_clip(
        "评分", FONT_BODY, 40, (180, 180, 200),
        ('center', H//2 - 120), 0, duration, fade_in=0.3
    ))
    clips.append(_text_clip(
        stars, FONT_TITLE, 90, (255, 200, 50),
        ('center', H//2 - 30), 0.5, duration - 0.5,
        fade_in=0.5, fade_out=0.3, shadow=True
    ))
    clips.append(_text_clip(
        rating_text, FONT_BODY, 40, (200, 200, 200),
        ('center', H//2 + 50), 1.5, duration - 1.5,
        fade_in=0.4, shadow=False
    ))
    clips.append(_text_clip(
        "AI-Tools-Hub", FONT_BODY, 24, (100, 100, 120),
        ('center', H - 60), 2.5, duration - 2.5,
        fade_in=0.5, shadow=False
    ))

    return CompositeVideoClip(clips, size=(W, H))


def generate_audio(segment_times):
    """生成背景音乐——从现有项目复用"""
    from audio import make_background_music
    return make_background_music(segment_times)


def make_tool_review(tool):
    """为单个工具生成完整评测视频（约 22 秒）"""
    SEGMENTS = [
        (scene_name_card, 7, "intro"),
        (scene_features, 10, "grand"),
        (scene_rating, 5, "tribute"),
    ]

    scenes = []
    seg_times = []
    current_time = 0
    for fn, dur, mood in SEGMENTS:
        clip = fn(tool, dur).subclipped(0, dur)
        scenes.append(clip)
        seg_times.append((current_time, dur, mood))
        current_time += dur

    video = concatenate_videoclips(scenes, padding=-0.2)

    try:
        audio = generate_audio(seg_times)
        video = video.with_audio(audio)
    except Exception as e:
        print(f"  [警告] 音频生成失败: {e}")

    return video


def main():
    args = sys.argv[1:]
    target_slug = args[0] if args else None

    tools_to_process = [t for t in TOOLS if t["slug"] == target_slug] if target_slug else TOOLS

    for tool in tools_to_process:
        output_path = os.path.join(OUTPUT_DIR, f"{tool['slug']}_review.mp4")
        if os.path.exists(output_path):
            print(f"  [跳过] {tool['name']} — 已存在")
            continue

        print(f"  [生成] {tool['name']}...")
        try:
            clip = make_tool_review(tool)
            clip.write_videofile(
                output_path,
                fps=FPS,
                codec="libx264",
                audio_codec="aac",
                bitrate="4000k",
                threads=2,
                logger=None
            )
            size_mb = os.path.getsize(output_path) / 1024 / 1024
            print(f"  [完成] {tool['name']} → {output_path} ({size_mb:.1f} MB)")
        except Exception as e:
            print(f"  [错误] {tool['name']}: {e}")


if __name__ == "__main__":
    main()
