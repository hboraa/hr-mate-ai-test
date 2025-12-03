import React from 'react';
import { User, Policy, AnalyticsData } from '../types';
import { FileText, CheckCircle, Bell, ChevronRight, Download, Megaphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_POLICIES, MOCK_ANALYTICS, MOCK_NOTICES } from '../constants';

interface DashboardProps {
  user: User;
  activeTab: 'personal' | 'policy' | 'admin' | 'onboarding' | 'detail' | 'notice' | 'notice-detail' | 'leave';
  selectedPolicyId?: string;
  selectedNoticeId?: number;
  detailContent?: string;
  onSelectPolicy: (id: string) => void;
  onSelectNotice: (id: number) => void;
  onViewAllNotices: () => void;
  onViewLeaveDetail: () => void;
  onBackToHome: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  user, activeTab, selectedPolicyId, selectedNoticeId, detailContent,
  onSelectPolicy, onSelectNotice, onViewAllNotices, onViewLeaveDetail, onBackToHome
}) => {

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalTab user={user} onSelectPolicy={onSelectPolicy} onViewAllNotices={onViewAllNotices} onSelectNotice={onSelectNotice} onViewLeaveDetail={onViewLeaveDetail} />;
      case 'policy':
        return <PolicyTab selectedId={selectedPolicyId} onSelect={onSelectPolicy} />;
      case 'onboarding':
        return <OnboardingTab user={user} />;
      case 'leave':
        return <LeaveDetailTab user={user} onSelectPolicy={onSelectPolicy} onBack={onBackToHome} />;
      case 'admin':
        return <AdminTab data={MOCK_ANALYTICS} />;
      case 'detail':
        return <DetailTab content={detailContent || ''} />;
      case 'notice':
        return <NoticeTab onSelect={onSelectNotice} onBack={onBackToHome} />;
      case 'notice-detail':
        return <NoticeDetailTab noticeId={selectedNoticeId || 0} onBack={onViewAllNotices} />;
      default:
        return <PersonalTab user={user} onSelectPolicy={onSelectPolicy} onViewAllNotices={onViewAllNotices} onSelectNotice={onSelectNotice} onViewLeaveDetail={onViewLeaveDetail} />;
    }
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto custom-scrollbar">
      {renderContent()}
    </div>
  );
};

/* --- Sub Components --- */

const PersonalTab = ({ user, onSelectPolicy, onViewAllNotices, onSelectNotice, onViewLeaveDetail }: {
  user: User,
  onSelectPolicy: (id: string) => void,
  onViewAllNotices: () => void,
  onSelectNotice: (id: number) => void,
  onViewLeaveDetail: () => void
}) => (
  <div className="p-6 space-y-6">
    {/* Profile Card */}
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 z-0"></div>

      <div className="relative z-10 flex items-center space-x-5 mb-6">
        <div className="relative">
          <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover" />
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {user.name}
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">{user.position}</span>
          </h2>
          <p className="text-slate-500">{user.department}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div
          onClick={onViewLeaveDetail}
          className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors group"
        >
          <div className="flex justify-between items-start">
            <p className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">잔여 연차</p>
            <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-blue-800">{user.leaveBalance}</span>
            <span className="text-sm text-blue-600 font-medium">일</span>
          </div>
        </div>
        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-100">
          <p className="text-xs text-purple-600 font-semibold mb-1 uppercase tracking-wider">다음 급여일</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-purple-800">{(() => {
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

              // If today is past the last day of this month, get next month's last day
              const payDay = today.getDate() > lastDayOfMonth.getDate()
                ? new Date(currentYear, currentMonth + 2, 0)
                : lastDayOfMonth;

              return `${payDay.getMonth() + 1}.${payDay.getDate()}`;
            })()}</span>
            <span className="text-sm text-purple-600 font-medium">{(() => {
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
              const payDay = today.getDate() > lastDayOfMonth.getDate()
                ? new Date(currentYear, currentMonth + 2, 0)
                : lastDayOfMonth;

              const diffTime = payDay.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return `(D-${diffDays})`;
            })()}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Announcements (Replaced Mood Check) */}
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-1.5 rounded-lg text-orange-500">
            <Megaphone size={18} fill="currentColor" className="text-orange-500" />
          </div>
          <h3 className="font-bold text-slate-800">사내 공지사항</h3>
        </div>
        <button onClick={onViewAllNotices} className="text-xs text-slate-400 hover:text-blue-600">전체보기</button>
      </div>

      <div className="space-y-3">
        {MOCK_NOTICES.map((notice) => (
          <div
            key={notice.id}
            onClick={() => onSelectNotice(notice.id)}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${notice.important ? 'bg-red-500' : 'bg-slate-300'}`}></div>
            <div className="flex-1">
              <p className={`text-sm ${notice.important ? 'font-semibold text-slate-900' : 'text-slate-700'} group-hover:text-blue-600 transition-colors`}>
                {notice.title}
              </p>
              <span className="text-xs text-slate-400">{notice.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Recommendations */}
    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
      <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
        <FileText size={150} />
      </div>
      <h3 className="font-bold text-lg mb-2 relative z-10">💡 맞춤 혜택 알림</h3>
      <p className="text-blue-100 text-sm mb-4 relative z-10">입사 1주년 축하드려요! 건강검진 신청 기간입니다.</p>
      <button
        onClick={() => onSelectPolicy('benefit-01')}
        className="relative z-10 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2"
      >
        신청 바로가기 <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

const PolicyTab = ({ selectedId, onSelect }: { selectedId?: string, onSelect: (id: string) => void }) => {
  const policy = selectedId ? MOCK_POLICIES.find(p => p.id === selectedId) : null;

  if (policy) {
    return (
      <div className="p-6 h-full flex flex-col animate-fade-in-up">
        <button
          onClick={() => onSelect('')}
          className="mb-4 text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium w-fit"
        >
          <ChevronRight className="rotate-180" size={16} /> 목록으로 돌아가기
        </button>

        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-blue-100 rounded-full text-xs font-bold text-blue-700 mb-3">
            {policy.category}
          </span>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">{policy.title}</h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            <span>최종 업데이트: {policy.lastUpdated}</span>
          </p>
        </div>

        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar">
          {/* Simple Markdown Rendering */}
          <div className="prose prose-slate prose-headings:text-slate-800 prose-a:text-blue-600 max-w-none">
            {policy.content.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 pb-2 border-b border-slate-100 text-slate-900">{trimmed.replace('# ', '')}</h1>;
              if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-slate-800 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full"></div>{trimmed.replace('### ', '')}</h3>;
              if (trimmed.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-600 mb-1">{trimmed.replace('- ', '')}</li>;
              if (trimmed.startsWith('1. ')) return <li key={i} className="ml-4 list-decimal text-slate-600 mb-1">{trimmed.replace('1. ', '')}</li>;
              if (trimmed.includes('|')) {
                // Very basic table rendering for demo
                const cells = trimmed.split('|').filter(Boolean);
                if (trimmed.includes('---')) return null; // Skip separator
                return (
                  <div key={i} className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
                    {cells.map((c, idx) => <span key={idx} className={`${idx === 0 ? 'font-bold text-slate-700' : 'text-slate-600'}`}>{c.trim()}</span>)}
                  </div>
                );
              }
              return <p key={i} className="mb-2 text-slate-600 leading-relaxed">{trimmed}</p>;
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              const blob = new Blob([policy.content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${policy.title}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
          >
            <Download size={16} />
            PDF 다운로드
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">사내 규정집</h2>
        <p className="text-slate-500 text-sm mt-1">궁금한 회사 내규를 검색하거나 찾아보세요.</p>
      </div>

      <div className="grid gap-4">
        {MOCK_POLICIES.map(p => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50 rounded-bl-full -mr-10 -mt-10 group-hover:bg-blue-50 transition-colors"></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.category}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{p.summary}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-400">
                <FileText size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OnboardingTab = ({ user }: { user: User }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome, {user.name}님!</h2>
        <p className="text-slate-500 text-sm mt-1">성공적인 온보딩을 위해 아래 단계를 완료해주세요.</p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-2xl font-bold text-green-600">40%</span>
        <span className="text-xs text-slate-400">전체 진행률</span>
      </div>
    </div>

    <div className="relative border-l-2 border-slate-200 ml-3 space-y-10">
      {[
        { title: '사내 메신저 설치 및 가입', status: 'done', desc: '슬랙 초대장 확인 후 가입을 완료해주세요.' },
        { title: 'PC 및 주변기기 수령', status: 'done', desc: 'IT 지원팀(11층) 방문하여 수령.' },
        { title: '팀원들과 점심 식사', status: 'current', desc: '오늘 12:00 팀 런치 예정입니다.' },
        { title: '법정 의무 교육 이수', status: 'todo', desc: '온라인 교육 센터에서 4대 폭력 예방 교육 이수.' },
        { title: '명함 신청', status: 'todo', desc: '그룹웨어 > 총무 > 명함신청.' },
      ].map((step, idx) => (
        <div key={idx} className="relative pl-8 group">
          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-all ${step.status === 'done' ? 'bg-green-500 border-green-500 scale-110' :
            step.status === 'current' ? 'bg-white border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]' : 'bg-white border-slate-300'
            }`}>
            {step.status === 'done' && <CheckCircle size={12} className="text-white mx-auto mt-[1px]" />}
          </div>

          <div className={`p-4 rounded-xl border transition-all ${step.status === 'current' ? 'bg-white border-blue-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-100'
            }`}>
            <h3 className={`font-bold text-lg ${step.status === 'current' ? 'text-blue-700' : step.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
              {step.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
            {step.status === 'current' && (
              <button className="mt-3 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                자세히 보기
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdminTab = ({ data }: { data: AnalyticsData[] }) => (
  <div className="p-6 h-full flex flex-col">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-800">HR 데이터 인사이트</h2>
      <p className="text-sm text-slate-500 mt-1">최근 임직원 문의 트렌드를 분석합니다.</p>
    </div>

    <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={80} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'][index % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="mt-6 bg-orange-50 border border-orange-100 rounded-2xl p-6">
      <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
        미답변 질문 발생 (4건)
      </h3>
      <div className="bg-white rounded-xl p-4 border border-orange-100 mb-3">
        <p className="font-medium text-slate-800 text-sm">"재택 근무 장비 지원 한도가 얼마인가요?"</p>
        <span className="text-xs text-slate-400 mt-1 block">3명이 같은 질문을 했습니다.</span>
      </div>
      <button className="w-full bg-orange-100 text-orange-700 text-sm font-bold py-3 rounded-xl hover:bg-orange-200 transition-colors">
        답변 등록하러 가기
      </button>
    </div>
  </div>
);

const DetailTab = ({ content }: { content: string }) => (
  <div className="p-6 h-full flex flex-col animate-fade-in-up">
    <div className="mb-6">
      <span className="inline-block px-3 py-1 bg-blue-100 rounded-full text-xs font-bold text-blue-700 mb-3">
        AI 상세 답변
      </span>
      <h2 className="text-2xl font-bold text-slate-900 leading-tight">상세 설명</h2>
    </div>

    <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar">
      <div className="prose prose-slate prose-headings:text-slate-800 prose-a:text-blue-600 max-w-none">
        {content.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 pb-2 border-b border-slate-100 text-slate-900">{trimmed.replace('# ', '')}</h1>;
          if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-slate-800 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full"></div>{trimmed.replace('### ', '')}</h3>;
          if (trimmed.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-600 mb-1">{trimmed.replace('- ', '')}</li>;
          if (trimmed.startsWith('1. ')) return <li key={i} className="ml-4 list-decimal text-slate-600 mb-1">{trimmed.replace('1. ', '')}</li>;
          if (trimmed.includes('|')) {
            const cells = trimmed.split('|').filter(Boolean);
            if (trimmed.includes('---')) return null;
            return (
              <div key={i} className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
                {cells.map((c, idx) => <span key={idx} className={`${idx === 0 ? 'font-bold text-slate-700' : 'text-slate-600'}`}>{c.trim()}</span>)}
              </div>
            );
          }
          return <p key={i} className="mb-2 text-slate-600 leading-relaxed">{trimmed}</p>;
        })}
      </div>
    </div>
  </div>
);

const LeaveDetailTab = ({ user, onSelectPolicy, onBack }: { user: User, onSelectPolicy: (id: string) => void, onBack: () => void }) => {
  const usedDays = 15 - user.leaveBalance; // Mock calculation
  const totalDays = 15;

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in-up">
      <button
        onClick={onBack}
        className="mb-4 text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium w-fit"
      >
        <ChevronRight className="rotate-180" size={16} /> 홈으로 돌아가기
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">연차 현황</h2>
        <p className="text-sm text-slate-500 mt-1">나의 연차 사용 내역과 잔여 현황을 확인하세요.</p>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
          <FileText size={200} />
        </div>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-semibold mb-2 uppercase tracking-wide">잔여 연차</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-extrabold">{user.leaveBalance}</span>
            <span className="text-2xl font-medium">일</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-xs mb-1">총 부여</p>
              <p className="text-2xl font-bold">{totalDays}일</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-xs mb-1">사용</p>
              <p className="text-2xl font-bold">{usedDays}일</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
          사용 내역
        </h3>
        <div className="space-y-3">
          {[
            { date: '2023.11.15', type: '연차', days: 1, reason: '개인 사유' },
            { date: '2023.10.20', type: '연차', days: 0.5, reason: '오후 반차' },
            { date: '2023.09.08', type: '연차', days: 1, reason: '병원 방문' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-800">{item.date}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{item.type}</span>
                </div>
                <p className="text-xs text-slate-500">{item.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-700">-{item.days}일</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Link */}
      <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-3">연차 규정 확인</h3>
        <p className="text-sm text-slate-600 mb-4">연차 발생 기준 및 사용 절차에 대한 자세한 내용은 사내 규정을 참고하세요.</p>
        <button
          onClick={() => {
            onSelectPolicy('leave-01');
            // Give the state a moment to update before navigating
            setTimeout(() => {
              // The policy should now be selected and displayed
            }, 50);
          }}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          연차 휴가 규정 보기 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const NoticeTab = ({ onSelect, onBack }: { onSelect: (id: number) => void, onBack: () => void }) => (
  <div className="p-6 h-full flex flex-col animate-fade-in-up">
    <button
      onClick={onBack}
      className="mb-4 text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium w-fit"
    >
      <ChevronRight className="rotate-180" size={16} /> 홈으로 돌아가기
    </button>

    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900">사내 공지사항</h2>
      <p className="text-sm text-slate-500 mt-1">회사의 주요 소식과 일정을 확인하세요.</p>
    </div>

    <div className="grid gap-3">
      {MOCK_NOTICES.map((notice) => (
        <div
          key={notice.id}
          onClick={() => onSelect(notice.id)}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group flex items-center gap-4"
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${notice.important ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${notice.important ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                {notice.important ? '중요' : '일반'}
              </span>
              <span className="text-xs text-slate-400">{notice.date}</span>
            </div>
            <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{notice.title}</h3>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
        </div>
      ))}
    </div>
  </div>
);

const NoticeDetailTab = ({ noticeId, onBack }: { noticeId: number, onBack: () => void }) => {
  const notice = MOCK_NOTICES.find(n => n.id === noticeId);

  if (!notice) return <div>Notice not found</div>;

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in-up">
      <button
        onClick={onBack}
        className="mb-4 text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium w-fit"
      >
        <ChevronRight className="rotate-180" size={16} /> 목록으로 돌아가기
      </button>

      <div className="mb-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${notice.important ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
            {notice.important ? '중요' : '일반'}
          </span>
          <span className="text-sm text-slate-400">{notice.date}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{notice.title}</h2>
      </div>

      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar">
        <div className="prose prose-slate prose-headings:text-slate-800 prose-a:text-blue-600 max-w-none">
          {notice.content?.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 pb-2 border-b border-slate-100 text-slate-900">{trimmed.replace('# ', '')}</h1>;
            if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-slate-800 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full"></div>{trimmed.replace('### ', '')}</h3>;
            if (trimmed.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-600 mb-1">{trimmed.replace('- ', '')}</li>;
            if (trimmed.startsWith('1. ')) return <li key={i} className="ml-4 list-decimal text-slate-600 mb-1">{trimmed.replace('1. ', '')}</li>;
            return <p key={i} className="mb-2 text-slate-600 leading-relaxed">{trimmed}</p>;
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;