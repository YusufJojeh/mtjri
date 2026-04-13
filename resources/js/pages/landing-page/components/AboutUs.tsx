import React from 'react';
import { Target, Heart, Award, Lightbulb, Star, Shield, Users, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LANDING_VIEWPORT, landingRevealTransition } from '../lib/landing-motion';

interface AboutUsProps {
  brandColor?: string;
  settings: any;
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
  'target': Target,
  'heart': Heart,
  'award': Award,
  'lightbulb': Lightbulb,
  'tar': Star,
  'hield': Shield,
  'users': Users,
  'zap': Zap
};

export default function AboutUs({ settings, brandColor = '#3b82f6' }: AboutUsProps) {
  const reduce = useReducedMotion() ?? false;
  const { t, i18n } = useTranslation();

  // Get colors from settings
  const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
  const primaryColor = colors.primary || brandColor;
  const secondaryColor = colors.secondary || '#059669';
  const accentColor = colors.accent || '#065f46';
  
  // Static content only - no dynamic images
  const sectionImage = null;
  
  // Re-create values array when language changes (i18n.language as dependency)
  const values = React.useMemo(() => [
    {
      icon: 'target',
      title: t('landing.about.values.mission.title'),
      description: t('landing.about.values.mission.description')
    },
    {
      icon: 'heart',
      title: t('landing.about.values.values.title'),
      description: t('landing.about.values.values.description')
    },
    {
      icon: 'award',
      title: t('landing.about.values.commitment.title'),
      description: t('landing.about.values.commitment.description')
    },
    {
      icon: 'lightbulb',
      title: t('landing.about.values.vision.title'),
      description: t('landing.about.values.vision.description')
    }
  ], [t, i18n.language]);

  const stats = React.useMemo(() => [
    { value: '10K+', label: t('landing.about.stats.users'), color: primaryColor },
    { value: '50+', label: t('landing.about.stats.countries'), color: primaryColor },
    { value: '99%', label: t('landing.about.stats.satisfaction'), color: primaryColor }
  ], [t, i18n.language, primaryColor]);

  return (
    <section id='about' className='bg-white py-20 md:py-32'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          className='grid items-center gap-12 lg:grid-cols-2 lg:gap-20'
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          transition={landingRevealTransition(reduce, 0)}
        >
          {/* Content */}
          <div>
                   <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6'>
                     {t('landing.about.title')}
                   </h2>
            {/* Description removed - using story content only */}
                   <div 
                     className='text-lg text-gray-600 mb-8 leading-relaxed' 
                     dangerouslySetInnerHTML={{
                       __html: t('landing.about.description').replace(/\n/g, '<br />')
                     }} 
                   />
            
            {/* Stats */}
            {stats.length > 0 && (
              <div className='grid grid-cols-3 gap-4 md:gap-6 mt-8'>
                {stats.map((stat, index) => {
                  const statColor = stat.color === 'blue' ? primaryColor : stat.color === 'green' ? secondaryColor : stat.color === 'purple' ? accentColor : stat.color || primaryColor;
                  return (
                    <div key={index} className='p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200'>
                      <p className='text-3xl md:text-4xl font-bold mb-1' style={{ color: statColor }}>
                        {stat.value}
                      </p>
                      <p className='text-sm text-gray-600 font-medium'>
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image/Graphic */}
          <div className='relative'>
            {sectionImage ? (
              <div className='aspect-square rounded-2xl overflow-hidden shadow-lg'>
                <img 
                  src={sectionImage} 
                  alt='About Us' 
                  className='w-full h-full object-cover rounded-2xl'
                />
              </div>
            ) : (
              <div 
                className='aspect-square rounded-2xl flex items-center justify-center shadow-lg'
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}15)` 
                }}
              >
                <div className='text-center p-8'>
                  <div className='w-24 h-24 bg-white/50 rounded-full mx-auto mb-6 flex items-center justify-center'>
                    <span className='text-4xl'>🚀</span>
                  </div>
                  <h4 className='text-xl font-semibold text-gray-900 mb-2'>
                    {t('landing.about.innovationDriven')}
                  </h4>
                  <p className='text-gray-600 text-sm'>
                    {t('landing.about.buildingFuture')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Floating accents */}
            <div 
              className='absolute -bottom-6 -left-6 w-24 h-24 rounded-xl -z-10 opacity-60'
              style={{ backgroundColor: `${accentColor}20` }}
            />
            <div 
              className='absolute -top-6 -right-6 w-32 h-32 rounded-xl -z-10 opacity-60'
              style={{ backgroundColor: `${primaryColor}20` }}
            />
          </div>
        </motion.div>

        <div className='mt-20 grid gap-8 md:mt-24 md:grid-cols-3 lg:gap-12'>
          {values.slice(0, 3).map((value: any, index: number) => {
            const IconComponent = iconMap[value.icon] || Target;
            return (
              <motion.div
                key={index}
                className='landing-card-depth rounded-xl p-6 text-center'
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={LANDING_VIEWPORT}
                transition={landingRevealTransition(reduce, index + 1)}
              >
                <div
                  className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-shadow duration-300 motion-safe:hover:shadow-md'
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <IconComponent className='h-8 w-8' style={{ color: primaryColor }} />
                </div>
                <h3 className='mb-3 text-xl font-semibold text-gray-900'>{value.title}</h3>
                <p className='leading-relaxed text-gray-600'>{value.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
