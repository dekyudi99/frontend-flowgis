// import { sendContactMessage } from "@/api/contactServices";
import { Button } from "@/components/elements/Button"
import { Card, CardContent } from "@/components/elements/Card"
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react"
import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";

export default function ContactSection() {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: "" });

    try {
      await sendContactMessage(formData);
      
      setStatus({ loading: false, success: true, error: "" });
      setFormData({ name: "", email: "", message: "" }); 
      
      // Remove the success message after 3 seconds
      setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 3000);

    } catch (err) {
      console.error(err);
      setStatus({ 
        loading: false, 
        success: false, 
        error: "Failed to send message. Please try again." 
      });
    }
  };

  return (
    <section id="contact" className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            
            <Trans i18nKey="contact.title">
              Contact <span className="text-secondary">Us</span>
            </Trans>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            {t('contact.subtitle')} 
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-card-foreground">
                      {t('contact.info.emailTitle')} 
                    </h3>
                    
                    <p className="text-muted-foreground">FloowGis@gmail.com</p>
                    <p className="text-muted-foreground">supportFloowGis@gmail.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-card-foreground">
                      {t('contact.info.callTitle')} 
                    </h3>
                    <p className="text-muted-foreground">+ 21 1234 5678</p>
                    <p className="text-muted-foreground">+ 812 3456 7890</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-card-foreground">
                      {t('contact.info.addressTitle')} 
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {/* Gunakan <Trans> lagi untuk teks dengan <br /> */}
                      <Trans i18nKey="contact.info.addressDetail">
                        KMUTT Geospatial Engineering and InnOvation Center (KGEO) located in the Science Instrument Building, 5th floor, on the KMUTT Bangmod Campus 
                        <br />
                          126 Pracha Uthit Road
                        <br />
                        Bang Mod, Thung Khru, Bangkok 10140, Thailand. 
                      </Trans>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2 text-card-foreground">
                    {t('contact.form.nameLabel')} 
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder={t('contact.form.namePlaceholder')} 
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-card-foreground">
                    {t('contact.form.emailLabel')} 
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder={t('contact.form.emailPlaceholder')} 
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2 text-card-foreground">
                    {t('contact.form.messageLabel')} 
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    placeholder={t('contact.form.messagePlaceholder')} 
                  />
                </div>

                {status.error && (
                    <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{status.error}</div>
                )}
                {status.success && (
                    <div className="text-green-600 text-sm bg-green-50 p-2 rounded">Message sent successfully! We will contact you soon.</div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-teal-600 hover:bg-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {status.loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      {t('common.submit')}
                    </>
                  )}
                   
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}