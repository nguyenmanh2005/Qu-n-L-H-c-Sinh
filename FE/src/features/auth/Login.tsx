import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  username: z.string().min(1, 'Username không được để trống'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();
  const { login } = useAuthStore();

  // State quản lý UI giống như file HTML
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setMessage('Đang đăng nhập...');
    setMessageColor('text-blue-600');

    try {
      const res = await loginApi(data.username, data.password);
      
      // Lưu thông tin vào store (hoạt động tương tự localStorage)
      login(res.token, {
        userId: res.userId,
        username: res.username,
        role: res.role,
      });

      setMessage('Đăng nhập thành công!');
      setMessageColor('text-green-600');

      // Set timeout 800ms giống file HTML để user kịp nhìn thấy thông báo thành công
      setTimeout(() => {
        if (res.role === 'Admin') navigate('/admin');
        else if (res.role === 'Teacher') navigate('/teacher');
        else navigate('/student');
      }, 800);

    } catch (err: any) {
      setMessage(err.response?.data?.message || err.message || 'Sai tài khoản hoặc mật khẩu');
      setMessageColor('text-red-500');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      {/* Container - max-w-[400px] giống hệt HTML */}
      <div className="bg-white p-8 rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.1)] w-full max-w-[400px] text-center">
        <h2 className="text-2xl font-bold mb-6">Đăng nhập</h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username */}
          <div className="mb-4 text-left">
            <input
              {...register('username')}
              placeholder="Username hoặc Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
          </div>

          {/* Password wrapper có con mắt ẩn/hiện */}
          <div className="mb-6 text-left relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-500 pr-10"
            />
            <span 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 select-none"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? 'mở' : 'đóng'}
            </span>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Nút Login - Màu xanh lá #4CAF50 giống HTML */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#4CAF50] text-white py-3 rounded-md hover:bg-green-600 transition disabled:bg-[#aaa] disabled:cursor-not-allowed text-base font-medium"
          >
            Đăng nhập
          </button>

          {/* Message hiển thị kết quả */}
          <p className={`mt-4 font-bold min-h-[24px] ${messageColor}`}>
            {message}
          </p>
        </form>

        {/* Links giống HTML */}
        <div className="mt-5 text-sm flex flex-col gap-2">
          <Link to="/register" className="text-blue-600 hover:underline">
            Chưa có tài khoản? Đăng ký
          </Link>
          <Link to="#" className="text-blue-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
      </div>
    </div>
  );
}