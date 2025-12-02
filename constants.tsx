import { Policy, Role, User, EmployeeSearchResult, AnalyticsData } from './types';
import React from 'react';

// Updated Profile: Ham Bora, Design Team, UI/UX Designer
// Avatar: Professional Korean female photo
export const CURRENT_USER: User = {
  id: 'EMP002',
  name: '함보라',
  role: Role.EMPLOYEE,
  department: '디자인팀',
  joinDate: '2023-01-15',
  leaveBalance: 12.5,
  position: 'UI/UX Designer',
  email: 'bora.ham@techcorp.com',
  avatarUrl: '/user-avatar.png'
};

export const MOCK_NOTICES = [
  { id: 1, title: '[공지] 2024년 연말정산 일정 안내', date: '2023.12.01', important: true },
  { id: 2, title: '[행사] 12월 디자인팀 타운홀 미팅', date: '2023.12.05', important: false },
  { id: 3, title: '[HR] 사내 독감 예방접종 신청', date: '2023.11.28', important: false },
  { id: 4, title: '[시스템] 그룹웨어 서버 점검 안내', date: '2023.11.25', important: false },
];

export const MOCK_POLICIES: Policy[] = [
  {
    id: 'leave-01',
    title: '연차 휴가 규정',
    category: '근태/휴가',
    summary: '연차 발생 기준 및 사용 절차에 대한 안내',
    content: `
# 연차 휴가 관리 규정

### 제1조 (목적)
본 규정은 사원의 휴가 사용을 보장하고, 일과 삶의 균형을 유지하기 위함이다.

### 제2조 (연차 발생)
1. **1년 이상 근속자**: 1년간 80% 이상 출근한 근로자에게 15일의 유급휴가를 부여한다.
2. **1년 미만 근속자**: 1개월 개근 시 1일의 유급휴가를 부여한다.
3. **가산 휴가**: 3년 이상 근속한 경우, 매 2년마다 1일을 가산한다 (최대 25일).

### 제3조 (사용 및 절차)
1. **시기 지정**: 회사는 근로기준법 제61조에 따라 연차 사용을 촉진할 수 있다.
2. **반차 사용**: 
   - 오전 반차: 09:00 ~ 13:00 (4시간)
   - 오후 반차: 14:00 ~ 18:00 (4시간)
3. **결재**: 휴가 예정일 3일 전까지 그룹웨어를 통해 부서장의 승인을 득해야 한다.
    `,
    lastUpdated: '2024-01-01'
  },
  {
    id: 'expense-01',
    title: '경비 처리 및 법인카드',
    category: '재무/회계',
    summary: '법인카드 사용 한도 및 경조사비 청구 기준',
    content: `
# 경비 지출 관리 규정

### 제1조 (법인카드 사용 원칙)
1. 업무와 직접적인 관련이 있는 지출에 한하여 사용 가능하다.
2. **제한 사항**:
   - 심야 시간 (22:00 ~ 06:00) 사용 금지
   - 휴일 및 주말 사용 금지 (사전 품의 시 예외)
   - 개인적인 물품 구매 절대 금지

### 제2조 (식대 지원)
| 구분 | 지원 금액 | 비고 |
|---|---|---|
| **야근 식대** | 12,000원 | 20:00 이후 퇴근 시 |
| **팀 회식비** | 30,000원/인 | 월 1회, 부서장 승인 |
| **점심 식대** | 월 200,000원 | 급여 포함 지급 |

### 제3조 (경조사비)
- **본인 결혼**: 1,000,000원 + 화환 + 휴가 5일
- **자녀 출산**: 300,000원 + 과일바구니
- **부모 칠순**: 200,000원 지원
    `,
    lastUpdated: '2023-11-15'
  },
  {
    id: 'benefit-01',
    title: '복리후생 제도',
    category: '복지',
    summary: '건강검진, 자기개발비, 생일 선물 등',
    content: `
# 임직원 복리후생 제도

### 제1조 (건강관리)
1. **종합 건강검진**: 매년 1회 KMI, 녹십자 등 지정 병원에서 무료 검진 (본인 및 배우자).
2. **의료비 지원**: 본인 부담금 10만원 초과 시 실비 지원 (연간 100만원 한도).

### 제2조 (자기개발)
- **교육비**: 직무 관련 교육, 도서 구입비 연간 120만원 지원.
- **체력단련**: 헬스, 요가 등 운동 비용 월 5만원 지원.

### 제3조 (기념일)
- **생일**: 생일 해당 월에 신세계 상품권 5만원 지급 및 조기 퇴근(4시).
- **명절**: 설/추석 귀향비 각 20만원 지급.
    `,
    lastUpdated: '2024-02-20'
  }
];

export const EMPLOYEES: EmployeeSearchResult[] = [
  { name: '이영희', role: '인사팀장', department: 'HR팀', phone: '02-123-4567', location: '10층 A구역' },
  { name: '박지성', role: 'IT팀장', department: 'IT지원팀', phone: '02-123-9999', location: '11층 B구역' },
  { name: '최법카', role: '총무담당', department: '경영지원팀', phone: '02-123-8888', location: '10층 C구역' }
];

export const MOCK_ANALYTICS: AnalyticsData[] = [
  { category: '연차/휴가', count: 120 },
  { category: '급여/정산', count: 85 },
  { category: '복리후생', count: 60 },
  { category: '증명서발급', count: 40 },
  { category: '기타', count: 25 },
];