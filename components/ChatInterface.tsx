import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Paperclip, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { Message, User, StructuredResponse } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  user: User;
  onOpenPolicy: (policyId: string) => void;
  onOpenDetail: (content: string) => void;
  onDraftAction: (data: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onOpenPolicy, onOpenDetail, onDraftAction }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '', // Text is empty, data is structured
      structuredData: {
        summary: `안녕하세요, ${user.name}님! 디자인팀 업무는 어떠신가요? \n궁금한 사내 규정이나 복지가 있다면 편하게 물어보세요.`,
        suggestions: ["내 연차 잔여일 알려줘", "경조사비 지원 규정", "법인카드 식대 한도"]
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // CLIENT-SIDE DETECTION: Check if this is a leave balance question
      const balanceKeywords = ['연차', '잔여', '남았', '며칠', 'balance', 'leave', 'days left', '휴가'];
      const isBalanceQuestion = balanceKeywords.some(keyword =>
        textToSend.toLowerCase().includes(keyword.toLowerCase())
      ) && (textToSend.includes('?') || textToSend.includes('？') || textToSend.includes('알려') || textToSend.includes('남았'));

      if (isBalanceQuestion) {
        // Bypass AI and return the balance directly
        console.log("[Chat] Detected balance question - bypassing AI");
        const balanceResponse: StructuredResponse = {
          summary: `${user.name}님의 현재 잔여 연차는 **${user.leaveBalance}일**입니다. 😊`,
          relatedPolicyId: 'leave-01',
          suggestions: ['연차 규정 더보기', '연차 신청하기']
        };

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: balanceResponse.summary,
          structuredData: balanceResponse
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }

      // Normal AI flow for other questions
      const handleToolCall = async (toolName: string, args: any) => {
        if (toolName === 'getPolicy') {
          onOpenPolicy(args.policyId);
        } else if (toolName === 'draftLeaveRequest') {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-action',
            role: 'system',
            text: '기안 작성 중...',
            actionRequired: { type: 'DRAFT_LEAVE', data: args }
          }]);
        }
      };

      const responseText = await sendMessageToGemini(textToSend, handleToolCall);

      let parsedData: StructuredResponse = { summary: responseText };
      try {
        parsedData = JSON.parse(responseText);
        console.log("[Chat] Parsed Data:", parsedData); // Debug log
      } catch (e) {
        console.warn("Failed to parse JSON response, treating as raw text", e);

        // Fallback Strategy:
        // 1. If text is short (< 200 chars), treat as simple answer (No Detail button).
        // 2. If text is long, treat as detailed answer (Show Detail button).
        const isLongText = responseText.length > 200;

        parsedData = {
          summary: isLongText ? responseText.substring(0, 100) + "..." : responseText,
          detail: isLongText ? responseText : undefined,
          suggestions: isLongText ? ["관련 규정 더보기", "다른 질문 하기"] : []
        };
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: parsedData.summary,
        structuredData: parsedData
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: '오류가 발생했습니다.',
        structuredData: { summary: '죄송합니다. 오류가 발생했습니다.' }
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden shadow-sm">
              <Bot size={24} />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">HR-Mate</h2>
            <p className="text-xs text-slate-500">규정/복지 AI 상담</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>

              {/* Avatar */}
              {msg.role !== 'system' && (
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-blue-100'}`}>
                  {msg.role === 'user' ? (
                    <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <Bot size={16} className="text-blue-600" />
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="flex flex-col gap-2 w-full">
                {/* Bubble */}
                {msg.role === 'system' && msg.actionRequired?.type === 'DRAFT_LEAVE' ? (
                  <DraftLeaveCard data={msg.actionRequired.data} />
                ) : (
                  <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                    }`}>
                    {msg.structuredData ? (
                      <div className="space-y-3">
                        {/* 1. Summary Card */}
                        <div>
                          <div className="mb-2 font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                            <span className="text-lg">🤖</span> 요약 답변
                          </div>
                          <div className="text-slate-700 leading-relaxed">
                            {msg.structuredData.summary}
                          </div>
                        </div>

                        {/* 2. View Details Button (Consolidated) */}
                        {(msg.structuredData.relatedPolicyId || msg.structuredData.detail || (msg.structuredData as any).details) && (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                if (msg.structuredData?.relatedPolicyId) {
                                  onOpenPolicy(msg.structuredData.relatedPolicyId);
                                } else if (msg.structuredData?.detail || (msg.structuredData as any).details) {
                                  onOpenDetail(msg.structuredData.detail || (msg.structuredData as any).details);
                                }
                              }}
                              className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <FileText size={16} /> 자세히 보기
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                )}

                {/* 4. Suggestions (Pills) */}
                {msg.role === 'model' && msg.structuredData?.suggestions && (
                  <div className="flex flex-wrap gap-2 ml-1">
                    {msg.structuredData.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="text-xs text-blue-600 border border-blue-100 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Bot size={16} />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <button className="absolute left-3 text-slate-400 hover:text-blue-500 transition-colors">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 내용을 입력하세요 (예: 경조사 휴가는 며칠이야?)"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-full py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 p-2 rounded-full ${input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} transition-all`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DraftLeaveCard = ({ data }: { data: any }) => (
  <div className="bg-white border border-blue-200 rounded-xl p-5 w-full shadow-md animate-fade-in-up">
    <div className="flex items-center gap-2 mb-4 text-blue-700 font-bold border-b border-slate-100 pb-2">
      <FileText size={20} />
      <span>휴가 신청서 (초안)</span>
    </div>
    <div className="space-y-3 text-sm text-slate-600 mb-5">
      <div className="flex justify-between items-center">
        <span className="text-slate-500">신청일</span>
        <span className="font-semibold text-slate-900">{data.date}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-500">휴가 종류</span>
        <span className="font-semibold text-slate-900">{data.type}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-500">예상 차감</span>
        <span className="font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-0.5일</span>
      </div>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => alert("결재가 상신되었습니다.")}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
      >
        바로 결재 상신
      </button>
      <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold transition-colors">
        수정
      </button>
    </div>
  </div>
);

export default ChatInterface;