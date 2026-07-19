'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { contactAPI } from '@/services/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await contactAPI.send(formData);
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
          {/* Header */}
          <div className="mb-8 text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Contact Us</h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Get in touch with our team. We&apos;d love to hear from you!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <ContactInfoCard
                icon={<Phone className="w-6 h-6" />}
                title="Phone"
                content="+977-71-540000"
                link="tel:+97771540000"
              />
              <ContactInfoCard
                icon={<Mail className="w-6 h-6" />}
                title="Email"
                content="mokshyafoods@gmail.com"
                link="mailto:mokshyafoods@gmail.com"
              />
              <ContactInfoCard
                icon={<MapPin className="w-6 h-6" />}
                title="Location"
                content="Butwal, Nepal"
              />
              <ContactInfoCard
                icon={<Clock className="w-6 h-6" />}
                title="Business Hours"
                content="Mon - Fri: 9:00 AM - 6:00 PM"
              />
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+977 9841234567"
                  />
                </div>

                <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Message Subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Your message here..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ContactInfoCard({ icon, title, content, link }: any) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 sm:p-6 space-y-3">
      <div className="text-primary">{icon}</div>
      <h3 className="font-bold text-lg text-primary">{title}</h3>
      {link ? (
        <a href={link} className="text-muted-foreground hover:text-accent transition">
          {content}
        </a>
      ) : (
        <p className="text-muted-foreground">{content}</p>
      )}
    </div>
  );
}
