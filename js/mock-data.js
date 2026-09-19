/**
 * Cute Timetable & GPA Master - Default Initial Data
 * Tailored for UTCC Digital Marketing (สาขาการตลาดดิจิทัล คณะบริหารธุรกิจ ม.หอการค้าไทย)
 */

export const DEFAULT_TIMETABLE_CLASSES = [
  {
    id: 'cls-1',
    code: 'MK101',
    title: 'หลักการตลาด (Principles of Marketing)',
    room: '7301 (อาคาร 7)',
    day: 'mon',
    startTime: '09:00',
    endTime: '12:00',
    color: 'var(--color-class-pink)',
    note: 'อ่านเคสศึกษาแบรนด์ดัง + สอบกลางภาคสัปดาห์ที่ 8'
  },
  {
    id: 'cls-2',
    code: 'DM201',
    title: 'การตลาดดิจิทัลเบื้องต้น (Digital Marketing Intro)',
    room: '10204 (Lab คอม)',
    day: 'tue',
    startTime: '13:00',
    endTime: '16:00',
    color: 'var(--color-class-purple)',
    note: 'กลุ่ม 3 ส่งหัวข้อ TikTok Campaign สัปดาห์หน้า'
  },
  {
    id: 'cls-3',
    code: 'BA102',
    title: 'การบัญชีสำหรับนักบริหาร (Managerial Accounting)',
    room: '5202',
    day: 'wed',
    startTime: '09:00',
    endTime: '12:00',
    color: 'var(--color-class-mint)',
    note: 'นำเครื่องคิดเลขเข้าห้องเรียนทุกครั้ง'
  },
  {
    id: 'cls-4',
    code: 'DM205',
    title: 'การสร้างสรรค์คอนเทนต์ดิจิทัล (Content Creation)',
    room: 'Studio อาคาร 3',
    day: 'thu',
    startTime: '13:30',
    endTime: '16:30',
    color: 'var(--color-class-peach)',
    note: 'เวิร์กช็อปถ่ายคลิป Reels & ทำกราฟิก Canva'
  },
  {
    id: 'cls-5',
    code: 'EN101',
    title: 'ภาษาอังกฤษเพื่อการสื่อสารธุรกิจ (Business English)',
    room: 'Online Zoom',
    day: 'fri',
    startTime: '10:00',
    endTime: '12:00',
    color: 'var(--color-class-sky)',
    note: 'Zoom Link อยู่ใน Google Classroom'
  }
];

export const DEFAULT_GRADE_SEMESTERS = [
  {
    id: 'sem-1',
    name: 'ปี 1 เทอม 1',
    year: 1,
    term: 1,
    courses: [
      { id: 'c-1', code: 'MK101', title: 'หลักการตลาด', credits: 3, grade: 'A' },
      { id: 'c-2', code: 'EC101', title: 'เศรษฐศาสตร์เบื้องต้น', credits: 3, grade: 'B+' },
      { id: 'c-3', code: 'BA101', title: 'องค์การและการจัดการ', credits: 3, grade: 'A' },
      { id: 'c-4', code: 'EN101', title: 'ภาษาอังกฤษพื้นฐาน 1', credits: 3, grade: 'B+' },
      { id: 'c-5', code: 'GE101', title: 'การคิดเชิงสร้างสรรค์', credits: 3, grade: 'A' },
      { id: 'c-6', code: 'GE102', title: 'ทักษะชีวิตในยุคดิจิทัล', credits: 3, grade: 'A' }
    ]
  },
  {
    id: 'sem-2',
    name: 'ปี 1 เทอม 2',
    year: 1,
    term: 2,
    courses: [
      { id: 'c-7', code: 'DM201', title: 'การตลาดดิจิทัลเบื้องต้น', credits: 3, grade: 'A' },
      { id: 'c-8', code: 'BA102', title: 'การบัญชีสำหรับนักบริหาร', credits: 3, grade: 'B' },
      { id: 'c-9', code: 'MK202', title: 'พฤติกรรมผู้บริโภค', credits: 3, grade: 'A' },
      { id: 'c-10', code: 'EN102', title: 'ภาษาอังกฤษเพื่อธุรกิจ', credits: 3, grade: 'B+' },
      { id: 'c-11', code: 'FN201', title: 'การเงินธุรกิจ', credits: 3, grade: 'B+' },
      { id: 'c-12', code: 'ST101', title: 'สถิติธุรกิจประยุกต์', credits: 3, grade: 'B' }
    ]
  }
];

export const DEFAULT_COUNTDOWN_ITEMS = [
  {
    id: 'cnt-1',
    title: 'สอบปลายภาค (Final Exam)',
    date: '2026-10-15',
    tag: '📚 การสอบ',
    note: 'อ่านทวนวิชา MK101 & DM201 ให้แม่นๆ นะคะ'
  },
  {
    id: 'cnt-2',
    title: 'ส่ง Final Project แคมเปญ TikTok',
    date: '2026-10-08',
    tag: '🎀 ส่งงาน',
    note: 'ตรวจไฟล์ VDO + สไลด์พรีเซนต์ของกลุ่ม 3'
  }
];
