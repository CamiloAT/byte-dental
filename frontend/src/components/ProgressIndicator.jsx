import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...args) {
  return twMerge(clsx(args));
}

const ProgressIndicator = ({ step = 1 }) => {
  const steps = [1, 2, 3];

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {steps.map((num, i) => (
        <React.Fragment key={num}>
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-poppins font-semibold transition-all duration-300',
              num === step && 'bg-[#48A4D6] text-white shadow-md shadow-[#48A4D6]/30',
              num < step && 'bg-[#3bbba1] text-white',
              num > step && 'bg-gray-200 text-gray-400',
            )}
          >
            {num < step ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : num}
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'w-5 h-[1.5px] rounded-full transition-all duration-300',
              num < step ? 'bg-[#3bbba1]' : 'bg-gray-200',
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressIndicator;
