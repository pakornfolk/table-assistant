/**
 * Cute Timetable & GPA Master - Grade Calculation Engine
 * Accurate Universal & UTCC Standard GPA / GPAX Formulas
 */

import { Storage, STORAGE_KEYS } from './supabase-client.js';
import { DEFAULT_GRADE_SEMESTERS } from './mock-data.js';

export const GRADE_POINTS = {
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0
};

// Grades that count towards passed credits but not towards GPA calculation
export const NON_CALCULATED_GRADES = ['S', 'U', 'W', 'P'];

class GradeManager {
  constructor() {
    this.semesters = Storage.load(STORAGE_KEYS.GRADES, DEFAULT_GRADE_SEMESTERS);
  }

  init() {
    this.renderGrades();
    this.setupSimulator();
  }

  getSemesters() {
    return this.semesters;
  }

  // Calculate stats for a single semester
  calcSemesterStats(semester) {
    let totalPoints = 0;
    let qualityCredits = 0; // Credits counted in GPA
    let earnedCredits = 0;  // Total passed credits (grades != F, U, W)

    semester.courses.forEach(c => {
      const credits = Number(c.credits) || 0;
      const grade = (c.grade || '').trim().toUpperCase();

      if (GRADE_POINTS[grade] !== undefined) {
        qualityCredits += credits;
        totalPoints += credits * GRADE_POINTS[grade];
        if (grade !== 'F') {
          earnedCredits += credits;
        }
      } else if (grade === 'S' || grade === 'P') {
        earnedCredits += credits;
      }
    });

    const gpa = qualityCredits > 0 ? (totalPoints / qualityCredits) : 0.0;

    return {
      gpa: Math.round(gpa * 100) / 100,
      totalPoints,
      qualityCredits,
      earnedCredits
    };
  }

  // Calculate cumulative GPAX across all semesters
  calcCumulativeStats() {
    let cumulativePoints = 0;
    let cumulativeQualityCredits = 0;
    let cumulativeEarnedCredits = 0;
    let hasFailedGrade = false;

    this.semesters.forEach(sem => {
      const stats = this.calcSemesterStats(sem);
      cumulativePoints += stats.totalPoints;
      cumulativeQualityCredits += stats.qualityCredits;
      cumulativeEarnedCredits += stats.earnedCredits;

      sem.courses.forEach(c => {
        if ((c.grade || '').toUpperCase() === 'F') {
          hasFailedGrade = true;
        }
      });
    });

    const gpax = cumulativeQualityCredits > 0 ? (cumulativePoints / cumulativeQualityCredits) : 0.0;
    const roundedGPAX = Math.round(gpax * 100) / 100;

    // Honors classification according to UTCC / Universal standard
    let honors = 'normal';
    let honorsText = 'ระดับการศึกษาปกติ';
    let honorsBadgeClass = 'honors-none';

    if (!hasFailedGrade) {
      if (roundedGPAX >= 3.50) {
        honors = 'first';
        honorsText = '🏆 มีสิทธิ์ได้รับเกียรตินิยมอันดับ 1';
        honorsBadgeClass = 'honors-gold';
      } else if (roundedGPAX >= 3.25) {
        honors = 'second';
        honorsText = '🥈 มีสิทธิ์ได้รับเกียรตินิยมอันดับ 2';
        honorsBadgeClass = 'honors-silver';
      }
    } else {
      honorsText = 'ไม่ได้รับเกียรตินิยม (มีผลการเรียน F)';
    }

    return {
      gpax: roundedGPAX,
      totalPoints: cumulativePoints,
      qualityCredits: cumulativeQualityCredits,
      earnedCredits: cumulativeEarnedCredits,
      honors,
      honorsText,
      honorsBadgeClass,
      hasFailedGrade
    };
  }

  // Target GPA simulator
  simulateTarget(targetGPAX, remainingCredits) {
    const current = this.calcCumulativeStats();
    const currentPoints = current.totalPoints;
    const currentCredits = current.qualityCredits;
    const target = Number(targetGPAX);
    const remCredits = Number(remainingCredits);

    if (remCredits <= 0) {
      return { feasible: false, message: 'กรุณากรอกหน่วยกิตที่เหลือมากกว่า 0 ค่ะ' };
    }

    // Required Formula: (currentPoints + requiredPoints) / (currentCredits + remCredits) = target
    // requiredPoints = target * (currentCredits + remCredits) - currentPoints
    // requiredGPA = requiredPoints / remCredits
    const totalRequiredCredits = currentCredits + remCredits;
    const totalRequiredPoints = target * totalRequiredCredits;
    const neededPoints = totalRequiredPoints - currentPoints;
    const neededGPA = neededPoints / remCredits;

    const roundedNeeded = Math.round(neededGPA * 100) / 100;

    if (roundedNeeded > 4.0) {
      return {
        feasible: false,
        neededGPA: roundedNeeded,
        message: `เป้าหมาย ${target.toFixed(2)} ต้องได้เกรดเฉลี่ย ${roundedNeeded.toFixed(2)} ในหน่วยกิตที่เหลือ ซึ่งเกินเกรด A (4.00) ค่ะ ลองเพิ่มหน่วยกิตเพื่อเกลี่ยคะแนนดูนะคะ`
      };
    } else if (roundedNeeded < 0) {
      return {
        feasible: true,
        neededGPA: 0.0,
        message: `เกรดปัจจุบันสะสมดีมากอยู่แล้วค่ะ ได้เกรดเฉลี่ยขั้นต่ำ 1.00 หรือผ่านทุกวิชาก็จะถึงเป้า ${target.toFixed(2)} ได้สบายๆ เลยค่ะ! 🌟`
      };
    } else {
      return {
        feasible: true,
        neededGPA: roundedNeeded,
        message: `เพื่อให้ได้เกรดเฉลี่ยสะสม ${target.toFixed(2)} คุณต้องทำเกรดเฉลี่ยในอีก ${remCredits} หน่วยกิตให้ได้ขั้นต่ำ **${roundedNeeded.toFixed(2)}** ค่ะ (สู้ๆ นะคะคนเก่ง! 💖)`
      };
    }
  }

  // Calculate stats for an entire academic year (เช่น รวมเทอม 1 + เทอม 2 ของปีนั้นๆ)
  calcYearStats(yearNumber) {
    const yearSemesters = this.semesters.filter(s => Number(s.year) === Number(yearNumber));
    let totalPoints = 0;
    let qualityCredits = 0;
    let earnedCredits = 0;

    yearSemesters.forEach(sem => {
      const stats = this.calcSemesterStats(sem);
      totalPoints += stats.totalPoints;
      qualityCredits += stats.qualityCredits;
      earnedCredits += stats.earnedCredits;
    });

    const gpa = qualityCredits > 0 ? (totalPoints / qualityCredits) : 0.0;
    return {
      year: yearNumber,
      gpa: Math.round(gpa * 100) / 100,
      totalPoints,
      qualityCredits,
      earnedCredits,
      semestersCount: yearSemesters.length
    };
  }

  // Add a whole new academic year (สร้างชั้นปีใหม่ พร้อมเทอม 1 และ เทอม 2)
  addAcademicYear(specificYear = null) {
    const existingYears = this.semesters.map(s => Number(s.year) || 1);
    const maxYear = existingYears.length > 0 ? Math.max(...existingYears) : 0;
    const targetYear = specificYear ? Number(specificYear) : (maxYear + 1);

    const sem1 = {
      id: 'sem-' + Date.now(),
      name: `ปี ${targetYear} เทอม 1`,
      year: targetYear,
      term: 1,
      courses: []
    };
    const sem2 = {
      id: 'sem-' + (Date.now() + 10),
      name: `ปี ${targetYear} เทอม 2`,
      year: targetYear,
      term: 2,
      courses: []
    };

    this.semesters.push(sem1, sem2);
    this.save();
    this.renderGrades();
    if (window.showToast) window.showToast(`เพิ่มชั้นปีที่ ${targetYear} (เทอม 1 & 2) เรียบร้อยแล้วค่ะ 🎓🌸`);
  }

  // Add a single semester into a specific year
  addSemesterToYear(targetYear) {
    const yearSemesters = this.semesters.filter(s => Number(s.year) === Number(targetYear));
    const nextTerm = yearSemesters.length + 1;
    const termLabel = nextTerm === 3 ? 'ภาคฤดูร้อน (Summer)' : `เทอม ${nextTerm}`;

    const newSem = {
      id: 'sem-' + Date.now(),
      name: `ปี ${targetYear} ${termLabel}`,
      year: Number(targetYear),
      term: nextTerm,
      courses: []
    };

    this.semesters.push(newSem);
    this.save();
    this.renderGrades();
    if (window.showToast) window.showToast(`เพิ่ม ${newSem.name} สำเร็จแล้วค่ะ 🌸`);
  }

  // Add new semester
  addSemester() {
    const existingYears = this.semesters.map(s => Number(s.year) || 1);
    const maxYear = existingYears.length > 0 ? Math.max(...existingYears) : 1;
    this.addSemesterToYear(maxYear);
  }

  // Delete semester
  deleteSemester(semesterId) {
    if (confirm('ยืนยันลบภาคการศึกษานี้พร้อมรายวิชาทั้งหมดหรือไม่คะ?')) {
      this.semesters = this.semesters.filter(s => s.id !== semesterId);
      this.save();
      this.renderGrades();
      if (window.showToast) window.showToast('ลบภาคการศึกษาเรียบร้อยแล้วค่ะ');
    }
  }

  // Add course to semester
  addCourseToSemester(semesterId, courseData) {
    const sem = this.semesters.find(s => s.id === semesterId);
    if (!sem) return;

    const newCourse = {
      id: 'c-' + Date.now(),
      code: courseData.code ? courseData.code.trim() : '',
      title: courseData.title.trim(),
      credits: Number(courseData.credits) || 3,
      grade: courseData.grade || 'A'
    };

    sem.courses.push(newCourse);
    this.save();
    this.renderGrades();
    if (window.showToast) window.showToast(`เพิ่มวิชา ${newCourse.title} เรียบร้อยแล้วค่ะ ✨`);
  }

  // Delete course
  deleteCourse(semesterId, courseId) {
    const sem = this.semesters.find(s => s.id === semesterId);
    if (!sem) return;

    sem.courses = sem.courses.filter(c => c.id !== courseId);
    this.save();
    this.renderGrades();
  }

  // Update course inline
  updateCourseGrade(semesterId, courseId, newGrade) {
    const sem = this.semesters.find(s => s.id === semesterId);
    if (!sem) return;
    const course = sem.courses.find(c => c.id === courseId);
    if (course) {
      course.grade = newGrade;
      this.save();
      this.renderGrades();
    }
  }

  // Update course credits inline with real-time recalculation
  updateCourseCredits(semesterId, courseId, newCredits) {
    const sem = this.semesters.find(s => s.id === semesterId);
    if (!sem) return;
    const course = sem.courses.find(c => c.id === courseId);
    if (course) {
      course.credits = Number(newCredits) || 3;
      this.save();
      this.renderGrades();
    }
  }

  save() {
    Storage.save(STORAGE_KEYS.GRADES, this.semesters);
  }

  // Render GPA Dashboard, Yearly Summaries, and Grouped Semesters
  renderGrades() {
    const cumulative = this.calcCumulativeStats();

    // Update cumulative overview UI
    const gpaxEl = document.getElementById('cumulativeGpaxDisplay');
    const honorsEl = document.getElementById('cumulativeHonorsDisplay');
    const totalCreditsEl = document.getElementById('cumulativeCreditsDisplay');
    const qualityCreditsEl = document.getElementById('qualityCreditsDisplay');
    const totalPointsEl = document.getElementById('totalPointsDisplay');

    if (gpaxEl) gpaxEl.innerText = cumulative.gpax.toFixed(2);
    if (honorsEl) {
      honorsEl.className = `honors-badge ${cumulative.honorsBadgeClass}`;
      honorsEl.innerText = cumulative.honorsText;
    }
    if (totalCreditsEl) totalCreditsEl.innerText = cumulative.earnedCredits;
    if (qualityCreditsEl) qualityCreditsEl.innerText = cumulative.qualityCredits;
    if (totalPointsEl) totalPointsEl.innerText = cumulative.totalPoints.toFixed(1);

    // 1. Render Yearly GPA Summary Cards (สรุปเกรดเฉลี่ยรายปี)
    const yearlyContainer = document.getElementById('yearlySummaryContainer');
    const distinctYearsSet = new Set(this.semesters.map(s => Number(s.year) || 1));
    // Ensure at least Years 1 and 2 or all existing years are listed
    if (distinctYearsSet.size === 0) { distinctYearsSet.add(1); }
    const sortedYears = Array.from(distinctYearsSet).sort((a, b) => a - b);

    if (yearlyContainer) {
      yearlyContainer.innerHTML = `
        <div class="yearly-section-title">
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span>🎓</span> <strong>สรุปผลการเรียนเฉลี่ยรายปี (Yearly GPA Breakdown)</strong>
          </div>
          <button class="btn btn-sm btn-primary" onclick="window.gradeManager.addAcademicYear()">
            <span>+</span> <span>เพิ่มชั้นปีใหม่ (เช่น ปี ${Math.max(...sortedYears) + 1})</span>
          </button>
        </div>
        <div class="yearly-gpa-grid">
          ${sortedYears.map(yr => {
            const yrStats = this.calcYearStats(yr);
            return `
              <div class="year-metric-card">
                <div class="year-card-header">
                  <span class="year-title-text">🌸 ชั้นปีที่ ${yr}</span>
                  <span style="font-size:0.75rem;background:var(--primary-soft);color:var(--primary);padding:0.15rem 0.5rem;border-radius:var(--radius-full);font-weight:600;">
                    ${yrStats.semestersCount} ภาคเรียน
                  </span>
                </div>
                <div>
                  <div style="font-size:0.78rem;color:var(--text-muted);">เกรดเฉลี่ยประจำปี (Yearly GPA)</div>
                  <div class="year-gpa-big">${yrStats.gpa.toFixed(2)}</div>
                </div>
                <div class="year-footer-info">
                  <span>หน่วยกิตผ่าน: <strong>${yrStats.earnedCredits}</strong></span>
                  <span>แต้มคะแนน: <strong>${yrStats.totalPoints.toFixed(1)}</strong></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 2. Render Semesters Grouped by Academic Year
    const container = document.getElementById('semestersContainer');
    if (!container) return;

    if (this.semesters.length === 0) {
      container.innerHTML = `
        <div class="empty-timetable-state">
          <div class="empty-icon">📝</div>
          <h3>ยังไม่มีข้อมูลภาคการศึกษา</h3>
          <p>กดปุ่ม "+ เพิ่มชั้นปีใหม่" เพื่อเริ่มบันทึกและคำนวณเกรดได้เลยค่ะ</p>
        </div>
      `;
      return;
    }

    container.innerHTML = sortedYears.map(yr => {
      const yearSemesters = this.semesters.filter(s => Number(s.year) === Number(yr));
      const yrStats = this.calcYearStats(yr);

      const semestersHtml = yearSemesters.map(sem => {
        const semStats = this.calcSemesterStats(sem);

        const coursesRows = sem.courses.map(c => {
          const gradeClass = 'grade-' + c.grade.replace('+', '-plus');
          const currentCredits = Number(c.credits) || 3;
          const creditList = [1, 1.5, 2, 3, 4, 5, 6];
          if (!creditList.includes(currentCredits)) {
            creditList.push(currentCredits);
            creditList.sort((a, b) => a - b);
          }

          return `
            <tr>
              <td><strong>${c.code || '-'}</strong></td>
              <td>${c.title}</td>
              <td>
                <select class="form-select" style="padding:0.3rem 0.55rem;font-size:0.85rem;width:105px;"
                        onchange="window.gradeManager.updateCourseCredits('${sem.id}', '${c.id}', this.value)"
                        title="ปรับหน่วยกิต (คำนวณ GPA เรียลไทม์)">
                  ${creditList.map(cr => `
                    <option value="${cr}" ${currentCredits === cr ? 'selected' : ''}>${cr} หน่วยกิต</option>
                  `).join('')}
                </select>
              </td>
              <td>
                <select class="form-select" style="padding:0.3rem 0.55rem;font-size:0.85rem;width:95px;"
                        onchange="window.gradeManager.updateCourseGrade('${sem.id}', '${c.id}', this.value)"
                        title="ปรับเกรด (คำนวณ GPA เรียลไทม์)">
                  ${['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'S', 'U', 'W', 'P'].map(g => `
                    <option value="${g}" ${c.grade === g ? 'selected' : ''}>${g}</option>
                  `).join('')}
                </select>
              </td>
              <td>
                <span class="grade-badge-display ${gradeClass}">${c.grade}</span>
              </td>
              <td style="text-align:right;">
                <button class="btn btn-sm btn-secondary" style="color:#ef4444;border-color:transparent;padding:0.25rem 0.5rem;"
                        onclick="window.gradeManager.deleteCourse('${sem.id}', '${c.id}')" title="ลบวิชานี้">
                  ✕
                </button>
              </td>
            </tr>
          `;
        }).join('');

        return `
          <div class="semester-card" style="margin-bottom:1.25rem;">
            <div class="semester-card-header">
              <div class="semester-title-group">
                <h3>🌸 ${sem.name}</h3>
              </div>
              <div class="semester-stats">
                <span style="font-size:0.85rem;color:var(--text-muted);">หน่วยกิต: <strong>${semStats.earnedCredits}</strong></span>
                <span class="semester-gpa-badge">GPA เทอมนี้: ${semStats.gpa.toFixed(2)}</span>
                <button class="btn btn-sm btn-primary" onclick="window.gradeManager.openAddCourseModal('${sem.id}', '${sem.name}')">
                  + เพิ่มวิชา
                </button>
                <button class="btn btn-sm btn-secondary" onclick="window.gradeManager.deleteSemester('${sem.id}')" title="ลบเทอมนี้">
                  🗑️
                </button>
              </div>
            </div>
            <div class="course-table-wrapper">
              <table class="course-table">
                <thead>
                  <tr>
                    <th style="width:120px;">รหัสวิชา</th>
                    <th>ชื่อวิชา</th>
                    <th style="width:110px;">หน่วยกิต</th>
                    <th style="width:110px;">ปรับเกรด</th>
                    <th style="width:80px;">เกรด</th>
                    <th style="width:50px;text-align:right;">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${coursesRows || `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:1.5rem;">ยังไม่มีวิชาในเทอมนี้ กด "+ เพิ่มวิชา" ได้เลยค่ะ</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="year-group-wrapper">
          <div class="year-group-header">
            <div class="year-group-title">
              <h3>🎓 ชั้นปีที่ ${yr}</h3>
            </div>
            <div class="year-group-stats">
              <span class="year-gpa-pill">เกรดเฉลี่ยปี ${yr}: <strong>${yrStats.gpa.toFixed(2)}</strong></span>
              <span style="font-size:0.85rem;color:var(--text-muted);">รวม <strong>${yrStats.earnedCredits}</strong> หน่วยกิต</span>
              <button class="btn btn-sm btn-secondary" onclick="window.gradeManager.addSemesterToYear(${yr})">
                + เพิ่มเทอมในชั้นปีที่ ${yr}
              </button>
            </div>
          </div>
          <div>
            ${semestersHtml || `<div style="text-align:center;padding:1.5rem;color:var(--text-muted);">ยังไม่มีเทอมในชั้นปีที่ ${yr} กด "+ เพิ่มเทอมในชั้นปีที่ ${yr}" ได้เลยค่ะ</div>`}
          </div>
        </div>
      `;
    }).join('');
  }

  openAddCourseModal(semesterId, semesterName) {
    const modal = document.getElementById('addCourseModal');
    if (!modal) return;
    modal.dataset.semesterId = semesterId;
    document.getElementById('modalSemesterTargetName').innerText = semesterName;
    document.getElementById('courseCodeInput').value = '';
    document.getElementById('courseTitleInput').value = '';
    document.getElementById('courseCreditsInput').value = '3';
    document.getElementById('courseGradeInput').value = 'A';
    modal.classList.add('open');
  }

  setupSimulator() {
    const btn = document.getElementById('btnRunSimulator');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const targetGPAX = parseFloat(document.getElementById('simTargetGpax').value);
      const remainingCredits = parseFloat(document.getElementById('simRemainingCredits').value);
      const resultBox = document.getElementById('simResultBox');

      if (isNaN(targetGPAX) || isNaN(remainingCredits)) {
        alert('กรุณากรอกเกรดเป้าหมายและหน่วยกิตที่เหลือให้ถูกต้องค่ะ');
        return;
      }

      const result = this.simulateTarget(targetGPAX, remainingCredits);
      resultBox.className = 'simulator-result-box show';
      resultBox.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.6rem;">
          <span style="font-size:1.4rem;">${result.feasible ? '🎯' : '💡'}</span>
          <div>${result.message}</div>
        </div>
      `;
    });
  }
}

export const Grades = new GradeManager();
window.gradeManager = Grades;
