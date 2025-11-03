import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import avatarFemale from "@/assets/avatar-female.png";

export default function ProfilePage() {
    const jobs = [
    {
      title: "UI/UX Designer",
      company: "TechCorp",
      type: "Дистанційна",
      status: "active",
    },
    {
      title: "Frontend Developer",
      company: "WebStudio",
      type: "Гібридна",
      status: "active",
    },
    {
      title: "Content Writer",
      company: "MediaHub",
      type: "Дистанційна",
      status: "closed",
    },
  ];
  return (
    <section>

    <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - messaging */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message */}

            {/* User Info Card */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Чи хочете ви розповісти про себе своєю роботи?</h2>
                {/* <MoreVertical className="w-5 h-5 text-muted-foreground cursor-pointer" /> */}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Спеціалізація <span className="text-muted-foreground">(HR-менеджер)</span>
                  </label>
                  {/* <Input placeholder="Оберіть українською" /> */}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Ваші можливості
                  </label>
                  {/* <Input placeholder="Поділіться своїми навичками" /> */}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Тип зайнятості
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground">
                    <option>Дистанційна робота</option>
                    <option>Офіс</option>
                    <option>Гібридна</option>
                  </select>
                </div>

                <p className="text-sm text-muted-foreground">
                  Так, занадто! Я маю великі інтенції! У нас посаді менеджера кабінету...
                </p>

                <Button className="w-full">Активувати комунікацію</Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Profile */}
          <div className="space-y-6">
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Профіль</h2>
                {/* <MoreVertical className="w-5 h-5 text-muted-foreground cursor-pointer" /> */}
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                  <Image
                src={avatarFemale} 
                alt="аватар користувача"
                className="w-full rounded-2xl shadow-[var(--shadow-card)]"
              />
                <h3 className="text-lg font-semibold text-foreground">Olena</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Напишіть, що хочете сказати
                </p>

                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary">Озвучити текст</Badge>
                  <Badge variant="secondary">Перекласти</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Вакансій Я прагнення і комунікації. У нас посаді менеджера кабінету...
                </p>

                <Button className="w-full mb-4">Запросити на співбесіду</Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Ваші можливості</h4>
                <p className="text-sm text-muted-foreground">Дистанційна робота</p>
                <p className="text-sm text-muted-foreground">Адаптований простір</p>
                <p className="text-sm text-muted-foreground">Гнучкий графік</p>
              </div>
            </Card>

            {/* Jobs Section */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Вакансії</h3>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Пошук кандидатів" className="pl-9" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-foreground">15</div>
                  <div className="text-sm text-muted-foreground">Активних</div>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-foreground">78</div>
                  <div className="text-sm text-muted-foreground">Закритих</div>
                </div>
              </div>

              <div className="space-y-3">
                {jobs.map((job, index) => (
                  <div 
                    key={index}
                    className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-sm text-foreground">{job.title}</div>
                    <div className="text-xs text-muted-foreground">{job.company} • {job.type}</div>
                    <Badge 
                      variant={job.status === "active" ? "default" : "secondary"}
                      className="mt-2 text-xs"
                    >
                      {job.status === "active" ? "Активна" : "Закрита"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
      
    </section>
  );
}