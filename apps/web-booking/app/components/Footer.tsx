import { Separator, Button } from '@dc-beauty/ui'
import { Globe, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Beauty Platform
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Современная платформа для автоматизации салонов красоты. 
              Управляйте бизнесом эффективно и развивайтесь быстрее.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white">
                <Globe className="h-4 w-4 mr-2" />
                Русский
              </Button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Продукт</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Возможности</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Цены</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Интеграции</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Поддержка</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Документация</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Обучение</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Помощь</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Статус системы</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Контакты</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                support@beauty.designcorp.eu
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                +48 123 456 789
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Варшава, Польша
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            © 2025 Beauty Platform by DesignCorp. Все права защищены.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white transition-colors">Условия использования</a>
            <a href="#" className="hover:text-white transition-colors">Куки</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
