import React, { useState, useEffect } from 'react';
import { getMailSettings, updateMailSettings, testEmail } from '../../../api/mail';
import FormField from '../../../components/FormField/FormField';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import styles from './index.module.scss';

export default function System() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mailSettings, setMailSettings] = useState({
    mail: '',
    displayName: '',
    password: ''
  });
  const [originalSettings, setOriginalSettings] = useState({
    mail: '',
    displayName: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Test email states
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState('');
  const [testSuccess, setTestSuccess] = useState('');

  // Load mail settings khi component mount
  useEffect(() => {
    loadMailSettings();
  }, []);

  const loadMailSettings = async () => {
    setLoading(true);
    try {
      const response = await getMailSettings();
      if (response.status === 200 && response.data) {
        const settings = {
          mail: response.data.mail || '',
          displayName: response.data.displayName || '',
          password: '' // Không load password từ API
        };
        setMailSettings(settings);
        setOriginalSettings({
          mail: settings.mail,
          displayName: settings.displayName
        });
        // Tắt chế độ edit khi load lại
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error loading mail settings:', error);
      alert('Không thể tải cài đặt email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setErrors({});
    setSuccessMessage('');
  };

  const handleCancel = () => {
    // Reset về giá trị ban đầu
    setMailSettings({
      mail: originalSettings.mail,
      displayName: originalSettings.displayName,
      password: ''
    });
    setIsEditing(false);
    setErrors({});
    setSuccessMessage('');
  };

  const handleInputChange = (field, value) => {
    setMailSettings(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error khi user nhập
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!mailSettings.mail || !mailSettings.mail.trim()) {
      newErrors.mail = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailSettings.mail)) {
      newErrors.mail = 'Email không hợp lệ';
    }

    if (!mailSettings.displayName || !mailSettings.displayName.trim()) {
      newErrors.displayName = 'Tên hiển thị không được để trống';
    }

    // Password chỉ validate khi có giá trị (cho phép để trống nếu không muốn đổi)
    if (mailSettings.password && mailSettings.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Chỉ gửi password nếu có giá trị
      const payload = {
        mail: mailSettings.mail.trim(),
        displayName: mailSettings.displayName.trim()
      };
      
      // Chỉ thêm password nếu user nhập
      if (mailSettings.password && mailSettings.password.trim()) {
        payload.password = mailSettings.password;
      }

      const response = await updateMailSettings(payload);
      
      if (response.status === 200) {
        setSuccessMessage('Cập nhật cài đặt email thành công!');
        // Clear password field sau khi lưu thành công
        setMailSettings(prev => ({
          ...prev,
          password: ''
        }));
        // Tắt chế độ edit sau khi lưu thành công
        setIsEditing(false);
        // Reload để lấy dữ liệu mới nhất
        setTimeout(() => {
          loadMailSettings();
        }, 500);
      } else {
        alert(response.message || 'Có lỗi xảy ra khi cập nhật cài đặt email');
      }
    } catch (error) {
      console.error('Error updating mail settings:', error);
      alert(error.message || 'Không thể cập nhật cài đặt email. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!testEmailAddress || !testEmailAddress.trim()) {
      setTestError('Email không được để trống');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress.trim())) {
      setTestError('Email không hợp lệ');
      return;
    }

    setTesting(true);
    setTestError('');
    setTestSuccess('');
    
    try {
      const response = await testEmail(testEmailAddress.trim());
      
      if (response.status === 200) {
        setTestSuccess(`Email test đã được gửi thành công đến ${testEmailAddress.trim()}. Vui lòng kiểm tra hộp thư đến.`);
        // Clear email sau 3 giây
        setTimeout(() => {
          setTestEmailAddress('');
        }, 3000);
      } else {
        setTestError(response.message || 'Không thể gửi email test. Vui lòng kiểm tra lại cài đặt.');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      setTestError(error.message || 'Không thể gửi email test. Vui lòng kiểm tra lại cài đặt email.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Quản lý hệ thống</h1>
        <p>Quản lý cài đặt hệ thống: email, bảo trì, backup, xử lý sự cố.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.emailCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Cài đặt Email</h2>
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <FormField 
                label="Email" 
                error={errors.mail}
                hint="Email dùng để gửi thông báo (ví dụ: gioidmhe171512@fpt.edu.vn)"
              >
                <Input
                  type="email"
                  value={mailSettings.mail}
                  onChange={(e) => handleInputChange('mail', e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  disabled={!isEditing || saving}
                  readOnly={!isEditing}
                />
              </FormField>

              <FormField 
                label="Tên hiển thị" 
                error={errors.displayName}
                hint="Tên hiển thị trong email gửi đi (ví dụ: FPTTrackingSystem)"
              >
                <Input
                  type="text"
                  value={mailSettings.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Nhập tên hiển thị"
                  disabled={!isEditing || saving}
                  readOnly={!isEditing}
                />
              </FormField>

              {isEditing && (
                <FormField 
                  label="Mật khẩu" 
                  error={errors.password}
                  hint="Nhập mật khẩu mới nếu muốn thay đổi (để trống nếu giữ nguyên)"
                >
                  <Input
                    type="password"
                    value={mailSettings.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Nhập mật khẩu mới (nếu muốn thay đổi)"
                    disabled={saving}
                  />
                </FormField>
              )}

              {successMessage && (
                <div className={styles.successMessage}>
                  {successMessage}
                </div>
              )}

              <div className={styles.actions}>
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setTestModalOpen(true)}
                  disabled={saving || isEditing}
                >
                  Test Email
                </Button>
                {!isEditing ? (
                  <Button 
                    type="button"
                    variant="primary"
                    onClick={handleEdit}
                    disabled={saving}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      loading={saving}
                      disabled={saving}
                    >
                      Lưu cài đặt
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      <Modal open={testModalOpen} onClose={() => {
        setTestModalOpen(false);
        setTestEmailAddress('');
        setTestError('');
        setTestSuccess('');
      }}>
        <div className={styles.testModal}>
          <h2 className={styles.testModalTitle}>Test Email</h2>
          <p className={styles.testModalDescription}>
            Nhập địa chỉ email để kiểm tra xem cài đặt email có hoạt động không.
          </p>
          
          <form onSubmit={handleTestEmail} className={styles.testForm}>
            <FormField 
              label="Email nhận test" 
              error={testError}
              hint="Nhập địa chỉ email để nhận email test"
            >
              <Input
                type="email"
                value={testEmailAddress}
                onChange={(e) => {
                  setTestEmailAddress(e.target.value);
                  setTestError('');
                  setTestSuccess('');
                }}
                placeholder="example@fpt.edu.vn"
                disabled={testing}
                autoFocus
              />
            </FormField>

            {testSuccess && (
              <div className={styles.testSuccessMessage}>
                {testSuccess}
              </div>
            )}

            <div className={styles.testModalActions}>
              <Button 
                type="button"
                variant="ghost"
                onClick={() => {
                  setTestModalOpen(false);
                  setTestEmailAddress('');
                  setTestError('');
                  setTestSuccess('');
                }}
                disabled={testing}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={testing}
                disabled={testing || !testEmailAddress.trim()}
              >
                Gửi Email Test
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
} 