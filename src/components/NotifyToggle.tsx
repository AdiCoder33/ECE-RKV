import React, { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { enablePush, disablePush, registerDevice, unregisterDevice } from '@/push';
import { useAuth } from '@/contexts/AuthContext';

const NotifyToggle: React.FC = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    fetch(`${apiBase}/users/${user.id}/push`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setEnabled(!!data.pushEnabled))
      .catch(() => setEnabled(false));
  }, [user?.id]);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      if (checked) {
        if (!user?.id) {
          throw new Error('User not authenticated');
        }
        await registerDevice('web');
        await enablePush([], user.id);
        await fetch(`${apiBase}/users/${user.id}/push`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ enabled: true }),
        });
        setEnabled(true);
        setError(null);
      } else {
        await unregisterDevice();
        await disablePush();
        if (user?.id) {
          await fetch(`${apiBase}/users/${user.id}/push`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ enabled: false }),
          });
        }
        setEnabled(false);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to update notifications';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Push Notifications</p>
        <p className="text-sm text-muted-foreground">
          {enabled ? 'Enabled' : 'Disabled'}
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <Switch checked={enabled} onCheckedChange={handleChange} disabled={loading} />
    </div>
  );
};

export default NotifyToggle;
