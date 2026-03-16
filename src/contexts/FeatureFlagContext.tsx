import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeatureFlag } from '../types';
import { fetchFeatureFlags } from '../services/featureFlagService';

interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  loading: boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlags = async () => {
      const data = await fetchFeatureFlags();
      const flagMap = data.reduce((acc, flag) => {
        acc[flag.key] = flag.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      setFlags(flagMap);
      setLoading(false);
    };
    loadFlags();
  }, []);

  return (
    <FeatureFlagContext.Provider value={{ flags, loading }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};
