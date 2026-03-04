import React from 'react';
import { IonIcon, IonText } from '@ionic/react';
import { cardOutline, mailOutline, checkmarkCircle, checkmarkDoneCircle } from 'ionicons/icons';
import { useCheckout } from './CheckoutContext';
import { CheckoutStep } from '@models/checkout.types';

interface StepInfo {
  step: CheckoutStep;
  label: string;
  icon: string;
}

const CheckoutStepper: React.FC = () => {
  const { currentStep, goToStep, hasDeliveryMethods } = useCheckout();

  const steps: StepInfo[] = [
    { step: 1, label: 'Payment', icon: cardOutline },
    { step: 2, label: 'Delivery', icon: mailOutline },
    { step: 3, label: 'Review', icon: checkmarkCircle },
  ];

  // Filter out delivery step if no delivery methods
  const visibleSteps = hasDeliveryMethods
    ? steps
    : steps.filter(s => s.step !== 2);

  const getStepStatus = (step: CheckoutStep): 'pending' | 'active' | 'completed' => {
    // Handle step mapping when delivery is skipped
    const effectiveStep = !hasDeliveryMethods && step === 3 ? currentStep : step;

    if (effectiveStep < currentStep) return 'completed';
    if (effectiveStep === currentStep) return 'active';
    return 'pending';
  };

  const handleStepClick = (step: CheckoutStep) => {
    const status = getStepStatus(step);
    // Only allow clicking on completed steps
    if (status === 'completed') {
      goToStep(step);
    }
  };

  return (
    <div className="checkout-stepper">
      {visibleSteps.map((stepInfo, index) => {
        const status = getStepStatus(stepInfo.step);
        const isClickable = status === 'completed';

        return (
          <React.Fragment key={stepInfo.step}>
            <div
              className={`stepper-step ${status} ${isClickable ? 'clickable' : ''}`}
              onClick={() => handleStepClick(stepInfo.step)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  handleStepClick(stepInfo.step);
                }
              }}
            >
              <div className="step-icon-wrapper">
                <IonIcon
                  icon={status === 'completed' ? checkmarkDoneCircle : stepInfo.icon}
                  className="step-icon"
                />
              </div>
              <IonText className="step-label">
                <span>{stepInfo.label}</span>
              </IonText>
            </div>

            {/* Connector line between steps */}
            {index < visibleSteps.length - 1 && (
              <div className={`stepper-connector ${status === 'completed' ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default CheckoutStepper;
