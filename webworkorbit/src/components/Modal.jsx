import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Size variants
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  // Handle escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap and management
  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousFocusRef.current = document.activeElement;

    // Focus the modal
    modalRef.current?.focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Restore body scroll
      document.body.style.overflow = 'unset';

      // Restore focus to previous element
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  // Focus trap within modal
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          aria-hidden="true"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* Center modal */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          ref={modalRef}
          tabIndex={-1}
          onKeyDown={handleTabKey}
          className={`
            inline-block align-bottom bg-white rounded-lg text-left
            overflow-hidden shadow-xl transform transition-all
            sm:my-8 sm:align-middle w-full ${sizeClasses[size]}
            animate-fade-in
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
