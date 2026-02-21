import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

const Register = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    fullName: '',
    role: 'WORKER' // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength <= 1) return '+7';
    if (phoneNumberLength <= 4) {
      return `+7 (${phoneNumber.slice(1, 4)}`;
    }
    if (phoneNumberLength <= 7) {
      return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}`;
    }
    if (phoneNumberLength <= 9) {
      return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}`;
    }
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData({
        ...formData,
        phone: formatPhoneNumber(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clean phone number
    const submitData = {
      ...formData,
      phone: formData.phone.replace(/[^\d]/g, '')
    };

    const result = await api.register(submitData);

    if (result.success) {
      alert('Регистрация успешна! Теперь вы можете войти.');
      navigate('/');
    } else {
      setError(result.message || 'Ошибка регистрации');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800">Регистрация</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Номер телефона</label>
            <input
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+7 (7xx) xxx-xx-xx"
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ФИО</label>
            <input
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Роль</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            >
              <option value="WORKER">Работник</option>
              <option value="FOREMAN">Прораб</option>
              <option value="PM">Администратор</option>
              <option value="ESTIMATOR">Сметчик</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/" className="text-indigo-600 hover:text-indigo-500">
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
