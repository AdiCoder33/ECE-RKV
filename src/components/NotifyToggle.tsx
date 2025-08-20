import React, { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { enablePush, disablePush, isSubscribed } from '@/push';
import { useAuth } from '@/contexts/AuthContext';

const NotifyToggle: React.FC = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isSubscribed().then(setEnabled).catch(() => setEnabled(false));
  }, []);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    try {
      if (checked) {
        await enablePush([], user?.id);
        setEnabled(true);
      } else {
        await disablePush();
        setEnabled(false);
      }
    } catch (err) {
      console.error(err);
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
      </div>
      <Switch checked={enabled} onCheckedChange={handleChange} disabled={loading} />
    </div>
  );
};

export default NotifyToggle;
