import React, { useEffect, useRef, useId } from 'react';

const Modal = ({ isOpen, onClose, children, title }) => {
  const modalRef = useRef(null);
  const titleId = useId();
  
  // Efecto 1: Gestión del Foco INICIAL (Solo corre cuando isOpen cambia a true)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const focusableElements = modalRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select'
        );

        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          // Solo enfocar si el foco no está ya dentro del modal
          if (!modalRef.current?.contains(document.activeElement)) {
            firstElement.focus();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // Dependencia estricta en isOpen, no onClose

  // Efecto 2: Listeners de Teclado (Escape y Tab Trap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
      
    const focusableElements = modalRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    );

    let handleTabKeyPress = null;

    if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          handleTabKeyPress = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
                } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
                }
            }
          };
          
          const currentModalRef = modalRef.current;
          currentModalRef?.addEventListener('keydown', handleTabKeyPress);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (handleTabKeyPress) {
          modalRef.current?.removeEventListener('keydown', handleTabKeyPress);
      }
    };
  }, [isOpen, onClose]); // Aquí sí necesitamos onClose para el callback


  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
    >
      <div ref={modalRef} className="bg-card rounded-lg shadow-xl w-full max-w-md m-4 transform transition-all duration-300 ease-out">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 id={titleId} className="text-xl font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;