import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonText,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useCategoryPlanTypes } from '@services/useApi';
import { CategoryNavigation } from '@components/categories';
import { SectionHeader, ResponsiveGrid } from '@components/layout';
import { PlanTypeCard, LoadingSpinner, ErrorState, EmptyState } from '@components/ui';
import { gridOutline } from 'ionicons/icons';
import './CategoryPage.scss';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { category, planTypes, loading, error } = useCategoryPlanTypes(
    categoryId ? parseInt(categoryId) : null
  );

  if (loading) {
    return (
      <IonPage className="category-page">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <LoadingSpinner message="Loading category..." fullPage />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage className="category-page">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="ion-padding">
            <ErrorState
              title="Failed to load category"
              message={error.message}
            />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!category) {
    return (
      <IonPage className="category-page">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="ion-padding">
            <EmptyState
              icon={gridOutline}
              title="Category not found"
              description="The category you're looking for doesn't exist"
              actionLabel="Go Home"
              onAction={() => window.location.href = '/'}
            />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="category-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{category.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <CategoryNavigation
          items={[
            { label: category.name, isActive: true },
          ]}
        />

        <div className="category-page__header">
          <h1 className="category-page__title">{category.name}</h1>
          {category.description && (
            <IonText color="medium" className="category-page__description">
              <p>{category.description}</p>
            </IonText>
          )}
        </div>

        <div className="category-page__content">
          <SectionHeader
            title="Plan Types"
            subtitle={`${planTypes.length} ${planTypes.length === 1 ? 'type' : 'types'} available`}
          />

          {planTypes.length > 0 ? (
            <div className="category-page__grid">
              <ResponsiveGrid columns={{ xs: '12', sm: '6', md: '4', lg: '3' }}>
                {planTypes.map((planType) => (
                  <PlanTypeCard
                    key={planType.id}
                    id={planType.id}
                    name={planType.name}
                    description={planType.description}
                    image={planType.image}
                    plansCount={planType.plans_count}
                    isActive={planType.is_active}
                  />
                ))}
              </ResponsiveGrid>
            </div>
          ) : (
            <div className="ion-padding">
              <EmptyState
                icon={gridOutline}
                title="No plan types available"
                description="Check back later for new plan types in this category"
              />
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CategoryPage;
