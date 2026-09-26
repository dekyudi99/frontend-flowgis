import { useState } from "react"
import { Button } from "@/components/elements/Button"
import { MapPin, Waves, TrendingDown, WavesIcon, WavesLadderIcon, LucideWaves, LucideWavesLadder, Building, GlassWater, Earth, EarthIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Trans, useTranslation } from "react-i18next"

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false)
  const { t } = useTranslation();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-1000 ${isHovered ? "opacity-100" : "opacity-70"}`}>
          {/* Vertical flowing water streams */}
          {[...Array(10)].map((_, i) => (
            <div
              key={`stream-${i}`}
              className={`absolute w-1 h-screen bg-gradient-to-b from-transparent via-secondary/30 to-transparent animate-pulse ${
                isHovered ? "opacity-100 scale-y-125" : "opacity-60 scale-y-100"
              } transition-all duration-1000`}
              style={{
                left: `${5 + i * 10}%`,
                animationDuration: `${2 + (i % 3)}s`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}

          {/* Wave layers with movement */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary/20 via-secondary/15 to-transparent animate-pulse ${
              isHovered ? "translate-y-0 scale-105" : "translate-y-4 scale-100"
            } transition-all duration-700`}
            style={{ animationDuration: "4s" }}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-secondary/15 via-accent/10 to-transparent animate-pulse ${
              isHovered ? "translate-y-0 scale-110" : "translate-y-8 scale-100"
            } transition-all duration-1000`}
            style={{ animationDuration: "5s", animationDelay: "0.5s" }}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-accent/12 via-primary/8 to-transparent animate-pulse ${
              isHovered ? "translate-y-0 scale-115" : "translate-y-12 scale-100"
            } transition-all duration-1000`}
            style={{ animationDuration: "6s", animationDelay: "1s" }}
          />

          {/* Animated water droplets */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`drop-${i}`}
              className={`absolute w-3 h-3 bg-secondary/40 rounded-full ${
                isHovered ? "animate-bounce scale-150" : "animate-pulse scale-100"
              } transition-all duration-500`}
              style={{
                left: `${10 + i * 8}%`,
                top: `${15 + (i % 4) * 20}%`,
                animationDuration: `${2 + (i % 3)}s`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}

          {/* Ripple circles */}
          {[...Array(5)].map((_, i) => (
            <div
              key={`ripple-${i}`}
              className={`absolute w-16 h-16 rounded-full border-2 border-primary/20 animate-ping ${
                isHovered ? "opacity-100" : "opacity-50"
              } transition-opacity duration-700`}
              style={{
                left: `${20 + i * 15}%`,
                bottom: `${25 + (i % 3) * 15}%`,
                animationDuration: `${4 + i}s`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className={`absolute w-2 h-2 bg-accent/30 rounded-full animate-bounce ${
                isHovered ? "opacity-100" : "opacity-60"
              } transition-all duration-500`}
              style={{
                left: `${15 + i * 11}%`,
                bottom: `${10 + (i % 5) * 12}%`,
                animationDuration: `${3 + (i % 4)}s`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo/Icon with hover trigger */}
          <div
            className="inline-flex items-center justify-center mb-8 transition-transform duration-500 hover:scale-110 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative">
              <div
                className="absolute inset-0 bg-primary/15 blur-2xl rounded-full animate-pulse"
                style={{ animationDuration: "3s" }}
              />
              {/* <div className="relative hover:border-primary/40 transition-colors duration-300"> */}
                {/* <img src="/flowgis-logo.png" alt="Company Logo" className="w-24 h-24" /> */}
                {/* <span className="font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">FlowGIS</span> */}
              {/* </div> */}
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance leading-tight">
            <Trans i18nKey="hero.title">
              <span className="text-gray-600">Geographic Information System</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Flood-prone Area Mapping
              </span>
            </Trans>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/map">
                <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                    <MapPin className="mr-2 h-5 w-5" />
                    {t('hero.ctaButton')}
                </Button>
            </Link>
            {/* <Button
              size="lg"
              variant="outline"
              className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm"
            >
              <TrendingDown className="mr-2 h-5 w-5" />
              See Demo
            </Button> */}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
