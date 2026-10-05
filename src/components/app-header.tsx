import Link from "next/link";

export function AppHeader({ admin = false }: { admin?: boolean }) {
  return <header className="border-b border-blue-100 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="text-3xl font-black tracking-tight text-[#0a318c]">Crea</Link><nav className="flex items-center gap-1 text-sm font-semibold text-[#10295b]"><Link className="rounded-lg px-3 py-2 hover:bg-blue-50" href="/negocios">Mi espacio</Link>{admin && <Link className="rounded-lg bg-blue-50 px-3 py-2 text-[#1464f6]" href="/admin">Administración</Link>}<Link className="rounded-lg px-3 py-2 hover:bg-blue-50" href="/">Inicio</Link></nav></div></header>;
}
