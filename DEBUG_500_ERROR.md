# 调试 500 错误指南

## 🔍 如何查看详细错误信息

### 1. 在 Vercel Dashboard 查看日志

1. 登录 https://vercel.com
2. 进入你的项目
3. 点击顶部的 **"Functions"** 标签
4. 点击 **"Logs"** 或 **"Real-time"**
5. 点击"测试配置"按钮触发错误
6. 在日志中搜索以下关键词：
   - `[邮件测试]`
   - `[邮件服务]`
   - `错误`
   - `失败`

### 2. 查看浏览器控制台

1. 按 F12 打开开发者工具
2. 切换到 **"Network"** 标签
3. 点击"测试配置"按钮
4. 找到 `/api/email/test` 请求
5. 查看 **"Response"** 标签中的错误信息

### 3. 本地测试

```bash
npm run dev
```

在本地测试是否正常，对比本地和 Vercel 的差异。

## 🐛 常见 500 错误原因

### 错误 1: 模块导入失败
**症状**: `Cannot find module` 或 `Module not found`

**原因**: 
- `nodemailer` 包未安装
- 构建时依赖缺失

**解决方案**:
```bash
# 确保 nodemailer 在 dependencies 中（不是 devDependencies）
npm install nodemailer
npm install --save-dev @types/nodemailer

# 重新部署
git add .
git commit -m "fix: ensure nodemailer in dependencies"
git push
```

### 错误 2: 环境差异
**症状**: 本地正常，Vercel 报错

**原因**:
- Node.js 版本不同
- 环境变量缺失
- 文件路径大小写问题

**解决方案**:
检查 `package.json` 中的 Node 版本：
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 错误 3: 超时
**症状**: `FUNCTION_INVOCATION_TIMEOUT`

**原因**: 
- Vercel 免费版限制 10 秒
- SMTP 连接太慢

**解决方案**:
- 使用 465 端口（SSL）通常更快
- 考虑使用第三方邮件服务（Resend, SendGrid）

### 错误 4: 网络限制
**症状**: `ETIMEDOUT`, `ECONNREFUSED`

**原因**:
- Vercel 限制某些出站连接
- SMTP 端口被阻止

**解决方案**:
1. 尝试 465 端口（SSL）
2. 使用第三方邮件服务

## 📋 检查清单

### 部署前检查

- [ ] `nodemailer` 在 `dependencies` 中
- [ ] `@types/nodemailer` 在 `devDependencies` 中
- [ ] `package.json` 中指定了 Node 版本
- [ ] 本地测试通过
- [ ] 代码已提交并推送

### 部署后检查

- [ ] 构建成功（无错误）
- [ ] 查看 Vercel 函数日志
- [ ] 检查浏览器控制台错误
- [ ] 测试邮件配置

## 🔧 快速修复步骤

### 步骤 1: 确认依赖
```bash
# 查看 package.json
cat package.json | grep nodemailer

# 应该看到：
# "nodemailer": "^6.9.x"
```

### 步骤 2: 查看日志
在 Vercel 日志中查找：
```
[邮件测试] API 被调用
[邮件测试] 开始解析请求体
[邮件测试] 请求体解析成功
[邮件服务] testEmailConfig 函数被调用
```

如果看不到这些日志，说明函数根本没执行。

### 步骤 3: 检查响应
浏览器控制台应该显示详细错误：
```json
{
  "success": false,
  "message": "服务器错误: ...",
  "errorType": "Error",
  "stack": "..."
}
```

### 步骤 4: 根据错误类型修复

#### 如果是 `Cannot find module 'nodemailer'`
```bash
npm install nodemailer
git add package.json package-lock.json
git commit -m "fix: add nodemailer dependency"
git push
```

#### 如果是 `ETIMEDOUT` 或网络错误
修改邮件配置：
```javascript
{
  smtp: {
    host: 'smtp.qq.com',
    port: 465,        // 改为 465
    secure: true,     // 改为 true
    // ...
  }
}
```

#### 如果是超时
考虑使用 Resend:
```bash
npm install resend
```

## 📞 获取帮助

如果问题仍未解决，请提供以下信息：

1. **Vercel 日志截图**（包含完整的错误堆栈）
2. **浏览器控制台错误**
3. **邮件配置**（隐藏密码）
4. **本地是否正常**
5. **使用的邮箱服务商**（QQ、163、Gmail 等）

## 🎯 推荐解决方案

如果 SMTP 在 Vercel 上持续失败，强烈建议使用 **Resend**：

### 为什么选择 Resend？
- ✅ 专为 Serverless 设计
- ✅ 免费 3000 封/月
- ✅ 简单的 API
- ✅ 无需 SMTP 配置
- ✅ 发送速度快（< 1 秒）
- ✅ 详细的发送日志

### 快速集成
```bash
npm install resend
```

```typescript
// lib/resendService.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlertEmail(to: string[], subject: string, html: string) {
  return await resend.emails.send({
    from: 'alerts@yourdomain.com',
    to,
    subject,
    html
  });
}
```

在 Vercel 环境变量中添加：
```
RESEND_API_KEY=re_xxxxx
```

这样可以完全避免 SMTP 相关的问题！
