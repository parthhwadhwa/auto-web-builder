import React, { useEffect, useState, useCallback } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import type { IProviderConfig } from '~/types/model';
import { logStore } from '~/lib/stores/logs';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { SiGoogle } from 'react-icons/si';
import { TbCloudComputing } from 'react-icons/tb';

const CloudProvidersTab = () => {
  const settings = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);
  const [categoryEnabled, setCategoryEnabled] = useState<boolean>(false);

  // Load and filter providers - only show Google
  useEffect(() => {
    const newFilteredProviders = Object.entries(settings.providers || {})
      .filter(([key]) => key === 'Google')
      .map(([key, value]) => ({
        name: key,
        settings: value.settings,
        staticModels: value.staticModels || [],
        getDynamicModels: value.getDynamicModels,
        getApiKeyLink: value.getApiKeyLink,
        labelForGetApiKey: value.labelForGetApiKey,
        icon: value.icon,
      }));

    setFilteredProviders(newFilteredProviders);

    // Update category enabled state
    const allEnabled = newFilteredProviders.every((p) => p.settings.enabled);
    setCategoryEnabled(allEnabled);
  }, [settings.providers]);

  const handleToggleCategory = useCallback(
    (enabled: boolean) => {
      // Update all providers
      filteredProviders.forEach((provider) => {
        settings.updateProviderSettings(provider.name, { ...provider.settings, enabled });
      });

      setCategoryEnabled(enabled);
      toast.success(enabled ? 'Google Gemini enabled' : 'Google Gemini disabled');
    },
    [filteredProviders, settings],
  );

  const handleToggleProvider = useCallback(
    (provider: IProviderConfig, enabled: boolean) => {
      // Update the provider settings in the store
      settings.updateProviderSettings(provider.name, { ...provider.settings, enabled });

      if (enabled) {
        logStore.logProvider(`Provider ${provider.name} enabled`, { provider: provider.name });
        toast.success(`${provider.name} enabled`);
      } else {
        logStore.logProvider(`Provider ${provider.name} disabled`, { provider: provider.name });
        toast.success(`${provider.name} disabled`);
      }
    },
    [settings],
  );

  return (
    <div className="space-y-6">
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between gap-4 mt-8 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={classNames(
                'w-8 h-8 flex items-center justify-center rounded-lg',
                'bg-bolt-elements-background-depth-3',
                'text-purple-500',
              )}
            >
              <TbCloudComputing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-md font-medium text-bolt-elements-textPrimary">AI Provider</h4>
              <p className="text-sm text-bolt-elements-textSecondary">Google Gemini AI models</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-bolt-elements-textSecondary">Enable</span>
            <Switch checked={categoryEnabled} onCheckedChange={handleToggleCategory} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProviders.map((provider, index) => (
            <motion.div
              key={provider.name}
              className={classNames(
                'rounded-lg border bg-bolt-elements-background text-bolt-elements-textPrimary shadow-sm',
                'bg-bolt-elements-background-depth-2',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-all duration-200',
                'relative overflow-hidden group',
                'flex flex-col',
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-4 p-4">
                <motion.div
                  className={classNames(
                    'w-10 h-10 flex items-center justify-center rounded-xl',
                    'bg-bolt-elements-background-depth-3 group-hover:bg-bolt-elements-background-depth-4',
                    'transition-all duration-200',
                    provider.settings.enabled ? 'text-purple-500' : 'text-bolt-elements-textSecondary',
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className={classNames('w-6 h-6', 'transition-transform duration-200', 'group-hover:rotate-12')}>
                    <SiGoogle className="w-full h-full" aria-label="Google logo" />
                  </div>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-bolt-elements-textPrimary group-hover:text-purple-500 transition-colors">
                        {provider.name}
                      </h4>
                      <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
                        Access Gemini 2.0 Flash, Gemini 1.5 Pro, and other Google AI models
                      </p>
                    </div>
                    <Switch
                      checked={provider.settings.enabled}
                      onCheckedChange={(checked) => handleToggleProvider(provider, checked)}
                    />
                  </div>
                </div>
              </div>

              <motion.div
                className="absolute inset-0 border-2 border-purple-500/0 rounded-lg pointer-events-none"
                animate={{
                  borderColor: provider.settings.enabled ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0)',
                  scale: provider.settings.enabled ? 1 : 0.98,
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CloudProvidersTab;
