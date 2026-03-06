# 图片资源说明

此目录存放应用所需的图片资源。

## 必需的图片资源

以下图片需要从 xingchen-agent 项目复制或自行准备：

### 应用图标
- `logo.png` - 应用图标 (128x128)

### 界面图标
- `icon-back.svg` - 返回按钮图标
- `new-chat.svg` - 新建对话图标
- `icon-thinking.svg` - 思考中图标
- `icon-refresh.svg` - 刷新重试图标
- `icon-next.svg` - 跳转到底部图标
- `icon-intro-star.svg` - 引导问题星标图标

### 输入框图标
- `icon-typing-idle.svg` - 输入框空闲状态图标
- `icon-typing-active.svg` - 输入框激活状态图标
- `icon-typing-paused.svg` - 输入框暂停状态图标

## 图片规格建议

- SVG 图标：24x24 或 32x32
- PNG 图标：使用 2x 或 3x 分辨率
- 应用图标：128x128 (PNG)

## 复制命令

如果要从 xingchen-agent 复制图片资源：

```bash
# Windows PowerShell
Copy-Item -Recurse "xingchen-agent/src/assets/images/*" "template-v2/src/assets/images/"

# Linux/Mac
cp -r xingchen-agent/src/assets/images/* template-v2/src/assets/images/
```
