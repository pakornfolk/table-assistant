/**
 * Cute Timetable & GPA Master - Timetable Engine
 * Collision Detection, Autocomplete History, Grid Positioning
 */

import { Storage, STORAGE_KEYS } from './supabase-client.js';
import { DEFAULT_TIMETABLE_CLASSES } from './mock-data.js';

const START_HOUR = 8; // 08:00
const END_HOUR = 20;  // 20:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 12 hours

class TimetableManager {
  constructor() {
    this.classes = Storage.load(STORAGE_KEYS.TIMETABLE, DEFAULT_TIMETABLE_CLASSES);
    this.history = Storage.load(STORAGE_KEYS.AUTOCOMPLETE_HISTORY, {
      codes: ['MK101', 'DM201', 'BA102', 'DM205', 'EN101', 'MK202', 'FN201'],
      titles: ['หลักการตลาด', 'การตลาดดิจิทัลเบื้องต้น', 'การบัญชีสำหรับนักบริหาร', 'การสร้างสรรค์คอนเทนต์ดิจิทัล', 'ภาษาอังกฤษเพื่อการสื่อสารธุรกิจ', 'พฤติกรรมผู้บริโภค'],
      rooms: ['7301 (อาคาร 7)', '10204 (Lab คอม)', '5202', 'Studio อาคาร 3', 'Online Zoom']
    });
    this.activeEditId = null;
  }

  init() {
    this.renderTimetable();
    this.updateDatalists();
    this.checkAllCollisions();
  }

  getClasses() {
    return this.classes;
  }

  // Convert "09:30" to minutes from 08:00
  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return (h - START_HOUR) * 60 + m;
  }

  // Check collision for a specific class against the rest
  findCollisions(targetClass) {
    const targetStart = this.timeToMinutes(targetClass.startTime);
    const targetEnd = this.timeToMinutes(targetClass.endTime);

    return this.classes.filter(cls => {
      if (cls.id === targetClass.id) return false;
      if (cls.day !== targetClass.day) return false;

      const clsStart = this.timeToMinutes(cls.startTime);
      const clsEnd = this.timeToMinutes(cls.endTime);

      // Overlap condition: targetStart < clsEnd AND targetEnd > clsStart
      return targetStart < clsEnd && targetEnd > clsStart;
    });
  }

  // Check if any collision exists in current schedule
  checkAllCollisions() {
    const alertBox = document.getElementById('collisionAlertBox');
    if (!alertBox) return;

    let conflictFound = false;
    let conflictDetails = [];

    for (let i = 0; i < this.classes.length; i++) {
      for (let j = i + 1; j < this.classes.length; j++) {
        const c1 = this.classes[i];
        const c2 = this.classes[j];
        if (c1.day === c2.day) {
          const s1 = this.timeToMinutes(c1.startTime);
          const e1 = this.timeToMinutes(c1.endTime);
          const s2 = this.timeToMinutes(c2.startTime);
          const e2 = this.timeToMinutes(c2.endTime);
          if (s1 < e2 && e1 > s2) {
            conflictFound = true;
            conflictDetails.push(`วันเดียวกัน วิชา "${c1.title}" (${c1.startTime}-${c1.endTime}) ชนกับวิชา "${c2.title}" (${c2.startTime}-${c2.endTime})`);
          }
        }
      }
    }

    if (conflictFound) {
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <span class="cute-alert-icon">⚠️</span>
          <div>
            <strong>อุ๊ย! พบเวลาเรียนชนกันค่ะคนเก่ง:</strong>
            <ul style="margin:0.25rem 0 0 1.25rem;font-size:0.85rem;">
              ${conflictDetails.map(msg => `<li>${msg}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    } else {
      alertBox.style.display = 'none';
    }
  }

  // Save class (Add or Edit)
  saveClass(classData) {
    if (this.activeEditId) {
      const idx = this.classes.findIndex(c => c.id === this.activeEditId);
      if (idx !== -1) {
        this.classes[idx] = { ...classData, id: this.activeEditId };
      }
      this.activeEditId = null;
    } else {
      const newClass = {
        ...classData,
        id: 'cls-' + Date.now()
      };
      this.classes.push(newClass);
    }

    // Save to history for autocomplete
    this.recordHistory(classData.code, classData.title, classData.room);

    // Save state
    Storage.save(STORAGE_KEYS.TIMETABLE, this.classes);
    this.renderTimetable();
    this.updateDatalists();
    this.checkAllCollisions();
  }

  deleteClass(classId) {
    this.classes = this.classes.filter(c => c.id !== classId);
    Storage.save(STORAGE_KEYS.TIMETABLE, this.classes);
    this.renderTimetable();
    this.checkAllCollisions();
  }

  recordHistory(code, title, room) {
    if (code && !this.history.codes.includes(code.trim())) {
      this.history.codes.push(code.trim());
    }
    if (title && !this.history.titles.includes(title.trim())) {
      this.history.titles.push(title.trim());
    }
    if (room && !this.history.rooms.includes(room.trim())) {
      this.history.rooms.push(room.trim());
    }
    Storage.save(STORAGE_KEYS.AUTOCOMPLETE_HISTORY, this.history);
  }

  updateDatalists() {
    const codeList = document.getElementById('historyCourseCodes');
    const titleList = document.getElementById('historyCourseTitles');
    const roomList = document.getElementById('historyRooms');

    if (codeList) {
      codeList.innerHTML = this.history.codes.map(c => `<option value="${c}"></option>`).join('');
    }
    if (titleList) {
      titleList.innerHTML = this.history.titles.map(t => `<option value="${t}"></option>`).join('');
    }
    if (roomList) {
      roomList.innerHTML = this.history.rooms.map(r => `<option value="${r}"></option>`).join('');
    }
  }

  // Render the timetable into the grid
  renderTimetable(containerId = 'timetableGridContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const days = [
      { key: 'mon', name: 'จันทร์', badge: 'mon' },
      { key: 'tue', name: 'อังคาร', badge: 'tue' },
      { key: 'wed', name: 'พุธ', badge: 'wed' },
      { key: 'thu', name: 'พฤหัสฯ', badge: 'thu' },
      { key: 'fri', name: 'ศุกร์', badge: 'fri' },
      { key: 'sat', name: 'เสาร์', badge: 'sat' },
      { key: 'sun', name: 'อาทิตย์', badge: 'sun' }
    ];

    // Build hours header: 08:00 - 20:00
    let hoursHeaderHtml = '<div class="grid-time-header">';
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const startStr = `${String(h).padStart(2, '0')}:00`;
      const endStr = `${String(h + 1).padStart(2, '0')}:00`;
      hoursHeaderHtml += `<div class="time-slot-label">${startStr}<br><span style="font-size:0.7rem;font-weight:normal;opacity:0.75;">- ${endStr}</span></div>`;
    }
    hoursHeaderHtml += '</div>';

    let daysRowsHtml = '';
    const totalMinutes = TOTAL_HOURS * 60;

    days.forEach(dayObj => {
      const dayClasses = this.classes.filter(c => c.day === dayObj.key);

      let classBlocksHtml = '';
      dayClasses.forEach(cls => {
        const startMin = this.timeToMinutes(cls.startTime);
        const endMin = this.timeToMinutes(cls.endTime);
        const durationMin = Math.max(endMin - startMin, 30);

        const leftPercent = (startMin / totalMinutes) * 100;
        const widthPercent = (durationMin / totalMinutes) * 100;

        const hasNote = cls.note && cls.note.trim().length > 0;

        classBlocksHtml += `
          <div class="class-block" 
               style="left: ${leftPercent}%; width: calc(${widthPercent}% - 6px); background-color: ${cls.color || 'var(--color-class-pink)'};"
               onclick="window.timetableManager.openQuickNoteModal('${cls.id}')"
               title="${cls.title} (${cls.startTime} - ${cls.endTime})">
            <div>
              ${cls.code ? `<div class="class-block-code">${cls.code}</div>` : ''}
              <div class="class-block-title">${cls.title}</div>
            </div>
            <div class="class-block-footer">
              ${cls.room ? `<span class="class-room-badge">${cls.room}</span>` : '<span></span>'}
              ${hasNote ? '<span class="class-note-indicator" title="มีบันทึกโน้ต">📝</span>' : ''}
            </div>
          </div>
        `;
      });

      daysRowsHtml += `
        <div class="grid-day-row">
          <div class="day-header-cell">
            <span>${dayObj.name}</span>
            <span class="day-badge ${dayObj.badge}">${dayObj.key.toUpperCase()}</span>
          </div>
          <div class="day-time-track">
            ${classBlocksHtml}
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="timetable-grid">
        <div style="background:var(--primary-soft);border-bottom:1px solid var(--surface-border);border-right:2px solid var(--surface-border);"></div>
        ${hoursHeaderHtml}
        ${daysRowsHtml}
      </div>
    `;

    // Update stats pill
    const countEl = document.getElementById('classCountStat');
    if (countEl) countEl.innerText = this.classes.length;
  }

  openQuickNoteModal(classId) {
    const cls = this.classes.find(c => c.id === classId);
    if (!cls) return;

    const modal = document.getElementById('quickNoteModal');
    if (!modal) return;

    document.getElementById('quickNoteClassTitle').innerText = `${cls.code ? cls.code + ' - ' : ''}${cls.title}`;
    document.getElementById('quickNoteTimeRoom').innerText = `🕒 ${cls.startTime} - ${cls.endTime} | 📍 ${cls.room || 'ไม่ระบุห้อง'}`;
    document.getElementById('quickNoteInput').value = cls.note || '';
    
    // Store current class ID on modal for saving
    modal.dataset.currentClassId = classId;
    modal.classList.add('open');
  }

  saveQuickNote() {
    const modal = document.getElementById('quickNoteModal');
    const classId = modal.dataset.currentClassId;
    const note = document.getElementById('quickNoteInput').value;

    const cls = this.classes.find(c => c.id === classId);
    if (cls) {
      cls.note = note.trim();
      Storage.save(STORAGE_KEYS.TIMETABLE, this.classes);
      this.renderTimetable();
    }
    modal.classList.remove('open');
    if (window.showToast) window.showToast('บันทึกโน้ตเรียบร้อยแล้วค่ะ 📝✨');
  }

  // Export JSON for sharing with friends
  exportJSON() {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      classes: this.classes
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cute-timetable-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast('ส่งออกไฟล์ตารางเรียนสำหรับแชร์ให้เพื่อนเรียบร้อยค่ะ! 👯‍♀️✨');
  }

  // Import JSON from friend
  importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.classes)) {
          this.classes = data.classes;
          Storage.save(STORAGE_KEYS.TIMETABLE, this.classes);
          this.renderTimetable();
          this.checkAllCollisions();
          if (window.showToast) window.showToast('นำเข้าตารางเรียนของเพื่อนสำเร็จแล้วค่ะ! 💖');
        } else {
          alert('รูปแบบไฟล์ตารางเรียนไม่ถูกต้องค่ะ');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
}

export const Timetable = new TimetableManager();
window.timetableManager = Timetable;
