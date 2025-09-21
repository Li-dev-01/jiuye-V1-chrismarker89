"""
PNG卡片生成服务
将问卷心声和故事内容转换为不同风格的PNG卡片
"""

import os
import json
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import textwrap
import requests
from dataclasses import dataclass

@dataclass
class CardStyle:
    """卡片风格配置"""
    name: str
    width: int
    height: int
    background_color: str
    text_color: str
    accent_color: str
    font_family: str
    font_size_title: int
    font_size_content: int
    font_size_meta: int
    padding: int
    border_radius: int

@dataclass
class ContentData:
    """内容数据"""
    content_type: str  # 'heart_voice' or 'story'
    title: str
    content: str
    author_name: str
    created_at: str
    tags: List[str] = None
    emotion_score: float = None

class PNGCardGenerator:
    """PNG卡片生成器"""
    
    def __init__(self, r2_config: Dict = None):
        self.r2_config = r2_config or {}
        self.styles = self._init_card_styles()
        self.fonts_cache = {}
        
    def _init_card_styles(self) -> Dict[str, CardStyle]:
        """初始化卡片风格"""
        return {
            'style_1': CardStyle(
                name='经典风格',
                width=800, height=600,
                background_color='#ffffff',
                text_color='#333333',
                accent_color='#1890ff',
                font_family='SimHei',
                font_size_title=24,
                font_size_content=16,
                font_size_meta=12,
                padding=40,
                border_radius=12
            ),
            'style_2': CardStyle(
                name='温暖风格',
                width=800, height=600,
                background_color='#fef7e6',
                text_color='#8b4513',
                accent_color='#ff7f50',
                font_family='SimHei',
                font_size_title=26,
                font_size_content=18,
                font_size_meta=14,
                padding=50,
                border_radius=16
            ),
            'style_3': CardStyle(
                name='现代风格',
                width=900, height=700,
                background_color='#f8f9fa',
                text_color='#2c3e50',
                accent_color='#e74c3c',
                font_family='SimHei',
                font_size_title=28,
                font_size_content=20,
                font_size_meta=16,
                padding=60,
                border_radius=20
            ),
            'minimal': CardStyle(
                name='简约风格',
                width=600, height=400,
                background_color='#ffffff',
                text_color='#000000',
                accent_color='#666666',
                font_family='SimHei',
                font_size_title=20,
                font_size_content=14,
                font_size_meta=10,
                padding=30,
                border_radius=8
            ),
            'colorful': CardStyle(
                name='彩色风格',
                width=1000, height=800,
                background_color='linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                text_color='#ffffff',
                accent_color='#ffd700',
                font_family='SimHei',
                font_size_title=32,
                font_size_content=22,
                font_size_meta=18,
                padding=70,
                border_radius=24
            )
        }
    
    def _get_font(self, font_family: str, size: int) -> ImageFont.FreeTypeFont:
        """获取字体对象（带缓存）"""
        cache_key = f"{font_family}_{size}"
        if cache_key not in self.fonts_cache:
            try:
                # 尝试加载系统字体
                font_paths = [
                    f"/System/Library/Fonts/{font_family}.ttc",  # macOS
                    f"/usr/share/fonts/truetype/dejavu/{font_family}.ttf",  # Linux
                    f"C:/Windows/Fonts/{font_family}.ttf",  # Windows
                    "arial.ttf"  # 备用字体
                ]
                
                font = None
                for path in font_paths:
                    try:
                        font = ImageFont.truetype(path, size)
                        break
                    except:
                        continue
                
                if font is None:
                    font = ImageFont.load_default()
                
                self.fonts_cache[cache_key] = font
            except Exception as e:
                print(f"字体加载失败: {e}")
                self.fonts_cache[cache_key] = ImageFont.load_default()
        
        return self.fonts_cache[cache_key]
    
    def _wrap_text(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
        """文本换行处理"""
        lines = []
        words = text.split()
        current_line = ""
        
        for word in words:
            test_line = current_line + (" " if current_line else "") + word
            bbox = font.getbbox(test_line)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines
    
    def _create_gradient_background(self, width: int, height: int, colors: List[str]) -> Image.Image:
        """创建渐变背景"""
        # 简化实现：使用第一个颜色作为背景
        color = colors[0] if colors else '#ffffff'
        if color.startswith('#'):
            color = color[1:]
        
        # 转换为RGB
        r = int(color[0:2], 16)
        g = int(color[2:4], 16)
        b = int(color[4:6], 16)
        
        image = Image.new('RGB', (width, height), (r, g, b))
        return image
    
    def generate_heart_voice_card(self, content_data: ContentData, style_name: str) -> BytesIO:
        """生成问卷心声卡片"""
        style = self.styles.get(style_name, self.styles['style_1'])
        
        # 创建画布
        if style.background_color.startswith('linear-gradient'):
            # 处理渐变背景
            img = self._create_gradient_background(style.width, style.height, ['#667eea', '#764ba2'])
        else:
            color = style.background_color
            if color.startswith('#'):
                color = color[1:]
            r, g, b = int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16)
            img = Image.new('RGB', (style.width, style.height), (r, g, b))
        
        draw = ImageDraw.Draw(img)
        
        # 获取字体
        title_font = self._get_font(style.font_family, style.font_size_title)
        content_font = self._get_font(style.font_family, style.font_size_content)
        meta_font = self._get_font(style.font_family, style.font_size_meta)
        
        # 解析颜色
        def parse_color(color_str):
            if color_str.startswith('#'):
                color_str = color_str[1:]
            return tuple(int(color_str[i:i+2], 16) for i in (0, 2, 4))
        
        text_color = parse_color(style.text_color)
        accent_color = parse_color(style.accent_color)
        
        # 计算布局
        y_offset = style.padding
        max_text_width = style.width - 2 * style.padding
        
        # 绘制标题
        title = "💭 问卷心声"
        title_bbox = title_font.getbbox(title)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (style.width - title_width) // 2
        draw.text((title_x, y_offset), title, font=title_font, fill=accent_color)
        y_offset += title_bbox[3] - title_bbox[1] + 30
        
        # 绘制内容
        content_lines = self._wrap_text(content_data.content, content_font, max_text_width)
        for line in content_lines[:8]:  # 最多显示8行
            draw.text((style.padding, y_offset), line, font=content_font, fill=text_color)
            line_bbox = content_font.getbbox(line)
            y_offset += line_bbox[3] - line_bbox[1] + 8
        
        # 绘制元信息
        y_offset += 30
        meta_info = f"作者: {content_data.author_name} | {content_data.created_at[:10]}"
        if content_data.emotion_score:
            emotion_text = "😊" if content_data.emotion_score > 0.6 else "😐" if content_data.emotion_score > 0.3 else "😔"
            meta_info += f" | {emotion_text}"
        
        draw.text((style.padding, y_offset), meta_info, font=meta_font, fill=accent_color)
        
        # 绘制装饰边框
        border_width = 3
        draw.rectangle([border_width//2, border_width//2, 
                       style.width-border_width//2, style.height-border_width//2], 
                      outline=accent_color, width=border_width)
        
        # 保存到BytesIO
        output = BytesIO()
        img.save(output, format='PNG', quality=95)
        output.seek(0)
        
        return output
    
    def generate_story_card(self, content_data: ContentData, style_name: str) -> BytesIO:
        """生成故事分享卡片"""
        style = self.styles.get(style_name, self.styles['style_1'])
        
        # 创建画布
        if style.background_color.startswith('linear-gradient'):
            img = self._create_gradient_background(style.width, style.height, ['#667eea', '#764ba2'])
        else:
            color = style.background_color
            if color.startswith('#'):
                color = color[1:]
            r, g, b = int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16)
            img = Image.new('RGB', (style.width, style.height), (r, g, b))
        
        draw = ImageDraw.Draw(img)
        
        # 获取字体
        title_font = self._get_font(style.font_family, style.font_size_title)
        content_font = self._get_font(style.font_family, style.font_size_content)
        meta_font = self._get_font(style.font_family, style.font_size_meta)
        
        # 解析颜色
        def parse_color(color_str):
            if color_str.startswith('#'):
                color_str = color_str[1:]
            return tuple(int(color_str[i:i+2], 16) for i in (0, 2, 4))
        
        text_color = parse_color(style.text_color)
        accent_color = parse_color(style.accent_color)
        
        # 计算布局
        y_offset = style.padding
        max_text_width = style.width - 2 * style.padding
        
        # 绘制标题
        header = "📖 就业故事"
        header_bbox = title_font.getbbox(header)
        header_width = header_bbox[2] - header_bbox[0]
        header_x = (style.width - header_width) // 2
        draw.text((header_x, y_offset), header, font=title_font, fill=accent_color)
        y_offset += header_bbox[3] - header_bbox[1] + 20
        
        # 绘制故事标题
        story_title_lines = self._wrap_text(content_data.title, title_font, max_text_width)
        for line in story_title_lines[:2]:  # 最多显示2行标题
            draw.text((style.padding, y_offset), line, font=title_font, fill=text_color)
            line_bbox = title_font.getbbox(line)
            y_offset += line_bbox[3] - line_bbox[1] + 10
        
        y_offset += 20
        
        # 绘制故事内容
        content_lines = self._wrap_text(content_data.content, content_font, max_text_width)
        for line in content_lines[:10]:  # 最多显示10行内容
            draw.text((style.padding, y_offset), line, font=content_font, fill=text_color)
            line_bbox = content_font.getbbox(line)
            y_offset += line_bbox[3] - line_bbox[1] + 6
        
        # 绘制标签
        if content_data.tags:
            y_offset += 20
            tags_text = " ".join([f"#{tag}" for tag in content_data.tags[:3]])
            draw.text((style.padding, y_offset), tags_text, font=meta_font, fill=accent_color)
            y_offset += 30
        
        # 绘制元信息
        meta_info = f"分享者: {content_data.author_name} | {content_data.created_at[:10]}"
        draw.text((style.padding, y_offset), meta_info, font=meta_font, fill=accent_color)
        
        # 绘制装饰边框
        border_width = 3
        draw.rectangle([border_width//2, border_width//2, 
                       style.width-border_width//2, style.height-border_width//2], 
                      outline=accent_color, width=border_width)
        
        # 保存到BytesIO
        output = BytesIO()
        img.save(output, format='PNG', quality=95)
        output.seek(0)
        
        return output
    
    def upload_to_r2(self, image_data: BytesIO, filename: str) -> Dict[str, str]:
        """上传图片到Cloudflare R2存储"""
        try:
            # 这里需要实现R2上传逻辑
            # 暂时返回模拟结果
            file_path = f"cards/{datetime.now().strftime('%Y/%m/%d')}/{filename}"
            file_url = f"https://your-r2-domain.com/{file_path}"
            
            return {
                'success': True,
                'file_path': file_path,
                'file_url': file_url,
                'file_size': len(image_data.getvalue())
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_all_styles(self, content_data: ContentData) -> Dict[str, Dict]:
        """生成所有风格的卡片"""
        results = {}
        
        for style_name in self.styles.keys():
            try:
                if content_data.content_type == 'heart_voice':
                    image_data = self.generate_heart_voice_card(content_data, style_name)
                elif content_data.content_type == 'story':
                    image_data = self.generate_story_card(content_data, style_name)
                else:
                    continue
                
                # 生成文件名
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{content_data.content_type}_{content_data.title[:20]}_{style_name}_{timestamp}.png"
                filename = "".join(c for c in filename if c.isalnum() or c in '._-')
                
                # 上传到R2
                upload_result = self.upload_to_r2(image_data, filename)
                
                results[style_name] = {
                    'style_name': style_name,
                    'filename': filename,
                    'upload_result': upload_result,
                    'image_size': len(image_data.getvalue())
                }
                
            except Exception as e:
                results[style_name] = {
                    'style_name': style_name,
                    'error': str(e)
                }
        
        return results
