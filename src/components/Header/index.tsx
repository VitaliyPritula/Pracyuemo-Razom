"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
}  from "../ui/dropdown-menu";  
  
import {  User } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { title: "Головна", href: "/" },
    { title: "Система спілкування", href: "/messaging" },
    // { title: "Вакансії", href: "/jobs" },
    { title: "Профіль", href: "/profile" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fff] border-b border-[#dddee0]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/Logo.svg" alt="Logo" width={32} height={32} />
          <span className="font-semibold sm:text-[18px] text-[14px] text-[#151E4D]">
            Працюємо разом
          </span>
        </Link>

        <nav
          className={`lg:relative absolute top-16 lg:top-0 right-0 p-0 h-auto lg:bg-transparent bg-background/95 w-full lg:w-auto transition-all duration-500 ease-in-out
            ${
              isOpen
                ? "translate-x-0 opacity-100 lg:h-8 h-screen overflow-y-scroll px-7"
                : "lg:translate-x-0 translate-x-full lg:opacity-100 opacity-0"
            }
          `}
        >
          <ul className="flex lg:flex-row flex-col gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-[18px] font-medium
                      hover:text-[#3c83f6e6] transition-colors relative group ${
                    pathname === link.href
                      ? "text-[#3C83F6E6]"
                      : "hover:text-[#3c83f6e6]"
                  }`}
                >
                  {link.title}
                  {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#354FFE] group-hover:w-full transition-all duration-300"></span> */}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
             <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/login" className="cursor-pointer">Увійти</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/register?mode=signup" className="cursor-pointer">Зареєструватися</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="hidden md:block">
              <Link href="/dashboard">Роботодавець</Link>
            </Button>
          </div>
          {/* Burger Icon */}
          <div
            className="flex flex-col justify-between w-6 h-4 lg:hidden cursor-pointer"
            onClick={toggleMenu}
          >
            <span
              className={`block h-[3px] bg-[#354FFE] transition-all duration-300 ${
                isOpen ? "rotate-45 translate-y-1" : ""
              }`}
            ></span>
            <span
              className={`block h-[3px] bg-[#354FFE] transition-all duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block h-[3px] bg-[#354FFE] transition-all duration-300 ${
                isOpen ? "-rotate-45 -translate-y-[11px]" : ""
              }`}
            ></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
