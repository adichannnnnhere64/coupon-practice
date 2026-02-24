import React, { useState, useMemo, useCallback } from 'react';
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
  IonSpinner,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  search,
  chevronDown,
  flame,
  closeCircle,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './SearchPage.scss';
import { usePlansQuery, usePlanTypesQuery, useCategoriesQuery } from '@hooks/useQueries';
import { useDebounce } from '@hooks/useDebounce';

const priceRanges = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: '$200+', min: 200, max: 10000 },
];

type SortOption = {
  value: string;
  label: string;
  sort_by: 'name' | 'actual_price' | 'created_at';
  sort_order: 'asc' | 'desc';
};

const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Newest', sort_by: 'created_at', sort_order: 'desc' },
  { value: 'name', label: 'Name A-Z', sort_by: 'name', sort_order: 'asc' },
  { value: 'price-low', label: 'Price: Low to High', sort_by: 'actual_price', sort_order: 'asc' },
  { value: 'price-high', label: 'Price: High to Low', sort_by: 'actual_price', sort_order: 'desc' },
];

const SearchPage: React.FC = () => {
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ lower: 0, upper: 10000 });
  const [selectedPlanType, setSelectedPlanType] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const perPage = 12;

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch categories and plan types
  const { data: categories, isLoading: categoriesLoading } = useCategoriesQuery();
  const { data: planTypesData, isLoading: planTypesLoading } = usePlanTypesQuery({ per_page: 100 });
  const planTypes = planTypesData?.data || [];

  // Get current sort option
  const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  // Build query params
  const queryParams = useMemo(() => ({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    plan_type_id: selectedPlanType || undefined,
    category_id: selectedCategory || undefined,
    min_price: priceRange.lower > 0 ? priceRange.lower : undefined,
    max_price: priceRange.upper < 10000 ? priceRange.upper : undefined,
    sort_by: currentSort.sort_by,
    sort_order: currentSort.sort_order,
  }), [page, debouncedSearch, selectedPlanType, selectedCategory, priceRange, currentSort]);

  // Use React Query for fetching plans
  const { data, isLoading: loading, error, refetch } = usePlansQuery(queryParams);

  const plans = data?.data || [];
  const meta = data?.meta || null;

  // Track previous filter state to detect changes
  const filterKey = JSON.stringify({
    search: debouncedSearch,
    planType: selectedPlanType,
    category: selectedCategory,
    price: priceRange,
    sort: sortBy
  });
  const prevFilterKeyRef = React.useRef(filterKey);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      setPage(1);
      setAllPlans([]);
    }
  }, [filterKey]);

  // Accumulate plans for infinite scroll
  React.useEffect(() => {
    if (loading) return;

    if (page === 1) {
      setAllPlans(plans);
    } else if (plans.length > 0) {
      setAllPlans(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPlans = plans.filter((p: any) => !existingIds.has(p.id));
        if (newPlans.length === 0) return prev;
        return [...prev, ...newPlans];
      });
    }
  }, [plans, page, loading]);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(async (ev: CustomEvent<void>) => {
    if (meta && meta.current_page < meta.last_page) {
      setPage(prev => prev + 1);
    }
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  }, [meta]);

  const clearFilters = useCallback((): void => {
    setSearchQuery('');
    setPriceRange({ lower: 0, upper: 10000 });
    setSelectedPlanType(null);
    setSelectedCategory(null);
    setSortBy('newest');
    setPage(1);
    setAllPlans([]);
  }, []);

  const handleViewPlan = useCallback((planId: number): void => {
    history.push(`/checkout/${planId}`);
  }, [history]);

  const getPlanTypeName = useCallback((planTypeId: number): string => {
    const planType = planTypes.find((pt: any) => pt.id === planTypeId);
    return planType ? planType.name : 'Unknown';
  }, [planTypes]);

  const getDiscountPercentage = (plan: any): number => {
    if (plan.base_price && plan.actual_price && plan.base_price > plan.actual_price) {
      return Math.round(((plan.base_price - plan.actual_price) / plan.base_price) * 100);
    }
    return 0;
  };

  const hasActiveFilters = selectedPlanType !== null ||
    selectedCategory !== null ||
    priceRange.lower > 0 ||
    priceRange.upper < 10000;

  return (
    <IonPage className="search-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search Plans</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Search Bar */}
        <div className="search-container ion-padding">
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
            placeholder="Search plans by name or description..."
            animated
            showCancelButton="focus"
            debounce={0}
          />

          <div className="search-controls">
            <IonButton
              fill="outline"
              size="small"
              onClick={clearFilters}
              disabled={!hasActiveFilters && !searchQuery}
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
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="category-chips ion-padding-horizontal">
          <IonSegment
            scrollable
            value={selectedCategory?.toString() || 'all'}
            onIonChange={(e) => setSelectedCategory(e.detail.value === 'all' ? null : Number(e.detail.value))}
          >
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            {categoriesLoading ? (
              <IonSpinner name="dots" />
            ) : (
              categories?.map((category: any) => (
                <IonSegmentButton key={category.id} value={category.id.toString()}>
                  <IonLabel>{category.name}</IonLabel>
                </IonSegmentButton>
              ))
            )}
          </IonSegment>
        </div>

        {/* Plan Type Filter Chips */}
        <div className="plan-type-chips ion-padding-horizontal ion-padding-top">
          <div className="chips-scroll">
            <IonChip
              color={selectedPlanType === null ? 'primary' : 'medium'}
              onClick={() => setSelectedPlanType(null)}
            >
              All Types
            </IonChip>
            {planTypesLoading ? (
              <IonSpinner name="dots" />
            ) : (
              planTypes.map((planType: any) => (
                <IonChip
                  key={planType.id}
                  color={selectedPlanType === planType.id ? 'primary' : 'medium'}
                  onClick={() => setSelectedPlanType(planType.id)}
                >
                  {planType.name}
                </IonChip>
              ))
            )}
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

              {/* Plan Types */}
              <IonAccordion value="planTypes">
                <IonItem slot="header" color="light">
                  <IonLabel>Plan Types</IonLabel>
                  <IonIcon slot="end" icon={chevronDown} />
                </IonItem>
                <div className="ion-padding" slot="content">
                  <IonList>
                    <IonItem>
                      <IonCheckbox
                        checked={selectedPlanType === null}
                        onIonChange={() => setSelectedPlanType(null)}
                      />
                      <IonLabel>All Plan Types</IonLabel>
                    </IonItem>
                    {planTypes.map((planType: any) => (
                      <IonItem key={planType.id}>
                        <IonCheckbox
                          checked={selectedPlanType === planType.id}
                          onIonChange={() => setSelectedPlanType(planType.id)}
                        />
                        <IonLabel>{planType.name}</IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
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
                    <IonItem>
                      <IonCheckbox
                        checked={selectedCategory === null}
                        onIonChange={() => setSelectedCategory(null)}
                      />
                      <IonLabel>All Categories</IonLabel>
                    </IonItem>
                    {categories?.map((category: any) => (
                      <IonItem key={category.id}>
                        <IonCheckbox
                          checked={selectedCategory === category.id}
                          onIonChange={() => setSelectedCategory(category.id)}
                        />
                        <IonLabel>{category.name}</IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </div>
              </IonAccordion>
            </IonAccordionGroup>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="active-filters ion-padding">
            <div className="filters-chips">
              {selectedPlanType !== null && (
                <IonChip onClick={() => setSelectedPlanType(null)}>
                  Type: {getPlanTypeName(selectedPlanType)}
                  <IonIcon icon={closeCircle} />
                </IonChip>
              )}
              {selectedCategory !== null && (
                <IonChip onClick={() => setSelectedCategory(null)}>
                  Category: {categories?.find((c: any) => c.id === selectedCategory)?.name}
                  <IonIcon icon={closeCircle} />
                </IonChip>
              )}
              {(priceRange.lower > 0 || priceRange.upper < 10000) && (
                <IonChip onClick={() => setPriceRange({ lower: 0, upper: 10000 })}>
                  Price: ${priceRange.lower} - ${priceRange.upper}
                  <IonIcon icon={closeCircle} />
                </IonChip>
              )}
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="results-info ion-padding">
          <h3>
            {meta?.total || 0} {meta?.total === 1 ? 'plan' : 'plans'} found
            {searchQuery && ` for "${searchQuery}"`}
          </h3>
          {meta && meta.last_page > 1 && (
            <p className="page-info">
              Showing {allPlans.length} of {meta.total}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && page === 1 && (
          <div className="loading-state ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <p>Loading plans...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state ion-text-center ion-padding">
            <IonIcon icon={flame} size="large" color="danger" />
            <h3>Error Loading Plans</h3>
            <p>{(error as Error).message}</p>
            <IonButton onClick={() => refetch()}>
              Try Again
            </IonButton>
          </div>
        )}

        {/* Plans Grid */}
        {!loading || page > 1 ? (
          <div className="products-grid ion-padding">
            <IonGrid>
              <IonRow>
                {allPlans.map(plan => {
                  const discount = getDiscountPercentage(plan);
                  return (
                    <IonCol size="12" sizeMd="6" sizeLg="4" key={plan.id}>
                      <IonCard className="plan-card" button onClick={() => handleViewPlan(plan.id)}>
                        <div className="plan-image">
                          {plan.plan_type?.image || (plan.media && plan.media.length > 0) ? (
                            <img
                              src={plan.plan_type?.image || plan.media?.[0]?.url}
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
                                <IonBadge
                                  color={plan.stock_summary.available > 0 ? "success" : "danger"}
                                >
                                  {plan.stock_summary.available} in stock
                                </IonBadge>
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
                  loadingSpinner="crescent"
                  loadingText="Loading more plans..."
                />
              </IonInfiniteScroll>
            )}

            {!loading && allPlans.length === 0 && !error && (
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
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default SearchPage;
