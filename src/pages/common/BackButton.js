import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.scss';

const BackButton = ({ 
  to, 
  onClick, 
  children = '← Quay lại', 
  variant = 'default',
  size = 'default',
  className = '',
  ...props 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  const buttonClass = [
    styles.backButton,
    variant === 'dark' && styles.backButtonDark,
    size === 'small' && styles.backButtonSmall,
    size === 'large' && styles.backButtonLarge,
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClass}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default BackButton;
