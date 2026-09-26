import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/elements/Card"
import { Calendar, MapPin } from "lucide-react"

//statis data
const newsData = [
  {
    id: 1,
    title: "News1",
    description: "description.....",
    location: "location",
    date: "15 January 2025",
    severity: "high",
  },
  {
    id: 2,
    title: "News2",
    description: "description.....",
    location: "Location",
    date: "14 January 2025",
    severity: "medium",
  },
  {
    id: 3,
    title: "News3",
    description: "description.....",
    location: "location",
    date: "13 January 2025",
    severity: "high",
  },
  {
    id: 4,
    title: "News4",
    description: "description.....",
    location: "location",
    date: "12 January 2025",
    severity: "low",
  },
  {
    id: 5,
    title: "News5",
    description: "description.....",
    location: "location",
    date: "11 January 2025",
    severity: "medium",
  },
]

export default function NewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % newsData.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "border-l-4 border-l-red-500"
      case "medium":
        return "border-l-4 border-l-amber-600"
      case "low":
        return "border-l-4 border-l-teal-500"
      default:
        return "border-l-4 border-l-blue-500"
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {newsData.map((news) => (
          <div key={news.id} className="min-w-full px-2">
            <Card
              className={`bg-white hover:shadow-xl transition-shadow duration-300 ${getSeverityColor(news.severity)}`}
            >
              <CardHeader>
                <CardTitle className="text-2xl text-teal-700">{news.title}</CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">{news.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{news.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>{news.date}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Indicator Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {newsData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-teal-600 w-8" : "bg-gray-300 hover:bg-teal-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
