
const DisasterPrep = (() => {
  const STORAGE_KEY = 'japan_safe_checklist_state_v1';
  const CUSTOM_ITEMS_KEY = 'japan_safe_custom_checklist_v1';

  const DEFAULT_ITEMS = [
    {
      id: 'chk-01',
      title: 'Drinking Water (3 Liters per Person per Day)',
      desc: 'Minimum 9 liters for 72-hour survival per individual. Sealed PET bottles stored in cool dark storage.',
      category: 'water',
      priority: 'CRITICAL',
      checked: false
    },
    {
      id: 'chk-02',
      title: 'Emergency Rations (Alpha Rice & Retort Pouches)',
      desc: 'High-calorie freeze-dried alpha rice, instant miso, canned fish, high-energy biscuits requiring no heat.',
      category: 'water',
      priority: 'CRITICAL',
      checked: false
    },
    {
      id: 'chk-03',
      title: 'Portable Gas Stove (Cassette Konro) & Canisters',
      desc: 'Butane cartridge stove with minimum 3 full gas canisters for boiling water and emergency sanitation.',
      category: 'water',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-04',
      title: 'Emergency Coagulant Toilet Bags (Bousai Toire)',
      desc: 'Minimum 15-20 coagulating polymer disinfectant bags for household toilets when municipal water is severed.',
      category: 'sanitation',
      priority: 'CRITICAL',
      checked: false
    },
    {
      id: 'chk-05',
      title: 'Alcohol Disinfectant & Antiseptic Wet Wipes',
      desc: 'Body wipes and antimicrobial sanitizers for hygiene preservation without running tap water.',
      category: 'sanitation',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-06',
      title: 'Heavy Duty Waste Disposal Sacks',
      desc: 'Opaque 45L high-density polyethylene bags for sanitary isolation of biohazard waste and debris.',
      category: 'sanitation',
      priority: 'MEDIUM',
      checked: false
    },
    {
      id: 'chk-07',
      title: 'Portable Hand-Crank / Battery AM/FM Radio',
      desc: 'Tuned to NHK Radio 1 (594 kHz Tokyo / 666 kHz Osaka) for official emergency seismic and tsunami dispatches.',
      category: 'power',
      priority: 'CRITICAL',
      checked: false
    },
    {
      id: 'chk-08',
      title: 'High-Capacity Mobile Power Banks (20,000+ mAh)',
      desc: 'Pre-charged lithium backup banks with reinforced lightning and USB-C cables for smartphone telemetry.',
      category: 'power',
      priority: 'CRITICAL',
      checked: false
    },
    {
      id: 'chk-09',
      title: 'LED Headlamp & High-Lumen Tactical Flashlight',
      desc: 'Hands-free lighting with extra AA/AAA alkaline batteries stored in water-tight casing.',
      category: 'power',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-10',
      title: 'Trauma First Aid Kit & Hemostatic Dressings',
      desc: 'Sterile gauze rolls, medical tape, shears, antiseptic solution, burn dressings, and tourniquet.',
      category: 'medical',
      priority: 'CRITICAL',
      checked: false
    },
    {
      id: 'chk-11',
      title: 'Prescription Medication & Copy of Okusuri Techo',
      desc: '7-day minimum buffer of vital chronic prescriptions along with physical medicine record booklet.',
      category: 'medical',
      priority: 'CRITICAL',
      checked: false
    },
    {
      id: 'chk-12',
      title: 'N95 / DS2 Particulate Dust Masks',
      desc: 'Essential respiratory protection against pulverized concrete, asbestos, and post-seismic fire particulates.',
      category: 'medical',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-13',
      title: 'Physical Cash (1,000-Yen Notes & 100-Yen Coins)',
      desc: 'Electronic payment terminals and ATMs fail during regional blackout; coins operate public payphones.',
      category: 'power',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-14',
      title: 'Laminated Paper Evacuation & Hazard Maps',
      desc: 'Ward hazard map clearly marking designated emergency evacuation sites (Hinansho) and tsunami shelters.',
      category: 'power',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-15',
      title: 'Reinforced Leather Work Gloves & Hard Sole Shoes',
      desc: 'Protection against broken window glass, collapsed masonry, and structural rebar during escape.',
      category: 'sanitation',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-16',
      title: 'Emergency Mylar Thermal Blankets',
      desc: 'Compact aluminized foil blankets to prevent rapid hypothermia during outdoor evacuation or unheated shelters.',
      category: 'sanitation',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-17',
      title: 'High-Decibel Safety Whistle',
      desc: 'Allows entrapment rescue localization through collapsed debris without exhausting vocal cords.',
      category: 'medical',
      priority: 'HIGH',
      checked: false
    },
    {
      id: 'chk-18',
      title: 'Identification Copies & Passport Backup',
      desc: 'Waterproof pouch containing photocopies of Resident Card (Zairyu Card), Passport, and Insurance Card.',
      category: 'power',
      priority: 'HIGH',
      checked: false
    }
  ];

  let checklistItems = [];
  let currentFilter = 'all';

  const QUICK_ITEMS_KEY = 'japan_safe_quick_checklist_v1';

  let checklistInitialized = false;

    function init() {
    loadChecklistState();
    renderChecklist();
    if (!checklistInitialized) {
      setupAccordionInteractions();
      setupChecklistEventListeners();
      initQuickChecklist();
      checklistInitialized = true;
    }
  }

  function initQuickChecklist() {
    const quickIds = ['quick-chk-furniture', 'quick-chk-gobag', 'quick-chk-route'];
    try {
      const savedQuick = JSON.parse(localStorage.getItem(QUICK_ITEMS_KEY) || '{"quick-chk-furniture": true}');
      quickIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.checked = !!savedQuick[id];
          el.addEventListener('change', () => {
            savedQuick[id] = el.checked;
            localStorage.setItem(QUICK_ITEMS_KEY, JSON.stringify(savedQuick));
          });
        }
      });
    } catch (e) {
    }
  }

    function setupAccordionInteractions() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        if (!item) return;

        const isOpen = item.classList.contains('open');

        if (isOpen) {
          item.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

    function loadChecklistState() {
    try {
      const savedCheckedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const customItems = JSON.parse(localStorage.getItem(CUSTOM_ITEMS_KEY) || '[]');

      checklistItems = DEFAULT_ITEMS.concat(customItems).map(item => ({
        ...item,
        checked: savedCheckedIds.includes(item.id)
      }));
    } catch (e) {
      console.warn('LocalStorage access restricted. Utilizing memory state:', e);
      checklistItems = DEFAULT_ITEMS.map(item => ({ ...item, checked: false }));
    }
  }

  function saveChecklistState() {
    try {
      const checkedIds = checklistItems.filter(i => i.checked).map(i => i.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch (e) {
      console.error('Error persisting checklist state to LocalStorage:', e);
    }
  }

    function renderChecklist() {
    const listContainer = document.getElementById('checklist-items-container');
    if (!listContainer) return;

    const filtered = checklistItems.filter(item => {
      if (currentFilter === 'all') return true;
      return item.category === currentFilter;
    });

    listContainer.innerHTML = '';

    filtered.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = `checklist-item ${item.checked ? 'checked' : ''}`;
      itemEl.dataset.id = item.id;

      itemEl.innerHTML = `
        <div class="chk-box-custom" role="checkbox" aria-checked="${item.checked}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="item-info">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="item-title">${item.title}</span>
            <span class="item-badge-light">${item.priority}</span>
          </div>
          <p class="item-subtext">${item.desc}</p>
        </div>
      `;

      itemEl.addEventListener('click', () => {
        toggleItemCheck(item.id);
      });

      listContainer.appendChild(itemEl);
    });

    updateProgressMetric();
  }

  function toggleItemCheck(id) {
    const target = checklistItems.find(i => i.id === id);
    if (!target) return;

    target.checked = !target.checked;
    saveChecklistState();
    renderChecklist();
  }

  function updateProgressMetric() {
    const total = checklistItems.length;
    const checkedCount = checklistItems.filter(i => i.checked).length;
    const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    const countEl = document.getElementById('chk-progress-count');
    const pctEl = document.getElementById('chk-progress-pct');
    const barEl = document.getElementById('chk-progress-bar-fill');

    if (countEl) countEl.textContent = `${checkedCount} of ${total} items confirmed`;
    if (pctEl) pctEl.textContent = `${pct}% Complete`;
    if (barEl) {
      barEl.style.width = `${pct}%`;
      barEl.className = 'progress-fill';
      if (pct >= 85) barEl.classList.add('fill-green');
      else if (pct >= 40) barEl.classList.add('fill-amber');
      else barEl.classList.add('fill-red');
    }
  }

  function setupChecklistEventListeners() {
    const filterBtns = document.querySelectorAll('.chk-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter || 'all';
        renderChecklist();
      });
    });

    const addForm = document.getElementById('add-custom-item-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('custom-item-input');
        if (!input || !input.value.trim()) return;

        const newItem = {
          id: `custom-${Date.now()}`,
          title: input.value.trim(),
          desc: 'Custom user preparedness requirement.',
          category: 'sanitation',
          priority: 'USER',
          checked: false
        };

        checklistItems.push(newItem);

        try {
          const customItems = JSON.parse(localStorage.getItem(CUSTOM_ITEMS_KEY) || '[]');
          customItems.push(newItem);
          localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
        } catch (err) {
          console.error(err);
        }

        input.value = '';
        renderChecklist();
      });
    }

    const resetBtn = document.getElementById('btn-reset-checklist');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all checklist verification states to unconfirmed?')) {
          checklistItems.forEach(i => i.checked = false);
          saveChecklistState();
          renderChecklist();
        }
      });
    }

    const printBtn = document.getElementById('btn-print-checklist');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  return {
    init,
    renderChecklist
  };
})();
