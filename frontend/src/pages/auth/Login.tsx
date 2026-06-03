import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Utensils, Mail, Lock } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError('');
      const response = await api.post('/auth/login', data);
      
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      
      // Redirect based on role
      if (user.role === 'owner') navigate('/owner');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
      
    } catch (err: any) {
      setServerError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white relative">
        <Link to="/" className="absolute top-8 left-8 text-2xl font-bold text-primary flex items-center gap-2">
          <Utensils color="currentColor" size={28} />
          QuickBite
        </Link>
        
        <div className="w-full max-w-[400px] animate-slide-up mt-12 md:mt-0">
          <h1 className="text-3xl font-bold mb-2 text-text-primary">Welcome back</h1>
          <p className="text-text-secondary mb-8">Login to order your favorite food</p>
          
          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="p-3 bg-error-bg text-error rounded-md text-sm border border-error/20">
                {serverError}
              </div>
            )}
            
            <Input
              label="Email Address"
              placeholder="Enter your email"
              type="email"
              leftIcon={<Mail size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />
            
            <Input
              label="Password"
              placeholder="Enter your password"
              type="password"
              leftIcon={<Lock size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />
            
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Login
            </Button>
          </form>
          
          <div className="mt-6 text-center text-text-secondary text-sm">
            Don't have an account? <Link to="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
          </div>
        </div>
      </div>
      
      <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-gradient-to-br from-primary to-[#ff8a00] text-white p-16 relative overflow-hidden">
        <div className="absolute rounded-full bg-white/10 w-[300px] h-[300px] -top-[100px] -right-[50px]" />
        <div className="absolute rounded-full bg-white/10 w-[200px] h-[200px] -bottom-[50px] -left-[50px]" />
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 max-w-[450px] shadow-2xl animate-slide-up z-10">
          <h2 className="text-4xl font-bold leading-tight mb-4 text-white">Hungry? You're in the right place.</h2>
          <p className="text-lg opacity-90 leading-relaxed text-white/90">Get food delivery to your doorstep from thousands of amazing local and national restaurants.</p>
        </div>
      </div>
    </div>
  );
};
