import client from '../../utils/axiosClient';

// ================== Mail Settings ==================

// Get mail settings
export async function getMailSettings() {
  try {
    const response = await client.get('/Mail/mail-settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching mail settings:', error);
    throw error;
  }
}

// Update mail settings
export async function updateMailSettings(mailData) {
  try {
    // Fix cứng host và port theo yêu cầu
    const payload = {
      ...mailData,
      host: 'smtp.gmail.com',
      port: 587
    };
    const response = await client.post('/Mail/mail-settings', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating mail settings:', error);
    throw error;
  }
}

// Test email
export async function testEmail(email) {
  try {
    // Sử dụng API send-mails giống như các phần khác trong hệ thống
    const response = await client.post('/Mail/send-mails', {
      to: [email],
      subject: '[FPT Tracking System] Test Email - Kiểm tra cài đặt email',
      body: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Test thành công!</h2>
          <p>Xin chào,</p>
          <p>Đây là email test từ hệ thống <strong>FPT Tracking System</strong>.</p>
          <p>Nếu bạn nhận được email này, có nghĩa là cài đặt email của hệ thống đang hoạt động bình thường.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Thời gian gửi: ${new Date().toLocaleString('vi-VN')}
          </p>
        </div>
      `,
      cc: []
    });
    return response.data;
  } catch (error) {
    console.error('Error testing email:', error);
    throw error;
  }
}

