import { Link } from 'react-router-dom';
import { CalendarDays, Users, QrCode, BarChart3, Shield, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: CalendarDays, title: 'Event Management', desc: 'Create and publish events with custom registration forms and capacity limits.' },
  { icon: Users, title: 'Registration Handling', desc: 'Review, approve, or reject registrations with instant email notifications.' },
  { icon: QrCode, title: 'QR Attendance', desc: 'Generate QR codes for attendees and scan them at the door in real time.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Track registrations, attendance rates, and export data as CSV.' },
  { icon: Shield, title: 'Multi-tenant Isolation', desc: 'Your data is completely isolated from other organizations on the platform.' },
  { icon: Zap, title: 'Instant Setup', desc: 'Sign up, get approved, and start managing events within minutes.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <img src="/Event Hub.png" alt="EventHub" className="h-10 w-auto object-contain brightness-0 invert" />
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-blue-500 hover:bg-blue-400 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <span className="inline-block text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full mb-6">
          Event Registration Platform
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
          Run your events.<br />
          <span className="text-blue-400">Effortlessly.</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
          EventHub gives your organization a complete event management system — registrations, QR attendance, reports, and more — under your own branded URL.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-400 text-white px-8 gap-2">
              Register your organization <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold mb-12 text-slate-200">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-16 text-center px-6">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-slate-400 mb-8">Sign up your organization and start running events today.</p>
        <Link to="/signup">
          <Button size="lg" className="bg-blue-500 hover:bg-blue-400 text-white px-10">
            Create your account
          </Button>
        </Link>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} EventHub · Powered by DreamLabs IT Solution
      </footer>
    </div>
  );
}
