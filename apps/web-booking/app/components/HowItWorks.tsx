import { Card, CardContent } from '@dc-beauty/ui'
import { UserPlus, Settings, Users } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: UserPlus,
      title: 'Создайте аккаунт',
      description: 'Зарегистрируйтесь и настройте профиль вашего салона за 5 минут'
    },
    {
      number: '02',
      icon: Settings,
      title: 'Настройте услуги',
      description: 'Добавьте ваши услуги, цены, мастеров и расписание работы'
    },
    {
      number: '03',
      icon: Users,
      title: 'Принимайте клиентов',
      description: 'Начните принимать онлайн-записи и управлять бизнесом эффективно'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Как это работает
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Простые шаги для запуска вашего цифрового салона красоты
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-purple-300 to-pink-300"></div>
          
          {steps.map((step, index) => (
            <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative">
              <CardContent className="p-8">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                  <step.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
