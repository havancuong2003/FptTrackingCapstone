import React, { useState, useEffect } from 'react';
import { getAISettings, updateAISettings } from '../../../api/ai';
import FormField from '../../../components/FormField/FormField';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import styles from './index.module.scss';

export default function AISettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiSettings, setAISettings] = useState({
    name: '',
    secretKey: ''
  });
  const [originalSettings, setOriginalSettings] = useState({
    name: '',
    secretKey: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load AI settings khi component mount
  useEffect(() => {
    loadAISettings();
  }, []);

  const loadAISettings = async () => {
    setLoading(true);
    try {
      const response = await getAISettings();
      if (response.status === 200 && response.data) {
        const settings = {
          name: response.data.name || '',
          secretKey: response.data.secretKey || ''
        };
        setAISettings(settings);
        setOriginalSettings(settings);
        // Tắt chế độ edit khi load lại
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      alert('Unable to load AI settings. Please try again.');
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
    setAISettings({
      name: originalSettings.name,
      secretKey: originalSettings.secretKey
    });
    setIsEditing(false);
    setErrors({});
    setSuccessMessage('');
  };

  const handleInputChange = (field, value) => {
    setAISettings(prev => ({
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
    
    if (!aiSettings.name || !aiSettings.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!aiSettings.secretKey || !aiSettings.secretKey.trim()) {
      newErrors.secretKey = 'Secret Key is required';
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
      const payload = {
        name: aiSettings.name.trim(),
        secretKey: aiSettings.secretKey.trim()
      };

      const response = await updateAISettings(payload);
      
      if (response.status === 200) {
        setSuccessMessage('AI settings updated successfully!');
        // Tắt chế độ edit sau khi lưu thành công
        setIsEditing(false);
        // Reload để lấy dữ liệu mới nhất
        setTimeout(() => {
          loadAISettings();
        }, 500);
      } else {
        alert(response.message || 'Error updating AI settings');
      }
    } catch (error) {
      console.error('Error updating AI settings:', error);
      alert(error.message || 'Unable to update AI settings. Please try again.');
    } finally {
      setSaving(false);
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
        <h1>AI Settings</h1>
        <p>Manage AI settings: name and secret key.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>AI Settings</h2>
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <FormField 
                label="Name" 
                error={errors.name}
                hint="Name of the AI service"
              >
                <Input
                  type="text"
                  value={aiSettings.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter AI service name"
                  disabled={!isEditing || saving}
                  readOnly={!isEditing}
                />
              </FormField>

              <FormField 
                label="Secret Key" 
                error={errors.secretKey}
                hint="Secret key for authenticating with AI service"
              >
                <Input
                  type="password"
                  value={aiSettings.secretKey}
                  onChange={(e) => handleInputChange('secretKey', e.target.value)}
                  placeholder="Enter secret key"
                  disabled={!isEditing || saving}
                  readOnly={!isEditing}
                />
              </FormField>

              {successMessage && (
                <div className={styles.successMessage}>
                  {successMessage}
                </div>
              )}

              <div className={styles.actions}>
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
    </div>
  );
}

