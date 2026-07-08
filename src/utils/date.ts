// Retorna a data de hoje no fuso horário local (YYYY-MM-DD), evitando o bug
// classico de `new Date().toISOString()`: essa função sempre converte para UTC,
// entao em qualquer horário após as 21h no Brasil (UTC-3) o resultado já é o
// dia seguinte — e, se for o último dia do mês, o registro cai no mês errado.
export function todayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
