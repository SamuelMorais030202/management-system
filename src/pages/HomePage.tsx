export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1D39] via-[#0B1D39] to-[#102a4a]" />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#F97316]/20 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#F97316]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white ring-1 ring-white/20">
                UNISYSTEM TECNOLOGIA
              </span>
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Operação de cozinha mais inteligente, ágil e integrada
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/80">
                Simplifique a gestão da sua cozinha com uma plataforma moderna e robusta: pedidos em tempo real,
                performance visível e uma experiência que o seu time vai adorar.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  className="inline-flex items-center gap-2 rounded-md bg-[#F97316] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#ea6a0d] focus:outline-none focus:ring-2 focus:ring-white/40"
                  href="#features"
                >
                  Conheça os recursos
                </a>
                <a
                  className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                  href="#contact"
                >
                  Fale com a gente
                </a>
              </div>
              <div className="mt-6 flex items-center gap-6 text-white/70">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-white">99.9%</span>
                  <span className="text-sm">uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-white">+1M</span>
                  <span className="text-sm">pedidos processados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-white">24/7</span>
                  <span className="text-sm">suporte</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur">
                <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
                <div className="mt-4 grid grid-cols-3 gap-3 text-[10px] text-white/80 sm:text-xs">
                  <div className="rounded-md bg-white/10 p-3">Tempo real</div>
                  <div className="rounded-md bg-white/10 p-3">Fila otimizada</div>
                  <div className="rounded-md bg-white/10 p-3">Métricas</div>
                  <div className="rounded-md bg-white/10 p-3">Status visível</div>
                  <div className="rounded-md bg-white/10 p-3">UX de equipe</div>
                  <div className="rounded-md bg-white/10 p-3">Multi-terminais</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Velocidade e foco',
              desc: 'Listagem inteligente, contagens por status e controles rápidos para seu time ganhar tempo.',
              accent: 'from-[#0B1D39] to-[#102a4a]'
            },
            {
              title: 'Confiável e seguro',
              desc: 'Arquitetura robusta com monitoramento e observabilidade para operação sem interrupções.',
              accent: 'from-[#F97316] to-[#ff8a3d]'
            },
            {
              title: 'Pronto para crescer',
              desc: 'Multi-empresa, multi-terminais e paginação eficiente para alto volume de pedidos.',
              accent: 'from-gray-100 to-white'
            }
          ].map((f, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${f.accent} opacity-10`} />
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <div className="mt-4 text-xs font-medium text-[#0B1D39]">Unisystem Tecnologia</div>
            </div>
          ))}
        </div>
      </section>

      {/* Highlight Strip */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <h2 className="text-2xl font-bold text-[#0B1D39]">Tecnologia para transformar a sua operação</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Da seleção de terminais à visualização de pedidos, o fluxo foi desenhado para ser natural, rápido e
                centrado na experiência do usuário. O resultado? Mais precisão, menos atrito e um time mais produtivo.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <div className="h-40 rounded-lg bg-gradient-to-tr from-[#F97316]/20 to-[#0B1D39]/20 ring-1 ring-gray-200" />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-8 rounded-xl border bg-white p-6 shadow-sm sm:grid-cols-3">
          {[
            { k: '+35%', v: 'Velocidade na produção' },
            { k: '-28%', v: 'Erros operacionais' },
            { k: '+18%', v: 'Giro de pedidos' }
          ].map((m, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-extrabold text-[#0B1D39]">{m.k}</div>
              <div className="mt-1 text-sm text-gray-600">{m.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1D39] via-[#0B1D39] to-[#102a4a]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="grid items-center gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-white">Pronto para elevar sua cozinha ao próximo nível?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                A Unisystem Tecnologia constrói software com foco em performance, confiabilidade e experiência.
                Vamos juntos acelerar sua operação.
              </p>
            </div>
            <div className="flex md:justify-end">
              <a
                className="inline-flex items-center gap-2 rounded-md bg-[#F97316] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#ea6a0d] focus:outline-none focus:ring-2 focus:ring-white/40"
                href="mailto:contato@unisystem.com.br"
              >
                Entrar em contato
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Unisystem Tecnologia. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  )
}

