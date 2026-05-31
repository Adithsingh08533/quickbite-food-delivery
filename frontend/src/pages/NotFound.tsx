import { Link } from 'react-router-dom';
import { Utensils, ArrowLeft, Home } from 'lucide-react';
import './NotFound.css';

export const NotFound = () => {
  return (
    <div className="nf-container animate-fade-in">
      <div className="nf-content">
        {/* Animated plate illustration */}
        <div className="nf-illustration">
          <div className="nf-plate">
            <Utensils size={48} />
          </div>
          <div className="nf-steam">
            <span /><span /><span />
          </div>
        </div>

        <h1 className="nf-code">404</h1>
        <h2 className="nf-title">Oops! Page not found</h2>
        <p className="nf-message">
          Looks like this page ran out of ingredients.<br />
          Let&apos;s get you back to something delicious.
        </p>

        <div className="nf-actions">
          <Link to="/" className="btn btn-primary nf-btn">
            <Home size={18} />
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline nf-btn"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
