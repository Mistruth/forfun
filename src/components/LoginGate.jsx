import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authStore } from '@/lib/authStore';

const LoginGate = ({ children }) => {
  const [checking, setChecking] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    authStore.getSession()
      .then((session) => {
        if (mounted) setAuthenticated(Boolean(session.authenticated));
      })
      .catch(() => {
        if (mounted) setAuthenticated(false);
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password.trim()) {
      toast.error('请输入访问口令');
      return;
    }
    setSubmitting(true);
    try {
      await authStore.login(password);
      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      toast.error(error.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        正在检查登录状态...
      </div>
    );
  }

  if (authenticated) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="text-base font-medium">公众号长图工具</h1>
            <p className="text-sm text-muted-foreground">请输入管理员口令继续</p>
          </div>
        </div>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="访问口令"
          autoFocus
        />
        <Button type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? '登录中...' : '登录'}
        </Button>
      </form>
    </div>
  );
};

export default LoginGate;
