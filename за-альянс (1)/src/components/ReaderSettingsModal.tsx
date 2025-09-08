import React from 'react';
import Modal from './Modal';

// FIX: Export the ReaderSettings interface so it can be used in other files.
export interface ReaderSettings {
    readerType: 'paged' | 'scroll';
    containerWidth: number;
    imageServer: 'main' | 'backup';
    autoLoadNextChapter: boolean;
    showNotes: boolean;
    showPageIndicator: boolean;
}

interface ReaderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ReaderSettings;
    onSettingsChange: (newSettings: ReaderSettings) => void;
}

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-text-primary text-sm">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-brand' : 'bg-overlay'}`}
            aria-checked={enabled}
            role="switch"
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const SettingButton: React.FC<{ label: string; active: boolean; onClick: () => void; }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-brand text-white' : 'hover:bg-surface text-text-secondary'}`}
    >
        {label}
    </button>
);


const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    
    const handleSettingChange = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Настройки читалки" confirmText="Готово" onConfirm={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Тип читалки</label>
                    <div className="flex bg-base p-1 rounded-lg">
                        <SettingButton label="Постраничная" active={settings.readerType === 'paged'} onClick={() => handleSettingChange('readerType', 'paged')} />
                        <SettingButton label="Лента" active={settings.readerType === 'scroll'} onClick={() => handleSettingChange('readerType', 'scroll')} />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Ширина контейнера: {settings.containerWidth}%</label>
                     <input
                        type="range"
                        min="50"
                        max="100"
                        value={settings.containerWidth}
                        onChange={(e) => handleSettingChange('containerWidth', Number(e.target.value))}
                        className="w-full h-2 bg-overlay rounded-lg appearance-none cursor-pointer brand-thumb"
                        style={{'--thumb-color': '#5964f2'} as React.CSSProperties}
                    />
                </div>

                 <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Сервер картинок</label>
                    <div className="flex bg-base p-1 rounded-lg">
                        <SettingButton label="Основной" active={settings.imageServer === 'main'} onClick={() => handleSettingChange('imageServer', 'main')} />
                        <SettingButton label="Запасной" active={settings.imageServer === 'backup'} onClick={() => handleSettingChange('imageServer', 'backup')} />
                    </div>
                 </div>
                 
                 <div className="border-t border-surface pt-4 mt-4">
                    <Toggle label="Автоподгрузка следующей главы" enabled={settings.autoLoadNextChapter} onChange={(val) => handleSettingChange('autoLoadNextChapter', val)} />
                    <Toggle label="Показывать заметки" enabled={settings.showNotes} onChange={(val) => handleSettingChange('showNotes', val)} />
                    <Toggle label="Отображение индикатора номера страницы" enabled={settings.showPageIndicator} onChange={(val) => handleSettingChange('showPageIndicator', val)} />
                 </div>
            </div>
             <style>{`
                .brand-thumb::-webkit-slider-thumb {
                    background-color: var(--thumb-color);
                }
                .brand-thumb::-moz-range-thumb {
                     background-color: var(--thumb-color);
                }
            `}</style>
        </Modal>
    );
};

export default ReaderSettingsModal;