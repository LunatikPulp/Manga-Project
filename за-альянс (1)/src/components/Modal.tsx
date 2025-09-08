import React, { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  confirmText?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, onConfirm, confirmText = 'Подтвердить' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-overlay"
          >
            <div className="p-6 border-b border-overlay">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            </div>
            <div className="p-6 text-sm">
              {children}
            </div>
            <div className="p-4 bg-base/50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold bg-overlay text-text-primary rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-semibold bg-brand-accent text-white rounded-lg hover:bg-opacity-80 transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;