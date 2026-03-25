'use client';

const steps = [
  { num: 1, label: 'תאריך' },
  { num: 2, label: 'שעה' },
  { num: 3, label: 'פרטים' },
  { num: 4, label: 'אישור' },
];

interface StepperProps {
  currentStep: number;
}

export default function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="w-full py-5 px-6 bg-[#1a1a2e]">
      <div className="flex items-center justify-between max-w-xs mx-auto" dir="ltr">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center" style={{ flex: index < steps.length - 1 ? 1 : 'none' }}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-400 border-2
                  ${
                    index < currentStep
                      ? 'bg-[#c9a84c] border-[#c9a84c] text-white shadow-md shadow-[#c9a84c]/30'
                      : index === currentStep
                        ? 'bg-transparent border-[#c9a84c] text-[#c9a84c]'
                        : 'bg-white/10 border-white/20 text-white/40'
                  }
                `}
              >
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`
                  mt-1.5 text-[11px] font-semibold whitespace-nowrap
                  ${index < currentStep ? 'text-[#c9a84c]' : index === currentStep ? 'text-white' : 'text-white/40'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-3 self-start mt-[19px]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    index < currentStep ? 'bg-[#c9a84c]' : 'bg-white/15'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
