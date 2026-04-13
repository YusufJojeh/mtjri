import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
}

export function Stepper({ steps, currentStep, onStepClick, allowNavigation = true }: StepperProps) {
  const isStepCompleted = (stepIndex: number) => stepIndex < currentStep;
  const isStepActive = (stepIndex: number) => stepIndex === currentStep;
  const canNavigateToStep = (stepIndex: number) => {
    if (!allowNavigation) return false;
    return isStepCompleted(stepIndex) || isStepActive(stepIndex);
  };

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between'>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className='flex flex-col items-center flex-1'>
              <button
                type='button'
                onClick={() => canNavigateToStep(index) && onStepClick?.(index)}
                disabled={!canNavigateToStep(index)}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                  isStepCompleted(index)
                    ? 'bg-primary border-primary text-white cursor-pointer hover:bg-primary/90'
                    : isStepActive(index)
                    ? 'bg-primary border-primary text-white cursor-default'
                    : 'bg-white border-gray-300 text-gray-400 cursor-not-allowed',
                  canNavigateToStep(index) && 'hover:scale-105'
                )}
              >
                {isStepCompleted(index) ? (
                  <Check className='w-5 h-5' />
                ) : (
                  <span className='text-sm font-semibold'>{index + 1}</span>
                )}
              </button>
              <div className='mt-2 text-center'>
                <div
                  className={cn(
                    'text-sm font-medium',
                    isStepActive(index)
                      ? 'text-primary'
                      : isStepCompleted(index)
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400'
                  )}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div
                    className={cn(
                      'text-xs mt-1',
                      isStepActive(index)
                        ? 'text-primary/70'
                        : isStepCompleted(index)
                        ? 'text-gray-500'
                        : 'text-gray-400'
                    )}
                  >
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-colors duration-200',
                  isStepCompleted(index)
                    ? 'bg-primary'
                    : 'bg-gray-300'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

