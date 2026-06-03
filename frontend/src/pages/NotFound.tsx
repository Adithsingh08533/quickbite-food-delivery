
import { Utensils, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 p-8">
      <div className="text-center max-w-[480px] animate-fade-in">
        {/* Animated plate illustration */}
        <div className="relative inline-flex flex-col items-center mb-6">
          {/* Steam effect above the plate */}
          <div className="flex gap-2 mb-1 order-first">
            <span className="block w-1.5 h-5 rounded-full bg-gradient-to-t from-primary/40 to-transparent animate-steam"></span>
            <span className="block w-1.5 h-5 rounded-full bg-gradient-to-t from-primary/40 to-transparent animate-steam" style={{ animationDelay: '0.3s' }}></span>
            <span className="block w-1.5 h-5 rounded-full bg-gradient-to-t from-primary/40 to-transparent animate-steam" style={{ animationDelay: '0.6s' }}></span>
          </div>
          
          <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-primary to-[#ff8c60] flex items-center justify-center text-white shadow-[0_20px_40px_rgba(255,107,53,0.35)] animate-bounce-slow">
            <Utensils size={48} />
          </div>
        </div>

        <h1 className="text-[6rem] sm:text-[8rem] font-extrabold leading-none bg-gradient-to-br from-primary to-[#ff8c60] text-transparent bg-clip-text tracking-tighter mb-2">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">Oops! Page not found</h2>
        <p className="text-text-secondary text-base sm:text-lg leading-relaxed mb-8">
          Looks like this page ran out of ingredients.<br />
          Let&apos;s get you back to something delicious.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.location.href = '/'} className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <Home size={18} />
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 w-full sm:w-auto justify-center bg-white"
          >
            <ArrowLeft size={18} />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
