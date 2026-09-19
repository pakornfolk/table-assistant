/**
 * Cute Timetable & GPA Master - Image Export Service
 * Renders high-resolution PNG / JPG for Phone Wallpapers (9:16) and Landscape (16:9)
 */

import { Timetable } from './timetable.js';

class ImageExportService {
  constructor() {
    this.isExporting = false;
  }

  // Export Timetable as Phone Wallpaper (9:16) or Landscape (16:9)
  async exportTimetable(mode = 'phone', format = 'png') {
    if (this.isExporting) return;
    this.isExporting = true;
    if (window.showToast) window.showToast('กำลังเนรมิตรูปภาพตารางเรียนน่ารักๆ สักครู่นะคะ... 🌸');

    try {
      const exportTarget = document.getElementById('timetableScrollContainer');
      if (!exportTarget || !window.html2canvas) {
        throw new Error('ไม่พบองค์ประกอบตารางเรียนหรือไลบรารี html2canvas');
      }

      // If phone mode (9:16), we populate the hidden phone wallpaper frame
      let renderElement = exportTarget;
      let frameContainer = null;

      if (mode === 'phone') {
        frameContainer = document.getElementById('phoneExportFrame');
        if (frameContainer) {
          // Render a clean phone-optimized view into phone frame
          this.buildPhoneWallpaperContent(frameContainer);
          renderElement = frameContainer;
        }
      }

      const canvas = await window.html2canvas(renderElement, {
        scale: 2, // 2x resolution for retina sharpness
        useCORS: true,
        backgroundColor: mode === 'phone' ? null : '#ffffff',
        logging: false
      });

      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const extension = format === 'jpg' ? 'jpg' : 'png';
      const quality = format === 'jpg' ? 0.95 : undefined;

      const dataUrl = canvas.toDataURL(mimeType, quality);
      const link = document.createElement('a');
      link.download = `cute-timetable-${mode}-${Date.now()}.${extension}`;
      link.href = dataUrl;
      link.click();

      if (window.showToast) window.showToast(`บันทึกรูปภาพตารางเรียน (${extension.toUpperCase()}) สำเร็จแล้วค่ะ! 💖`);
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างภาพ: ' + err.message);
    } finally {
      this.isExporting = false;
    }
  }

  // Build the phone frame content before capturing
  buildPhoneWallpaperContent(container) {
    const classes = Timetable.getClasses();
    const days = [
      { key: 'mon', name: 'จันทร์' },
      { key: 'tue', name: 'อังคาร' },
      { key: 'wed', name: 'พุธ' },
      { key: 'thu', name: 'พฤหัสฯ' },
      { key: 'fri', name: 'ศุกร์' },
      { key: 'sat', name: 'เสาร์' },
      { key: 'sun', name: 'อาทิตย์' }
    ];

    let scheduleListHtml = '';
    days.forEach(d => {
      const dayClasses = classes.filter(c => c.day === d.key);
      if (dayClasses.length > 0) {
        scheduleListHtml += `
          <div style="margin-bottom:1.25rem;">
            <div style="font-size:1.3rem;font-weight:700;color:var(--primary);margin-bottom:0.6rem;display:flex;align-items:center;gap:0.5rem;">
              <span>🗓️ วัน${d.name}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.6rem;">
              ${dayClasses.map(c => `
                <div style="background:${c.color || '#fff0f5'};border-radius:18px;padding:0.9rem 1.25rem;box-shadow:0 4px 12px rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:space-between;">
                  <div>
                    <div style="font-size:1.15rem;font-weight:700;color:#2d242a;">${c.title}</div>
                    <div style="font-size:0.95rem;color:#6b5864;">📍 ${c.room || 'ไม่ระบุห้อง'} ${c.code ? `• ${c.code}` : ''}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.7);padding:0.4rem 0.85rem;border-radius:12px;font-weight:700;font-size:1rem;color:var(--primary);">
                    ${c.startTime} - ${c.endTime}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = `
      <div class="phone-lockscreen-spacer">
        <div style="font-size:1.4rem;color:#8f7b88;font-weight:600;">✨ MY CLASS SCHEDULE ✨</div>
      </div>
      <div class="phone-wallpaper-header">
        <h1 style="font-size:2.8rem;margin-bottom:0.3rem;">ตารางเรียนสุดคิ้วท์ 🎀</h1>
        <p style="font-size:1.25rem;">ม.หอการค้าไทย (UTCC) • คณะบริหารธุรกิจ การตลาดดิจิทัล</p>
      </div>
      <div class="phone-wallpaper-grid">
        ${scheduleListHtml || '<div style="text-align:center;font-size:1.4rem;color:#888;padding:3rem;">ยังไม่มีวิชาเรียนในตารางค่ะ</div>'}
      </div>
      <div style="text-align:center;font-size:1.1rem;color:#998793;margin-top:2rem;">
        Made with 💖 Cute Timetable Master • Have a wonderful study day! 🌸
      </div>
    `;
  }
}

export const ImageExport = new ImageExportService();
window.imageExport = ImageExport;
