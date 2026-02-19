import React, { useState } from 'react';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonLabel,
  IonRange,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { closeCircle, filterOutline, chevronDown, chevronUp } from 'ionicons/icons';
import './PlanFilters.scss';

interface Category {
  id: number;
  name: string;
}

interface PlanFiltersProps {
  categories?: Category[];
  selectedCategory?: number | null;
  onCategoryChange?: (categoryId: number | null) => void;
  priceRange?: { min: number; max: number };
  selectedPriceRange?: { lower: number; upper: number };
  onPriceChange?: (range: { lower: number; upper: number }) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  onClearFilters?: () => void;
}

const PlanFilters: React.FC<PlanFiltersProps> = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  priceRange = { min: 0, max: 1000 },
  selectedPriceRange,
  onPriceChange,
  sortBy = 'popular',
  onSortChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    selectedCategory !== null ||
    (selectedPriceRange &&
      (selectedPriceRange.lower > priceRange.min || selectedPriceRange.upper < priceRange.max));

  return (
    <div className="plan-filters">
      <div className="plan-filters__header">
        <IonButton
          fill="outline"
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          className="plan-filters__toggle"
        >
          <IonIcon icon={filterOutline} slot="start" />
          Filters
          <IonIcon icon={isExpanded ? chevronUp : chevronDown} slot="end" />
        </IonButton>

        {onSortChange && (
          <IonItem className="plan-filters__sort" lines="none">
            <IonLabel>Sort:</IonLabel>
            <IonSelect
              value={sortBy}
              onIonChange={(e) => onSortChange(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="popular">Most Popular</IonSelectOption>
              <IonSelectOption value="name">Name A-Z</IonSelectOption>
              <IonSelectOption value="price-low">Price: Low to High</IonSelectOption>
              <IonSelectOption value="price-high">Price: High to Low</IonSelectOption>
            </IonSelect>
          </IonItem>
        )}
      </div>

      {hasActiveFilters && (
        <div className="plan-filters__active">
          {selectedCategory && (
            <IonChip onClick={() => onCategoryChange?.(null)}>
              <IonLabel>
                Category: {categories.find((c) => c.id === selectedCategory)?.name}
              </IonLabel>
              <IonIcon icon={closeCircle} />
            </IonChip>
          )}
          {selectedPriceRange &&
            (selectedPriceRange.lower > priceRange.min ||
              selectedPriceRange.upper < priceRange.max) && (
              <IonChip
                onClick={() => onPriceChange?.({ lower: priceRange.min, upper: priceRange.max })}
              >
                <IonLabel>
                  ${selectedPriceRange.lower} - ${selectedPriceRange.upper}
                </IonLabel>
                <IonIcon icon={closeCircle} />
              </IonChip>
            )}
          {onClearFilters && (
            <IonButton fill="clear" size="small" onClick={onClearFilters}>
              Clear All
            </IonButton>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="plan-filters__panel">
          {categories.length > 0 && onCategoryChange && (
            <div className="plan-filters__section">
              <h4 className="plan-filters__section-title">Category</h4>
              <div className="plan-filters__chips">
                <IonChip
                  color={selectedCategory === null ? 'primary' : undefined}
                  outline={selectedCategory !== null}
                  onClick={() => onCategoryChange(null)}
                >
                  All
                </IonChip>
                {categories.map((category) => (
                  <IonChip
                    key={category.id}
                    color={selectedCategory === category.id ? 'primary' : undefined}
                    outline={selectedCategory !== category.id}
                    onClick={() => onCategoryChange(category.id)}
                  >
                    {category.name}
                  </IonChip>
                ))}
              </div>
            </div>
          )}

          {onPriceChange && (
            <div className="plan-filters__section">
              <h4 className="plan-filters__section-title">
                Price Range: ${selectedPriceRange?.lower || priceRange.min} - $
                {selectedPriceRange?.upper || priceRange.max}
              </h4>
              <IonRange
                dualKnobs
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                value={selectedPriceRange || { lower: priceRange.min, upper: priceRange.max }}
                onIonChange={(e) =>
                  onPriceChange(e.detail.value as { lower: number; upper: number })
                }
              >
                <IonLabel slot="start">${priceRange.min}</IonLabel>
                <IonLabel slot="end">${priceRange.max}</IonLabel>
              </IonRange>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanFilters;
