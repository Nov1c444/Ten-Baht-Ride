import { useTranslation } from 'react-i18next'

export default function AboutPage() {
  const { t } = useTranslation()
  const steps = t('about.howToRideSteps', { returnObjects: true }) as string[]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">{t('about.title')}</h2>

      <section className="mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('about.whatIs')}</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="text-6xl shrink-0">&#x1F69B;</div>
            <p className="text-gray-600 leading-relaxed">{t('about.whatIsDesc')}</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('about.howToRide')}</h3>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
                {index + 1}
              </div>
              <p className="text-gray-700 pt-2">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('advisor.tips')}</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <ul className="space-y-3">
            {[
              'tips.waveToStop',
              'tips.pressButton',
              'tips.payWhenExit',
              'tips.haveChange',
              'tips.checkDirection',
              'tips.nightPrice',
              'tips.charterPrice',
              'tips.beachRoadSouth',
              'tips.secondRoadNorth',
            ].map((tipKey) => (
              <li key={tipKey} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-gray-600">{t(tipKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        {t('about.disclaimer')}
      </div>
    </div>
  )
}
