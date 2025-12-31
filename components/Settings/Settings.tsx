import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Palette,
  Download,
  User,
  Monitor,
  Sun,
  Moon,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useNotesContext } from '../../context/NotesContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui';
import { APP_CONFIG } from '../../constants';
import type { SettingsTabType, ThemeMode, PdfFormat } from '../../types';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>('general');
  const { theme, notes } = useNotesContext();
  const { settings, updateSetting, updateExportDefault, resetSettings } = useSettings();
  const { user, updateUserProfile, deleteAccount } = useAuth();

  // Account state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isGoogleUser = user?.providerData.some(
    (provider) => provider.providerId === 'google.com'
  );

  const tabs: { id: SettingsTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'export', label: 'Export', icon: <Download size={18} /> },
    { id: 'account', label: 'Account', icon: <User size={18} /> },
  ];

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaveSuccess(false);

    try {
      await updateUserProfile({ displayName: displayName.trim() });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 2000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Clear all notes before deleting account
      notes.notes.forEach((note) => {
        notes.permanentlyDeleteNote(note.id);
      });

      // Delete the account
      await deleteAccount(isGoogleUser ? undefined : deletePassword);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleThemeChange = (mode: ThemeMode) => {
    theme.setThemeMode(mode);
    updateSetting('themeMode', mode);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
                General Settings
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure general application preferences
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Application Info
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {APP_CONFIG.APP_NAME} - Your intelligent note-taking app
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Reset Settings
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reset all settings to their default values
                  </p>
                </div>
                <button
                  onClick={resetSettings}
                  className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
                Appearance
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Customize how {APP_CONFIG.APP_NAME} looks
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">
                Theme
              </h4>
              <div className="space-y-2">
                {[
                  { value: 'system' as ThemeMode, label: 'System', icon: <Monitor size={18} />, description: 'Follow your system settings' },
                  { value: 'light' as ThemeMode, label: 'Light', icon: <Sun size={18} />, description: 'Always use light mode' },
                  { value: 'dark' as ThemeMode, label: 'Dark', icon: <Moon size={18} />, description: 'Always use dark mode' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      settings.themeMode === option.value
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={option.value}
                      checked={settings.themeMode === option.value}
                      onChange={() => handleThemeChange(option.value)}
                      className="sr-only"
                    />
                    <div className={`${
                      settings.themeMode === option.value
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        settings.themeMode === option.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {option.description}
                      </div>
                    </div>
                    {settings.themeMode === option.value && (
                      <Check size={18} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
                Export Settings
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure default export options for your notes
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Include Tags in Export
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Always include note tags when exporting
                  </p>
                </div>
                <button
                  onClick={() => updateExportDefault('includeTags', !settings.exportDefaults.includeTags)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.exportDefaults.includeTags
                      ? 'bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.exportDefaults.includeTags ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Include Summary in Export
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Always include AI-generated summaries
                  </p>
                </div>
                <button
                  onClick={() => updateExportDefault('includeSummary', !settings.exportDefaults.includeSummary)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.exportDefaults.includeSummary
                      ? 'bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.exportDefaults.includeSummary ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      PDF Format
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Default page size for PDF exports
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: 'a4' as PdfFormat, label: 'A4' },
                    { value: 'letter' as PdfFormat, label: 'Letter' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateExportDefault('pdfFormat', option.value)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        settings.exportDefaults.pdfFormat === option.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
                Account Settings
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage your profile and account
              </p>
            </div>

            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">
                Profile
              </h4>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user?.displayName || 'No display name'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                {profileError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{profileError}</p>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || !displayName.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? (
                    'Saving...'
                  ) : profileSaveSuccess ? (
                    <>
                      <Check size={16} />
                      Saved
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                  Danger Zone
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Once you delete your account, there is no going back. All your notes and data will be permanently deleted.
              </p>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Settings
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <nav className="md:w-48 flex-shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {renderTabContent()}
          </main>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmText('');
          setDeletePassword('');
          setDeleteError(null);
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>

          {!isGoogleUser && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
            />
          </div>

          {deleteError && (
            <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
                setDeletePassword('');
                setDeleteError(null);
              }}
              className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={
                deleteConfirmText !== 'DELETE' ||
                isDeleting ||
                (!isGoogleUser && !deletePassword)
              }
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
