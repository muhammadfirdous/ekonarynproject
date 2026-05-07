'use client';

import { Target, Heart, Users, Mountain } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function AboutPage() {
  const t = useT();

  const team = [
    { name: t('about.member1Name'), role: t('about.member1Role'), desc: t('about.member1Desc') },
    { name: t('about.member2Name'), role: t('about.member2Role'), desc: t('about.member2Desc') },
    { name: t('about.member3Name'), role: t('about.member3Role'), desc: t('about.member3Desc') },
  ];

  const values = [
    { icon: Target, title: t('about.valueMission'), desc: t('about.valueMissionDesc') },
    { icon: Heart, title: t('about.valueCare'), desc: t('about.valueCareDesc') },
    { icon: Users, title: t('about.valueCommunity'), desc: t('about.valueCommunityDesc') },
    { icon: Mountain, title: t('about.valueNature'), desc: t('about.valueNatureDesc') },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            {t('about.badge')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
            {t('about.title')}
          </h1>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl mx-auto">{t('about.sub')}</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">{t('about.storyTitle')}</h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed text-[16px]">
            <p>{t('about.story1')}</p>
            <p>{t('about.story2')}</p>
            <p>{t('about.story3')}</p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900">{t('about.valuesTitle')}</h2>
            <p className="text-neutral-500 mt-2">{t('about.valuesSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 text-center border border-neutral-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl mb-4">
                    <Icon className="h-6 w-6 text-brand-700" />
                  </div>
                  <h3 className="font-semibold text-neutral-900">{v.title}</h3>
                  <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900">{t('about.teamTitle')}</h2>
            <p className="text-neutral-500 mt-2">{t('about.teamSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center border border-neutral-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                <div className="w-16 h-16 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl font-bold text-brand-700">{member.name[0]}</span>
                </div>
                <h3 className="font-semibold text-neutral-900">{member.name}</h3>
                <p className="text-sm text-brand-600 font-medium mt-0.5">{member.role}</p>
                <p className="text-sm text-neutral-500 mt-3 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
