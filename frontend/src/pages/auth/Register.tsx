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
    <div className="min-h-screen flex bg-gray-50">
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-8 bg-white relative">
        <Link to="/" className="absolute top-6 md:top-8 left-6 md:left-8 text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
          <Utensils color="currentColor" size={24} />
          QuickBite
        </Link>
        
        <div className="w-full max-w-[400px] animate-slide-up mt-16 md:mt-0 py-8">
          <h1 className="text-3xl font-bold mb-2 text-text-primary">Create an account</h1>
          <p className="text-text-secondary mb-6 md:mb-8">Join us to start ordering or selling</p>
          
          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="p-3 bg-error-bg text-error rounded-md text-sm border border-error/20">
                {serverError}
              </div>
            )}
            
            <div className="flex gap-3 mb-2">
              <label className="flex-1 cursor-pointer">
                <input type="radio" value="customer" {...register('role')} className="hidden" />
                <div className={`p-2.5 text-center rounded-md border-2 transition-colors ${
                  selectedRole === 'customer' 
                    ? 'border-primary bg-primary/10 font-semibold text-primary' 
                    : 'border-border bg-transparent font-normal text-text-secondary hover:border-gray-300'
                }`}>
                  I'm a Customer
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" value="owner" {...register('role')} className="hidden" />
                <div className={`p-2.5 text-center rounded-md border-2 transition-colors ${
                  selectedRole === 'owner' 
                    ? 'border-primary bg-primary/10 font-semibold text-primary' 
                    : 'border-border bg-transparent font-normal text-text-secondary hover:border-gray-300'
                }`}>
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
            
            <Button type="submit" fullWidth className="mt-2" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center text-text-secondary text-sm pb-8 md:pb-0">
            Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </div>
        </div>
      </div>
      
      <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-gradient-to-br from-primary to-[#ff8a00] text-white p-16 relative overflow-hidden">
        <div className="absolute rounded-full bg-white/10 w-[300px] h-[300px] -top-[100px] -right-[50px]" />
        <div className="absolute rounded-full bg-white/10 w-[200px] h-[200px] -bottom-[50px] -left-[50px]" />
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 max-w-[450px] shadow-2xl animate-slide-up z-10">
          <h2 className="text-4xl font-bold leading-tight mb-4 text-white">
            {selectedRole === 'owner' ? 'Partner with us.' : 'Discover new flavors.'}
          </h2>
          <p className="text-lg opacity-90 leading-relaxed text-white/90">
            {selectedRole === 'owner' 
              ? 'Grow your business by reaching thousands of hungry customers every day.' 
              : 'Sign up to explore top-rated restaurants and get fast delivery.'}
          </p>
        </div>
      </div>
    </div>
  );
};
