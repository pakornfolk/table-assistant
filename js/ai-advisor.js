/**
 * Cute Timetable & GPA Master - AI Study & Marketing Advisor
 * "น้องกุลสตรี AI" - Digital Marketing Mentor & Academic Cheerleader
 */

import { Grades } from './grades.js';
import { Timetable } from './timetable.js';


class AIAdvisorManager {
  constructor() {
    const defaultKey = typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SVBPczJVaFNSdzlnSlFRazZfRlk3ZXo1aXp1bEI2V2RNUGRTR2pPeE5HaVE=') : '';
    this.geminiApiKey = localStorage.getItem('cute_utcc_gemini_key') || defaultKey;
    this.chatHistory = [
      {
        sender: 'ai',
        text: 'สวัสดีค่ะ! พี่คนเก่ง 💖 น้องกุลสตรี AI ที่ปรึกษาการเรียนสาขาการตลาดดิจิทัล ม.หอการค้าไทย ยินดีช่วยเหลือค่ะ มีอะไรให้น้องวิเคราะห์ตารางเรียน แนะนำเรื่องเกรด หรือขอกำลังใจ บอกได้เลยนะคะ 🌸'
      }
    ];
  }

  init() {
    this.renderChat();
    this.setupListeners();
  }

  setupListeners() {
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSendBtn');
    const saveKeyBtn = document.getElementById('btnSaveGeminiKey');
    const keyInput = document.getElementById('geminiApiKeyInput');

    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSendMessage();
      });
    }

    if (keyInput) {
      keyInput.value = this.geminiApiKey;
    }

    if (saveKeyBtn && keyInput) {
      saveKeyBtn.addEventListener('click', () => {
        this.geminiApiKey = keyInput.value.trim();
        localStorage.setItem('cute_utcc_gemini_key', this.geminiApiKey);
        this.updateModeBadge();
        if (this.geminiApiKey) {
          if (window.showToast) window.showToast('เชื่อมต่อ Gemini 1.5 Flash สำเร็จ! คุยได้ทุกเรื่องแล้วค่ะ 🟢✨');
        } else {
          if (window.showToast) window.showToast('กลับสู่โหมดไกด์คำถามสำเร็จรูปค่ะ 💡');
        }
      });
    }

    this.updateModeBadge();
  }

  updateModeBadge() {
    const badge = document.getElementById('aiModeStatusBadge');
    if (!badge) return;
    if (this.geminiApiKey) {
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
      badge.style.borderColor = '#86efac';
      badge.innerHTML = '🟢 โหมด: Gemini 3.6 Flash (คุยได้ทุกเรื่อง)';
    } else {
      badge.style.background = 'var(--primary-soft)';
      badge.style.color = 'var(--primary)';
      badge.style.borderColor = 'var(--surface-border)';
      badge.innerHTML = '💡 โหมด: ไกด์คำถามสำเร็จรูป';
    }
  }

  renderChat() {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    container.innerHTML = this.chatHistory.map(msg => `
      <div style="display:flex;margin-bottom:1rem;justify-content:${msg.sender === 'user' ? 'flex-end' : 'flex-start'};">
        <div style="max-width:82%;padding:0.9rem 1.25rem;border-radius:${msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px'};background:${msg.sender === 'user' ? 'var(--primary)' : '#ffffff'};color:${msg.sender === 'user' ? '#ffffff' : 'var(--text-main)'};box-shadow:0 4px 14px rgba(0,0,0,0.06);border:1px solid ${msg.sender === 'user' ? 'transparent' : 'var(--surface-border)'};font-size:0.92rem;line-height:1.5;">
          ${msg.sender === 'ai' ? '<span style="font-size:1.1rem;margin-right:0.3rem;">🎀</span>' : ''}
          ${msg.text.replace(/\n/g, '<br>')}
        </div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  async handleSendMessage() {
    const input = document.getElementById('aiChatInput');
    const query = input.value.trim();
    if (!query) return;
    input.value = '';
    await this.processQuery(query);
  }

  // Handle clicking guided question chips
  async askGuided(questionText) {
    await this.processQuery(questionText);
  }

  async processQuery(query) {
    // Push User message
    this.chatHistory.push({ sender: 'user', text: query });
    this.renderChat();

    // Show AI typing indicator
    this.chatHistory.push({ sender: 'ai', text: 'กำลังตอบ... ✨' });
    this.renderChat();

    const stats = Grades.calcCumulativeStats();
    const classes = Timetable.getClasses();

    let responseText = '';

    if (this.geminiApiKey) {
      // Direct call to Gemini 1.5 Flash
      responseText = await this.callGeminiAPI(query, stats, classes);
    } else {
      // Smart rich curated response
      responseText = this.generateSmartRuleResponse(query, stats, classes);
    }

    // Replace typing indicator with actual response
    this.chatHistory[this.chatHistory.length - 1] = { sender: 'ai', text: responseText };
    this.renderChat();
  }


  // Rules-based response if no Gemini API Key is provided
  generateSmartRuleResponse(query, stats, classes) {
    const q = query.toLowerCase();

    // 1. เกรด & การเรียน
    if (q.includes('เกรด') || q.includes('gpa') || q.includes('เกียรตินิยม') || q.includes('f')) {
      return `ตอนนี้เกรดเฉลี่ยสะสม (GPAX) ของพี่อยู่ที่ **${stats.gpax.toFixed(2)}** ค่ะ (${stats.honorsText}) มีหน่วยกิตสะสมที่ผ่านแล้ว **${stats.earnedCredits} หน่วยกิต**\n\n💡 **คำแนะนำจากน้องกุลสตรี**: หากต้องการคว้าเกียรตินิยม อย่าลืมว่าห้ามติด F และลองไปที่แท็บ "คำนวณเกรด" ใส่ตัวจำลองเกรดเป้าหมายดูนะคะ จะบอกเลยว่าเทอมหน้าต้องทำเกรดเฉลี่ยขั้นต่ำเท่าไหร่ สู้ๆ ค่ะ! 🌸✨`;
    }

    // 2. ตารางเรียน & เวลา
    if (q.includes('ตาราง') || q.includes('วิชา') || q.includes('เรียน') || q.includes('เวลา')) {
      return `สัปดาห์นี้พี่มีเรียนทั้งหมด **${classes.length} วิชา** ค่ะ สามารถกดปุ่ม **"Wallpaper มือถือ (9:16)"** ด้านบนเพื่อโหลดรูปไปตั้งเป็นหน้าจอล็อกได้เลย สะดวกและสวยมาก ไม่ต้องคอยแคปรูปหรือเปิดดูในสมุดค่ะ 📲🎀`;
    }

    // 3. กำลังใจ & ความเครียด & งานกลุ่ม
    if (q.includes('เหนื่อย') || q.includes('เครียด') || q.includes('ท้อ') || q.includes('กำลังใจ') || q.includes('เหงา') || q.includes('ปลอบ') || q.includes('กลุ่ม')) {
      if (q.includes('กลุ่ม') || q.includes('งานกลุ่ม')) {
        return `กอดๆ นะคะคนเก่ง! 🧸💖 ปัญหางานกลุ่มนี่เป็นมหากาพย์ของเด็กมหาวิทยาลัยทุกคนเลยค่ะ น้องกุลสตรีเข้าใจหัวอกพี่สุดๆ เลย\n\n💡 **ทริคฮีลใจและจัดการงานกลุ่มให้รอดแบบไม่ประสาทเสีย**:\n1. **แบ่งงานแบบชัดเจนเป็นลายลักษณ์อักษร**: ทำ Check-list ระบุ Deadline ย่อยและชื่อคนรับผิดชอบในโน้ตกลุ่มเลยค่ะ จะได้ไม่มีใครอ้างว่าไม่รู้หน้าที่\n2. **อย่ายอมแบกไว้คนเดียว**: ถ้าเพื่อนไม่ช่วย ลองคุยตรงๆ ด้วยเหตุผลอย่างนุ่มนวล หรือทักปรึกษาอาจารย์ประจำวิชาได้เลยนะคะ ไม่ต้องกลัวผิด\n3. **พักฮีลใจตัวเองด่วนๆ**: วันนี้เหนื่อยมาทั้งวันแล้ว ไปหาของหวานอร่อยๆ ทาน หรือเปิดเพลงที่ชอบฟังแล้วนอนพักผ่อนให้เต็มที่ก่อนนะคะ คนเก่งทำดีที่สุดแล้วค่ะ น้องคอยอยู่เคียงข้างเสมอค่ะ! 🌸✨`;
      }
      return `กอดๆ นะคะคนเก่ง! 🧸💖 การเรียนมหาวิทยาลัยและชีวิตวัยรุ่นมีช่วงที่เหนื่อยเป็นธรรมดาเลยค่ะ ไม่ต้องกดดันตัวเองจนเกินไปนะคะ\n\nลองพักสายตาสัก 15 นาที จิบชาเขียวเย็นๆ หรือเปิดเพลงที่ชอบฟังก่อน แล้วค่อยลุยต่อนะคะ น้องกุลสตรีคอยอยู่ข้างๆ และเชื่อมั่นในตัวพี่เสมอค่ะ! ☕🌸`;
    }

    // 4. ของกิน & ร้านอร่อยรอบ ม.หอการค้า
    if (q.includes('กิน') || q.includes('หิว') || q.includes('ร้าน') || q.includes('อร่อย') || q.includes('ข้าว') || q.includes('คาเฟ่')) {
      return `เรื่องกินเรื่องใหญ่ของเด็ก ม.หอการค้าไทย เลยค่ะ! 😋🍴\n- **ซอยวิภาวดี 2**: มีร้านข้าวมันไก่, ก๋วยเตี๋ยวเรือ, และยำรสแซ่บเยอะมาก\n- **ฝั่งประชาสงเคราะห์**: มีร้านชานมไข่มุก คาเฟ่อ่านหนังสือน่ารักๆ และร้านปิ้งย่างบุฟเฟต์หลังเลิกเรียน\nอย่าลืมทานข้าวให้อิ่มท้องก่อนไปลุยอ่านหนังสือน้า! 🧋🍰`;
    }

    // 5. ไอเดียการตลาด & คอนเทนต์
    if (q.includes('การตลาด') || q.includes('แคมเปญ') || q.includes('คอนเทนต์') || q.includes('tiktok') || q.includes('ไอเดีย') || q.includes('โปรเจกต์')) {
      return `ไอเดียสำหรับเด็กการตลาดดิจิทัล UTCC ยุคนี้ 📱✨:\n1. **TikTok & Reels**: ยุคนี้เน้น Hook 3 วินาทีแรก และความเรียล (Authenticity) มากกว่าความเพอร์เฟกต์\n2. **Trend Jacking**: เอาเทรนด์เพลงหรือมุกตลกไวรัลมาผูกกับสินค้า\n3. **Data Metric**: เวลาทำรายงานอาจารย์คณะบริหาร อย่าลืมใส่ Engagement Rate และ Conversion Funnel ให้ชัดเจนนะคะ จะได้เกรด A แน่นอน! 💼🎀`;
    }

    // 6. ความรัก & ความสัมพันธ์
    if (q.includes('รัก') || q.includes('แฟน') || q.includes('ชอบ') || q.includes('คนคุย') || q.includes('เพื่อน')) {
      return `เรื่องหัวใจน้องกุลสตรีก็พร้อมรับฟังเสมอนะคะ! 💖 ความสัมพันธ์ที่ดีคือความสัมพันธ์ที่ทำให้เราเติบโตและมีความสุข หากกำลังมีเรื่องกวนใจ ลองโฟกัสที่การรักตัวเองและเป้าหมายของเราก่อนนะคะ คนที่ใช่จะเข้ามาในเวลาที่เหมาะสมเสมอค่ะ ✨`;
    }

    // 7. แฟชั่น & แต่งตัวไปมอ
    if (q.includes('แต่งตัว') || q.includes('ชุด') || q.includes('แฟชั่น') || q.includes('รองเท้า')) {
      return `ลุคเด็กบริหาร ม.หอการค้าไทย สุดปัง 👗✨: เสื้อนักศึกษาทรงพอดีตัว แมตช์กับกระโปรงพลีทหรือทรงเอ พร้อมรองเท้าผ้าใบสีขาวคลีนๆ หรือกระเป๋า Tote Bag พาสเทลมินิมอล แค่นี้ก็น่ารักสดใส มั่นใจตลอดทั้งวันแล้วค่ะ! 🌸`;
    }

    // Default Friendly Response
    return `น้องกุลสตรีพร้อมคุยและให้คำปรึกษาได้ทุกเรื่องเลยค่ะ! ทั้งเรื่องเกรด, การตลาด, วางแผนชีวิต, เพื่อน, ความรัก หรือเรื่องทั่วไป 🌸💖\n\n💡 **เคล็ดลับ**: หากต้องการให้น้องตอบได้ลึกซึ้งและฉลาดแบบตอบได้ทุกสิ่งทุกอย่างบนโลก สามารถนำ **Google Gemini API Key** มาใส่ที่ช่องด้านล่างได้เลยค่ะ (ฟรี 100%) แล้วพิมพ์คุยได้ไม่อั้นเลยนะคะ! ✨`;
  }

  // Direct Google Gemini API integration with Multi-Model Failover & Resilient Fallback
  async callGeminiAPI(query, stats, classes) {
    const candidateModels = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash'];

    const systemInstruction = `
คุณคือ "น้องกุลสตรี AI" เพื่อนสนิทและที่ปรึกษาคนเก่งของนักศึกษามหาวิทยาลัยหอการค้าไทย (UTCC) คณะบริหารธุรกิจ สาขาการตลาดดิจิทัล
บุคลิกภาพ: น่ารัก, สดใส, อ่อนหวาน, ฉลาดรอบรู้, อบอุ่น, เป็นมิตร, ปลอบโยนเก่ง, คุยสนุก ใช้สรรพนามแทนตัวเองว่า "น้องกุลสตรี" หรือ "น้อง" และเรียกผู้ใช้ว่า "พี่" หรือ "คนเก่ง"
ความสามารถ:
1. ตอบและคุยได้ "ทุกเรื่องบนโลกอย่างอิสระ" ไม่จำกัดเฉพาะเรื่องเรียน เช่น การวางแผนเกรด, วิเคราะห์ตารางเรียน, คิดไอเดียการตลาดดิจิทัล, ช่วยคิดหัวข้อโปรเจกต์, ความรัก, แฟชั่น, ร้านอร่อย, การใช้ชีวิตในมหาลัย, ปัญหาความเครียด, สุขภาพจิต, งานกลุ่ม
2. ข้อมูลปัจจุบันของผู้ใช้: เกรดเฉลี่ยสะสม (GPAX) = ${stats.gpax.toFixed(2)}, หน่วยกิตสะสม = ${stats.earnedCredits}, สถานะ = ${stats.honorsText}, วิชาในตารางเรียน = ${classes.length} วิชา
3. ภาษา: ตอบเป็นภาษาไทยที่สุภาพ น่ารัก เป็นธรรมชาติ มีอิโมจิประดับ 🌸💖 และให้ข้อคิดหรือคำตอบที่มีประโยชน์เสมอ
    `.trim();

    const contents = [
      {
        role: 'user',
        parts: [{ text: `[System Context: ${systemInstruction}]\n\nผู้ใช้ถามว่า: ${query}` }]
      }
    ];

    for (const model of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (!response.ok) {
          // If server is experiencing high demand (503), rate-limited (429), or 404, fallback to next model
          continue;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        // Network error - try next candidate model
        continue;
      }
    }

    // Graceful automatic degradation: If Google API is temporarily experiencing high demand across all models,
    // seamlessly return our smart tailored response so the user never sees raw API error messages!
    return this.generateSmartRuleResponse(query, stats, classes);
  }
}

export const AIAdvisor = new AIAdvisorManager();
window.aiAdvisor = AIAdvisor;
