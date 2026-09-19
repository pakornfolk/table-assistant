/**
 * Cute Timetable & GPA Master - Storage & Supabase Client
 * Hybrid architecture: LocalStorage fallback + Optional Cloud Sync
 */

const STORAGE_KEYS = {
  TIMETABLE: 'cute_utcc_timetable_classes',
  GRADES: 'cute_utcc_grade_semesters',
  COUNTDOWNS: 'cute_utcc_countdown_events',
  AUTOCOMPLETE_HISTORY: 'cute_utcc_autocomplete_history',
  SUPABASE_CONFIG: 'cute_utcc_supabase_config',
  THEME: 'cute_utcc_selected_theme',
  CUSTOM_COLORS: 'cute_utcc_custom_colors'
};

class StorageService {
  constructor() {
    this.supabase = null;
    this.initSupabase();
  }

  // Load config from localStorage
  getSupabaseConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      return saved ? JSON.parse(saved) : { url: '', key: '', isConnected: false };
    } catch (e) {
      return { url: '', key: '', isConnected: false };
    }
  }

  // Save config
  setSupabaseConfig(url, key) {
    const config = { url: url.trim(), key: key.trim(), isConnected: false };
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
    this.initSupabase();
  }

  // Initialize Supabase if credentials are provided
  initSupabase() {
    const config = this.getSupabaseConfig();
    if (config.url && config.key && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(config.url, config.key);
      } catch (err) {
        console.warn('Could not initialize Supabase:', err);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
    }
  }

  // Test connection to Supabase
  async testConnection(url, key) {
    if (!window.supabase) {
      return { success: false, message: 'ไม่พบไลบรารี Supabase ในระบบ กรุณาตรวจสอบอินเทอร์เน็ต' };
    }
    try {
      const tempClient = window.supabase.createClient(url.trim(), key.trim());
      // Test querying or checking table
      const { data, error } = await tempClient.from('student_data').select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist yet, it's connected to database but table needs to be created
        if (error.message.includes('relation "student_data" does not exist') || error.code === '42P01') {
          return { 
            success: true, 
            warning: true, 
            message: 'เชื่อมต่อ Supabase สำเร็จแล้ว! แต่ยังไม่ได้รัน SQL สร้างตาราง (ดูวิธีทำด้านล่างได้เลยค่ะ)' 
          };
        }
        return { success: false, message: 'เชื่อมต่อไม่สำเร็จ: ' + error.message };
      }
      return { success: true, message: 'เชื่อมต่อ Supabase สำเร็จสมบูรณ์! ข้อมูลจะซิงค์บนคลาวด์' };
    } catch (err) {
      return { success: false, message: 'เกิดข้อผิดพลาด: ' + (err.message || 'โปรดตรวจสอบ URL และ Key') };
    }
  }

  // Generic Save
  async save(key, data) {
    // Always persist to LocalStorage for 100% offline reliability
    localStorage.setItem(key, JSON.stringify(data));

    // If Supabase is active, sync in the background
    if (this.supabase) {
      this.syncKeyToSupabase(key, data).catch(err => {
        console.warn('Background Supabase sync notice:', err);
      });
    }
  }

  // Generic Load
  load(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error('Error reading localStorage for key', key, e);
      return defaultValue;
    }
  }

  // Push full payload to Supabase
  async syncKeyToSupabase(dataKey, dataValue) {
    if (!this.supabase) return;
    try {
      await this.supabase.from('student_data').upsert({
        id: dataKey,
        content: dataValue,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase sync error', e);
    }
  }

  // Pull all data from Supabase
  async pullAllFromSupabase() {
    if (!this.supabase) return { success: false, message: 'ยังไม่ได้เชื่อมต่อ Supabase' };
    try {
      const { data, error } = await this.supabase.from('student_data').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(row => {
          if (row.id && row.content) {
            localStorage.setItem(row.id, JSON.stringify(row.content));
          }
        });
        return { success: true, message: 'ดึงข้อมูลจาก Supabase Cloud สำเร็จเรียบร้อยค่ะ! ☁️✨' };
      }
      return { success: true, message: 'เชื่อมต่อสำเร็จ แต่ยังไม่มีข้อมูลบนคลาวด์' };
    } catch (err) {
      return { success: false, message: 'ดึงข้อมูลไม่สำเร็จ: ' + err.message };
    }
  }
}

export const Storage = new StorageService();
export { STORAGE_KEYS };
