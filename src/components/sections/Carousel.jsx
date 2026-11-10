import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/elements/Card"
import { Calendar, MapPin } from "lucide-react"
import { ShieldAlert, Layers, Activity, CheckCircle2, ChevronLeft, ChevronRight,Sparkles} from "lucide-react"

import imgFacilities from "@/assets/images/features/facilities-cctv.png"
import imgGeosocial from "@/assets/images/features/geosocial-map.png"
import imgFloodAnalysis from "@/assets/images/features/flood-risk-analysis.png"

//statis data
// const newsData = [
//   {
//     id: 1,
//     title: "News1",
//     description: "description.....",
//     location: "location",
//     date: "15 January 2025",
//     severity: "high",
//   },
//   {
//     id: 2,
//     title: "News2",
//     description: "description.....",
//     location: "Location",
//     date: "14 January 2025",
//     severity: "medium",
//   },
//   {
//     id: 3,
//     title: "News3",
//     description: "description.....",
//     location: "location",
//     date: "13 January 2025",
//     severity: "high",
//   },
//   {
//     id: 4,
//     title: "News4",
//     description: "description.....",
//     location: "location",
//     date: "12 January 2025",
//     severity: "low",
//   },
//   {
//     id: 5,
//     title: "News5",
//     description: "description.....",
//     location: "location",
//     date: "11 January 2025",
//     severity: "medium",
//   },
// ]

const featuresData = [
  {
    id: 1,
    tag: "Facilities & Monitoring",
    icon: ShieldAlert,
    title: "Monitoring of Public Facilities & River CCTV Feeds",
    description: "Monitor the distribution of emergency healthcare services and CCTV locations along rivers prone to flooding in real time to ensure disaster preparedness.",
    points: [
      "Distribution of Hospitals",
      "Live Stream/CCTV river monitoring stations",
      "Monitoring flood-prone areas"
    ],
    image: imgFacilities,
    severityColor: "from-teal-500 to-emerald-600",
  },
  {
    id: 2,
    tag: "Geosocial Information",
    icon: Layers,
    title: "Geosocial and Regional Infrastructure Mapping",
    description: "Exploration of spatial information layers, ranging from community settlements, hydrological points and bridges to agricultural areas.",
    points: [
      "Information on residential and public areas (Community Area)",
      "Network of hydrological stations and bridges",
      "Visualisation of land use and agricultural areas"
    ],
    image: imgGeosocial,
    severityColor: "from-blue-500 to-teal-600",
  },
  {
    id: 3,
    tag: "Flood Risk Analysis",
    icon: Activity,
    title: "Flood Risk Analysis",
    description: "Interactive flood risk simulation utilizing Google Earth Engine (GEE) satellite imagery and expert-based parameter weighting.",
    points: [
      "Processing of Google Earth Engine (GEE) satellite data",
      "Variable simulations: Rainfall, Elevation (DEM), Topographic, Wetness, Vegetation, & Distance from Rivers",
      "Visualisation of risk level charts & legends (Very Low - Critical)"
    ],
    image: imgFloodAnalysis,
    severityColor: "from-amber-500 to-red-600",
  },
]

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuresData.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuresData.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuresData.length) % featuresData.length)
  }

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto px-4 py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container Carousel */}
      <div className="overflow-hidden rounded-3xl shadow-xl border border-slate-200/80 bg-white">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {featuresData.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.id} className="min-w-full">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-6 md:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      
                      <div className="lg:col-span-5 space-y-4 text-left">
                        {/* Tag/Badge */}
                        {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200/60">
                          <IconComponent className="w-4 h-4 text-teal-600" />
                          <span>{item.tag}</span>
                        </div> */}

                        {/* Judul Fitur */}
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                          {item.title}
                        </h3>

                        {/* Deskripsi */}
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                          {item.description}
                        </p>

                        <div className="pt-2 space-y-2">
                          {item.points.map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Kolom Kanan Visual Screenshot Aplikasi */}
                      <div className="lg:col-span-7">
                        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md group bg-slate-900/5">
                          {/* Screenshot */}
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-[280px] sm:h-[360px] object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
                          />

                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-700 shadow-sm border border-white/40 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span>FlowGIS Feature</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={handlePrev}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-lg border border-slate-200 flex items-center justify-center transition-all hover:scale-110 z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-lg border border-slate-200 flex items-center justify-center transition-all hover:scale-110 z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicator Dots */}
      <div className="flex justify-center items-center gap-2 mt-5">
        {featuresData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-teal-600 w-8" : "bg-slate-300 hover:bg-teal-400 w-2.5"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// export default function NewsCarousel() {
//   const [currentIndex, setCurrentIndex] = useState(0)

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentIndex((prevIndex) => (prevIndex + 1) % newsData.length)
//     }, 3000)

//     return () => clearInterval(interval)
//   }, [])

//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case "high":
//         return "border-l-4 border-l-red-500"
//       case "medium":
//         return "border-l-4 border-l-amber-600"
//       case "low":
//         return "border-l-4 border-l-teal-500"
//       default:
//         return "border-l-4 border-l-blue-500"
//     }
//   }

//   return (
//     <div className="relative overflow-hidden">
//       <div
//         className="flex transition-transform duration-700 ease-in-out"
//         style={{ transform: `translateX(-${currentIndex * 100}%)` }}
//       >
//         {newsData.map((news) => (
//           <div key={news.id} className="min-w-full px-2">
//             <Card
//               className={`bg-white hover:shadow-xl transition-shadow duration-300 ${getSeverityColor(news.severity)}`}
//             >
//               <CardHeader>
//                 <CardTitle className="text-2xl text-teal-700">{news.title}</CardTitle>
//                 <CardDescription className="text-base text-gray-600 mt-2">{news.description}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center gap-6 text-sm text-gray-500">
//                   <div className="flex items-center gap-2">
//                     <MapPin className="w-4 h-4 text-blue-600" />
//                     <span>{news.location}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Calendar className="w-4 h-4 text-teal-600" />
//                     <span>{news.date}</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         ))}
//       </div>

//       {/* Indicator Dots */}
//       <div className="flex justify-center gap-2 mt-6">
//         {newsData.map((_, index) => (
//           <button
//             key={index}
//             onClick={() => setCurrentIndex(index)}
//             className={`w-3 h-3 rounded-full transition-all duration-300 ${
//               index === currentIndex ? "bg-teal-600 w-8" : "bg-gray-300 hover:bg-teal-400"
//             }`}
//             aria-label={`Go to slide ${index + 1}`}
//           />
//         ))}
//       </div>
//     </div>
//   )
// }
