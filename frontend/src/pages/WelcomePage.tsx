import {  useEffect } from 'react';
import {
  // IonCard,
  // IonCardContent,
  // IonCardHeader,
  // IonCardSubtitle,
  // IonCardTitle,
  IonContent,
  IonPage,
  // IonGrid,
  // IonRow,
  // IonCol,
  IonButton,
  IonIcon,
} from '@ionic/react';
import {
  chevronForward,
} from 'ionicons/icons';
import './WelcomePage.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
// import apiClient from '@services/APIService';
import { useCategories } from '@services/useApi';
import { CategoryList } from '@components/categories';
import { SectionHeader } from '@components/layout';
import { useHistory } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  const history = useHistory();
  // API-driven products (PlanTypes / Operators)
  // const [planTypes, setPlanTypes] = useState<any[]>([]);
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  // const getOperators = async () => {
  //   try {
  //     const result = await apiClient.getPlanTypes() as any;
  //     if (result.success && result.data) {
  //       setPlanTypes(result.data);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  useEffect(() => {
    // getOperators();
  }, []);

  // Hero slides data
  const heroSlides = [
    {
      title: 'Summer Sale 2024',
      subtitle: 'Up to 50% Off',
      description: 'Discover amazing deals on top brands',
      color: 'primary',
      bgColor: 'var(--blue-primary)',
      image: 'assets/slide1.jpg',
      buttonText: 'Shop Now',
    },
    {
      title: 'Free Shipping',
      subtitle: 'On Orders Over $50',
      description: 'No minimum purchase required',
      color: 'success',
      bgColor: 'var(--accent-indigo)',
      image: 'assets/slide3.jpg',
      buttonText: 'Start Shopping',
    },
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

        {/* Categories Section */}
        <section className="categories-section">
          <SectionHeader
            title="Browse Categories"
            subtitle="Explore our product categories"
            actionLabel="View All"
            onAction={() => history.push('/products')}
          />
          <CategoryList
            categories={categories}
            loading={categoriesLoading}
            error={categoriesError}
            variant="horizontal"
            onCategoryClick={(category) => history.push(`/category/${category.id}`)}
          />
        </section>

      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;
