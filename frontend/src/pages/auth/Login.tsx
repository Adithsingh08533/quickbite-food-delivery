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
import './auth.css';

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
    <div className="auth-container">
      <div className="auth-left">
        <Link to="/" className="auth-logo">
          <Utensils color="var(--primary)" size={28} />
          QuickBite
        </Link>
        
        <div className="auth-form-wrapper">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Login to order your favorite food</p>
          
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div style={{ padding: '12px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
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
          
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-shape shape-1" />
        <div className="auth-shape shape-2" />
        <div className="auth-glass-card">
          <h2>Hungry? You're in the right place.</h2>
          <p>Get food delivery to your doorstep from thousands of amazing local and national restaurants.</p>
        </div>
      </div>
    </div>
  );
};
