import { Card, CardContent, CardHeader, CardTitle } from '@dc-beauty/ui'
import { 
  Calendar, 
  Users, 
  Zap, 
  Star, 
  Bell, 
  Camera,
  BarChart3,
  MessageSquare
} from 'lucide-react'

export function PlatformFeatures() {
  const features = [
    {
      icon: Calendar,
      title: 'Онлайн-запись',
      description: 'Удобная система бронирования с автоматическим подтверждением'
    },
    {
      icon: Users,
      title: 'CRM система',
      description: 'Полное управление клиентской базой и историей посещений'
    },
    {
      icon: Zap,
      title: 'Автоматизация',
      description: 'Умные напоминания, SMS и email рассылки'
    },
    {
      icon: Star,
      title: 'Система отзывов',
      description: 'Сбор и управление отзывами для улучшения репутации'
    },
    {
      icon: Bell,
      title: 'Уведомления',
      description: 'Настраиваемые уведомления для клиентов и персонала'
    },
    {
      icon: Camera,
      title: 'Галерея работ',
      description: 'Демонстрация портфолио и привлечение новых клиентов'
    },
    {
      icon: BarChart3,
      title: 'Аналитика',
      description: 'Детальная отчетность по доходам и эффективности'
    },
    {
      icon: MessageSquare,
      title: 'Чат поддержка',
      description: 'Круглосуточная техническая поддержка на вашем языке'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Полный функционал для вашего салона
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Все инструменты, необходимые для эффективного управления современным салоном красоты
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-white/80 backdrop-blur">
              <CardHeader className="text-center pb-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
