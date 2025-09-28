import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import Select from '../../../components/Select/Select';
import Checkbox from '../../../components/Checkbox/Checkbox';
import RadioGroup from '../../../components/RadioGroup/RadioGroup';
import Switch from '../../../components/Switch/Switch';
import Tooltip from '../../../components/Tooltip/Tooltip';
import Modal from '../../../components/Modal/Modal';
import Card from '../../../components/Card/Card';
import Spinner from '../../../components/Spinner/Spinner';
import FormField from '../../../components/FormField/FormField';

export default function ComponentsDemo() {
  const [checked, setChecked] = React.useState(false);
  const [radio, setRadio] = React.useState('a');
  const [toggle, setToggle] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [select, setSelect] = React.useState('1');
  const [text, setText] = React.useState('');
  const [area, setArea] = React.useState('');

  return (
    <div className={styles.wrap}>
      <h1>Components Demo</h1>

      <div className={styles.grid}>
        <Card title="Button">
          <div className={styles.row}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Loading</Button>
          </div>
        </Card>

        <Card title="Input / Textarea">
          <div className={styles.row}>
            <FormField label="Text" hint="Nhập text">
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Text..." />
            </FormField>
            <FormField label="Textarea" hint="Nhập mô tả">
              <Textarea value={area} onChange={e => setArea(e.target.value)} placeholder="Textarea..." />
            </FormField>
          </div>
        </Card>

        <Card title="Select">
          <Select value={select} onChange={e => setSelect(e.target.value)}>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </Select>
        </Card>

        <Card title="Checkbox / Radio / Switch">
          <div className={styles.row}>
            <Checkbox label="Đồng ý" checked={checked} onChange={setChecked} />
            <RadioGroup name="demo" value={radio} onChange={setRadio} options={[{label:'A', value:'a'}, {label:'B', value:'b'}]} />
            <Switch checked={toggle} onChange={setToggle} label={toggle ? 'Bật' : 'Tắt'} />
          </div>
        </Card>

        <Card title="Tooltip">
          <Tooltip content="Xin chào!">
            <span tabIndex={0} style={{ textDecoration: 'underline', cursor: 'help' }}>Di chuột vào đây</span>
          </Tooltip>
        </Card>

        <Card title="Modal">
          <Button onClick={() => setOpen(true)}>Mở Modal</Button>
          <Modal open={open} onClose={() => setOpen(false)}>
            <h3>Modal Demo</h3>
            <p>Nội dung modal.</p>
            <Button onClick={() => setOpen(false)}>Đóng</Button>
          </Modal>
        </Card>

        <Card title="Spinner">
          <Spinner />
        </Card>
      </div>
    </div>
  );
} 