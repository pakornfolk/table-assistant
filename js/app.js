/**
 * Cute Timetable & GPA Master - Main Application Orchestrator
 */

import { Storage, STORAGE_KEYS } from './supabase-client.js';
import { Themes, THEME_PRESETS } from './themes.js';
import { Timetable } from './timetable.js';
import { Grades } from './grades.js';
import { ImageExport } from './export-image.js';
import { AIAdvisor } from './ai-advisor.js';
import { DEFAULT_COUNTDOWN_ITEMS } from './mock-data.js';

// Global Toast utility
window.showToast = function(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>💖</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

class App {
  constructor() {
    this.countdowns = Storage.load(STORAGE_KEYS.COUNTDOWNS, DEFAULT_COUNTDOWN_ITEMS);
    this.selectedClassColor = 'var(--color-class-pink)';
  }

  init() {
    Themes.init();
    Timetable.init();
    Grades.init();
    AIAdvisor.init();
    this.initTabs();
    this.initModals();
    this.initCountdowns();
    this.initThemeSettings();
    this.initSupabaseSettings();
    this.updateCloudStatus();
  }

  // Navigation Tabs
  initTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const target = document.getElementById(`tabContent-${tabId}`);
        if (target) target.classList.add('active');

        if (tabId === 'grades') {
          Grades.renderGrades();
        } else if (tabId === 'timetable') {
          Timetable.renderTimetable();
        }
      });
    });
  }

  // Modals & Forms
  initModals() {
    // 1. Add Class Modal
    const btnOpenAddClass = document.getElementById('btnOpenAddClass');
    const addClassModal = document.getElementById('addClassModal');
    const formAddClass = document.getElementById('formAddClass');

    if (btnOpenAddClass && addClassModal) {
      btnOpenAddClass.addEventListener('click', () => {
        document.getElementById('inputClassCode').value = '';
        document.getElementById('inputClassTitle').value = '';
        document.getElementById('inputClassRoom').value = '';
        document.getElementById('inputClassDay').value = 'mon';
        document.getElementById('inputClassStartTime').value = '09:00';
        document.getElementById('inputClassEndTime').value = '12:00';
        document.getElementById('inputClassNote').value = '';
        addClassModal.classList.add('open');
      });
    }

    // Color swatches selection
    const colorSwatches = document.querySelectorAll('#classColorSwatches .color-swatch-item');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.selectedClassColor = swatch.dataset.color;
      });
    });

    if (formAddClass) {
      formAddClass.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('inputClassCode').value.trim();
        const title = document.getElementById('inputClassTitle').value.trim();
        const room = document.getElementById('inputClassRoom').value.trim();
        const day = document.getElementById('inputClassDay').value;
        const startTime = document.getElementById('inputClassStartTime').value;
        const endTime = document.getElementById('inputClassEndTime').value;
        const note = document.getElementById('inputClassNote').value.trim();

        if (!title || !startTime || !endTime) {
          alert('กรุณากรอกชื่อวิชา และช่วงเวลาเรียนให้ครบถ้วนค่ะ');
          return;
        }

        if (startTime >= endTime) {
          alert('เวลาเริ่มเรียนต้องมาก่อนเวลาเลิกเรียนนะคะ');
          return;
        }

        Timetable.saveClass({
          code,
          title,
          room,
          day,
          startTime,
          endTime,
          color: this.selectedClassColor,
          note
        });

        addClassModal.classList.remove('open');
        window.showToast(`เพิ่มวิชา "${title}" ลงตารางเรียนแล้วค่ะ! 🌸`);
      });
    }

    // 2. Add Course to Semester Modal
    const addCourseModal = document.getElementById('addCourseModal');
    const formAddCourse = document.getElementById('formAddCourse');

    if (formAddCourse && addCourseModal) {
      formAddCourse.addEventListener('submit', (e) => {
        e.preventDefault();
        const semId = addCourseModal.dataset.semesterId;
        const code = document.getElementById('courseCodeInput').value.trim();
        const title = document.getElementById('courseTitleInput').value.trim();
        const credits = document.getElementById('courseCreditsInput').value;
        const grade = document.getElementById('courseGradeInput').value;

        if (!title) {
          alert('กรุณากรอกชื่อวิชาค่ะ');
          return;
        }

        Grades.addCourseToSemester(semId, { code, title, credits, grade });
        addCourseModal.classList.remove('open');
      });
    }

    // 5. Add to Home Screen (PWA) Guide Modal
    const pwaModal = document.getElementById('pwaGuideModal');
    const openPwaBtns = [
      document.getElementById('btnHeaderPwaGuide'),
      document.getElementById('btnToolbarPwaGuide')
    ];

    openPwaBtns.forEach(btn => {
      if (btn && pwaModal) {
        btn.addEventListener('click', () => pwaModal.classList.add('open'));
      }
    });

    const pwaTabIos = document.getElementById('pwaTabIos');
    const pwaTabAndroid = document.getElementById('pwaTabAndroid');
    const pwaContentIos = document.getElementById('pwaContentIos');
    const pwaContentAndroid = document.getElementById('pwaContentAndroid');

    if (pwaTabIos && pwaTabAndroid && pwaContentIos && pwaContentAndroid) {
      pwaTabIos.addEventListener('click', () => {
        pwaTabIos.style.background = 'var(--surface)';
        pwaTabIos.style.color = 'var(--primary)';
        pwaTabIos.style.boxShadow = 'var(--shadow-sm)';
        pwaTabAndroid.style.background = 'transparent';
        pwaTabAndroid.style.color = 'var(--text-muted)';
        pwaTabAndroid.style.boxShadow = 'none';
        pwaContentIos.style.display = 'block';
        pwaContentAndroid.style.display = 'none';
      });

      pwaTabAndroid.addEventListener('click', () => {
        pwaTabAndroid.style.background = 'var(--surface)';
        pwaTabAndroid.style.color = 'var(--primary)';
        pwaTabAndroid.style.boxShadow = 'var(--shadow-sm)';
        pwaTabIos.style.background = 'transparent';
        pwaTabIos.style.color = 'var(--text-muted)';
        pwaTabIos.style.boxShadow = 'none';
        pwaContentAndroid.style.display = 'block';
        pwaContentIos.style.display = 'none';
      });
    }

    // Universal modal close triggers
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close on overlay background click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
  }

  // Countdowns (Exams & Assignments)
  initCountdowns() {
    this.renderCountdowns();

    const addBtn = document.getElementById('btnAddCountdown');
    const modal = document.getElementById('addCountdownModal');
    const form = document.getElementById('formAddCountdown');

    if (addBtn && modal) {
      addBtn.addEventListener('click', () => modal.classList.add('open'));
    }

    if (form && modal) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('inputCountTitle').value.trim();
        const date = document.getElementById('inputCountDate').value;
        const tag = document.getElementById('inputCountTag').value;
        const note = document.getElementById('inputCountNote').value.trim();

        if (!title || !date) {
          alert('กรุณากรอกหัวข้อและวันที่กำหนดส่ง/สอบค่ะ');
          return;
        }

        this.countdowns.push({
          id: 'cnt-' + Date.now(),
          title,
          date,
          tag,
          note
        });

        Storage.save(STORAGE_KEYS.COUNTDOWNS, this.countdowns);
        this.renderCountdowns();
        modal.classList.remove('open');
        window.showToast('เพิ่มรายการนับถอยหลังเรียบร้อยค่ะ ⏳💖');
      });
    }
  }

  renderCountdowns() {
    const container = document.getElementById('countdownListContainer');
    if (!container) return;

    if (this.countdowns.length === 0) {
      container.innerHTML = `
        <div class="empty-timetable-state">
          <div class="empty-icon">⏳</div>
          <h3>ยังไม่มีรายการนับถอยหลัง</h3>
          <p>กดปุ่ม "+ เพิ่มวันสำคัญ" เพื่อนับถอยหลังวันสอบหรือส่งงานโปรเจกต์ได้เลยค่ะ</p>
        </div>
      `;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = this.countdowns.map(item => {
      const targetDate = new Date(item.date);
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let daysText = '';
      let statusColor = 'var(--primary)';

      if (diffDays < 0) {
        daysText = `ผ่านมาแล้ว ${Math.abs(diffDays)} วัน`;
        statusColor = '#9ca3af';
      } else if (diffDays === 0) {
        daysText = 'ถึงกำหนดวันนี้แล้ว! 🚨';
        statusColor = '#ef4444';
      } else {
        daysText = `เหลืออีก ${diffDays} วัน ✨`;
      }

      return `
        <div style="background:var(--surface);border:1px solid var(--surface-border);border-radius:var(--radius-lg);padding:1.4rem;box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
              <span style="background:var(--primary-soft);color:var(--primary);padding:0.2rem 0.6rem;border-radius:var(--radius-full);font-size:0.75rem;font-weight:600;">${item.tag}</span>
              <span style="font-size:0.85rem;color:var(--text-muted);">🗓️ ${item.date}</span>
            </div>
            <h3 style="font-size:1.15rem;color:var(--text-main);margin-bottom:0.25rem;">${item.title}</h3>
            ${item.note ? `<p style="font-size:0.85rem;color:var(--text-muted);">📝 ${item.note}</p>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:1.25rem;">
            <div style="font-size:1.4rem;font-weight:800;color:${statusColor};font-family:var(--font-cute);">
              ${daysText}
            </div>
            <button class="btn btn-sm btn-secondary" onclick="window.app.deleteCountdown('${item.id}')" title="ลบรายการ">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  deleteCountdown(id) {
    this.countdowns = this.countdowns.filter(c => c.id !== id);
    Storage.save(STORAGE_KEYS.COUNTDOWNS, this.countdowns);
    this.renderCountdowns();
  }

  // Theme Settings & Custom Colors
  initThemeSettings() {
    const container = document.getElementById('themePresetsContainer');
    if (container) {
      container.innerHTML = THEME_PRESETS.map(p => `
        <button class="btn btn-secondary theme-preset-btn ${Themes.currentTheme === p.id ? 'active' : ''}"
                data-theme="${p.id}"
                style="border-left: 4px solid ${p.color};">
          <span>${p.icon}</span> <span>${p.name}</span>
        </button>
      `).join('');

      container.querySelectorAll('.theme-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          Themes.applyTheme(btn.dataset.theme);
          window.showToast(`เปลี่ยนธีมเป็น "${btn.innerText}" แล้วค่ะ 🎨✨`);
        });
      });
    }

    // Custom Color Pickers
    const primaryPicker = document.getElementById('customPrimaryPicker');
    const accentPicker = document.getElementById('customAccentPicker');

    if (primaryPicker && accentPicker) {
      primaryPicker.value = Themes.customColors.primary || '#ff7597';
      accentPicker.value = Themes.customColors.accent || '#9b72cf';

      const applyCustom = () => {
        Themes.setCustomColors(primaryPicker.value, accentPicker.value);
      };

      primaryPicker.addEventListener('input', applyCustom);
      accentPicker.addEventListener('input', applyCustom);
    }
  }

  // Supabase Cloud Settings & Connection
  initSupabaseSettings() {
    const config = Storage.getSupabaseConfig();
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    const btnSave = document.getElementById('btnSaveSupabase');
    const btnTest = document.getElementById('btnTestSupabase');
    const btnPull = document.getElementById('btnPullSupabase');

    if (urlInput && keyInput) {
      urlInput.value = config.url || '';
      keyInput.value = config.key || '';
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();
        Storage.setSupabaseConfig(url, key);
        this.updateCloudStatus();
        window.showToast('บันทึกการตั้งค่า Supabase เรียบร้อยแล้วค่ะ ☁️');
      });
    }

    if (btnTest) {
      btnTest.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();
        if (!url || !key) {
          alert('กรุณากรอก Supabase Project URL และ Anon Key ก่อนกดทดสอบค่ะ');
          return;
        }
        btnTest.disabled = true;
        btnTest.innerText = 'กำลังตรวจสอบ...';

        const result = await Storage.testConnection(url, key);
        alert(result.message);

        btnTest.disabled = false;
        btnTest.innerText = '🔌 ทดสอบการเชื่อมต่อ';
        this.updateCloudStatus();
      });
    }

    if (btnPull) {
      btnPull.addEventListener('click', async () => {
        btnPull.disabled = true;
        btnPull.innerText = 'กำลังดึงข้อมูล...';
        const res = await Storage.pullAllFromSupabase();
        alert(res.message);
        btnPull.disabled = false;
        btnPull.innerText = '⬇️ ดึงข้อมูลจากคลาวด์ลงเครื่อง';

        if (res.success) {
          Timetable.classes = Storage.load(STORAGE_KEYS.TIMETABLE, []);
          Timetable.renderTimetable();
          Grades.semesters = Storage.load(STORAGE_KEYS.GRADES, []);
          Grades.renderGrades();
        }
      });
    }

    // 1-Click Copy SQL Script
    const copySqlBtn = document.getElementById('btnCopySupabaseSql');
    if (copySqlBtn) {
      copySqlBtn.addEventListener('click', () => {
        const sql = `
-- รันคำสั่งนี้ในหน้า SQL Editor ของ Supabase เพื่อสร้างตารางเก็บข้อมูลนักศึกษา
CREATE TABLE IF NOT EXISTS student_data (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- อนุญาตให้อ่านและเขียนข้อมูลได้
ALTER TABLE student_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access" 
ON student_data FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);
        `.trim();

        navigator.clipboard.writeText(sql).then(() => {
          window.showToast('คัดลอกคำสั่ง SQL เรียบร้อย! นำไปวางใน Supabase ได้เลยค่ะ 📋✨');
        });
      });
    }
  }

  updateCloudStatus() {
    const config = Storage.getSupabaseConfig();
    const badge = document.getElementById('cloudStatusBadge');
    if (!badge) return;

    if (config.url && config.key) {
      badge.innerHTML = `<span class="cloud-dot"></span> <span>คลาวด์เชื่อมต่อแล้ว</span>`;
    } else {
      badge.innerHTML = `<span class="cloud-dot offline"></span> <span>ออฟไลน์ (เซฟในเครื่อง)</span>`;
    }
  }
}

// Instantiate and start app
window.app = new App();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
