import { useState } from "react";
import { MessageSquare, Sparkles, Send, Bot, Loader2, RefreshCw } from "lucide-react";

interface AIQueryWidgetProps {
  user?: any;
  onRefreshData?: () => void;
}

const PRESET_QUESTIONS = [
  "Qual motorista mais faturou este mês?",
  "Qual rota foi mais utilizada?",
  "Quanto gastei de combustível?",
  "Qual veículo teve maior consumo?",
  "Quanto foi faturado na semana?",
  "Qual motorista rodou mais quilômetros?"
];

export default function AIQueryWidget({ user, onRefreshData }: AIQueryWidgetProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Olá! Sou o Assistente LogiTech IA. Posso analisar todos os faturamentos, rotas, despesas e eficiências de combustível em tempo real. Escolha uma das perguntas sugeridas abaixo ou digite sua dúvida!"
    }
  ]);

  const handleAsk = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setChatHistory(prev => [...prev, { role: "user", text: textToSend }]);
    setQuestion("");

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: textToSend,
          user: user || { role: "Administrador" }
        })
      });
      const data = await response.json();

      if (data.success) {
        setChatHistory(prev => [...prev, { role: "assistant", text: data.answer }]);
        if (onRefreshData) onRefreshData(); // reload dashboard metrics in case state changed
      } else {
        setChatHistory(prev => [
          ...prev,
          { role: "assistant", text: `Erro: ${data.message || "Não consegui obter a resposta do servidor."}` }
        ]);
      }
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        { role: "assistant", text: "Erro ao conectar com o serviço de Inteligência Artificial. Verifique sua conexão ou se a chave API está ativa." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([
      {
        role: "assistant",
        text: "Olá! Sou o Assistente LogiTech IA. Estou pronto para responder a quaisquer perguntas de BI operacionais."
      }
    ]);
  };

  return (
    <div id="ai-assistant-card" className="bg-gradient-to-br from-slate-900 to-gray-950 border border-blue-900/40 rounded-xl p-5 shadow-xl flex flex-col h-[520px] justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-900/50 rounded-lg border border-blue-500/30">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Assistente LogiTech IA
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">Powered by Gemini 3.5 Flash</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-gray-500 hover:text-white p-1 hover:bg-gray-800 rounded transition-all"
          title="Limpar histórico"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-gray-800">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2.5 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none font-medium"
                  : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-none"
              }`}
            >
              {/* If it's the assistant, we render Markdown tables or bullets in a clean way */}
              <div className="whitespace-pre-line prose prose-invert max-w-none prose-xs">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 text-gray-400 rounded-lg rounded-bl-none px-3.5 py-2.5 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Analisando o banco de dados e preparando insights...</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Suggestions & Input */}
      <div>
        {chatHistory.length <= 2 && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mb-2">Sugestões rápidas:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(q)}
                  disabled={loading}
                  className="text-left p-1.5 text-[10px] text-gray-400 hover:text-white bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded transition-all truncate"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk(question)}
            placeholder="Pergunte sobre fretes, despesas, motoristas..."
            disabled={loading}
            className="flex-1 bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
          <button
            onClick={() => handleAsk(question)}
            disabled={loading || !question.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
