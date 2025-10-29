
'use client'

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Briefcase, MessageSquare, TrendingUp, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import heroImage from "@/assets/hero-img.png";
import { useAuth } from '@/hooks/useAuth';


export default function Home() {
  const { user } = useAuth();
  console.log('user', user)
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Працюємо разом
              </h1>
              <p className="text-lg text-[var(--muted-foreground)] mb-8 leading-relaxed lg:max-w-[587px]">
                Інклюзивна платформа для співпраці між людьми, які шукають
                роботу, та бізнесами. Ми надаємо можливість кожному комунікувати
                за допомогою сучасних технологій синтезу мови та перекладу.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild className="shadow-hover">
                  <Link href="/jobs">Вакансії</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">Роботодавці</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <Image
                src={heroImage}
                alt="Люди спілкуються через технології"
                className="w-full rounded-2xl shadow-[var(--shadow-card)]"
              />
            </div>
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Як це працює
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Три прості кроки до успішної комунікації та працевлаштування
          </p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
            <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#3C83F6]" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Створіть профіль
              </h3>
              <p className="text-sm text-muted-foreground">
                Вкажіть свої можливості та вподобання щодо роботи
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-[#3C83F6]" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Знайдіть вакансії
              </h3>
              <p className="text-sm text-muted-foreground">
                Перегляньте адаптовані пропозиції з гнучким графіком
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#3C83F6]" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Спілкуйтеся
              </h3>
              <p className="text-sm text-muted-foreground">
                Використовуйте комунікатор для озвучення тексту
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-[#3C83F6]" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Розвивайтеся
              </h3>
              <p className="text-sm text-muted-foreground">
                Отримуйте доступ до навчальних курсів і порад
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#3C83F6] mb-2">2.5M+</div>
              <div className="text-muted-foreground">
                Людей з інвалідністю в Україні
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#3C83F6] mb-2">100%</div>
              <div className="text-muted-foreground">
                Доступність інтерфейсу
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#3C83F6] mb-2">24/7</div>
              <div className="text-muted-foreground">
                Підтримка користувачів
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Готові розпочати?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Приєднуйтесь до {'"Працюємо разом"'} та відкрийте нові можливості для
            працевлаштування
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="sm:w-auto w-full" asChild>
              <Link href="/messaging">Спробувати комунікатор</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
