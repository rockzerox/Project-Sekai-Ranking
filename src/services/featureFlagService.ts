import { supabase } from '../lib/supabase';
import { FeatureFlag } from '../types';

export const fetchFeatureFlags = async (): Promise<FeatureFlag[]> => {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, enabled, note');

  if (error) {
    console.error('Error fetching feature flags:', error);
    return [];
  }

  return data as FeatureFlag[];
};
