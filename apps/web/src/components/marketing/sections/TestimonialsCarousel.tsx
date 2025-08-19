"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "Rivor has transformed how my team manages leads. Our response time is faster than ever.",
    name: "Sarah Thompson",
    role: "Top Producer",
    company: "Compass",
    avatar: "https://i.pravatar.cc/150?img=47"
  },
  {
    quote:
      "The automation features free me to focus on closing deals instead of chasing paperwork.",
    name: "Michael Lee",
    role: "Broker Owner",
    company: "RE/MAX",
    avatar: "https://i.pravatar.cc/150?img=12"
  },
  {
    quote:
      "Since adopting Rivor, our client satisfaction scores have skyrocketed.",
    name: "Emily Rodriguez",
    role: "Team Lead",
    company: "Keller Williams",
    avatar: "https://i.pravatar.cc/150?img=32"
  }
];

export function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-12 text-center animate-fade-up-delay-4">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {testimonials.map((t) => (
            <div key={t.name} className="w-full flex-shrink-0 px-4">
              <div className="card p-8 max-w-2xl mx-auto bg-gradient-to-br from-rivor-deep/20 to-rivor-indigo/20 border-rivor-teal/20">
                <p className="text-lg text-muted-foreground mb-4">"{t.quote}"</p>
                <div className="flex items-center justify-center gap-3">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t.role}, {t.company}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          aria-label="Previous testimonial"
          onClick={() =>
            setCurrent((current - 1 + testimonials.length) % testimonials.length)
          }
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
        >
          ‹
        </button>
        <button
          aria-label="Next testimonial"
          onClick={() => setCurrent((current + 1) % testimonials.length)}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
        >
          ›
        </button>
      </div>
      <div className="flex justify-center mt-4 gap-2">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full ${current === idx ? "bg-rivor-teal" : "bg-muted-foreground/40"}`}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

