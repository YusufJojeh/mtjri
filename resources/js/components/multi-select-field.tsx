// components/multi-select-field.tsx
import React from 'react';
import { SimpleMultiSelect } from '@/components/simple-multi-select';
import { FormField } from '@/types/crud';

interface MultiSelectFieldProps {
  field: FormField;
  formData: Record<string, any>;
  handleChange: (name: string, value: any) => void;
  hasError?: boolean;
}

export function MultiSelectField({ field, formData, handleChange, hasError = false }: MultiSelectFieldProps) {
  // Ensure selected value is always an array of strings
  const selectedValues = Array.isArray(formData[field.name]) 
    ? formData[field.name] 
    : formData[field.name] 
      ? [formData[field.name].toString()] 
      : [];
  
  return (
    <SimpleMultiSelect
      options={field.options || []}
      selected={selectedValues}
      onChange={(selected) => handleChange(field.name, selected)}
      placeholder={field.placeholder || `Select ${field.label}`}
      hasError={hasError}
    />
  );
}