import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonButton,
  IonIcon,
  IonLabel,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonRange,
  IonItem,
  IonList,
  IonCheckbox,
  IonAccordion,
  IonAccordionGroup,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonBadge,
  IonLoading,
} from '@ionic/react';
import {
  search,
  chevronDown,
  flame,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './SearchPage.scss';
import { usePlans } from '@services/useApi';

const categories = [
  { id: 'all', name: 'All Plans', count: 0 },
  { id: '1', name: 'Operator', count: 0 },
  { id: '2', name: 'Bagistix', count: 0 },
  { id: '3', name: 'Javelin', count: 0 },
];

const priceRanges = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: '$200+', min: 200, max: 10000 },
];

const SearchPage: React.FC = () => {
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ lower: 0, upper: 10000 });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Use the plans hook with filters
  const { 
    data: plans, 
    meta, 
    loading, 
    error, 
    updateFilters 
  } = usePlans({
    page,
    per_page: perPage,
    search: searchQuery || undefined,
    plan_type_id: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
    is_active: activeFilter !== null ? activeFilter : undefined,
    min_price: priceRange.lower > 0 ? priceRange.lower : undefined,
    max_price: priceRange.upper < 10000 ? priceRange.upper : undefined,
  });

	console.log(plans)

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({
        page: 1,
        per_page: perPage,
        search: searchQuery || undefined,
        plan_type_id: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
        is_active: activeFilter !== null ? activeFilter : undefined,
        min_price: priceRange.lower > 0 ? priceRange.lower : undefined,
        max_price: priceRange.upper < 10000 ? priceRange.upper : undefined,
      });
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, activeFilter, priceRange]);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(async (ev: any) => {
    if (meta && meta.current_page < meta.last_page) {
      setPage(prev => prev + 1);
      await updateFilters({
        page: page + 1,
        per_page: perPage,
        search: searchQuery || undefined,
        plan_type_id: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
        is_active: activeFilter !== null ? activeFilter : undefined,
        min_price: priceRange.lower > 0 ? priceRange.lower : undefined,
        max_price: priceRange.upper < 10000 ? priceRange.upper : undefined,
      });
    }
    ev.target.complete();
  }, [meta, page, searchQuery, selectedCategory, activeFilter, priceRange]);

  const clearFilters = (): void => {
    setSearchQuery('');
    setPriceRange({ lower: 0, upper: 10000 });
    setSelectedCategory('all');
    setActiveFilter(null);
    setSortBy('popular');
    setPage(1);
    updateFilters({
      page: 1,
      per_page: perPage,
    });
  };

  const handleViewPlan = (planId: number): void => {

    history.push(`/checkout/${planId}`);
  };

  // const formatPrice = (price: number): string => {
  //   return `$${price.toFixed(2)}`;
  // };

  const getPlanTypeName = (planTypeId: number): string => {
    const category = categories.find(cat => cat.id === planTypeId.toString());
    return category ? category.name : 'Unknown';
  };

  const getDiscountPercentage = (plan: any): number => {
    if (plan.base_price && plan.actual_price && plan.base_price > plan.actual_price) {
      return Math.round(((plan.base_price - plan.actual_price) / plan.base_price) * 100);
    }
    return 0;
  };

  // Sort plans locally
  const sortedPlans = [...plans].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.actual_price - b.actual_price;
      case 'price-high':
        return b.actual_price - a.actual_price;
      case 'name':
        return a.name.localeCompare(b.name);
      default: // popular
        return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    }
  });

  return (
    <IonPage className="search-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search Plans</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonLoading isOpen={loading} message="Loading plans..." />

        {/* Search Bar */}
        <div className="search-container ion-padding">
          <IonSearchbar
            value={searchQuery}
            onIonChange={(e) => setSearchQuery(e.detail.value || '')}
            placeholder="Search plans by name or description..."
            animated
            showCancelButton="focus"
          />
          
          <div className="search-controls">
            <IonButton 
              fill="outline" 
              size="small"
              onClick={clearFilters}
            >
              Clear All
            </IonButton>
            
            <div className="sort-dropdown">
              <IonLabel>Sort by:</IonLabel>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="popular">Most Popular</option>
                <option value="name">Name A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel ion-padding">
            <IonAccordionGroup>
              {/* Price Range */}
              <IonAccordion value="price">
                <IonItem slot="header" color="light">
                  <IonLabel>Price Range</IonLabel>
                  <IonIcon slot="end" icon={chevronDown} />
                </IonItem>
                <div className="ion-padding" slot="content">
                  <IonRange
                    dualKnobs={true}
                    min={0}
                    max={10000}
                    step={100}
                    value={priceRange}
                    onIonChange={(e) => setPriceRange(e.detail.value as any)}
                  >
                    <IonLabel slot="start">${priceRange.lower}</IonLabel>
                    <IonLabel slot="end">${priceRange.upper}</IonLabel>
                  </IonRange>
                  <div className="price-range-options">
                    {priceRanges.map((range, index) => (
                      <IonChip
                        key={index}
                        outline={priceRange.lower !== range.min || priceRange.upper !== range.max}
                        onClick={() => setPriceRange({ lower: range.min, upper: range.max })}
                      >
                        {range.label}
                      </IonChip>
                    ))}
                  </div>
                </div>
              </IonAccordion>

              {/* Categories */}
              <IonAccordion value="categories">
                <IonItem slot="header" color="light">
                  <IonLabel>Categories</IonLabel>
                  <IonIcon slot="end" icon={chevronDown} />
                </IonItem>
                <div className="ion-padding" slot="content">
                  <IonList>
                    {categories.map(category => (
                      <IonItem key={category.id}>
                        <IonCheckbox
                          checked={selectedCategory === category.id}
                          onIonChange={() => setSelectedCategory(category.id)}
                        />
                        <IonLabel>
                          {category.name}
                          <p>{category.count} items</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </div>
              </IonAccordion>

              {/* Status */}
              <IonAccordion value="status">
                <IonItem slot="header" color="light">
                  <IonLabel>Status</IonLabel>
                  <IonIcon slot="end" icon={chevronDown} />
                </IonItem>
                <div className="ion-padding" slot="content">
                  <IonList>
                    <IonItem>
                      <IonCheckbox
                        checked={activeFilter === null}
                        onIonChange={() => setActiveFilter(null)}
                      />
                      <IonLabel>All Plans</IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonCheckbox
                        checked={activeFilter === true}
                        onIonChange={() => setActiveFilter(true)}
                      />
                      <IonLabel>Active Only</IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonCheckbox
                        checked={activeFilter === false}
                        onIonChange={() => setActiveFilter(false)}
                      />
                      <IonLabel>Inactive Only</IonLabel>
                    </IonItem>
                  </IonList>
                </div>
              </IonAccordion>
            </IonAccordionGroup>
          </div>
        )}

        {/* Active Filters */}
        <div className="active-filters ion-padding">
          <div className="filters-chips">
            {selectedCategory !== 'all' && (
              <IonChip onClick={() => setSelectedCategory('all')}>
                Category: {getPlanTypeName(parseInt(selectedCategory))}
                <IonIcon name="close-circle" />
              </IonChip>
            )}
            {activeFilter !== null && (
              <IonChip onClick={() => setActiveFilter(null)}>
                Status: {activeFilter ? 'Active' : 'Inactive'}
                <IonIcon name="close-circle" />
              </IonChip>
            )}
            {(priceRange.lower > 0 || priceRange.upper < 10000) && (
              <IonChip onClick={() => setPriceRange({ lower: 0, upper: 10000 })}>
                Price: ${priceRange.lower} - ${priceRange.upper}
                <IonIcon name="close-circle" />
              </IonChip>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info ion-padding">
          <h3>
            {/* {meta?.total || 0} {meta?.total === 1 ? 'plan' : 'plans'} found */}
            {searchQuery && ` for "${searchQuery}"`}
          </h3>
          {meta && (
            <p className="page-info">
              Page {meta.current_page} of {meta.last_page}
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="error-state ion-text-center ion-padding">
            <IonIcon icon={flame} size="large" color="danger" />
            <h3>Error Loading Plans</h3>
            <p>{error.message}</p>
            <IonButton onClick={() => updateFilters({})}>
              Try Again
            </IonButton>
          </div>
        )}

        {/* Plans Grid */}
        <div className="products-grid ion-padding">
          <IonGrid>
            <IonRow>
              {sortedPlans.map(plan => {
                const discount = getDiscountPercentage(plan);
                return (
                  <IonCol size="12" sizeMd="6" sizeLg="4" key={plan.id}>
                    <IonCard className="plan-card" button onClick={() => handleViewPlan(plan.id)}>
                      <div className="plan-image">
                        { plan.plan_type?.image || plan.media && plan.media.length > 0 ? (
                          <img 
                            src={plan.plan_type?.image ?? ''} 
                            alt={plan.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="placeholder-image">
                            {getPlanTypeName(plan.plan_type_id).charAt(0)}
                          </div>
                        )}
                        
                        <div className="plan-tags">
                          {discount > 0 && (
                            <IonBadge color="danger" className="discount-badge">
                              {discount}% OFF
                            </IonBadge>
                          )}
                          {!plan.is_active && (
                            <IonBadge color="medium" className="status-badge">
                              Inactive
                            </IonBadge>
                          )}
                          <IonChip color="primary" className="category-chip">
                            {getPlanTypeName(plan.plan_type_id)}
                          </IonChip>
                        </div>
                      </div>
                      
                      <IonCardHeader>
                        <IonCardTitle>{plan.name}</IonCardTitle>
                        <IonCardSubtitle>
                          {plan.description || 'No description available'}
                        </IonCardSubtitle>
                      </IonCardHeader>
                      
                      <div className="plan-content">
                        <div className="plan-attributes">
                          {plan.attributes && plan.attributes.slice(0, 2).map((attr: any, idx: number) => (
                            <div key={idx} className="attribute">
                              <span className="attribute-name">{attr.name}:</span>
                              <span className="attribute-value">{attr.value}</span>
                            </div>
                          ))}
                          {plan.validity_days && (
                            <div className="attribute">
                              <span className="attribute-name">Validity:</span>
                              <span className="attribute-value">{plan.validity_days} days</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="plan-footer">
                          <div className="price-section">
                            {discount > 0 ? (
                              <>
                                <span className="original-price">
                                  ${plan.base_price?.toFixed(2)}
                                </span>
                                <h3 className="current-price">
                                  ${plan.actual_price?.toFixed(2)}
                                </h3>
                              </>
                            ) : (
                              <h3 className="current-price">
                                ${plan.actual_price?.toFixed(2)}
                              </h3>
                            )}
                          </div>
                          
                          <div className="stock-info">
                            {plan.stock_summary && (
                              <>
                                <IonBadge 
                                  color={plan.stock_summary.available > 0 ? "success" : "danger"}
                                >
                                  {plan.stock_summary.available} in stock
                                </IonBadge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </IonCard>
                  </IonCol>
                );
              })}
            </IonRow>
          </IonGrid>

          {/* Infinite Scroll */}
          {meta && meta.current_page < meta.last_page && (
            <IonInfiniteScroll onIonInfinite={handleInfiniteScroll}>
              <IonInfiniteScrollContent
                loadingText="Loading more plans..."
              />
            </IonInfiniteScroll>
          )}

          {!loading && sortedPlans.length === 0 && !error && (
            <div className="no-results ion-text-center ion-padding">
              <IonIcon icon={search} size="large" />
              <h3>No Plans Found</h3>
              <p>Try adjusting your search or filters</p>
              <IonButton onClick={clearFilters}>
                Clear All Filters
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SearchPage;
