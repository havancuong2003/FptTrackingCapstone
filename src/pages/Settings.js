import React from 'react';
import styles from './Settings.module.scss';
import useForm from '../hooks/useForm';
import Button from '../components/Button/Button';
import { required, email } from '../utils/validate';
import FormField from '../components/FormField/FormField';

export default function Settings() {
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm({
    initialValues: { displayName: '', email: '' },
    validators: {
      displayName: [required()],
      email: [required(), email()],
    },
    onSubmit: async (values) => {
      await new Promise(r => setTimeout(r, 400));
      setSubmitted(true);
    }
  });

  return (
    <div className={styles.wrap}>
      <h1>Settings</h1>
      {submitted && <div>Đã lưu cài đặt!</div>}
      <form onSubmit={form.handleSubmit}>
        <FormField label="Display name" hint="Tên hiển thị của bạn." error={form.touched.displayName && form.errors.displayName}>
          <input type="text" {...form.register('displayName')} />
        </FormField>

        <FormField label="Email" hint="Email để liên hệ." error={form.touched.email && form.errors.email}>
          <input type="email" {...form.register('email')} />
        </FormField>

        <Button type="submit">Lưu</Button>
      </form>
    </div>
  );
}
