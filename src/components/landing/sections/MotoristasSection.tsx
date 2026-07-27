import { Users } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { motoristas } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MotoristasSection({ reduced }: SectionProps) {
  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2 className="flex items-center justify-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          Cada motorista, sob controle.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Viagens, comissão e quilometragem de toda a equipe, em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {motoristas.map((m) => (
          <div key={m.id} className="bg-card border border-border p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#0B3D5C] to-[#153F73] text-white font-black text-sm shrink-0">
                {initials(m.nome)}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${m.ativo ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{m.nome}</p>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  {m.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Viagens</p>
                <p className="text-sm font-black font-mono mt-0.5">{m.viagensMes}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Comissão</p>
                <p className="text-sm font-black font-mono mt-0.5">R$ {m.comissao.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground">KM</p>
                <p className="text-sm font-black font-mono mt-0.5">{m.kmRodados.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionReveal>
  );
}
