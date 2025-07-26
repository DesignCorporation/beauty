import { Card, CardContent } from '@dc-beauty/ui'
import { CreditCard, Settings, Globe } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: CreditCard,
      title: 'Без комиссии',
      description: 'Никаких скрытых платежей. Фиксированная подписка для предсказуемого бизнеса.'
    },
    {
      icon: Settings,
      title: 'Встроенная CRM и автоматизация',
      description: 'Управляйте клиентами, записями и персоналом в одном месте с умной автоматизацией.'
    },
    {
      icon: Globe,
      title: 'Поддержка всех языков и устройств',
      description: 'Работает на любых устройствах с поддержкой множества языков для международного бизнеса.'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Почему выбирают Beauty Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Мы создали решение, которое действительно работает для салонов красоты
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
