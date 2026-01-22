// routes/_authenticated/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Shield,
  Truck,
  RefreshCw,
  Zap,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { OperatorList } from '../../components/Operator/OperatorList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
});

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const slides = [
    {
      id: 1,
      image: '../b1.jpg',
      title: 'Latest Mobile Plans',
      subtitle: 'Get the best deals on your favorite operators',
      cta: 'Browse Plans',
      color: 'from-indigo-600 to-purple-600',
    },
    {
      id: 2,
      image: '../b2.jpg',
      title: 'Instant Recharge',
      subtitle: 'Recharge your mobile in seconds',
      cta: 'Recharge Now',
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 3,
      image: '../b3.jpg',
      title: 'Special Offers',
      subtitle: 'Exclusive discounts for premium users',
      cta: 'View Offers',
      color: 'from-blue-600 to-indigo-600',
    },
  ];

  const features = [
    {
      icon: Truck,
      title: 'Instant Delivery',
      description: 'Coupons delivered instantly after payment',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure & encrypted transactions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: '30-day refund policy',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);



    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);


  const queryClient = new QueryClient();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Search Bar - Sticky Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search operators, plans, or coupons..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              onFocus={() => setIsAutoPlaying(false)}
              onBlur={() => setIsAutoPlaying(true)}
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Carousel */}
        <section className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Carousel Image */}
            <div className="relative h-64 md:h-80 lg:h-96">
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover opacity-40"
                loading="eager"
              />

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].color} opacity-80 mix-blend-multiply`} />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10">
                <div className="max-w-lg">
                  <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
                    {slides[currentSlide].title}
                  </h1>
                  <p className="text-gray-200 text-sm md:text-base mb-6">
                    {slides[currentSlide].subtitle}
                  </p>
                  <button className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
                    {slides[currentSlide].cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`${feature.bgColor} rounded-2xl p-6 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  <div className={`${feature.bgColor} p-3 rounded-xl`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Operators Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Popular Operators
                </h2>
              </div>
              <p className="text-gray-600">
                Choose from top mobile operators
              </p>
            </div>
            <button className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
              View all
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Operators Grid - Optimized for mobile */}
        <QueryClientProvider client={queryClient}>
          <OperatorList countryId={null} />
        </QueryClientProvider>
        </section>

        {/* Promo Banner */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="text-yellow-100 font-semibold">
                    Premium Member
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Get 20% Off Your First Recharge
                </h3>
                <p className="text-indigo-100">
                  Use code: WELCOME20 at checkout
                </p>
              </div>
              <button className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all whitespace-nowrap">
                Claim Offer
              </button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900 mb-1">50+</div>
            <div className="text-sm text-gray-600">Operators</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900 mb-1">1000+</div>
            <div className="text-sm text-gray-600">Plans</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900 mb-1">24/7</div>
            <div className="text-sm text-gray-600">Support</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900 mb-1">10K+</div>
            <div className="text-sm text-gray-600">Users</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Route;
