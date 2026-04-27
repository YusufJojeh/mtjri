import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';

interface ChatGptSettingsProps {
  settings?: Record<string, string>;
}

export default function ChatGptSettings({ settings = {} }: ChatGptSettingsProps) {
  const { t } = useTranslation();
  const pageProps = usePage().props as any;
  
  // Default settings
  const defaultSettings = {
    chatgptKey: '',
    chatgptModel: 'gpt-3.5-turbo',
    aiProviderDefault: 'openai',
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    ollamaModel: '',
    ollamaTimeoutMs: '60000',
    aiAgenticEnabled: false,
    aiFallbackToOpenai: false,
  };
  
  // Combine settings from props and page props
  const settingsData = Object.keys(settings).length > 0 
    ? settings 
    : (pageProps.settings || {});
  
  // Initialize state with merged settings
  const [chatgptSettings, setChatgptSettings] = useState(() => ({
    chatgptKey: settingsData.chatgptKey || defaultSettings.chatgptKey,
    chatgptModel: settingsData.chatgptModel || defaultSettings.chatgptModel,
    aiProviderDefault: settingsData.aiProviderDefault || defaultSettings.aiProviderDefault,
    ollamaBaseUrl: settingsData.ollamaBaseUrl || defaultSettings.ollamaBaseUrl,
    ollamaModel: settingsData.ollamaModel || defaultSettings.ollamaModel,
    ollamaTimeoutMs: String(settingsData.ollamaTimeoutMs || defaultSettings.ollamaTimeoutMs),
    aiAgenticEnabled: ['1', 'true', 'on', true].includes(settingsData.aiAgenticEnabled),
    aiFallbackToOpenai: ['1', 'true', 'on', true].includes(settingsData.aiFallbackToOpenai),
  }));
  
  // Update state when settings change
  useEffect(() => {
    if (Object.keys(settingsData).length > 0) {
      const mergedSettings = Object.keys(defaultSettings).reduce((acc, key) => {
        acc[key] = settingsData[key] || defaultSettings[key];
        return acc;
      }, {} as Record<string, any>);

      mergedSettings.aiAgenticEnabled = ['1', 'true', 'on', true].includes(mergedSettings.aiAgenticEnabled);
      mergedSettings.aiFallbackToOpenai = ['1', 'true', 'on', true].includes(mergedSettings.aiFallbackToOpenai);
      mergedSettings.ollamaTimeoutMs = String(mergedSettings.ollamaTimeoutMs || defaultSettings.ollamaTimeoutMs);
      
      setChatgptSettings(prevSettings => ({
        ...prevSettings,
        ...mergedSettings
      }));
    }
  }, [settingsData]);

  // Handle form changes
  const handleSettingsChange = (field: string, value: string | boolean) => {
    setChatgptSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const submitChatgptSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route('settings.chatgpt.update'), chatgptSettings, {
      preserveScroll: true,
      onError: (errors) => {
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to update Chat GPT settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <SettingsSection
      title={t("Chat GPT Settings")}
      description={t("Configure Chat GPT integration settings for AI-powered features")}
      action={
        <Button type="submit" form="chatgpt-settings-form" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {t("Save Changes")}
        </Button>
      }
    >
      <form id="chatgpt-settings-form" onSubmit={submitChatgptSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="chatgptKey">{t("Chat GPT Key")}</Label>
            <Input
              id="chatgptKey"
              type="password"
              value={chatgptSettings.chatgptKey}
              onChange={(e) => handleSettingsChange('chatgptKey', e.target.value)}
              placeholder={t("Enter your OpenAI API key")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="chatgptModel">{t("Chat GPT Model Name")}</Label>
            <Select 
              value={chatgptSettings.chatgptModel} 
              onValueChange={(value) => handleSettingsChange('chatgptModel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select Chat GPT model")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aiProviderDefault">{t("Default AI Provider")}</Label>
            <Select
              value={chatgptSettings.aiProviderDefault}
              onValueChange={(value) => handleSettingsChange('aiProviderDefault', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select provider")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="ollama">Ollama</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="ollamaBaseUrl">{t("Ollama Base URL")}</Label>
            <Input
              id="ollamaBaseUrl"
              value={chatgptSettings.ollamaBaseUrl}
              onChange={(e) => handleSettingsChange('ollamaBaseUrl', e.target.value)}
              placeholder="http://127.0.0.1:11434"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ollamaModel">{t("Ollama Model")}</Label>
            <Input
              id="ollamaModel"
              value={chatgptSettings.ollamaModel}
              onChange={(e) => handleSettingsChange('ollamaModel', e.target.value)}
              placeholder="llama3.1:8b"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ollamaTimeoutMs">{t("Ollama Timeout (ms)")}</Label>
            <Input
              id="ollamaTimeoutMs"
              type="number"
              min={1000}
              max={300000}
              value={chatgptSettings.ollamaTimeoutMs}
              onChange={(e) => handleSettingsChange('ollamaTimeoutMs', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>{t("Enable Agentic Tool Loop")}</Label>
              <p className="text-sm text-muted-foreground">{t("Use bounded tool-loop validation and repair for AI responses.")}</p>
            </div>
            <Switch
              checked={chatgptSettings.aiAgenticEnabled}
              onCheckedChange={(checked) => handleSettingsChange('aiAgenticEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>{t("Fallback to OpenAI")}</Label>
              <p className="text-sm text-muted-foreground">{t("If Ollama fails, try OpenAI when available.")}</p>
            </div>
            <Switch
              checked={chatgptSettings.aiFallbackToOpenai}
              onCheckedChange={(checked) => handleSettingsChange('aiFallbackToOpenai', checked)}
            />
          </div>
        </div>
      </form>
    </SettingsSection>
  );
}
