import React, { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { enablePush, disablePush, isSubscribed } from '@/push';
import { useAuth } from '@/contexts/AuthContext';

const NotifyToggle: React.FC = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isSubscribed().then(setEnabled).catch(() => setEnabled(false));
  }, []);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    try {
      if (checked) {
        await enablePush([], user?.id);
        setEnabled(true);
        setError(null);
      } else {
        await disablePush();
        setEnabled(false);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to update notifications';
      setError(message);
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
