'use client';

import { Flame, Wind, Droplets, TreePine, Heart, AlertTriangle, ArrowRight } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function EducationPage() {
  const t = useT();

  const burnFacts = [
    { icon: Flame, title: t('education.burnFact1Title'), desc: t('education.burnFact1Desc') },
    { icon: Wind, title: t('education.burnFact2Title'), desc: t('education.burnFact2Desc') },
    { icon: Droplets, title: t('education.burnFact3Title'), desc: t('education.burnFact3Desc') },
    { icon: Heart, title: t('education.burnFact4Title'), desc: t('education.burnFact4Desc') },
  ];

  const recycleReasons = [
    { title: t('education.reason1Title'), desc: t('education.reason1Desc') },
    { title: t('education.reason2Title'), desc: t('education.reason2Desc') },
    { title: t('education.reason3Title'), desc: t('education.reason3Desc') },
    { title: t('education.reason4Title'), desc: t('education.reason4Desc') },
    { title: t('education.reason5Title'), desc: t('education.reason5Desc') },
    { title: t('education.reason6Title'), desc: t('education.reason6Desc') },
  ];

  const decompItems = [
    { material: t('education.decompPaper'), time: t('education.decompPaperTime'), color: 'bg-green-500', width: 'w-[5%]' },
    { material: t('education.decompCardboard'), time: t('education.decompCardboardTime'), color: 'bg-green-600', width: 'w-[8%]' },
    { material: t('education.decompCotton'), time: t('education.decompCottonTime'), color: 'bg-yellow-500', width: 'w-[15%]' },
    { material: t('education.decompLeather'), time: t('education.decompLeatherTime'), color: 'bg-orange-500', width: 'w-[30%]' },
    { material: t('education.decompAlum'), time: t('education.decompAlumTime'), color: 'bg-red-400', width: 'w-[50%]' },
    { material: t('education.decompPet'), time: t('education.decompPetTime'), color: 'bg-red-600', width: 'w-[80%]' },
    { material: t('education.decompGlass'), time: t('education.decompGlassTime'), color: 'bg-red-800', width: 'w-full' },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            {t('education.badge')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">{t('education.title')}</h1>
          <p className="mt-4 text-lg text-neutral-500">{t('education.sub')}</p>
        </div>
      </section>

      {/* Why not burn */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">{t('education.burnTitle')}</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
            <p className="text-red-800 text-sm leading-relaxed">{t('education.burnWarning')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {burnFacts.map((fact, i) => {
              const Icon = fact.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 hover:shadow-card-hover transition-shadow duration-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                      <Icon className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{fact.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{fact.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why recycle */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <TreePine className="h-5 w-5 text-brand-700" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">{t('education.recycleTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recycleReasons.map((reason, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-5 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                <h3 className="font-semibold text-brand-700 text-sm">{reason.title}</h3>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline: Decomposition */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-neutral-900 mb-8 text-center">{t('education.decompTitle')}</h2>
          <div className="space-y-3 max-w-xl mx-auto">
            {decompItems.map((item, i) => (
              <div key={i} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-900 text-sm">{item.material}</span>
                  <span className="text-sm text-neutral-500 font-medium">{item.time}</span>
                </div>
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} ${item.width}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-brand-900 py-20 text-center">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)` }} />
        <div className="relative max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">{t('education.finalTitle')}</h2>
          <p className="text-brand-300 mb-8 leading-relaxed">{t('education.finalSub')}</p>
          <a
            href="/request"
            className="inline-flex items-center gap-2 bg-white text-brand-900 px-8 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
          >
            {t('education.finalBtn')}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
