import { Waves, Facebook, Twitter, Instagram, Linkedin, Github, EarthIcon, Globe, Map, Layers, Server } from "lucide-react"
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const quickLinks = ["home", "feature"];
const resourceLinks = [
  { 
    key: "userManual", 
    // href: "/manual-floowgis_v01.pdf", 
    href: "/manual-flowgis_v02.pdf",
    target: "_blank"
  },
  // { key: "apiDoc", href: "#" },
  { key: "demonstration", href: "https://youtu.be/HsWT7I4FGvY" },
  // { key: "faq", href: "#" },
  { key: "contact", href: "#contact"},
];

const legalLinks = ["privacy", "terms", "sitemap"];
const dataResourceLinks = [
  {
    key: "gee",
    url: "https://earthengine.google.com/",
    icon: Globe, 
  },
  {
    key: "leaflet",
    url: "https://leafletjs.com/",
    icon: Map, 
  },
  {
    key: "openStreetMap",
    url: "https://www.openstreetmap.org/",
    icon: Layers, 
  },
  {
    key: "nakhonPathomDWR",
    url: "https://telemetry.dwr.go.th/",
    icon: Server, 
  },
];

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (e, targetId) => {
    e.preventDefault(); 

    if (location.pathname === "/") {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <footer className="bg-card border-t border-border mt-24">
      <div className="container mx-auto px-6 md:px-16 py-12">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <EarthIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-card-foreground">FlowGIS</h3>
                <p className="text-sm text-muted-foreground">{t('footer.tagline')}</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "https://www.facebook.com/kmuttgeoinfo" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/kgeo-geospatial-engineering-and-innovation-center/posts/?feedView=all"},
              ].map((social, index) => {
                const Icon = social.icon
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="font-semibold text-card-foreground mb-4">{t('footer.quickLinks.title')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((linkKey) => (
                <li key={linkKey}>
                  <a 
                    href={`#${linkKey}`} 
                    onClick={(e) => handleNavigation(e, linkKey)}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {t(`footer.quickLinks.${linkKey}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h4 className="font-semibold text-card-foreground mb-4">{t('footer.resources.title')}</h4>
            <ul className="space-y-2">
              {resourceLinks.map((item) => (
                <li key={item.key}>
                  <a 
                    href={item.href} 
                    target={item.target || "_self"}
                    rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                    onClick={(e) => item.key === 'contact' ? handleNavigation(e, 'contact') : null}
                    className="text-muted-foreground hover:text-secondary transition-colors duration-200"
                  >
                    {t(`footer.resources.${item.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-semibold text-card-foreground mb-4">
              {t('footer.dataResources.title')}
            </h4>
            <ul className="space-y-2">
              {dataResourceLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.key}>
                    <a
                      href={link.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      {t(`footer.dataResources.${link.key}`)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                {t('footer.copyright', { year: currentYear })}
              </p>
              <p className="text-lg text-muted-foreground/80 mt-1">
                Part of a Collaboration with{" "}
                <a 
                  href="https://wefgis.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline font-medium"
                >
                  WEF GIS Project
                </a>
              </p>
            </div>
            
            <div className="flex gap-6 text-">
              {legalLinks.map((linkKey) => (
                <a 
                  key={linkKey} 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t(`footer.legal.${linkKey}`)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}