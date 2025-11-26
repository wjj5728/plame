# 修复 "to.join is not a function" 错误

## 🐛 问题描述

错误信息：
```
发送邮件失败: TypeError: e.to.join is not a function
```

## 🔍 原因分析

这个错误发生的原因是：
1. 旧版本的邮件配置中，`to` 字段是**字符串**（单个邮箱）
2. 新版本改为**数组**（支持多个邮箱）
3. 代码尝试对字符串调用 `.join()` 方法导致错误

## ✅ 已修复

代码已经添加了向后兼容性处理：

```typescript
// 兼容旧版本：确保 to 是数组
const recipientArray = Array.isArray(config.to) ? config.to : [config.to];
const recipients = recipientArray.join(', ');
```

这样无论 `config.to` 是字符串还是数组都能正常工作。

## 🔄 如何更新配置

### 方法 1: 重新配置（推荐）

1. 打开应用
2. 点击右上角"邮件配置"按钮
3. 删除旧的收件人（如果显示为单个输入框）
4. 使用新的添加功能重新添加收件人
5. 点击"保存配置"

### 方法 2: 手动清除旧配置

如果遇到问题，可以清除旧配置：

1. 打开浏览器开发者工具（F12）
2. 切换到 "Console" 标签
3. 执行以下命令：

```javascript
// 查看当前配置
console.log(JSON.parse(localStorage.getItem('emailConfig')));

// 清除旧配置（如果需要）
localStorage.removeItem('emailConfig');

// 刷新页面
location.reload();
```

4. 重新配置邮件设置

## 📝 配置格式说明

### 旧格式（字符串）
```json
{
  "to": "user@example.com"
}
```

### 新格式（数组）
```json
{
  "to": ["user1@example.com", "user2@example.com"]
}
```

### 兼容性
代码现在同时支持两种格式，会自动转换：
- 如果是字符串 → 转为单元素数组
- 如果是数组 → 直接使用

## 🎯 验证修复

1. 重新部署代码到 Vercel
2. 打开应用并配置邮件
3. 点击"测试配置"按钮
4. 应该能正常发送测试邮件

## 🔧 开发者说明

如果你在开发中遇到类似问题，确保：

1. **类型定义兼容**
```typescript
export interface EmailConfig {
  to: string | string[]; // 支持两种类型
}
```

2. **使用前转换为数组**
```typescript
const recipientArray = Array.isArray(config.to) ? config.to : [config.to];
```

3. **UI 加载时转换**
```typescript
useEffect(() => {
  const savedConfig = loadEmailConfig();
  if (savedConfig) {
    // 兼容旧版本
    const normalizedConfig = {
      ...savedConfig,
      to: Array.isArray(savedConfig.to) 
        ? savedConfig.to 
        : (savedConfig.to ? [savedConfig.to as string] : [])
    };
    setConfig(normalizedConfig);
  }
}, []);
```

## ✨ 新功能

修复后，您可以：
- ✅ 添加多个收件人邮箱
- ✅ 一键删除收件人
- ✅ 所有收件人同时收到告警邮件
- ✅ 兼容旧的单邮箱配置

## 🚀 下一步

1. 部署更新后的代码
2. 清除浏览器缓存（如果需要）
3. 重新配置邮件设置
4. 测试邮件发送功能

问题应该已经解决！🎉
