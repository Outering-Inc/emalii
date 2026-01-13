'use client'

import { cn } from '@/src/lib/utils/utils'
import { Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Step = {
  id: number
  labelKey: string
}

type Props = {
  activeStep: number
  onStepClick?: (step: number) => void
}

const steps: Step[] = [
  { id: 1, labelKey: 'Checkout.Steps.ShippingAddress' },
  { id: 2, labelKey: 'Checkout.Steps.PaymentMethod' },
  { id: 3, labelKey: 'Checkout.Steps.ReviewPlaceOrder' },
]

export default function CheckoutStepper({ activeStep, onStepClick }: Props) {
  const t = useTranslations()

  return (
    <div className='mb-6 border-b pb-4'>
      {/* Secure Header */}
      <div className='flex items-center gap-2 font-semibold'>
        <Lock className='h-4 w-4 text-green-600' />
        {t('Checkout.SecureCheckout')}
      </div>

      {/* Steps */}
      <div className='mt-4 flex items-center gap-6'>
        {steps.map((step, index) => {
          const isActive = step.id === activeStep
          const isCompleted = step.id < activeStep

          return (
            <div key={step.id} className='flex items-center gap-2'>
              <button
                disabled={!isCompleted}
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition-colors',
                  isActive && 'border-primary bg-primary text-white',
                  isCompleted &&
                    'border-green-600 bg-green-600 text-white cursor-pointer',
                  !isActive &&
                    !isCompleted &&
                    'border-muted text-muted-foreground cursor-default'
                )}
              >
                {step.id}
              </button>

              <span
                className={cn(
                  'text-sm font-medium whitespace-nowrap',
                  isActive && 'text-primary',
                  isCompleted && 'text-green-700',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                {t(step.labelKey)}
              </span>

              {index < steps.length - 1 && (
                <div className='mx-3 h-[2px] w-10 bg-muted' />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
