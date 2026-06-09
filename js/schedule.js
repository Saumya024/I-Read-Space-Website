(function () {
  'use strict';

  var B = window.IRSBooking;
  if (!B) return;

  var duration = B.getDurationFromURL();
  var bookingType = B.getTypeFromURL();
  var isPackage = bookingType === 'package';
  var regionOverride = B.getRegionFromURL();
  var isIndia = true;

  var timezoneInput = document.getElementById('schedule-timezone-input');
  var timezoneSuggestions = document.getElementById('schedule-timezone-suggestions');
  var datesShell = document.getElementById('schedule-dates-shell');
  var datesScroll = document.getElementById('schedule-dates-scroll');
  var datesTrack = document.getElementById('schedule-dates-track');
  var datesArrowLeft = document.getElementById('schedule-dates-arrow-left');
  var datesArrowRight = document.getElementById('schedule-dates-arrow-right');
  var datesScrollbar = document.getElementById('schedule-dates-scrollbar');
  var datesScrollbarThumb = document.getElementById('schedule-dates-scrollbar-thumb');
  var timesTrack = document.getElementById('schedule-times-track');
  var continueBtn = document.getElementById('schedule-continue-btn');
  var summaryEl = document.getElementById('schedule-selection-summary');
  var sessionNameEl = document.getElementById('schedule-session-name');
  var durationLabelEl = document.getElementById('schedule-duration-label');
  var formatGrid = document.getElementById('schedule-format-grid');
  var audioDetailEl = document.getElementById('schedule-format-audio-detail');
  var videoDetailEl = document.getElementById('schedule-format-video-detail');
  var loadingEl = document.getElementById('schedule-loading');
  var errorEl = document.getElementById('schedule-error');

  var selectedTimezone = null;
  var timezoneEntries = [];
  var selectedFormat = 'audio';
  var slotsByDate = {};
  var availableDates = [];
  var selectedDate = null;
  var selectedSlotStart = null;

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function setLoading(isLoading) {
    if (loadingEl) loadingEl.hidden = !isLoading;
    if (datesTrack) datesTrack.style.opacity = isLoading ? '0.5' : '1';
    if (timesTrack) timesTrack.style.opacity = isLoading ? '0.5' : '1';
  }

  function getSelectedPrice() {
    return B.getPriceForFormat(duration, isIndia, selectedFormat, isPackage);
  }

  function updateFormatDetails() {
    var audioPrice = B.getPriceForFormat(duration, isIndia, 'audio', isPackage);
    var videoPrice = B.getPriceForFormat(duration, isIndia, 'video', isPackage);
    if (audioDetailEl) audioDetailEl.textContent = audioPrice + ' · audio consultation';
    if (videoDetailEl) videoDetailEl.textContent = videoPrice + ' · video consultation';
  }

  function updateContinueButton() {
    if (!continueBtn) return;
    var enabled = !!(selectedDate && selectedSlotStart);
    continueBtn.disabled = !enabled;
    continueBtn.textContent = 'Continue';

    if (summaryEl) {
      if (enabled) {
        summaryEl.innerHTML = '<span class="schedule-summary-check" aria-hidden="true">✓</span> ' +
          B.formatSlotLabel(selectedSlotStart, selectedTimezone.id);
        summaryEl.hidden = false;
      } else {
        summaryEl.hidden = true;
        summaryEl.textContent = '';
      }
    }
  }

  function initFormatPicker() {
    if (!formatGrid) return;
    updateFormatDetails();

    formatGrid.addEventListener('click', function (e) {
      var card = e.target.closest('.schedule-format-card');
      if (!card) return;
      selectedFormat = card.dataset.format || 'audio';
      formatGrid.querySelectorAll('.schedule-format-card').forEach(function (item) {
        item.classList.toggle('is-selected', item.dataset.format === selectedFormat);
      });
      updateContinueButton();
    });
  }

  function setSuggestionsOpen(isOpen) {
    if (!timezoneSuggestions) return;
    if (isOpen) {
      timezoneSuggestions.removeAttribute('hidden');
    } else {
      timezoneSuggestions.setAttribute('hidden', '');
    }
  }

  function escapeAttr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function renderTimezoneOption(tz) {
    return '<button type="button" class="schedule-timezone-option" data-id="' + escapeAttr(tz.id) + '" data-label="' + escapeAttr(tz.label) + '">' +
      '<span class="schedule-tz-option-name">' + escapeAttr(tz.title) + '</span>' +
      '<span class="schedule-tz-option-offset">' + escapeAttr(tz.offset) + '</span>' +
      '</button>';
  }

  function renderTimezoneSuggestions(filter) {
    if (!timezoneSuggestions) return;
    if (!timezoneEntries.length) {
      timezoneSuggestions.innerHTML = '<p class="schedule-tz-empty">Time zones could not load. <button type="button" class="schedule-tz-retry-btn">Try again</button></p>';
      setSuggestionsOpen(true);
      return;
    }

    var query = (filter || '').trim();
    var matches = query
      ? B.searchCalTimezones(query, timezoneEntries, 20)
      : B.getPopularTimezoneSuggestions(
        timezoneEntries,
        selectedTimezone ? selectedTimezone.id : null,
        12
      );

    var currentOffset = selectedTimezone && selectedTimezone.id
      ? B.formatGmtOffset(selectedTimezone.id)
      : '';
    var headerHtml = currentOffset
      ? '<div class="schedule-tz-current-offset">' + escapeAttr(currentOffset) + '</div>'
      : '';

    if (!matches.length) {
      timezoneSuggestions.innerHTML = headerHtml +
        '<p class="schedule-tz-empty">No matches found. Try a city or country name.</p>';
      setSuggestionsOpen(true);
      return;
    }

    timezoneSuggestions.innerHTML = headerHtml + matches.map(renderTimezoneOption).join('');
    setSuggestionsOpen(true);
  }

  function updateDateScrollFades() {
    if (!datesShell || !datesScroll) return;
    var maxScroll = datesScroll.scrollWidth - datesScroll.clientWidth;
    var scrollable = maxScroll > 4;
    var canScrollLeft = scrollable && datesScroll.scrollLeft > 4;
    var canScrollRight = scrollable && datesScroll.scrollLeft < maxScroll - 4;

    datesShell.classList.toggle('is-scrollable-left', canScrollLeft);
    datesShell.classList.toggle('is-scrollable-right', canScrollRight);

    if (datesArrowLeft) datesArrowLeft.hidden = !canScrollLeft;
    if (datesArrowRight) datesArrowRight.hidden = !canScrollRight;

    if (datesScrollbar) datesScrollbar.hidden = !scrollable;

    if (datesScrollbarThumb && datesScrollbar && scrollable) {
      var trackWidth = datesScrollbar.clientWidth;
      var thumbWidth = Math.max(56, Math.round(trackWidth * (datesScroll.clientWidth / datesScroll.scrollWidth)));
      var maxThumbLeft = Math.max(trackWidth - thumbWidth, 0);
      var thumbLeft = maxScroll > 0 ? (datesScroll.scrollLeft / maxScroll) * maxThumbLeft : 0;
      datesScrollbarThumb.style.width = thumbWidth + 'px';
      datesScrollbarThumb.style.transform = 'translateX(' + thumbLeft + 'px)';
    }
  }

  function scrollDatesBy(direction) {
    if (!datesScroll) return;
    var amount = Math.max(datesScroll.clientWidth * 0.7, 220);
    datesScroll.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }

  function initDateScrollFades() {
    if (!datesScroll) return;
    datesScroll.addEventListener('scroll', updateDateScrollFades, { passive: true });
    window.addEventListener('resize', updateDateScrollFades);

    if (datesArrowLeft) {
      datesArrowLeft.addEventListener('click', function () {
        scrollDatesBy(-1);
      });
    }

    if (datesArrowRight) {
      datesArrowRight.addEventListener('click', function () {
        scrollDatesBy(1);
      });
    }

    if (datesScrollbar && datesScrollbarThumb) {
      datesScrollbar.addEventListener('click', function (e) {
        if (e.target === datesScrollbarThumb) return;
        var rect = datesScrollbar.getBoundingClientRect();
        var maxScroll = datesScroll.scrollWidth - datesScroll.clientWidth;
        if (maxScroll <= 0) return;
        var ratio = (e.clientX - rect.left) / rect.width;
        datesScroll.scrollLeft = ratio * maxScroll;
      });

      var dragState = null;

      datesScrollbarThumb.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        dragState = {
          startX: e.clientX,
          startScroll: datesScroll.scrollLeft,
          maxScroll: datesScroll.scrollWidth - datesScroll.clientWidth,
          trackWidth: datesScrollbar.clientWidth,
          thumbWidth: datesScrollbarThumb.offsetWidth
        };
        datesScrollbarThumb.setPointerCapture(e.pointerId);
      });

      datesScrollbarThumb.addEventListener('pointermove', function (e) {
        if (!dragState || dragState.maxScroll <= 0) return;
        var maxThumbLeft = Math.max(dragState.trackWidth - dragState.thumbWidth, 0);
        if (!maxThumbLeft) return;
        var deltaX = e.clientX - dragState.startX;
        var scrollDelta = (deltaX / maxThumbLeft) * dragState.maxScroll;
        datesScroll.scrollLeft = dragState.startScroll + scrollDelta;
      });

      datesScrollbarThumb.addEventListener('pointerup', function () {
        dragState = null;
      });

      datesScrollbarThumb.addEventListener('pointercancel', function () {
        dragState = null;
      });
    }
  }

  function renderDates() {
    if (!datesTrack) return;
    datesTrack.innerHTML = '';

    availableDates.forEach(function (dateStr) {
      datesTrack.appendChild(formatDateCardButton(dateStr));
    });

    if (!selectedDate && availableDates.length) {
      selectDate(availableDates[0]);
    } else if (selectedDate && availableDates.indexOf(selectedDate) === -1) {
      selectedDate = availableDates[0] || null;
      selectedSlotStart = null;
      if (selectedDate) selectDate(selectedDate);
      else renderTimes();
    } else {
      renderTimes();
    }
    updateContinueButton();
    requestAnimationFrame(updateDateScrollFades);
  }

  function formatDateCardButton(dateStr) {
    var parts = B.formatDateCard(dateStr, selectedTimezone.id);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'schedule-date-card' + (selectedDate === dateStr ? ' is-selected' : '');
    btn.dataset.date = dateStr;
    btn.innerHTML = '<span class="schedule-date-weekday">' + parts.weekday + '</span>' +
      '<span class="schedule-date-day">' + parts.dayMonth + '</span>';
    btn.addEventListener('click', function () {
      selectDate(dateStr);
    });
    return btn;
  }

  function selectDate(dateStr) {
    selectedDate = dateStr;
    selectedSlotStart = null;
    if (datesTrack) {
      datesTrack.querySelectorAll('.schedule-date-card').forEach(function (card) {
        card.classList.toggle('is-selected', card.dataset.date === dateStr);
      });
    }
    renderTimes();
    updateContinueButton();
  }

  function renderTimes() {
    if (!timesTrack) return;
    timesTrack.innerHTML = '';

    if (!selectedDate || !slotsByDate[selectedDate]) {
      timesTrack.innerHTML = '<p class="schedule-times-empty">No sessions available on this date.</p>';
      return;
    }

    slotsByDate[selectedDate].forEach(function (slot) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'schedule-time-pill' + (selectedSlotStart === slot.start ? ' is-selected' : '');
      btn.textContent = B.formatTimePill(slot.start, selectedTimezone.id);
      btn.dataset.start = slot.start;
      btn.addEventListener('click', function () {
        selectedSlotStart = slot.start;
        timesTrack.querySelectorAll('.schedule-time-pill').forEach(function (pill) {
          pill.classList.toggle('is-selected', pill.dataset.start === slot.start);
        });
        updateContinueButton();
      });
      timesTrack.appendChild(btn);
    });
  }

  async function loadSlots() {
    setLoading(true);
    showError('');
    selectedDate = null;
    selectedSlotStart = null;

    try {
      var start = new Date();
      var end = B.addDays(start, 30);
      slotsByDate = await B.fetchAvailableSlots(
        duration,
        selectedTimezone.id,
        B.toISODate(start),
        B.toISODate(end)
      );
      availableDates = Object.keys(slotsByDate).sort();
      if (!availableDates.length) {
        showError('No open slots in the next 30 days. Try another time zone or check back soon.');
      }
      renderDates();
    } catch (err) {
      showError('We could not load availability right now. Please refresh and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openTimezoneSuggestions() {
    var query = timezoneInput.value.trim();
    if (query === selectedTimezone.label) query = '';
    renderTimezoneSuggestions(query);
  }

  async function reloadTimezones() {
    try {
      B.clearTimezoneCache();
      timezoneEntries = await B.fetchCalTimezones(true);
      selectedTimezone = await B.getDefaultTimezone();
      if (timezoneInput) {
        timezoneInput.value = selectedTimezone.label;
        timezoneInput.disabled = false;
      }
      showError('');
      await loadSlots();
      return true;
    } catch (reloadError) {
      console.error(reloadError);
      showError('Time zones could not load. Please check your connection and try again.');
      return false;
    }
  }

  function initTimezonePicker() {
    if (!timezoneInput || !selectedTimezone) return;
    timezoneInput.value = selectedTimezone.label;
    timezoneInput.placeholder = 'Search city or country (e.g. Germany, London, UAE)';
    timezoneInput.disabled = !timezoneEntries.length;
    var timezoneWrap = timezoneInput.closest('.schedule-timezone-wrap');
    var suppressCloseUntil = 0;

    timezoneInput.addEventListener('focus', function () {
      timezoneInput.select();
      openTimezoneSuggestions();
      suppressCloseUntil = Date.now() + 300;
    });

    timezoneInput.addEventListener('click', function () {
      openTimezoneSuggestions();
      suppressCloseUntil = Date.now() + 300;
    });

    if (timezoneWrap) {
      timezoneWrap.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.schedule-timezone-option')) return;
        suppressCloseUntil = Date.now() + 300;
      });
    }

    timezoneInput.addEventListener('input', function () {
      renderTimezoneSuggestions(timezoneInput.value);
    });

    timezoneInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setSuggestionsOpen(false);
        timezoneInput.value = selectedTimezone.label;
        timezoneInput.blur();
      }
    });

    if (timezoneSuggestions) {
      timezoneSuggestions.addEventListener('mousedown', function (e) {
        e.preventDefault();
        if (e.target.closest('.schedule-tz-retry-btn')) {
          reloadTimezones().then(function (ok) {
            if (ok) openTimezoneSuggestions();
          });
          return;
        }
        var option = e.target.closest('.schedule-timezone-option');
        if (!option) return;
        selectedTimezone = {
          id: option.dataset.id,
          label: option.dataset.label || option.querySelector('.schedule-tz-option-name').textContent.trim(),
          title: option.querySelector('.schedule-tz-option-name').textContent.trim(),
          offset: option.querySelector('.schedule-tz-option-offset').textContent.trim()
        };
        timezoneInput.value = selectedTimezone.label;
        setSuggestionsOpen(false);
        loadSlots();
      });
    }

    document.addEventListener('click', function (e) {
      if (!timezoneSuggestions || !timezoneInput || !selectedTimezone) return;
      if (Date.now() < suppressCloseUntil) return;
      if (document.activeElement === timezoneInput) return;
      if (timezoneInput.contains(e.target) || timezoneSuggestions.contains(e.target)) return;
      setSuggestionsOpen(false);
      if (!timezoneInput.value.trim()) {
        timezoneInput.value = selectedTimezone.label;
      }
    });
  }

  function initContinue() {
    if (!continueBtn) return;
    continueBtn.addEventListener('click', function () {
      if (!selectedSlotStart || !selectedDate) return;

      var state = {
        duration: duration,
        type: isPackage ? 'package' : null,
        region: regionOverride,
        isIndia: isIndia,
        sessionType: selectedFormat,
        timeZone: selectedTimezone.id,
        timeZoneLabel: selectedTimezone.label,
        slotStart: selectedSlotStart,
        slotLabel: B.formatSlotLabel(selectedSlotStart, selectedTimezone.id),
        selectedDate: selectedDate,
        price: getSelectedPrice(),
        sessionName: B.getSessionName(duration, isIndia)
      };

      B.saveBookingState(state);
      window.location.href = B.buildIntakeUrl(state);
    });
  }

  async function init() {
    isIndia = await B.detectIsIndia(regionOverride);

    if (durationLabelEl) {
      durationLabelEl.textContent = duration + '-MINUTE CONSULTATION' + (isPackage ? ' · PACKAGE OF 3' : '');
    }
    if (sessionNameEl) sessionNameEl.textContent = B.getSessionName(duration, isIndia);

    timezoneEntries = await B.fetchCalTimezones();
    selectedTimezone = await B.getDefaultTimezone();
    if (!timezoneEntries.length) {
      showError('Time zones could not load. Tap the time zone field and try again.');
    }

    initFormatPicker();
    initTimezonePicker();
    initDateScrollFades();
    initContinue();
    updateContinueButton();
    await loadSlots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
