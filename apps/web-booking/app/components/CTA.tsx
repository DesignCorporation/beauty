import { Button } from '@dc-beauty/ui'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-300/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
      
      <div className="container mx-auto px-4 text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-12 w-12 text-yellow-300" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Начните бесплатно уже сегодня
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Присоединяйтесь к тысячам успешных салонов красоты. 
            14 дней бесплатного использования, настройка за 5 минут.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-4 text-lg font-semibold shadow-xl"
            >
              Попробовать бесплатно
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-purple-700 px-8 py-4 text-lg font-semibold"
            >
              Связаться с нами
            </Button>
          </div>
          <p className="text-purple-200 text-sm mt-6">
            Кредитная карта не требуется • Отмена в любое время
          </p>
        </div>
      </div>
    </section>
  )
}
