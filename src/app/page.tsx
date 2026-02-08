import { auth } from '@clerk/nextjs/server';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col font-sans overflow-x-hidden">
      {/* Header handled by ConditionalNavigationHeader in layout, but for landing we might want the custom one from design if it's different. 
          Actually, layout.tsx uses ConditionalNavigationHeader. Let's see if we should override it here or if it's already customized.
          For the landing page, we'll keep it simple and use a local header for maximum fidelity to the design. */}

      <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 dark:bg-background/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex items-center justify-between h-16 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-foreground text-xl font-bold leading-tight tracking-tight">SalaryMan</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">BETA</Badge>
            </div>
          </div>

          <div className="hidden md:flex flex-1 justify-center gap-8">
            <Link href="#features" className="text-foreground/80 hover:text-primary transition-colors text-sm font-semibold">Features</Link>
            <Link href="#pricing" className="text-foreground/80 hover:text-primary transition-colors text-sm font-semibold">Pricing</Link>
            <Link href="#about" className="text-foreground/80 hover:text-primary transition-colors text-sm font-semibold">About</Link>
          </div>

          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <button className="text-foreground hover:text-primary text-sm font-bold hidden sm:block">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-5 bg-primary hover:bg-primary/90 transition-all text-white text-sm font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 active:scale-95">Get Started</button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-8 overflow-hidden bg-[radial-gradient(circle_at_10%_20%,_var(--pastel-blue)_0%,_#fff_90%)] dark:bg-[radial-gradient(circle_at_10%_20%,_#101722_0%,_#172033_90%)]">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex flex-col gap-8 lg:w-1/2 lg:pr-8 text-center lg:text-left">
                <div className="flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/10 border border-primary/10 w-fit mx-auto lg:mx-0 shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-muted-foreground dark:text-gray-300 uppercase tracking-wider">v2.0 is now live</span>
                  </div>
                  <h1 className="text-foreground text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                    Take Control of Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Financial Future</span>
                  </h1>
                  <p className="text-muted-foreground text-lg sm:text-xl font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                    The smartest way to track expenses, set goals, and grow your wealth. Join over 10,000 users building their future today.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <SignUpButton mode="modal">
                    <button className="flex h-12 px-8 cursor-pointer items-center justify-center rounded-xl bg-primary hover:bg-primary/90 transition-all text-white text-base font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:scale-95">Start Free Today</button>
                  </SignUpButton>
                  <button className="flex h-12 px-8 cursor-pointer items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-border hover:bg-muted/50 transition-colors text-foreground text-base font-bold">
                    <span className="material-symbols-outlined mr-2 text-[20px]">play_circle</span>
                    Watch Demo
                  </button>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground font-semibold">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                    <span>14-day free trial</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2 w-full relative">
                {/* Decorative background blobs */}
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse [animation-delay:2s]"></div>

                {/* Main Image Container */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/50 bg-white dark:bg-background p-2 aspect-[4/3]">
                  <Image
                    alt="Dashboard Preview"
                    className="rounded-xl object-cover"
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Floating UI overlay from design */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-background/95 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">trending_up</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Total Savings</p>
                        <p className="text-sm font-black text-foreground">₹7,12,450.00</p>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-black">+24%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white dark:bg-background px-4 sm:px-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col items-center text-center gap-4 mb-16">
              <span className="text-primary font-black tracking-widest text-xs uppercase">Features</span>
              <h2 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight max-w-2xl">
                Why Choose SalaryMan?
              </h2>
              <p className="text-muted-foreground text-lg font-normal max-w-2xl">
                Everything you need to manage your money with confidence and style. We make finance simple, secure, and smart.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group flex flex-col gap-6 rounded-2xl border border-border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-[var(--pastel-blue)] text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">receipt_long</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-foreground text-xl font-black leading-tight">Expense Tracking</h3>
                  <p className="text-muted-foreground text-base font-normal leading-relaxed">
                    Log transactions in seconds. Categorize expenses and keep your financial records organized and accessible.
                  </p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="group flex flex-col gap-6 rounded-2xl border border-border bg-background p-8 transition-all hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-[var(--pastel-purple)] text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">pie_chart</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-foreground text-xl font-black leading-tight">Smart Insights</h3>
                  <p className="text-muted-foreground text-base font-normal leading-relaxed">
                    Visualize spending habits with intuitive pastel charts. Get a clear breakdown of where your money goes every month.
                  </p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="group flex flex-col gap-6 rounded-2xl border border-border bg-background p-8 transition-all hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-[var(--pastel-green)] text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">flag</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-foreground text-xl font-black leading-tight">Goal Tracking</h3>
                  <p className="text-muted-foreground text-base font-normal leading-relaxed">
                    Set savings targets and watch your progress grow. We help you stay motivated to reach that next financial milestone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-8 bg-muted/30">
          <div className="max-w-[1280px] mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 sm:px-16 sm:py-24 text-center shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 opacity-15 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent)]"></div>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl mx-auto">
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Ready to master your money?
                </h2>
                <p className="mx-auto max-w-xl text-lg text-white/80">
                  Join thousands of others who are taking control of their finances with SalaryMan. Start your free trial today.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <input
                    className="h-12 rounded-xl px-4 text-foreground outline-none focus:ring-4 focus:ring-white/30 min-w-[280px] shadow-inner"
                    placeholder="Enter your email"
                    type="email"
                  />
                  <SignUpButton mode="modal">
                    <button className="h-12 rounded-xl bg-white px-8 font-black text-primary hover:bg-gray-100 transition-all shadow-lg active:scale-95">Get Started</button>
                  </SignUpButton>
                </div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-2">No credit card required for trial.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white dark:bg-background py-16 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
              <span className="text-xl font-black text-foreground tracking-tight">SalaryMan</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold uppercase tracking-tight">Privacy Policy</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold uppercase tracking-tight">Terms of Service</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold uppercase tracking-tight">Contact Us</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold uppercase tracking-tight">Careers</Link>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-sm font-medium">© 2024 SalaryMan Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

