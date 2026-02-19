import React from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForward, chevronBack } from 'ionicons/icons';
import CategoryCard from '../ui/CategoryCard';
import ResponsiveGrid from '../layout/ResponsiveGrid';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { gridOutline } from 'ionicons/icons';
import './CategoryList.scss';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url?: string;
  plan_types_count?: number;
}

interface CategoryListProps {
  categories: Category[];
  loading?: boolean;
  error?: Error | null;
  variant?: 'grid' | 'horizontal';
  onCategoryClick?: (category: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  loading = false,
  error = null,
  variant = 'grid',
  onCategoryClick,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={gridOutline}
        title="Error loading categories"
        description={error.message}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={gridOutline}
        title="No categories found"
        description="Check back later for new categories"
      />
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className="category-list category-list--horizontal">
        <button className="category-list__scroll-btn category-list__scroll-btn--left" onClick={() => scroll('left')}>
          <IonIcon icon={chevronBack} />
        </button>
        <div className="category-list__scroll" ref={scrollRef}>
          {categories.map((category) => (
            <div key={category.id} className="category-list__item">
              <CategoryCard
                id={category.id}
                name={category.name}
                description={category.description}
                iconUrl={category.icon_url}
                planTypesCount={category.plan_types_count}
                onClick={onCategoryClick ? () => onCategoryClick(category) : undefined}
              />
            </div>
          ))}
        </div>
        <button className="category-list__scroll-btn category-list__scroll-btn--right" onClick={() => scroll('right')}>
          <IonIcon icon={chevronForward} />
        </button>
      </div>
    );
  }

    return (
  <div className="category-list category-list--grid">
    <ResponsiveGrid
                 columns={{
    xs: '12',   // 12/12 = 1 column on mobile
    sm: '6',    // 6/12 = 2 columns on small tablets
    md: '4',    // 4/12 = 3 columns on tablets
    lg: '3'     // 3/12 = 4 columns on desktop
  }}

    >
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          id={category.id}
          name={category.name}
          description={category.description}
          iconUrl={category.icon_url}
          planTypesCount={category.plan_types_count}
          onClick={onCategoryClick ? () => onCategoryClick(category) : undefined}
        />
      ))}
    </ResponsiveGrid>
  </div>
);

};

export default CategoryList;
