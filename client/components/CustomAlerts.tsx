// components/CustomAlert.tsx
import React from 'react';

interface CustomAlertProps {
  message: string;
  type: 'error' | 'success' | 'warning';  // Add more types as needed
  onClose?: () => void;  // Optional close handler
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, type, onClose }) => {
  const backgroundColors = {
    error: 'bg-[#F87171] border-[#F87171]',   // Red
    success: 'bg-[#34D399] border-[#34D399]', // Green
    warning: 'bg-[#FBBF24] border-[#FBBF24]', // Amber, adjusted for better color consistency
  };

  return (
    <div className={`flex items-center w-full border-l-4 mb-4 ${backgroundColors[type]} bg-opacity-10 p-4 shadow-sm dark:bg-opacity-20`}>
      <div className="flex-grow">
        <h5 className="text-sm font-semibold">{message}</h5>
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-xs text-gray-500 hover:text-gray-700">Close</button>
      )}
    </div>
  );
};

export default CustomAlert;
