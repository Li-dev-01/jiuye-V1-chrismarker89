import React, { createContext, useContext, useState } from 'react';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value = '', onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange: onValueChange || (() => {}), open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectTrigger must be used within Select');
  }

  return (
    <button
      onClick={() => context.setOpen(!context.open)}
      className={`
        flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        ${className || ''}
      `}
    >
      {children}
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectValue must be used within Select');
  }

  return (
    <span className={context.value ? 'text-gray-900' : 'text-gray-500'}>
      {context.value || placeholder}
    </span>
  );
}

interface SelectContentProps {
  children: React.ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectContent must be used within Select');
  }

  if (!context.open) {
    return null;
  }

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectItem must be used within Select');
  }

  const isSelected = context.value === value;

  return (
    <button
      onClick={() => {
        context.onValueChange(value);
        context.setOpen(false);
      }}
      className={`
        w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100
        ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
      `}
    >
      {children}
    </button>
  );
}
