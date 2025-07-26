import { Card, CardContent } from '@dc-beauty/ui'
import { Star } from 'lucide-react'

export function Testimonials() {
  const testimonials = [
    {
      name: 'Анна Ковалева',
      role: 'Владелица Studio Anna',
      avatar: '/avatars/anna.jpg',
      content: 'Beauty Platform полностью изменила наш бизнес. Автоматизация записей и уведомлений сэкономила нам часы работы каждый день.',
      rating: 5
    },
    {
      name: 'Ирина Петрова',
      role: 'Мастер маникюра',
      avatar: '/avatars/irina.jpg',
      content: 'Клиенты в восторге от удобства онлайн-записи. Количество записей выросло на 40% за первый месяц использования.',
      rating: 5
    },
    {
      name: 'Михаил Сидоров',
      role: 'Барбер-шоп "Стиль"',
      avatar: '/avatars/mikhail.jpg',
      content: 'Отличная платформа для небольших салонов. Простая настройка, понятный интерфейс и отзывчивая поддержка.',
      rating: 5
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Отзывы наших клиентов
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Более 1000+ салонов красоты уже доверяют нам свой бизнес
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
