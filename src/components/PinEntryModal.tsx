import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, AlertCircle } from 'lucide-react';

export function PinEntryModal() {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(pin);
      if (!success) {
        setError('Invalid PIN. Please try again.');
        setPin('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm" data-testid="pin-modal">
      <div className="w-full max-w-md mx-4">
        <div className="bg-card border rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Enter PIN
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              Please enter your PIN to access the application
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                ref={inputRef}
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                className="text-center text-lg tracking-wider"
                autoComplete="off"
                autoFocus
                data-testid="pin-input"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !pin.trim()}
              data-testid="pin-submit"
            >
              {isLoading ? 'Verifying...' : 'Submit'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
