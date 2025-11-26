# 更新日志

## [新增功能] 邮件通知系统

### 功能说明

为币安价格监控系统添加了完整的邮件通知功能，当价格告警触发时可以自动发送邮件通知。

### 新增内容

#### 1. 邮件服务模块
- **文件**: `lib/emailService.ts`
- **功能**: 
  - 发送价格告警邮件
  - 测试邮件配置
  - 邮件发送节流控制
  - 精美的 HTML 邮件模板

#### 2. API 路由
- **发送邮件**: `/api/email/send` (POST)
  - 接收告警信息并发送邮件
  - 支持邮件配置验证
  
- **测试配置**: `/api/email/test` (POST)
  - 测试 SMTP 配置是否正确
  - 发送测试邮件

#### 3. 邮件配置组件
- **文件**: `components/EmailConfigDialog.tsx`
- **功能**:
  - 可视化配置邮件参数
  - SMTP 服务器配置
  - 发件人和收件人设置
  - 邮件节流时间设置
  - 一键测试配置

#### 4. 告警系统增强
- **文件**: `hooks/usePriceAlert.ts`
- **更新**: 
  - 集成邮件通知功能
  - 告警触发时自动发送邮件
  - 支持单个告警的邮件开关

- **文件**: `components/AlertDialog.tsx`
- **更新**:
  - 添加"同时发送邮件通知"选项
  - 显示邮件通知状态标识
  - 告警列表显示邮件图标

#### 5. 类型定义更新
- **文件**: `lib/types.ts`
- **新增**:
  - `EmailConfig` 接口
  - `PriceAlert.emailNotification` 字段

#### 6. 工具函数
- **文件**: `lib/utils.ts`
- **新增**:
  - `saveEmailConfig()` - 保存邮件配置
  - `loadEmailConfig()` - 加载邮件配置

#### 7. 文档
- **文件**: `EMAIL_SETUP.md`
- **内容**: 详细的邮件功能使用说明和配置指南

### 依赖包

新增以下 npm 包：
- `nodemailer` - 邮件发送库
- `@types/nodemailer` - TypeScript 类型定义

### 使用方法

1. **配置邮件**
   - 点击主页右上角"邮件配置"按钮
   - 填写 SMTP 服务器信息
   - 填写发件邮箱和授权码
   - 填写收件邮箱
   - 点击"测试配置"验证
   - 保存配置

2. **创建带邮件通知的告警**
   - 在交易对卡片点击"告警设置"
   - 设置告警条件
   - 勾选"同时发送邮件通知"
   - 添加告警

3. **接收邮件通知**
   - 当价格触发告警时
   - 自动发送邮件到配置的收件邮箱
   - 邮件包含完整的告警信息

### 特性

✅ 支持多种邮箱服务商（QQ、163、Gmail 等）  
✅ 精美的 HTML 邮件模板  
✅ 邮件发送节流机制（防止频繁发送）  
✅ 配置测试功能  
✅ 本地存储配置（安全）  
✅ 单个告警可选择是否发送邮件  
✅ 详细的使用文档  

### 安全说明

- 邮件配置存储在浏览器 localStorage
- 不会上传到服务器
- 建议使用邮箱授权码而非密码
- 支持 TLS/SSL 加密连接

### 配置示例

```javascript
{
  enabled: true,
  smtp: {
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@qq.com',
      pass: 'your-authorization-code'
    }
  },
  from: '"币安价格提醒" <your-email@qq.com>',
  to: 'receiver@example.com',
  subjectPrefix: '[币安提醒]',
  throttleMinutes: 5
}
```

### 注意事项

1. QQ 邮箱、163 邮箱等需要使用授权码，不是登录密码
2. 首次使用需要在邮箱设置中开启 SMTP 服务
3. 邮件可能被邮箱服务商拦截，请检查垃圾邮件文件夹
4. 建议使用专门的邮箱账号用于发送通知

### 相关文件

```
plame/
├── app/
│   └── api/
│       └── email/
│           ├── send/
│           │   └── route.ts          # 发送邮件 API
│           └── test/
│               └── route.ts          # 测试配置 API
├── components/
│   ├── AlertDialog.tsx               # 告警对话框（已更新）
│   └── EmailConfigDialog.tsx         # 邮件配置对话框（新增）
├── hooks/
│   └── usePriceAlert.ts              # 价格告警 Hook（已更新）
├── lib/
│   ├── emailService.ts               # 邮件服务（新增）
│   ├── types.ts                      # 类型定义（已更新）
│   └── utils.ts                      # 工具函数（已更新）
├── EMAIL_SETUP.md                    # 使用说明（新增）
└── CHANGELOG.md                      # 更新日志（本文件）
```

### 后续优化建议

- [ ] 添加邮件模板自定义功能
- [ ] 支持多个收件人
- [ ] 添加邮件发送历史记录
- [ ] 支持邮件内容自定义
- [ ] 添加邮件发送统计
