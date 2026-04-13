import React from 'react';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TeamSectionProps {
  brandColor?: string;
  settings?: any;
}

export default function TeamSection({ settings, brandColor = '#3b82f6' }: TeamSectionProps) {
  const { t } = useTranslation();
  const defaultMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      bio: 'Former tech executive with 15+ years in digital innovation. Passionate about sustainable business solutions.',
      image: '',
      linkedin: '#',
      twitter: '#',
      email: 'sarah@Store.com'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      bio: 'Full-stack developer and AI enthusiast. Leads our technical vision and product development.',
      image: '',
      linkedin: '#',
      twitter: '#',
      email: 'michael@Store.com'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Design',
      bio: 'UX/UI expert focused on creating intuitive and beautiful user experiences that drive engagement.',
      image: '',
      linkedin: '#',
      twitter: '#',
      email: 'emily@Store.com'
    },
    {
      name: 'David Kim',
      role: 'Head of Marketing',
      bio: 'Growth marketing specialist with expertise in B2B SaaS and digital customer acquisition.',
      image: '',
      linkedin: '#',
      twitter: '#',
      email: 'david@Store.com'
    }
  ];

  // Static content from i18next only
  const teamMembers = defaultMembers;

  return (
    <section className='py-12 sm:py-16 lg:py-20 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-8 sm:mb-12 lg:mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            {t('landing.team.title')}
          </h2>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium'>
            {t('landing.team.subtitle')}
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
          {teamMembers.map((member, index) => (
            <div key={index} className='bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors'>
              {/* Profile Image */}
              <div className='w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center' style={{ backgroundColor: brandColor }}>
                <span className='text-white text-lg font-bold'>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>

              {/* Member Info */}
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                  {member.name}
                </h3>
                <p className='text-gray-700 font-medium mb-3'>
                  {member.role}
                </p>
                <p className='text-gray-600 text-sm leading-relaxed mb-4'>
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className='flex justify-center gap-2'>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      className='w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors'
                    >
                      <Linkedin className='w-4 h-4 text-gray-600' />
                    </a>
                  )}
                  {member.twitter && (
                    <a
                      href={member.twitter}
                      className='w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors'
                    >
                      <Twitter className='w-4 h-4 text-gray-600' />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className='w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors'
                    >
                      <Mail className='w-4 h-4 text-gray-600' />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Join Team CTA - Static content */}
        <div className='text-center mt-8 sm:mt-12 lg:mt-16'>
          <div className='bg-gray-50 rounded-xl p-8 border border-gray-200 max-w-2xl mx-auto'>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              {t('landing.team.ctaTitle')}
            </h3>
            <p className='text-gray-600 mb-6'>
              {t('landing.team.ctaDescription')}
            </p>
            <button className='text-white px-8 py-3 rounded-lg transition-colors font-semibold' style={{ backgroundColor: brandColor }}>
              {t('landing.team.ctaButton')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}