import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/elements/Card"
import { Map, Database, BarChart3, AlertTriangle, Cloud, Users } from "lucide-react"
import { Trans, useTranslation } from "react-i18next";

const featureIcons = {
  interactive: Map,
  database: Database,
  analysis: BarChart3,
  warning: AlertTriangle,
  monitoring: Cloud,
  collaboration: Users,
};

const featureKeys = ["interactive", "database", "analysis", "warning", "monitoring", "collaboration"];
const featureStyles = {
  interactive: { color: "text-primary", bgColor: "bg-primary/10" },
  database: { color: "text-secondary", bgColor: "bg-secondary/10" },
  analysis: { color: "text-accent", bgColor: "bg-accent/10" },
  warning: { color: "text-[oklch(0.65_0.20_45)]", bgColor: "bg-[oklch(0.65_0.20_45)]/10" },
  monitoring: { color: "text-secondary", bgColor: "bg-secondary/10" },
  collaboration: { color: "text-accent", bgColor: "bg-accent/10" },
};

// const features = [
//   {
//     icon: Map,
//     title: "Interactive Mapping",
//     description:
//       "Digital map visualization with customizable geospatial data layers for in-depth analysis of flood-prone areas.",
//     color: "text-primary",
//     bgColor: "bg-primary/10",
//   },
//   {
//     icon: Database,
//     title: "Database Integration",
//     description:
//       "A centralized database system that stores historical data on rainfall, topography, and flood events for predictive analysis.",
//     color: "text-secondary",
//     bgColor: "bg-secondary/10",
//   },
//   {
//     icon: BarChart3,
//     title: "Data Analysis",
//     description:
//       "Machine learning algorithms to analyze flood patterns and provide risk predictions based on historical and real-time data.",
//     color: "text-accent",
//     bgColor: "bg-accent/10",
//   },
//   {
//     icon: AlertTriangle,
//     title: "Early Warning System",
//     description:
//       "Automatic notifications to the public and stakeholders regarding potential flooding based on weather monitoring and field conditions.",
//     color: "text-[oklch(0.65_0.20_45)]",
//     bgColor: "bg-[oklch(0.65_0.20_45)]/10",
//   },
//   {
//     icon: Cloud,
//     title: "Monitoring Real-time",
//     description:
//       "Integration with satellites for real-time monitoring of weather and environmental conditions.",
//     color: "text-secondary",
//     bgColor: "bg-secondary/10",
//   },
//   {
//     icon: Users,
//     title: "Collaboration Multi-Stakeholder",
//     description:
//       "A collaborative platform for government, researchers, and communities in flood mitigation and management.",
//     color: "text-accent",
//     bgColor: "bg-accent/10",
//   },
// ]

export default function InfoCards() {
  const { t } = useTranslation();
  const features = featureKeys.map(key => ({
    key: key,
    icon: featureIcons[key],
    title: t(`infoCard.features.${key}.title`),
    description: t(`infoCard.features.${key}.description`),
    color: featureStyles[key].color,
    bgColor: featureStyles[key].bgColor,
  }));

  return (
    <section id = "feature" className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            {/* Best <span className="text-primary">Feature</span> */}
            <Trans i18nKey="infoCard.title">
              Best <span className="text-primary">Feature</span>
            </Trans>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            {/* Advanced technology for accurate and comprehensive analysis and mapping of flood-prone areas */}
            {t('infoCard.subtitle')}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.key}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div
                    className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-teal-600 group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
