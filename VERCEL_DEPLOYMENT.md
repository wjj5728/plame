# Vercel 部署指南 - 邮件功能

## 🚨 Vercel 邮件功能常见问题

### 问题：本地测试正常，部署到 Vercel 后邮件功能不生效

这是一个常见问题，主要原因如下：

### 1. **Serverless 函数超时限制**
- **免费版**：10 秒超时
- **Pro 版**：60 秒超时
- SMTP 连接和发送可能超过 10 秒

### 2. **网络限制**
- Vercel 的 Serverless 环境可能限制某些出站连接
- 某些 SMTP 端口可能被阻止
- 防火墙策略可能阻止 SMTP 连接

### 3. **SMTP 端口选择**
- **587 端口 (STARTTLS)**：可能被限制
- **465 端口 (SSL/TLS)**：通常更可靠 ✅ 推荐

## 🛠️ 解决方案

### 方案 1：使用 SSL/TLS (465 端口) ⭐ 推荐

在邮件配置中修改：

```javascript
{
  smtp: {
    host: 'smtp.qq.com',
    port: 465,        // 改为 465
    secure: true,     // 改为 true
    auth: {
      user: 'your-email@qq.com',
      pass: 'your-auth-code'
    }
  }
}
```

### 方案 2：查看 Vercel 日志

1. 登录 Vercel Dashboard
2. 进入你的项目
3. 点击 "Functions" 标签
4. 查看函数执行日志
5. 搜索 `[邮件测试]` 或 `[邮件发送]` 关键词
6. 查看详细错误信息

### 方案 3：使用第三方邮件服务 ⭐⭐⭐ 最佳方案

考虑使用专业的邮件发送服务，它们更适合 Serverless 环境：

#### Resend (推荐)
- 免费额度：3000 封/月
- 专为开发者设计
- 简单的 API
- 官网：https://resend.com

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'alerts@yourdomain.com',
  to: ['user@example.com'],
  subject: '[币安提醒] 价格告警',
  html: '<p>价格告警内容</p>'
});
```

#### SendGrid
- 免费额度：100 封/天
- 官网：https://sendgrid.com

#### Mailgun
- 免费额度：5000 封/月（前 3 个月）
- 官网：https://www.mailgun.com

## 📊 调试步骤

### 1. 检查 Vercel 日志

部署后，在 Vercel Dashboard 查看实时日志：

```
[邮件测试] 开始测试邮件配置
[邮件测试] SMTP 主机: smtp.qq.com
[邮件测试] SMTP 端口: 587
[邮件测试] 收件人数量: 1
[邮件测试] 测试结果: 失败
[邮件测试] 失败原因: 邮件配置测试失败: connect ETIMEDOUT
```

### 2. 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|---------|
| `ETIMEDOUT` | 连接超时 | 尝试使用 465 端口 (SSL) |
| `ECONNREFUSED` | 连接被拒绝 | SMTP 服务器可能被防火墙阻止 |
| `EAUTH` | 认证失败 | 检查邮箱和授权码 |
| `ENOTFOUND` | 服务器地址无效 | 检查 SMTP 主机地址 |
| `ESOCKET` | Socket 错误 | 网络连接问题 |

### 3. 测试配置

在 UI 界面点击"测试配置"按钮，查看返回的错误信息。

## 🔧 配置建议

### QQ 邮箱配置（推荐）

```javascript
{
  smtp: {
    host: 'smtp.qq.com',
    port: 465,           // 使用 SSL 端口
    secure: true,        // 启用 SSL
    auth: {
      user: 'your-email@qq.com',
      pass: 'authorization-code'  // 不是登录密码！
    }
  }
}
```

### 163 邮箱配置

```javascript
{
  smtp: {
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
      user: 'your-email@163.com',
      pass: 'authorization-code'
    }
  }
}
```

### Gmail 配置

```javascript
{
  smtp: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'app-password'  // 需要开启两步验证并生成应用专用密码
    }
  }
}
```

## ⚠️ 重要提示

1. **授权码不是登录密码**
   - QQ 邮箱：在邮箱设置 → 账户 → 开启 SMTP 服务 → 生成授权码
   - 163 邮箱：在邮箱设置 → POP3/SMTP/IMAP → 开启 SMTP 服务

2. **端口选择**
   - 优先使用 465 (SSL/TLS)
   - 避免使用 587 (STARTTLS) 在 Vercel 上

3. **超时限制**
   - 免费版 Vercel 有 10 秒限制
   - 邮件发送通常在 2-5 秒内完成
   - 如果经常超时，考虑使用第三方服务

4. **安全性**
   - 不要在代码中硬编码邮箱密码
   - 使用环境变量存储敏感信息（如果需要）
   - 当前配置存储在浏览器 localStorage 中

## 🎯 最佳实践

### 生产环境推荐方案

1. **使用 Resend 或 SendGrid**
   - 更可靠
   - 更快速
   - 更适合 Serverless
   - 有详细的发送统计

2. **配置环境变量**
   ```bash
   # Vercel 环境变量
   RESEND_API_KEY=your_api_key
   ```

3. **监控和日志**
   - 定期检查 Vercel 日志
   - 设置告警通知

## 📞 获取帮助

如果问题仍然存在：

1. 查看 Vercel 函数日志中的详细错误信息
2. 尝试不同的 SMTP 端口（465 vs 587）
3. 考虑切换到第三方邮件服务
4. 检查邮箱服务商的 SMTP 设置文档

## 🔗 相关资源

- [Vercel Serverless Functions 文档](https://vercel.com/docs/functions)
- [Nodemailer 文档](https://nodemailer.com/)
- [Resend 文档](https://resend.com/docs)
- [QQ 邮箱 SMTP 设置](https://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256)
