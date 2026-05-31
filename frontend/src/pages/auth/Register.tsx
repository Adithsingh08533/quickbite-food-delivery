import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Utensils, Mail, Lock, User, Phone } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import './auth.css';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  role: z.enum(['customer', 'owner']),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError('');
      // Clean up empty phone
      const payload = { ...data, phone: data.phone || undefined };
      const response = await api.post('/auth/register', payload);
      
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      
      if (user.role === 'owner') navigate('/owner');
      else navigate('/');
      
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left" style={{ padding: '1rem 2rem' }}>
        <Link to="/" className="auth-logo" style={{ top: '1.5rem', left: '1.5rem', fontSize: '1.2rem' }}>
          <Utensils color="var(--primary)" size={24} />
          QuickBite
        </Link>
        
        <div className="auth-form-wrapper" style={{ marginTop: '2rem' }}>
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Join us to start ordering or selling</p>
          
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div style={{ padding: '12px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                {serverError}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input type="radio" value="customer" {...register('role')} style={{ display: 'none' }} />
                <div style={{
                  padding: '10px', textAlign: 'center', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedRole === 'customer' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: selectedRole === 'customer' ? 'var(--primary-light)' : 'transparent',
                  fontWeight: selectedRole === 'customer' ? '600' : '400',
                  color: selectedRole === 'customer' ? 'var(--primary)' : 'var(--text-secondary)'
                }}>
                  I'm a Customer
                </div>
              </label>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input type="radio" value="owner" {...register('role')} style={{ display: 'none' }} />
                <div style={{
                  padding: '10px', textAlign: 'center', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedRole === 'owner' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: selectedRole === 'owner' ? 'var(--primary-light)' : 'transparent',
                  fontWeight: selectedRole === 'owner' ? '600' : '400',
                  color: selectedRole === 'owner' ? 'var(--primary)' : 'var(--text-secondary)'
                }}>
                  I'm an Owner
                </div>
              </label>
            </div>

            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User size={18} />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address"
              placeholder="john@example.com"
              type="email"
              leftIcon={<Mail size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number (Optional)"
              placeholder="+919876543210"
              leftIcon={<Phone size={18} />}
              error={errors.phone?.message}
              {...register('phone')}
            />
            
            <Input
              label="Password"
              placeholder="Create a strong password"
              type="password"
              leftIcon={<Lock size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />
            
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-shape shape-1" />
        <div className="auth-shape shape-2" />
        <div className="auth-glass-card">
          <h2>{selectedRole === 'owner' ? 'Partner with us.' : 'Discover new flavors.'}</h2>
          <p>
            {selectedRole === 'owner' 
              ? 'Grow your business by reaching thousands of hungry customers every day.' 
              : 'Sign up to explore top-rated restaurants and get fast delivery.'}
          </p>
        </div>
      </div>
    </div>
  );
};
