import { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
} from '@ionic/react';
import {
  chevronForward,
  flame,
  trendingUp,
  shieldCheckmark,
  cash,
} from 'ionicons/icons';
import './WelcomePage.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import apiClient from '@services/APIService';

const WelcomePage: React.FC = () => {
  // API-driven products (PlanTypes / Operators)
  const [planTypes, setPlanTypes] = useState<any[]>([]);

  const getOperators = async () => {
    try {
      const result = await apiClient.getPlanTypes() as any;
      if (result.success && result.data) {
        setPlanTypes(result.data);
        console.log(result.data); // this shows your Operator/Bagistix/Javelin data
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getOperators();
  }, []);

  // Hero slides data
  const heroSlides = [
    {
      title: 'Summer Sale 2024',
      subtitle: 'Up to 50% Off',
      description: 'Discover amazing deals on top brands',
      color: 'primary',
      bgColor: 'var(--ion-color-primary)',
      image: 'assets/slide1.jpg',
      buttonText: 'Shop Now',
    },
    {
      title: 'Free Shipping',
      subtitle: 'On Orders Over $50',
      description: 'No minimum purchase required',
      color: 'success',
      bgColor: 'var(--ion-color-success)',
      image: 'assets/slide3.jpg',
      buttonText: 'Start Shopping',
    },
  ];

  // Features data
  const features = [
    { icon: shieldCheckmark, title: 'Secure Payment', description: '100% safe & secure transactions' },
    { icon: cash, title: 'Money Back Guarantee', description: '30-day return policy' },
    { icon: trendingUp, title: 'Best Prices', description: 'Price match guarantee' },
    { icon: flame, title: 'Fast Delivery', description: 'Free shipping over $50' },
  ];

  return (
    <IonPage className="welcome-page">
      <IonContent fullscreen className="store-content">
        {/* Hero Slider */}
        <section className="hero-slider">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={0}
            slidesPerView={1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="hero-swiper"
          >
            {heroSlides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className="hero-slide" style={{ backgroundColor: slide.bgColor }}>
                  <div className="slide-content">
                    <h2 className="slide-title">{slide.title}</h2>
                    <h3 className="slide-subtitle">{slide.subtitle}</h3>
                    <p className="slide-description">{slide.description}</p>
                    <IonButton color="light" fill="solid" size="large" className="slide-button">
                      {slide.buttonText}
                      <IonIcon slot="end" icon={chevronForward} />
                    </IonButton>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        {/* Features Section */}
        <section className="features-section ion-padding">
          <IonGrid>
            <IonRow>
              {features.map((feature, index) => (
                <IonCol size="6" sizeMd="3" key={index}>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <IonIcon icon={feature.icon} />
                    </div>
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>

        {/* Products Section (API-driven PlanTypes) */}
        <section className="products-section ion-padding">
          <div className="section-header">
            <h2>Featured Operators</h2>
            <IonButton fill="clear" color="primary">
              View All <IonIcon slot="end" icon={chevronForward} />
            </IonButton>
          </div>

          <IonGrid>
            <IonRow>
              {planTypes.map((plan) => (
                <IonCol size="6" sizeMd="3" key={plan.id}>

                  <IonCard button routerLink={`/operator/${plan.id}`}>
                    <div className="product-image">
                      <img src={plan.image} alt={plan.name} />
                    </div>
                    <IonCardHeader>
                      <IonCardSubtitle>{plan.description}</IonCardSubtitle>
                      <IonCardTitle>{plan.name}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="product-footer">
                        <div className="product-price">
                          <p>Plans: {plan.plans_count}</p>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;

