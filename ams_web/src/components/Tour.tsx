import { Joyride, Step, STATUS, Styles } from 'react-joyride';
import { useState, useEffect } from 'react';

interface CallBackProps {
  action: string;
  index: number;
  lifecycle: string;
  size: number;
  status: string;
  step: Step;
  type: string;
}

interface TourProps {
  steps: Step[];
  tourKey: string;
}

export const Tour = ({ steps, tourKey }: TourProps) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`has_seen_tour_${tourKey}`);
    if (!hasSeenTour) {
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [tourKey]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      localStorage.setItem(`has_seen_tour_${tourKey}`, 'true');
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleJoyrideCallback}
      styles={
        {
          options: {
            primaryColor: '#ff8000',
            textColor: '#0f172a',
            zIndex: 1000,
          },
          tooltipContainer: {
            textAlign: 'left',
            borderRadius: '1.5rem',
            padding: '1rem',
          },
          buttonNext: {
            backgroundColor: '#ff8000',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '12px 24px',
            color: '#ffffff',
            border: 'none',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(255, 128, 0, 0.2)',
          },
          buttonBack: {
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginRight: '8px',
            color: '#64748b',
          },
          buttonSkip: {
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#94a3b8',
          },
        } as unknown as Styles
      }
    />
  );
};
