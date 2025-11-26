module.exports = {
  // 是否启用邮件通知
  enabled: true, // 改为 true 启用
  
  // SMTP 服务器配置
  smtp: {
    host: 'smtp.qq.com',        // SMTP 服务器地址
    port: 587,                      // SMTP 端口 (587 或 465)
    secure: false,                  // true for 465, false for other ports
    auth: {
      user: '44055732@qq.com', // 你的邮箱地址
      pass: 'nuwvliwpszkcbheb'     // 你的邮箱密码或应用专用密码
    }
  },
  
  // 发件人信息
  from: '"币安价格提醒" <44055732@qq.com>',
  
  // 收件人邮箱（接收提醒的邮箱）
  to: '184322331@qq.com',
  
  // 邮件主题前缀
  subjectPrefix: '[币安提醒]',
  
  // 邮件节流时间（分钟）- 防止频繁发送
  throttleMinutes: 5
};
