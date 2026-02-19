import React from 'react';
import { IonGrid, IonRow, IonCol } from '@ionic/react';
import './ResponsiveGrid.scss';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  gap?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: '12', sm: '6', md: '4', lg: '3' },
  gap = 'medium',
  className = '',
}) => {
  const gapClass = gap !== 'none' ? `responsive-grid--gap-${gap}` : '';

  return (
    <IonGrid className={`responsive-grid ${gapClass} ${className}`}>
      <IonRow>
        {React.Children.map(children, (child) => (
          <IonCol
            size={columns.xs}
            sizeSm={columns.sm}
            sizeMd={columns.md}
            sizeLg={columns.lg}
            sizeXl={columns.xl}
          >
            {child}
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );
};

export default ResponsiveGrid;
