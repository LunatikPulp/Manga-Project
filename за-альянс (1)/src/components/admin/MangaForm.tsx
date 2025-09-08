import React, { useState, useRef } from 'react';
import { Manga, MangaFormData } from '../../../types';
import Modal from '../Modal';

interface MangaFormProps {
  onSubmit: (formData: MangaFormData) => void;
  initialData?: Manga;
  onCancel?: () => void;
  submitText?: string;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-surface rounded-lg p-6 mt-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="mt-6">{children}</div>
    </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="text-sm text-muted block mb-1.5">{label}</label>
        {children}
    </div>
);

const MangaForm: React.FC<MangaFormProps> = ({ onSubmit, initialData, onCancel, submitText }) => {
  const [formData, setFormData] = useState<MangaFormData>({
    title: initialData?.title || '',
    cover: initialData?.cover || '',
    description: initialData?.description || '',
    year: initialData?.year || new Date().getFullYear(),
    genres: initialData?.genres || [],
    type: initialData?.type || 'Manhwa',
    status: initialData?.status || 'В процессе',
  });
  const [newGenre, setNewGenre] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value) : value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, cover: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddGenre = () => {
    if (newGenre && !formData.genres.includes(newGenre)) {
      setFormData(prev => ({ ...prev, genres: [...prev.genres, newGenre] }));
      setNewGenre('');
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setFormData(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genreToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const handleCoverDelete = () => {
    setFormData(prev => ({ ...prev, cover: '' }));
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setModalOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormSection title="Основная информация">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <FormField label="Обложка">
                   <div className="w-full aspect-[2/3] bg-base rounded-lg flex items-center justify-center relative overflow-hidden border border-overlay">
                       {formData.cover ? (
                           <>
                                <img src={formData.cover} alt="Предпросмотр обложки" className="w-full h-full object-cover" />
                                <button 
                                    type="button" 
                                    onClick={() => setModalOpen(true)} 
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 leading-none hover:bg-red-600 transition-colors"
                                    aria-label="Удалить обложку"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                           </>
                       ) : (
                           <div className="text-center text-muted text-sm p-4">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                               Нет обложки
                           </div>
                       )}
                   </div>
                </FormField>
            </div>
            <div className="md:col-span-2">
                 <FormField label="Название">
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-base border border-overlay rounded-md p-2" />
                </FormField>
                 <div className="mt-4">
                    <FormField label="URL Обложки">
                        <input type="url" name="cover" value={formData.cover.startsWith('data:') ? '' : formData.cover} onChange={handleChange} placeholder="https://..." className="w-full bg-base border border-overlay rounded-md p-2" />
                    </FormField>
                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" id="cover-upload" />
                    <label htmlFor="cover-upload" className="w-full mt-2 text-center block bg-overlay hover:bg-opacity-80 text-text-secondary font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm">
                        Или загрузить файл
                    </label>
                </div>
                 <div className="mt-4">
                    <FormField label="Описание">
                        <textarea rows={10} name="description" value={formData.description} onChange={handleChange} required className="w-full bg-base border border-overlay rounded-md p-2 text-sm"></textarea>
                    </FormField>
                </div>
            </div>
        </div>
      </FormSection>

      <FormSection title="Метаданные">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Тип">
            <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-base border border-overlay rounded-md p-2">
              <option>Manhwa</option>
              <option>Manga</option>
              <option>Manhua</option>
            </select>
          </FormField>
          <FormField label="Статус">
            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-base border border-overlay rounded-md p-2">
              <option>В процессе</option>
              <option>Завершено</option>
            </select>
          </FormField>
          <FormField label="Год выпуска">
            <input type="number" name="year" value={formData.year} onChange={handleChange} required className="w-full bg-base border border-overlay rounded-md p-2" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Жанры">
        <div className="flex flex-wrap gap-2">
          {formData.genres.map(genre => (
            <div key={genre} className="flex items-center gap-2 bg-overlay rounded-md px-3 py-1.5 text-sm text-brand">
              <span>{genre}</span>
              <button type="button" onClick={() => handleRemoveGenre(genre)} className="text-muted hover:text-text-primary">&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            placeholder="Добавить жанр"
            className="flex-grow bg-base border border-overlay rounded-md p-2"
          />
          <button type="button" onClick={handleAddGenre} className="bg-brand text-white font-semibold px-4 rounded-lg">Добавить</button>
        </div>
      </FormSection>

      <div className="flex justify-end gap-4 mt-8">
        {onCancel && (
            <button type="button" onClick={onCancel} className="bg-surface hover:bg-overlay text-text-primary font-bold py-2 px-6 rounded-lg transition-colors">
                Отмена
            </button>
        )}
        <button type="submit" className="bg-brand hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
          {submitText || (initialData ? 'Сохранить изменения' : 'Создать мангу')}
        </button>
      </div>

       <Modal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            title="Удалить обложку"
            onConfirm={handleCoverDelete}
            confirmText="Удалить"
        >
            <p className="text-text-secondary">Вы уверены, что хотите удалить обложку? Это действие нельзя будет отменить.</p>
        </Modal>
    </form>
  );
};

export default MangaForm;