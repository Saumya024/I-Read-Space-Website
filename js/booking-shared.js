(function (global) {
  'use strict';

  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQX3YcflcWNrUZN7a4pcBkzWmf5B4R4vccK5Ci32LuPnpW6YJnKNJrlUYyJ_vz-609/exec';
  var CAL_API_BASE = 'https://api.cal.com/v2';
  var CAL_USERNAME = 'i-read-space';
  var BOOKING_STORAGE_KEY = 'irsBooking';
  var RESERVED_PAGE_URL = 'reserved-latest.html';

  var EVENT_SLUGS = {
    30: '30min',
    60: '60min',
    90: '90min'
  };

  var pricingDataIN = {
    30: { duration: '30-Minutes', name: 'Quick Clarity', audioPrice: '₹1,200', videoPrice: '₹1,500' },
    60: { duration: '60-Minutes', name: 'Deep Insight', audioPrice: '₹2,400', videoPrice: '₹3,000' },
    90: { duration: '90-Minutes', name: 'Holistic Guidance', audioPrice: '₹3,600', videoPrice: '₹4,500' }
  };

  var pricingDataIntl = {
    30: { duration: '30-Minutes', name: 'Quick Clarity', audioPrice: '$27', videoPrice: '$33' },
    60: { duration: '60-Minutes', name: 'Deep Insight', audioPrice: '$54', videoPrice: '$73' },
    90: { duration: '90-Minutes', name: 'Holistic Guidance', audioPrice: '$81', videoPrice: '$114' }
  };

  var calTimezoneEntries = null;

  // Curated, self-contained timezone dataset. No external file required, so the
  // picker always works regardless of hosting/CDN behaviour. The full IANA zone
  // list is merged in at runtime via Intl.supportedValuesOf for complete coverage.
  var CURATED_TIMEZONES = [
    // India
    { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', pop: 18400000 },
    { city: 'Delhi', country: 'India', timezone: 'Asia/Kolkata', pop: 16800000 },
    { city: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata', pop: 10500000 },
    { city: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata', pop: 9700000 },
    { city: 'Chennai', country: 'India', timezone: 'Asia/Kolkata', pop: 9600000 },
    { city: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata', pop: 14800000 },
    { city: 'Pune', country: 'India', timezone: 'Asia/Kolkata', pop: 6200000 },
    { city: 'Ahmedabad', country: 'India', timezone: 'Asia/Kolkata', pop: 7200000 },
    // United States
    { city: 'New York', country: 'United States of America', timezone: 'America/New_York', pop: 18800000 },
    { city: 'Washington', country: 'United States of America', timezone: 'America/New_York', pop: 6300000 },
    { city: 'Boston', country: 'United States of America', timezone: 'America/New_York', pop: 4900000 },
    { city: 'Miami', country: 'United States of America', timezone: 'America/New_York', pop: 6200000 },
    { city: 'Atlanta', country: 'United States of America', timezone: 'America/New_York', pop: 6100000 },
    { city: 'Chicago', country: 'United States of America', timezone: 'America/Chicago', pop: 9500000 },
    { city: 'Houston', country: 'United States of America', timezone: 'America/Chicago', pop: 7100000 },
    { city: 'Dallas', country: 'United States of America', timezone: 'America/Chicago', pop: 7600000 },
    { city: 'Denver', country: 'United States of America', timezone: 'America/Denver', pop: 2900000 },
    { city: 'Phoenix', country: 'United States of America', timezone: 'America/Phoenix', pop: 4900000 },
    { city: 'Los Angeles', country: 'United States of America', timezone: 'America/Los_Angeles', pop: 13200000 },
    { city: 'San Francisco', country: 'United States of America', timezone: 'America/Los_Angeles', pop: 4700000 },
    { city: 'Seattle', country: 'United States of America', timezone: 'America/Los_Angeles', pop: 4000000 },
    { city: 'Anchorage', country: 'United States of America', timezone: 'America/Anchorage', pop: 290000 },
    { city: 'Honolulu', country: 'United States of America', timezone: 'Pacific/Honolulu', pop: 1000000 },
    // Canada
    { city: 'Toronto', country: 'Canada', timezone: 'America/Toronto', pop: 6200000 },
    { city: 'Montreal', country: 'Canada', timezone: 'America/Toronto', pop: 4200000 },
    { city: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver', pop: 2600000 },
    { city: 'Calgary', country: 'Canada', timezone: 'America/Edmonton', pop: 1500000 },
    { city: 'Edmonton', country: 'Canada', timezone: 'America/Edmonton', pop: 1400000 },
    { city: 'Winnipeg', country: 'Canada', timezone: 'America/Winnipeg', pop: 800000 },
    { city: 'Halifax', country: 'Canada', timezone: 'America/Halifax', pop: 440000 },
    // United Kingdom & Ireland
    { city: 'London', country: 'United Kingdom', timezone: 'Europe/London', pop: 9000000 },
    { city: 'Manchester', country: 'United Kingdom', timezone: 'Europe/London', pop: 2700000 },
    { city: 'Birmingham', country: 'United Kingdom', timezone: 'Europe/London', pop: 2600000 },
    { city: 'Edinburgh', country: 'United Kingdom', timezone: 'Europe/London', pop: 540000 },
    { city: 'Glasgow', country: 'United Kingdom', timezone: 'Europe/London', pop: 1200000 },
    { city: 'Dublin', country: 'Ireland', timezone: 'Europe/Dublin', pop: 1400000 },
    // Europe
    { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', pop: 3700000 },
    { city: 'Munich', country: 'Germany', timezone: 'Europe/Berlin', pop: 1500000 },
    { city: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin', pop: 760000 },
    { city: 'Hamburg', country: 'Germany', timezone: 'Europe/Berlin', pop: 1800000 },
    { city: 'Cologne', country: 'Germany', timezone: 'Europe/Berlin', pop: 1100000 },
    { city: 'Stuttgart', country: 'Germany', timezone: 'Europe/Berlin', pop: 630000 },
    { city: 'Paris', country: 'France', timezone: 'Europe/Paris', pop: 11000000 },
    { city: 'Lyon', country: 'France', timezone: 'Europe/Paris', pop: 1700000 },
    { city: 'Marseille', country: 'France', timezone: 'Europe/Paris', pop: 1600000 },
    { city: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid', pop: 6600000 },
    { city: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid', pop: 5600000 },
    { city: 'Rome', country: 'Italy', timezone: 'Europe/Rome', pop: 4300000 },
    { city: 'Milan', country: 'Italy', timezone: 'Europe/Rome', pop: 3100000 },
    { city: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam', pop: 1100000 },
    { city: 'Brussels', country: 'Belgium', timezone: 'Europe/Brussels', pop: 2100000 },
    { city: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich', pop: 1400000 },
    { city: 'Geneva', country: 'Switzerland', timezone: 'Europe/Zurich', pop: 600000 },
    { city: 'Vienna', country: 'Austria', timezone: 'Europe/Vienna', pop: 1900000 },
    { city: 'Lisbon', country: 'Portugal', timezone: 'Europe/Lisbon', pop: 2900000 },
    { city: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm', pop: 1600000 },
    { city: 'Oslo', country: 'Norway', timezone: 'Europe/Oslo', pop: 1000000 },
    { city: 'Copenhagen', country: 'Denmark', timezone: 'Europe/Copenhagen', pop: 1300000 },
    { city: 'Helsinki', country: 'Finland', timezone: 'Europe/Helsinki', pop: 1300000 },
    { city: 'Warsaw', country: 'Poland', timezone: 'Europe/Warsaw', pop: 1800000 },
    { city: 'Prague', country: 'Czechia', timezone: 'Europe/Prague', pop: 1300000 },
    { city: 'Athens', country: 'Greece', timezone: 'Europe/Athens', pop: 3200000 },
    { city: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow', pop: 12500000 },
    { city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul', pop: 15500000 },
    { city: 'Ankara', country: 'Turkey', timezone: 'Europe/Istanbul', pop: 5700000 },
    // Middle East
    { city: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai', pop: 3500000 },
    { city: 'Abu Dhabi', country: 'United Arab Emirates', timezone: 'Asia/Dubai', pop: 1500000 },
    { city: 'Riyadh', country: 'Saudi Arabia', timezone: 'Asia/Riyadh', pop: 7700000 },
    { city: 'Jeddah', country: 'Saudi Arabia', timezone: 'Asia/Riyadh', pop: 4600000 },
    { city: 'Doha', country: 'Qatar', timezone: 'Asia/Qatar', pop: 2400000 },
    { city: 'Kuwait City', country: 'Kuwait', timezone: 'Asia/Kuwait', pop: 3100000 },
    { city: 'Manama', country: 'Bahrain', timezone: 'Asia/Bahrain', pop: 700000 },
    { city: 'Muscat', country: 'Oman', timezone: 'Asia/Muscat', pop: 1600000 },
    { city: 'Jerusalem', country: 'Israel', timezone: 'Asia/Jerusalem', pop: 950000 },
    { city: 'Tel Aviv', country: 'Israel', timezone: 'Asia/Jerusalem', pop: 4300000 },
    // Africa
    { city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo', pop: 20900000 },
    { city: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg', pop: 5800000 },
    { city: 'Cape Town', country: 'South Africa', timezone: 'Africa/Johannesburg', pop: 4600000 },
    { city: 'Durban', country: 'South Africa', timezone: 'Africa/Johannesburg', pop: 3400000 },
    { city: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos', pop: 14400000 },
    { city: 'Abuja', country: 'Nigeria', timezone: 'Africa/Lagos', pop: 3300000 },
    { city: 'Nairobi', country: 'Kenya', timezone: 'Africa/Nairobi', pop: 4700000 },
    // Asia Pacific
    { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', pop: 5900000 },
    { city: 'Hong Kong', country: 'Hong Kong S.A.R.', timezone: 'Asia/Hong_Kong', pop: 7500000 },
    { city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai', pop: 27000000 },
    { city: 'Beijing', country: 'China', timezone: 'Asia/Shanghai', pop: 21500000 },
    { city: 'Shenzhen', country: 'China', timezone: 'Asia/Shanghai', pop: 12600000 },
    { city: 'Guangzhou', country: 'China', timezone: 'Asia/Shanghai', pop: 13300000 },
    { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', pop: 37400000 },
    { city: 'Osaka', country: 'Japan', timezone: 'Asia/Tokyo', pop: 19200000 },
    { city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul', pop: 9700000 },
    { city: 'Taipei', country: 'Taiwan', timezone: 'Asia/Taipei', pop: 2700000 },
    { city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok', pop: 10700000 },
    { city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', pop: 7800000 },
    { city: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta', pop: 10800000 },
    { city: 'Denpasar', country: 'Indonesia', timezone: 'Asia/Makassar', pop: 900000 },
    { city: 'Manila', country: 'Philippines', timezone: 'Asia/Manila', pop: 13900000 },
    { city: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', pop: 9000000 },
    { city: 'Hanoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', pop: 4700000 },
    { city: 'Karachi', country: 'Pakistan', timezone: 'Asia/Karachi', pop: 16100000 },
    { city: 'Lahore', country: 'Pakistan', timezone: 'Asia/Karachi', pop: 11100000 },
    { city: 'Islamabad', country: 'Pakistan', timezone: 'Asia/Karachi', pop: 1100000 },
    { city: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka', pop: 21000000 },
    { city: 'Colombo', country: 'Sri Lanka', timezone: 'Asia/Colombo', pop: 5600000 },
    { city: 'Kathmandu', country: 'Nepal', timezone: 'Asia/Kathmandu', pop: 1500000 },
    // Australia & New Zealand
    { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', pop: 5300000 },
    { city: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne', pop: 5100000 },
    { city: 'Brisbane', country: 'Australia', timezone: 'Australia/Brisbane', pop: 2500000 },
    { city: 'Perth', country: 'Australia', timezone: 'Australia/Perth', pop: 2100000 },
    { city: 'Adelaide', country: 'Australia', timezone: 'Australia/Adelaide', pop: 1400000 },
    { city: 'Auckland', country: 'New Zealand', timezone: 'Pacific/Auckland', pop: 1700000 },
    { city: 'Wellington', country: 'New Zealand', timezone: 'Pacific/Auckland', pop: 420000 },
    // Latin America
    { city: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo', pop: 22000000 },
    { city: 'Rio de Janeiro', country: 'Brazil', timezone: 'America/Sao_Paulo', pop: 13500000 },
    { city: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', pop: 15400000 },
    { city: 'Santiago', country: 'Chile', timezone: 'America/Santiago', pop: 6800000 },
    { city: 'Bogotá', country: 'Colombia', timezone: 'America/Bogota', pop: 11000000 },
    { city: 'Lima', country: 'Peru', timezone: 'America/Lima', pop: 10700000 },
    { city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City', pop: 21800000 },
    { city: 'Guadalajara', country: 'Mexico', timezone: 'America/Mexico_City', pop: 5300000 },
    { city: 'Monterrey', country: 'Mexico', timezone: 'America/Monterrey', pop: 4700000 },
    { city: 'Cancún', country: 'Mexico', timezone: 'America/Cancun', pop: 900000 }
  ];

  function getDurationFromURL() {
    var duration = new URLSearchParams(window.location.search).get('duration');
    if (duration === '30' || duration === '60' || duration === '90') return parseInt(duration, 10);
    return 60;
  }

  function getTypeFromURL() {
    return new URLSearchParams(window.location.search).get('type');
  }

  function getRegionFromURL() {
    var region = (new URLSearchParams(window.location.search).get('region') || '').toLowerCase();
    if (region === 'in' || region === 'intl') return region;
    return null;
  }

  function getFormatFromURL() {
    var format = (new URLSearchParams(window.location.search).get('format') || '').toLowerCase();
    if (format === 'audio' || format === 'video') return format;
    return null;
  }

  function regionFromIsIndia(isIndia) {
    return isIndia ? 'in' : 'intl';
  }

  function buildScheduleUrl(duration, type, region, format) {
    var params = new URLSearchParams();
    params.set('duration', String(duration || 60));
    if (type === 'package') params.set('type', 'package');
    if (region) params.set('region', region);
    if (format === 'audio' || format === 'video') params.set('format', format);
    return 'schedule.html?' + params.toString();
  }

  function buildIntakeUrl(booking) {
    var params = new URLSearchParams();
    params.set('duration', String(booking.duration || 60));
    if (booking.type === 'package') params.set('type', 'package');
    if (booking.region) params.set('region', booking.region);
    if (booking.sessionType === 'audio' || booking.sessionType === 'video') {
      params.set('format', booking.sessionType);
    }
    return 'intake.html?' + params.toString();
  }

  function formatSessionLabel(sessionType) {
    return sessionType === 'video' ? 'Video' : 'Audio';
  }

  function formatBookingSummary(booking) {
    if (!booking) return '';
    var isIndia = booking.isIndia !== undefined
      ? booking.isIndia
      : booking.region !== 'intl';
    var isPackage = booking.type === 'package';
    var sessionType = booking.sessionType || 'audio';
    var price = booking.price || booking.investment ||
      getPriceForFormat(booking.duration, isIndia, sessionType, isPackage);
    var sessionName = booking.sessionName || getSessionName(booking.duration, isIndia);
    var parts = [];
    if (sessionName) parts.push(sessionName);
    parts.push(formatSessionLabel(sessionType));
    if (price) parts.push(price);
    if (booking.slotLabel) parts.push(booking.slotLabel);
    return parts.join(' · ');
  }

  function getBookingState() {
    try {
      var raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveBookingState(state) {
    sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state));
  }

  function clearBookingState() {
    sessionStorage.removeItem(BOOKING_STORAGE_KEY);
  }

  function normalizeTimezoneId(timezoneId) {
    if (timezoneId === 'Asia/Calcutta') return 'Asia/Kolkata';
    return timezoneId;
  }

  function isValidTimezoneEntry(entry) {
    return !!(entry && entry.city && entry.timezone);
  }

  function formatGmtOffset(timezoneId) {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezoneId,
        timeZoneName: 'shortOffset'
      }).formatToParts(new Date());
      var offsetPart = parts.find(function (part) { return part.type === 'timeZoneName'; });
      if (offsetPart && offsetPart.value) {
        return offsetPart.value.replace('UTC', 'GMT');
      }
    } catch (e) {}
    return '';
  }

  function friendlyCityName(city) {
    if (city === 'Bengaluru') return 'Bangalore';
    return city;
  }

  var COUNTRY_SHORT_NAMES = {
    'United Arab Emirates': 'UAE',
    'United Kingdom': 'UK',
    'United States of America': 'USA',
    'United States': 'USA',
    'Hong Kong S.A.R.': 'Hong Kong'
  };

  function shortCountryName(country) {
    return COUNTRY_SHORT_NAMES[country] || country;
  }

  function getTopCitiesForZone(timezoneId, inZone, limit) {
    var max = limit || 3;
    var seen = {};
    var cities = [];

    if (timezoneId === 'Asia/Kolkata') {
      return ['Mumbai', 'Delhi', 'Bangalore'];
    }

    for (var i = 0; i < inZone.length && cities.length < max; i++) {
      var name = friendlyCityName(inZone[i].city);
      if (seen[name]) continue;
      seen[name] = true;
      cities.push(name);
    }

    return cities;
  }

  function countryTimezoneCount(country, entries) {
    var zones = {};
    entries.forEach(function (entry) {
      if (tzText(entry.country) === tzText(country)) {
        zones[entry.timezone] = true;
      }
    });
    return Object.keys(zones).length;
  }

  function formatTimezoneGroupLabel(timezoneId, entries, options) {
    options = options || {};
    var inZone = entries
      .filter(function (entry) { return entry.timezone === timezoneId; })
      .sort(function (a, b) { return (b.pop || 0) - (a.pop || 0); });

    if (!inZone.length) return timezoneId.replace(/_/g, ' ');

    var country = inZone[0].country || '';
    var topCity = friendlyCityName(inZone[0].city);
    var cities = getTopCitiesForZone(timezoneId, inZone, 3);
    var countryShort = shortCountryName(country);

    if (!country || tzText(topCity) === tzText(country) || country === 'Singapore') {
      return topCity;
    }

    if (country.indexOf('Hong Kong') !== -1) {
      return 'Hong Kong';
    }

    if (timezoneId === 'Asia/Kolkata' && country === 'India') {
      return 'India (Mumbai, Delhi, Bangalore)';
    }

    if (options.preferCountryGroup && cities.length > 1 && country &&
      countryTimezoneCount(country, entries) === 1) {
      return countryShort + ' (' + cities.join(', ') + ')';
    }

    return topCity + ', ' + countryShort;
  }

  function buildGroupedTimezoneLabel(timezoneId, entries) {
    return formatTimezoneGroupLabel(timezoneId, entries, { preferCountryGroup: true });
  }

  function toTimezoneSuggestion(entry, entries, options) {
    var city = entry.city;
    var country = entry.country || '';
    var groupLabel = entries
      ? formatTimezoneGroupLabel(entry.timezone, entries, options)
      : friendlyCityName(city);

    return {
      id: entry.timezone,
      title: groupLabel,
      offset: formatGmtOffset(entry.timezone),
      label: groupLabel,
      city: city,
      country: country
    };
  }

  function toTimezoneOption(entry, entries) {
    return toTimezoneSuggestion(entry, entries);
  }

  function prettifyZoneSegment(segment) {
    return String(segment || '').replace(/_/g, ' ');
  }

  function buildEntriesFromIntl() {
    var zones = [];
    try {
      if (typeof Intl.supportedValuesOf === 'function') {
        zones = Intl.supportedValuesOf('timeZone') || [];
      }
    } catch (e) {
      zones = [];
    }
    return zones.map(function (tz) {
      var parts = tz.split('/');
      var city = prettifyZoneSegment(parts[parts.length - 1]);
      return { city: city, city_ascii: city, country: '', timezone: tz, pop: 0 };
    });
  }

  function buildTimezoneEntries() {
    var entries = CURATED_TIMEZONES.slice();
    var coveredZones = {};
    CURATED_TIMEZONES.forEach(function (entry) {
      coveredZones[entry.timezone] = true;
    });

    // Ensure every IANA zone the browser knows about is selectable, even if it
    // is not in the curated list. Curated cities take priority for popular zones.
    buildEntriesFromIntl().forEach(function (entry) {
      if (coveredZones[entry.timezone]) return;
      coveredZones[entry.timezone] = true;
      entries.push(entry);
    });

    return entries.filter(isValidTimezoneEntry);
  }

  async function fetchCalTimezones(forceRefresh) {
    if (!forceRefresh && calTimezoneEntries && calTimezoneEntries.length) {
      return calTimezoneEntries;
    }
    calTimezoneEntries = buildTimezoneEntries();
    return calTimezoneEntries;
  }

  async function getDefaultTimezone() {
    var entries = await fetchCalTimezones();
    var detected = normalizeTimezoneId(Intl.DateTimeFormat().resolvedOptions().timeZone);
    var matches = entries
      .filter(function (entry) { return entry.timezone === detected; })
      .sort(function (a, b) { return (b.pop || 0) - (a.pop || 0); });

    if (matches.length) {
      return toTimezoneOption(matches[0], entries);
    }

    var fallback = entries
      .filter(function (entry) { return entry.timezone === 'Asia/Kolkata'; })
      .sort(function (a, b) { return (b.pop || 0) - (a.pop || 0); })[0];

    if (fallback) return toTimezoneOption(fallback, entries);
    return {
      id: detected,
      title: detected.replace(/_/g, ' '),
      offset: formatGmtOffset(detected),
      label: detected.replace(/_/g, ' '),
      city: '',
      country: ''
    };
  }

  var POPULAR_TIMEZONE_IDS = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Tokyo',
    'Australia/Sydney',
    'America/Toronto',
    'Pacific/Auckland',
    'Asia/Kolkata'
  ];

  function topCityForTimezone(timezoneId, entries) {
    return entries
      .filter(function (entry) { return entry.timezone === timezoneId; })
      .sort(function (a, b) { return (b.pop || 0) - (a.pop || 0); })[0] || null;
  }

  function getPopularTimezoneSuggestions(entries, userTimezoneId, limit) {
    var results = [];
    var seen = {};
    var max = limit || 12;

    if (userTimezoneId) {
      var userCity = topCityForTimezone(userTimezoneId, entries);
      if (userCity) {
        results.push(toTimezoneSuggestion(userCity, entries));
        seen[userCity.timezone] = true;
      }
    }

    POPULAR_TIMEZONE_IDS.forEach(function (timezoneId) {
      if (seen[timezoneId] || results.length >= max) return;
      var city = topCityForTimezone(timezoneId, entries);
      if (city) {
        results.push(toTimezoneSuggestion(city, entries));
        seen[timezoneId] = true;
      }
    });

    return results.slice(0, max);
  }

  function getTimezoneSuggestionsForZone(timezoneId, entries, limit) {
    return entries
      .filter(function (entry) { return entry.timezone === timezoneId; })
      .sort(function (a, b) { return b.pop - a.pop; })
      .slice(0, limit || 8)
      .map(function (entry) { return toTimezoneSuggestion(entry, entries); });
  }

  var COUNTRY_ALIASES = {
    uae: 'united arab emirates',
    uk: 'united kingdom',
    usa: 'united states',
    us: 'united states',
    america: 'united states'
  };

  function normalizeTimezoneQuery(query) {
    var q = (query || '').trim().toLowerCase();
    if (COUNTRY_ALIASES[q]) return COUNTRY_ALIASES[q];
    return q;
  }

  function tzText(value) {
    return String(value || '').toLowerCase();
  }

  function scoreTimezoneMatch(entry, q) {
    if (!isValidTimezoneEntry(entry)) return -1;

    var city = tzText(entry.city_ascii || entry.city);
    var country = tzText(entry.country);
    var province = tzText(entry.province);
    var iso2 = tzText(entry.iso2);
    var iso3 = tzText(entry.iso3);
    var tz = tzText(entry.timezone).replace(/_/g, ' ');

    if (country === q) return 1000;
    if (country.indexOf(q) === 0) return 950;
    if (country.indexOf(q) !== -1) return 900;
    if (iso2 === q || iso3 === q) return 880;
    if (city === q) return 850;
    if (city.indexOf(q) === 0) return 800;
    if (city.indexOf(q) !== -1) return 700;
    if (province.indexOf(q) === 0) return 600;
    if (province.indexOf(q) !== -1) return 500;
    if (entry.timezone.toLowerCase().indexOf(q.replace(/\s+/g, '_')) !== -1) return 400;
    if (tz.indexOf(q) !== -1) return 300;
    return -1;
  }

  function searchCalTimezones(query, entries, limit) {
    var max = limit || 20;
    var q = normalizeTimezoneQuery(query);
    if (!q) return [];

    var scored = [];

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var score = scoreTimezoneMatch(entry, q);
      if (score < 0) continue;
      scored.push({ entry: entry, score: score, pop: entry.pop || 0 });
    }

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.pop - a.pop;
    });

    var results = [];
    var seen = {};
    var preferCountryGroup = scored.length > 0 && scored[0].score >= 900;

    for (var j = 0; j < scored.length; j++) {
      var match = scored[j].entry;
      if (seen[match.timezone]) continue;
      seen[match.timezone] = true;
      results.push(toTimezoneSuggestion(match, entries, { preferCountryGroup: preferCountryGroup }));
      if (results.length >= max) break;
    }

    return results;
  }

  function formatDateCard(dateStr, timeZone) {
    var date = new Date(dateStr + 'T12:00:00');
    var weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: timeZone }).format(date).toUpperCase();
    var dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: timeZone }).format(date);
    return { weekday: weekday, dayMonth: dayMonth };
  }

  function formatSlotLabel(isoStart, timeZone) {
    var date = new Date(isoStart);
    var datePart = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: timeZone
    }).format(date);
    var timePart = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone
    }).format(date).toLowerCase();
    return datePart + ', ' + timePart;
  }

  function formatTimePill(isoStart, timeZone) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone
    }).format(new Date(isoStart)).toLowerCase();
  }

  var packageDataIN = {
    30: { audioPrice: '₹3,300', videoPrice: '₹4,200' },
    60: { audioPrice: '₹6,600', videoPrice: '₹8,400' },
    90: { audioPrice: '₹9,900', videoPrice: '₹12,600' }
  };

  var packageDataIntl = {
    30: { audioPrice: '$72', videoPrice: '$90' },
    60: { audioPrice: '$144', videoPrice: '$201' },
    90: { audioPrice: '$216', videoPrice: '$315' }
  };

  function getPricingData(duration, isIndia, isPackage) {
    if (isPackage) {
      return (isIndia ? packageDataIN : packageDataIntl)[duration] || null;
    }
    return (isIndia ? pricingDataIN : pricingDataIntl)[duration] || null;
  }

  function getPriceForFormat(duration, isIndia, format, isPackage) {
    var data = getPricingData(duration, isIndia, isPackage);
    if (!data) return '';
    return format === 'video' ? data.videoPrice : data.audioPrice;
  }

  function getAudioPrice(duration, isIndia) {
    return getPriceForFormat(duration, isIndia, 'audio', false);
  }

  function getSessionName(duration, isIndia) {
    var data = (isIndia ? pricingDataIN : pricingDataIntl)[duration];
    return data ? data.name : '';
  }

  async function detectIsIndia(regionOverride) {
    if (regionOverride === 'in') return true;
    if (regionOverride === 'intl') return false;
    try {
      var response = await fetch('https://ipapi.co/json/');
      var data = await response.json();
      if (data.country_code) return data.country_code === 'IN';
    } catch (e) {}
    var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Asia/Kolkata') return true;
    var locale = navigator.language || navigator.userLanguage || '';
    if (locale.startsWith('en-IN') || locale.startsWith('hi-IN')) return true;
    return false;
  }

  async function fetchAvailableSlots(duration, timeZone, startDate, endDate) {
    var slug = EVENT_SLUGS[duration] || EVENT_SLUGS[60];
    var url = CAL_API_BASE + '/slots?username=' + encodeURIComponent(CAL_USERNAME) +
      '&eventTypeSlug=' + encodeURIComponent(slug) +
      '&start=' + encodeURIComponent(startDate) +
      '&end=' + encodeURIComponent(endDate) +
      '&timeZone=' + encodeURIComponent(timeZone);

    var response = await fetch(url, {
      headers: { 'cal-api-version': '2024-09-04' }
    });
    if (!response.ok) throw new Error('Could not load availability');
    var json = await response.json();
    return json.data || {};
  }

  async function postToScript(payload) {
    var response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return response.json();
  }

  function createIdempotencyKey() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'idem-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
  }

  async function createBooking(bookingData) {
    var scriptResult = await postToScript({
      action: 'createBooking',
      duration: bookingData.duration,
      start: bookingData.slotStart,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone || '',
      timeZone: bookingData.timeZone || 'Asia/Kolkata',
      website: bookingData.website || '',
      idempotencyKey: bookingData.idempotencyKey || ''
    });

    if (scriptResult && scriptResult.success && scriptResult.data) {
      return scriptResult.data;
    }

    var message = (scriptResult && scriptResult.error) || 'Booking failed. Please try again.';
    throw new Error(message);
  }

  function addDays(date, days) {
    var copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function toISODate(date) {
    return date.toISOString().split('T')[0];
  }

  global.IRSBooking = {
    GOOGLE_SCRIPT_URL: GOOGLE_SCRIPT_URL,
    CAL_USERNAME: CAL_USERNAME,
    BOOKING_STORAGE_KEY: BOOKING_STORAGE_KEY,
    RESERVED_PAGE_URL: RESERVED_PAGE_URL,
    EVENT_SLUGS: EVENT_SLUGS,
    fetchCalTimezones: fetchCalTimezones,
    clearTimezoneCache: function () { calTimezoneEntries = null; },
    getDefaultTimezone: getDefaultTimezone,
    searchCalTimezones: searchCalTimezones,
    getTimezoneSuggestionsForZone: getTimezoneSuggestionsForZone,
    getPopularTimezoneSuggestions: getPopularTimezoneSuggestions,
    formatGmtOffset: formatGmtOffset,
    buildGroupedTimezoneLabel: buildGroupedTimezoneLabel,
    pricingDataIN: pricingDataIN,
    pricingDataIntl: pricingDataIntl,
    getDurationFromURL: getDurationFromURL,
    getTypeFromURL: getTypeFromURL,
    getRegionFromURL: getRegionFromURL,
    getFormatFromURL: getFormatFromURL,
    regionFromIsIndia: regionFromIsIndia,
    formatSessionLabel: formatSessionLabel,
    formatBookingSummary: formatBookingSummary,
    buildScheduleUrl: buildScheduleUrl,
    buildIntakeUrl: buildIntakeUrl,
    getBookingState: getBookingState,
    saveBookingState: saveBookingState,
    clearBookingState: clearBookingState,
    formatDateCard: formatDateCard,
    formatSlotLabel: formatSlotLabel,
    formatTimePill: formatTimePill,
    getAudioPrice: getAudioPrice,
    getPriceForFormat: getPriceForFormat,
    getPricingData: getPricingData,
    getSessionName: getSessionName,
    detectIsIndia: detectIsIndia,
    fetchAvailableSlots: fetchAvailableSlots,
    postToScript: postToScript,
    createIdempotencyKey: createIdempotencyKey,
    createBooking: createBooking,
    addDays: addDays,
    toISODate: toISODate
  };
})(window);
