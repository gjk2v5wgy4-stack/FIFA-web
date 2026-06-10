import { Bot, Send, Sparkles, X } from "lucide-react";
import { type FormEvent, useState } from "react";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "你好，我可以帮你解释赛程、概率预测、风险因素和数据摘要。",
  },
  {
    role: "assistant",
    text: "请选择一场比赛，我会围绕球队状态、阵容和环境因素给出数据分析。",
  },
];

export function AiPetAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMessage = draft.trim();

    if (!nextMessage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", text: nextMessage },
      {
        role: "assistant",
        text: "已记录问题。当前为前端演示对话，正式接入后会结合RAG资料和模型依据生成答复。",
      },
    ]);
    setDraft("");
  };

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-label="打开预测助手对话栏"
        className={`ai-pet${isOpen ? " ai-pet--open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="ai-pet__face">
          <Bot aria-hidden="true" size={24} />
        </span>
        <span>预测助手</span>
      </button>

      <aside
        aria-label="预测助手对话栏"
        className={`ai-drawer${isOpen ? " ai-drawer--open" : ""}`}
      >
        <div className="ai-drawer__header">
          <div>
            <p className="eyebrow">预测助手</p>
            <h2>赛前数据对话</h2>
          </div>
          <button
            aria-label="关闭预测助手对话栏"
            className="icon-button icon-button--light"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="ai-drawer__tip">
          <Sparkles aria-hidden="true" size={16} />
          <span>支持解释概率、风险因素、RAG引用和分析摘要。</span>
        </div>

        <div className="ai-chat-log" aria-live="polite">
          {messages.map((message, index) => (
            <div
              className={`ai-message ai-message--${message.role}`}
              key={`${message.role}-${index}`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <form className="ai-chat-form" onSubmit={handleSubmit}>
          <input
            aria-label="输入问题"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="输入想分析的比赛问题"
            type="text"
            value={draft}
          />
          <button aria-label="发送问题" className="primary-button" type="submit">
            <Send aria-hidden="true" size={16} />
          </button>
        </form>
      </aside>
    </>
  );
}
