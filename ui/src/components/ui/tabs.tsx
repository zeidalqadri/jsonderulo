import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  value, 
  onValueChange, 
  children, 
  className = '' 
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }
  
  const { value: currentValue, onValueChange } = context;
  const isActive = currentValue === value;
  
  const baseClasses = 'px-4 py-2 text-sm font-medium cursor-pointer transition-colors duration-200';
  const activeClasses = isActive 
    ? 'border-b-2 border-blue-500 text-blue-600' 
    : 'text-gray-600 hover:text-gray-800';
  
  return (
    <button
      className={`${baseClasses} ${activeClasses} ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }
  
  const { value: currentValue } = context;
  
  if (currentValue !== value) {
    return null;
  }
  
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
};