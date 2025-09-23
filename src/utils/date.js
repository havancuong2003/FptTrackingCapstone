import dayjs from 'dayjs';
export const formatDate = (value, format = 'YYYY-MM-DD HH:mm') => dayjs(value).format(format);
export default dayjs; 