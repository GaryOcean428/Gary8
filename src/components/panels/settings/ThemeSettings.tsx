import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { SaveButton } from '../../SaveButton';

const presetThemes = {
  default: {
    dark: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#10B981',
      background: '#111827',
      surface: '#1F2937',
      text: '#F3F4F6'
    },
    light: {
      primary: '#2563EB',
      secondary: '#4B5563',
      accent: '#059669',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827'
    }
  },
  ocean: {
    dark: {
      primary: '#0EA5E9',
      secondary: '#64748B',
      accent: '#06B6D4',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9'
    }
  },
  forest: {
    dark: {
      primary: '#22C55E',
      secondary: '#71717A',
      accent: '#10B981',
      background: '#14532D',
      surface: '#166534',
      text: '#ECFDF5'
    }
  }
};

export function ThemeSettings() {
  const { settings, updateSettings } = useSettings();
  // Ensure settings.theme exists before accessing its properties
  const initialTheme = settings?.theme || presetThemes.default.dark; 
  const [localSettings, setLocalSettings] = useState(initialTheme);
  
  // Check if settings.theme exists before comparing
  const isDirty = settings?.theme ? JSON.stringify(localSettings) !== JSON.stringify(settings.theme) : true;

  const handleSave = async () => {
    // Ensure updateSettings is called correctly
    await updateSettings({ theme: localSettings }); 
  };

  const handleThemeChange = (_mode: 'light' | 'dark' | 'system') => {
    setLocalSettings(_prev => ({
      ..._prev,
      mode: _mode, // Corrected property name
      colors: _mode === 'light' ? presetThemes.default.light : presetThemes.default.dark
    }));
  };

  const handlePresetChange = (_preset: keyof typeof presetThemes) => {
    setLocalSettings(_prev => {
      // Handle 'system' mode by defaulting to 'dark' for preset selection
      const modeForPreset = (_prev?.mode === 'system' ? 'dark' : _prev?.mode) || 'dark'; 
      const validModeKey = modeForPreset as keyof typeof presetThemes.default; // 'light' | 'dark'
      
      const currentPreset = presetThemes[_preset];
      let colorsToApply;

      // Check if the current preset exists and has the required mode key ('light' or 'dark')
      if (currentPreset && validModeKey in currentPreset) {
         // Type assertion needed here because TS can't infer that validModeKey is a key of currentPreset specifically
        colorsToApply = currentPreset[validModeKey as keyof typeof currentPreset];
      } else {
        // Fallback to the default theme's corresponding mode colors
        colorsToApply = presetThemes.default[validModeKey];
      }

      return {
        ..._prev,
        colors: colorsToApply
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Theme Settings</h3>
          <p className="text-sm text-gray-400">Customize the application appearance</p>
        </div>
        <Palette className="w-5 h-5 text-blue-400" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Theme Mode</label>
          <div className="flex space-x-4">
            {(['light', 'dark', 'system'] as const).map(_mode => (
              <button
                key={_mode}
                onClick={() => handleThemeChange(_mode)}
                className={`px-4 py-2 rounded-lg ${
                  localSettings.mode === _mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {_mode.charAt(0).toUpperCase() + _mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2">Color Preset</label>
          <div className="grid grid-cols-3 gap-4">
            {Object.keys(presetThemes).map(_preset => (
              <button
                key={_preset}
                onClick={() => handlePresetChange(_preset as keyof typeof presetThemes)}
                className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <div className="flex space-x-2 mb-2">
                  {Object.values(presetThemes[_preset as keyof typeof presetThemes].dark).map((_color, _i) => (
                    <div
                      key={_i}
                      className={`w-4 h-4 rounded-full theme-color-preview bg-${_color.replace('#', '')}`}
                    />
                  ))}
                </div>
                <span className="text-sm">{_preset.charAt(0).toUpperCase() + _preset.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2">Custom Colors</label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(localSettings.colors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm mb-1">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type="color"
                  value={value as string} // Ensure value is treated as string
                  onChange={(_e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(_prev => {
                    // Ensure _prev and _prev.colors exist before spreading
                    const prevColors = _prev?.colors || {};
                    return {
                      ..._prev,
                      colors: {
                        ...prevColors,
                        [key]: _e.target.value as string
                      }
                    } as typeof localSettings; // Add type assertion
                  })}
                  className="w-full h-8 rounded cursor-pointer"
                  aria-label={`Select color for ${key}`}
                  placeholder={`Choose ${key} color`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <SaveButton onSave={handleSave} isDirty={isDirty} />
        </div>
      </div>
    </div>
  );
}
