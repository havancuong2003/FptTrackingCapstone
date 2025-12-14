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
      alert('Unable to load email settings. Please try again.');
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
      newErrors.mail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailSettings.mail)) {
      newErrors.mail = 'Invalid email format';
    }

    if (!mailSettings.displayName || !mailSettings.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    // Password chỉ validate khi có giá trị (cho phép để trống nếu không muốn đổi)
    if (mailSettings.password && mailSettings.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
        setSuccessMessage('Email settings updated successfully!');
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
        alert(response.message || 'Error updating email settings');
      }
    } catch (error) {
      alert(error.message || 'Unable to update email settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!testEmailAddress || !testEmailAddress.trim()) {
      setTestError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress.trim())) {
      setTestError('Invalid email format');
      return;
    }

    setTesting(true);
    setTestError('');
    setTestSuccess('');
    
    try {
      const response = await testEmail(testEmailAddress.trim());
      
      if (response.status === 200) {
        setTestSuccess(`Test email sent successfully to ${testEmailAddress.trim()}. Please check your inbox.`);
        // Clear email sau 3 giây
        setTimeout(() => {
          setTestEmailAddress('');
        }, 3000);
      } else {
        setTestError(response.message || 'Unable to send test email. Please check your settings.');
      }
    } catch (error) {
      setTestError(error.message || 'Unable to send test email. Please check your email settings.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>System Management</h1>
        <p>Manage system settings: email, maintenance, backup, troubleshooting.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.emailCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Email Settings</h2>
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <FormField 
                label="Email" 
                error={errors.mail}
                hint="Email address used to send notifications (e.g., example@fpt.edu.vn)"
              >
                <Input
                  type="email"
                  value={mailSettings.mail}
                  onChange={(e) => handleInputChange('mail', e.target.value)}
                  placeholder="Enter email address"
                  disabled={!isEditing || saving}
                  readOnly={!isEditing}
                />
              </FormField>

              <FormField 
                label="Display Name" 
                error={errors.displayName}
                hint="Display name in sent emails (e.g., FPTTrackingSystem)"
              >
                <Input
                  type="text"
                  value={mailSettings.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Enter display name"
                  disabled={!isEditing || saving}
                  readOnly={!isEditing}
                />
              </FormField>

              {isEditing && (
                <FormField 
                  label="Password" 
                  error={errors.password}
                  hint="Enter new password if you want to change it (leave blank to keep current)"
                >
                  <Input
                    type="password"
                    value={mailSettings.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter new password (if changing)"
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
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      loading={saving}
                      disabled={saving}
                    >
                      Save Settings
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
            Enter an email address to test if email settings are working correctly.
          </p>
          
          <form onSubmit={handleTestEmail} className={styles.testForm}>
            <FormField 
              label="Test Email Address" 
              error={testError}
              hint="Enter email address to receive test email"
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
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={testing}
                disabled={testing || !testEmailAddress.trim()}
              >
                Send Test Email
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
} 