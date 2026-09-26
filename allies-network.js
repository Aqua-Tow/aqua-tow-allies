const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// schedule = array of 7 entries aligned to DAYS: {on: bool, all24: bool, start:"HH:MM", end:"HH:MM"}
function allDaySchedule(start,end){ return DAYS.map(()=>({on:true, all24:false, start, end})); }

// Kit lineup: Tow System (Tow-18 line only, for now), Jump Kit, Pump Kit —
// owning all three at once is sold/labeled as the Full Recovery Kit.
function kitsLabel(kits){
  const set = new Set(kits);
  if(set.has('Tow System') && set.has('Jump Kit') && set.has('Pump Kit')) return 'Full Recovery Kit';
  return kits.join(', ');
}
function servicesForKits(kitPurchasedOrArray){
  const kits = Array.isArray(kitPurchasedOrArray) ? kitPurchasedOrArray : String(kitPurchasedOrArray||'').split(',').map(s=>s.trim());
  const set = new Set(kits);
  if(set.has('Full Recovery Kit')){ set.add('Tow System'); set.add('Jump Kit'); set.add('Pump Kit'); }
  const services = [];
  if(set.has('Tow System')) services.push('Towing');
  if(set.has('Jump Kit')) services.push('Jump Start');
  if(set.has('Pump Kit')) services.push('Dewatering');
  return services;
}

// Live Allies now come straight from the Aqua-Tow Allies Airtable base via a
// Make.com scenario ("Aqua-Tow Allies Map Feed") — a webhook that runs an
// Airtable Search Records for every row where Status = "Verified & Live",
// then hands the raw records back as JSON. That means every kit owner who
// gets verified in Airtable shows up here automatically the next time the
// page loads — no more manually copying names into this file. See
// loadAlliesFromAirtable() below for the fetch + field-mapping.
const MAP_DATA_WEBHOOK = 'https://hook.us2.make.com/1e74mb39y7q94i4z7bpwq3tieanvfpw8';

// Rotating avatar-circle palette for Allies (Airtable doesn't store a color —
// initials/photo art always did the rest of the identity work anyway).
const AVATAR_COLORS = ['#0b3d5c','#1c7293','#c97a2a','#5b7280'];
function initialsFor(fullName){
  const parts = String(fullName||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
}

// Converts one raw Airtable "Allies" record (as the Make.com map-feed
// webhook returns it) into the shape the rest of this file expects. Returns
// null for a record that's missing a name or a valid pin location (e.g. a
// blank in-progress signup row) so it's silently skipped rather than
// crashing the map.
// Airtable hands attachment fields back as an array of file objects (or
// nothing, if the field is empty) — this pulls out a reasonably-sized image
// URL to actually display, preferring the "large" thumbnail over the full
// original so the popup avatar doesn't download a multi-megabyte photo.
function firstAttachmentUrl(attachments){
  if(!Array.isArray(attachments) || !attachments[0]) return '';
  const a = attachments[0];
  return (a.thumbnails && a.thumbnails.large && a.thumbnails.large.url) || a.url || '';
}

function mapAirtableRecordToAlly(rec, idx){
  const name = rec['Full Name'];
  const lat = Number(rec.Latitude), lng = Number(rec.Longitude);
  if(!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const kits = String(rec['Kit Purchased']||'').split(',').map(s=>s.trim()).filter(Boolean);
  const contact = (rec['Contact Methods']||[]).map(m=>CONTACT_LABEL_TO_VAL[m] || String(m).toLowerCase());
  const schedule = DAYS.map(d=>parseHoursString(rec[`${d} Hours`]));
  return {
    name, initials: initialsFor(name), color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    kits, orderNumber: rec['Order Number'] || '', phone: rec.Phone || '',
    lat, lng, label: rec['Location Label'] || '',
    contact, bio: rec.Bio || '', schedule,
    editToken: rec['Edit Token'] || '', photoType: PHOTO_LABEL_TO_KEY[rec['Photo Type']] || 'skip',
    photoUrl: firstAttachmentUrl(rec.Photo)
  };
}

let ALLIES = [];
let KNOWN_AREAS = [];

async function loadAlliesFromAirtable(){
  try{
    const res = await fetch(MAP_DATA_WEBHOOK, {cache:'no-store'});
    if(!res.ok) throw new Error('Map feed responded with ' + res.status);
    const rows = await res.json();
    ALLIES = rows.map(mapAirtableRecordToAlly).filter(Boolean);
  }catch(err){
    console.error('Could not load Allies from Airtable:', err);
    ALLIES = [];
  }
  KNOWN_AREAS = ALLIES.map(a=>({label:a.label, lat:a.lat, lng:a.lng}));
}

function findAreaMatch(query){
  const q = (query||'').trim().toLowerCase();
  if(!q) return null;
  let hit = KNOWN_AREAS.find(a=>a.label.toLowerCase()===q);
  if(hit) return hit;
  hit = KNOWN_AREAS.find(a=>{
    const city = a.label.toLowerCase().split(',')[0].trim();
    return a.label.toLowerCase().includes(q) || q.includes(city) || city.includes(q);
  });
  return hit || null;
}

// Real-world city/state/ZIP lookup, for anyone who'd rather type a place than
// use "Use my location". Tries the built-in demo lake list first (instant,
// no network call — keeps the sample Allies reachable by name), then falls
// back to a real geocoding lookup via MapTiler's Geocoding API (same key/
// account as the map tiles above) so ANY real US city, state or ZIP works,
// not just the handful of demo lakes. Returns {lat, lng, label} on success,
// null if nothing matched, or {error:true} if the lookup itself failed
// (network issue, bad key, etc).
async function geocodeArea(query){
  const q = (query||'').trim();
  if(!q) return null;
  const known = findAreaMatch(q);
  if(known) return {lat:known.lat, lng:known.lng, label:known.label};
  if(MAPTILER_API_KEY === 'YOUR_MAPTILER_KEY') return null; // no key configured yet — can't geocode real places until it is
  try{
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAPTILER_API_KEY}&country=US&limit=1`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('geocoding failed: ' + res.status);
    const data = await res.json();
    const feature = data.features && data.features[0];
    if(!feature || !Array.isArray(feature.center)) return null;
    const [lng, lat] = feature.center;
    return {lat, lng, label: feature.place_name || q};
  }catch(e){
    console.error('Geocoding error:', e);
    return {error:true};
  }
}

function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

// NOTE: the plain tile.openstreetmap.org server is for casual/testing use only —
// OSM's own policy actively blocks apps and business sites that use it directly
// (see https://operations.osmfoundation.org/policies/tiles/). MapTiler's free
// plan (100k tile loads/month, no credit card required) serves the same
// OpenStreetMap data in a way that's meant for real sites. Sign up free at
// https://www.maptiler.com/, grab your API key from the dashboard, and paste
// it below in place of "YOUR_MAPTILER_KEY".
const MAPTILER_API_KEY = 'XJzuTNREaLsq6KB1O1D0';
const OSM_TILE_URL = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
const OSM_ATTRIBUTION = '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

if(MAPTILER_API_KEY === 'YOUR_MAPTILER_KEY'){
  const warn = document.createElement('div');
  warn.className = 'note';
  warn.style.cssText = 'border-color:var(--pending);color:var(--pending);max-width:920px;margin:16px auto 0;';
  warn.innerHTML = '<b>Setup needed:</b> the maps below won’t load real tiles yet — sign up free at maptiler.com (no credit card), copy your API key, and paste it into the MAPTILER_API_KEY constant near the top of this file’s script.';
  document.body.insertBefore(warn, document.body.firstChild);
}

function pinDivIcon(color, size){
  size = size || 30;
  return L.divIcon({
    className: 'leaflet-pin',
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" fill="${color}" stroke="white" stroke-width="1"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
    iconSize: [size, size], iconAnchor: [size/2, size], popupAnchor: [0, -size]
  });
}
function meDivIcon(){
  return L.divIcon({
    className: 'leaflet-pin',
    html: `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${cssVar('--accent')}" stroke="white" stroke-width="2.5"/></svg>`,
    iconSize: [22, 22], iconAnchor: [11, 11]
  });
}

function timeToHours(t){ const [h,m] = t.split(':').map(Number); return h + m/60; }
function isAvailableNow(ally){
  const now = new Date();
  const dayIdx = (now.getDay()+6) % 7; // JS Sunday=0 -> map to Mon=0..Sun=6
  const today = ally.schedule[dayIdx];
  if(!today || !today.on) return false;
  if(today.all24) return true;
  const nowHour = now.getHours() + now.getMinutes()/60;
  return nowHour >= timeToHours(today.start) && nowHour < timeToHours(today.end);
}

// Pins are colored by real-time status, not by Ally identity — green means
// "reach out right now," red means "off-hours, but here's when they're back."
// This is what lets someone who broke down overnight tell at a glance which
// nearby Allies can actually help immediately.
const PIN_COLOR_AVAILABLE = '#2f9e5c';
const PIN_COLOR_UNAVAILABLE = '#c0392b';
function pinColorFor(ally){ return isAvailableNow(ally) ? PIN_COLOR_AVAILABLE : PIN_COLOR_UNAVAILABLE; }

// How long until an Ally who's currently off-hours opens back up — the whole
// point being that someone stranded overnight can see "back in ~6 hrs"
// instead of just "not available" and having no idea whether to wait it out.
// Scans today plus the next 7 days for the next day/time their schedule
// turns on; returns null only in the pathological case where no day is ever
// on (the signup form requires at least one, so this shouldn't occur live).
function nextAvailableInfo(ally){
  const now = new Date();
  for(let dayOffset=0; dayOffset<8; dayOffset++){
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const dayIdx = (d.getDay()+6) % 7;
    const sch = ally.schedule[dayIdx];
    if(!sch || !sch.on) continue;
    const startHour = sch.all24 ? 0 : timeToHours(sch.start);
    if(dayOffset===0){
      const nowHour = now.getHours() + now.getMinutes()/60;
      if(nowHour >= startHour) continue; // today's window already started (and, since we're only
                                          // called when NOT available now, must have already ended)
    }
    const avail = new Date(d);
    avail.setHours(Math.floor(startHour), Math.round((startHour%1)*60), 0, 0);
    return { minutes: Math.round((avail - now) / 60000), date: avail };
  }
  return null;
}

// A friendly readout for the wait: "Available in 40 min" / "~6 hrs" for
// anything under a day, otherwise a day name + time ("Available Tue 7am").
function formatWaitLabel(ally){
  if(isAvailableNow(ally)) return 'Available now';
  const info = nextAvailableInfo(ally);
  if(!info) return 'Not currently available';
  const hours = info.minutes / 60;
  if(hours < 1) return `Available in ${Math.max(1,info.minutes)} min`;
  if(hours < 20){ const h = Math.round(hours); return `Available in ~${h} hr${h!==1?'s':''}`; }
  const dayName = info.date.toLocaleDateString('en-US',{weekday:'long'});
  const timeStr = formatTime12(`${String(info.date.getHours()).padStart(2,'0')}:${String(info.date.getMinutes()).padStart(2,'0')}`);
  return `Available ${dayName} at ${timeStr}`;
}

document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('panel-'+t.dataset.tab).classList.add('active');
}));

function haversineMiles(lat1,lon1,lat2,lon2){
  const R=3958.8, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function pinIcon(){
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
}
function phoneIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
}
function textIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
}
function clockIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>';
}
function boatIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 15l1.5 4.5a2 2 0 0 0 1.9 1.5h11.2a2 2 0 0 0 1.9-1.5L21 15"/><path d="M5 15l1-8h12l1 8"/><path d="M12 3v4"/><path d="M2.5 15h19"/></svg>';
}

// Ally card popup: a friendly 12-hour readout of a stored weekly schedule,
// e.g. "Every day, 7am–9pm" / "Weekends, 8am–6pm" / "24 hours".
function formatTime12(t){
  if(!t) return '';
  let [h,m] = t.split(':').map(Number);
  const ap = h>=12 ? 'pm' : 'am';
  h = h % 12; if(h===0) h = 12;
  return m ? `${h}:${String(m).padStart(2,'0')}${ap}` : `${h}${ap}`;
}
function allySchedulePhrase(ally){
  const sch = ally.schedule;
  const onIdx = sch.map((d,i)=>d.on?i:-1).filter(i=>i>=0); // DAYS index: 0=Mon..6=Sun
  if(onIdx.length===0) return 'Not currently available';
  const on = sch.filter(d=>d.on);
  const sameHours = on.every(d=>d.all24===on[0].all24 && d.start===on[0].start && d.end===on[0].end);
  const hoursLabel = on[0].all24 ? '24 hours' : `${formatTime12(on[0].start)}–${formatTime12(on[0].end)}`;
  if(!sameHours) return 'Varies by day — ask when you reach out';
  const isWeekend = onIdx.length===2 && onIdx.includes(5) && onIdx.includes(6);
  const isWeekday = onIdx.length===5 && !onIdx.includes(5) && !onIdx.includes(6);
  if(onIdx.length===7) return on[0].all24 ? 'Available 24 hours, every day' : `Every day, ${hoursLabel}`;
  if(isWeekend) return `Weekends, ${hoursLabel}`;
  if(isWeekday) return `Weekdays, ${hoursLabel}`;
  return `${onIdx.length} days/week, ${hoursLabel}`;
}
function boltIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>';
}
function dropletIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11z"/></svg>';
}
const SERVICE_ICONS = { 'Towing': boatIcon, 'Jump Start': boltIcon, 'Dewatering': dropletIcon };

// Roughly the lower-48: used as the default "browse the whole map" view,
// and as a fallback if a device's viewport is unusually shaped.
const US_BOUNDS = L.latLngBounds([[24.5, -125], [49.5, -66.9]]);

let findMapInstance = null, findMarkersLayer = null;
function ensureFindMap(){
  if(findMapInstance) return findMapInstance;
  findMapInstance = L.map('findMap', {scrollWheelZoom:false});
  L.tileLayer(OSM_TILE_URL, {maxZoom:19, attribution:OSM_ATTRIBUTION}).addTo(findMapInstance);
  findMarkersLayer = L.layerGroup().addTo(findMapInstance);
  return findMapInstance;
}

function allyPopupHtml(a){
  const availableNow = isAvailableNow(a);
  const actions = availableNow ? [
    a.contact.includes('call') ? `<a class="call" href="tel:${a.phone}">${phoneIcon()} Call</a>` : '',
    a.contact.includes('text') ? `<a class="text" href="sms:${a.phone}">${textIcon()} Text</a>` : '',
  ].join('') : '';
  const contactSection = availableNow
    ? `<div class="ap-chip-label" style="margin-top:10px;">Ways to reach ${a.name.split(' ')[0]}</div>
       <div class="ap-actions">${actions}</div>`
    : `<div class="note" style="margin-top:10px;">Contact info is hidden while off-hours &mdash; ${formatWaitLabel(a).toLowerCase()}, or look for another Ally showing green nearby.</div>`;
  return `<div class="ally-popup">
    <div class="ap-head">
      <div class="ap-avatar" style="background:${a.color}">${a.photoUrl ? `<img src="${a.photoUrl}" alt="${a.name}">` : a.initials}</div>
      <div class="ap-id">
        <div class="ap-name">${a.name}</div>
        <span class="ap-badge">Aqua-Tow Ally</span>
      </div>
    </div>
    <div class="ap-disclaimer">Listed after purchasing an Aqua-Tow kit &mdash; not certified or vetted by Aqua-Tow.</div>
    ${a.bio ? `<div class="ap-bio">${a.bio}</div>` : ''}
    <div class="ap-divider"></div>
    <div class="ap-row">${clockIcon()}<div><b>Typically available</b><span>${allySchedulePhrase(a)}</span></div></div>
    <div style="margin-top:6px;font-weight:700;font-size:.82rem;color:${availableNow ? 'var(--good)' : 'var(--pending)'};">${availableNow ? 'Available now' : formatWaitLabel(a)}</div>
    <div class="ap-chip-label">Services offered</div>
    <div class="ap-chips">${servicesForKits(a.kits).map(s=>`<span class="ap-chip">${(SERVICE_ICONS[s]||boatIcon)()} ${s}</span>`).join('')}</div>
    ${contactSection}
    ${typeof a.dist === 'number' ? `<div class="ap-dist">${a.dist.toFixed(1)} mi away &middot; ${a.label}</div>` : `<div class="ap-dist">${a.label}</div>`}
    <div class="ap-foot">Towing help is arranged directly between you and this Ally &mdash; not through Aqua-Tow.</div>
  </div>`;
}

// --- selected-ally detail card ---------------------------------------
// A Leaflet popup is confined inside the map's own box (.map-wrap has a
// fixed aspect-ratio and overflow:hidden), which on a phone-sized map is
// often shorter than a full Ally card — cutting contact info off with no
// way to scroll to see it. Instead, tapping a pin renders the same details
// into a normal element right below the map, which scrolls with the rest
// of the page and has no height limit at all.
function allySelectedCardHtml(a){
  return `<button type="button" class="ally-detail-close" id="allyDetailCloseBtn" aria-label="Close">&times;</button>${allyPopupHtml(a)}`;
}
function showSelectedAlly(a){
  const card = document.getElementById('selectedAllyCard');
  card.innerHTML = allySelectedCardHtml(a);
  card.style.display = 'block';
  document.getElementById('allyDetailCloseBtn').addEventListener('click', hideSelectedAlly);
  card.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function hideSelectedAlly(){
  document.getElementById('selectedAllyCard').style.display = 'none';
}
function addAllyMarker(a){
  const marker = L.marker([a.lat, a.lng], {icon: pinDivIcon(pinColorFor(a))}).addTo(findMarkersLayer);
  marker.on('click', ()=>showSelectedAlly(a));
  return marker;
}

// Default landing view: the whole map, every active Ally pinned, so someone
// can just pan and zoom to their own stretch of water before ever searching.
function renderAllAlliesOverview(){
  document.getElementById('findMap').style.display = 'block';
  document.getElementById('findMapCaption').style.display = 'block';
  document.getElementById('showAllRow').style.display = 'none';
  document.getElementById('results').innerHTML = '';
  hideSelectedAlly();
  document.getElementById('statusLine').textContent = 'Showing every active Ally — pan and zoom the map, or tap a pin for details.';
  const map = ensureFindMap();
  findMarkersLayer.clearLayers();
  ALLIES.forEach(a=>{ addAllyMarker(a); });
  setTimeout(()=>{ map.invalidateSize(); map.fitBounds(US_BOUNDS.pad(0.04)); }, 0);
}

// 200 miles is a hard cap, not just a default zoom level: an Ally farther
// away than this is never shown as a search result at all, no matter how
// few (or zero) Allies are actually nearby. Without this cap, someone
// searching a remote area would see whoever's "closest" even if that's
// 900+ miles off, and could end up calling a total stranger clear across
// the country by mistake. If nobody is within 200 miles, the map still
// zooms out to the full 200-mile view (centered on the searcher) so the
// search visibly worked — it just shows no pins. It zooms in tighter than
// that when Allies are clustered close together, but never tighter than
// the distance needed to include at least the 5 closest ones, so a dense
// area doesn't zoom in so far it hides Allies just a few miles further out.
const SEARCH_ZOOM_MAX_MILES = 200;
const SEARCH_ZOOM_MIN_ALLY_COUNT = 5;
const SEARCH_ZOOM_FLOOR_MILES = 5; // don't zoom in so tight the map is useless
const SEARCH_MAX_SHOWN = 10; // never list/pin more than this many at once

function computeZoomRadiusMiles(searchLat, searchLng, allies){
  if(!allies.length) return SEARCH_ZOOM_MAX_MILES;
  const dists = allies.map(a=>haversineMiles(searchLat, searchLng, a.lat, a.lng)).sort((a,b)=>a-b);
  const idx = Math.min(SEARCH_ZOOM_MIN_ALLY_COUNT, dists.length) - 1;
  return Math.max(SEARCH_ZOOM_FLOOR_MILES, Math.min(SEARCH_ZOOM_MAX_MILES, dists[idx]));
}

// Builds a lat/lng box roughly `radiusMiles` out from a center point (69
// miles/degree latitude, adjusted for longitude compression at that latitude)
// — good enough for framing a map view, not for precise geodesy.
function boundsForRadiusMiles(lat, lng, radiusMiles){
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.max(0.15, Math.cos(lat * Math.PI/180)));
  return L.latLngBounds([[lat-latDelta, lng-lngDelta], [lat+latDelta, lng+lngDelta]]);
}

function renderFindMap(searcher, ranked, zoomRadiusMiles){
  const mapEl = document.getElementById('findMap'), capEl = document.getElementById('findMapCaption');
  mapEl.style.display='block'; capEl.style.display='block';
  document.getElementById('showAllRow').style.display = 'block';
  hideSelectedAlly();
  const map = ensureFindMap();
  findMarkersLayer.clearLayers();
  L.marker([searcher.lat, searcher.lng], {icon: meDivIcon(), interactive:false, zIndexOffset:1000}).addTo(findMarkersLayer);
  ranked.forEach(a=>{ addAllyMarker(a); });
  // Always zoom to the computed radius around the search point — even with
  // zero results — so the map visibly moves and confirms the search worked,
  // instead of silently staying on whatever view it had before. Every pin
  // handed in here is already within the 200-mile cap (see showResultsFor),
  // so extending the bounds to include each one is just a safety net for
  // rounding, never a way to pull in someone far outside that range.
  const bounds = boundsForRadiusMiles(searcher.lat, searcher.lng, zoomRadiusMiles);
  ranked.forEach(a=>{ bounds.extend([a.lat, a.lng]); });
  setTimeout(()=>{ map.invalidateSize(); map.fitBounds(bounds.pad(0.05)); }, 0);
}

function showResultsFor(latitude, longitude){
  const status=document.getElementById('statusLine'), results=document.getElementById('results');
  const all = ALLIES.map(a=>({...a, dist:haversineMiles(latitude,longitude,a.lat,a.lng)}))
                     .sort((a,b)=>a.dist-b.dist);
  // Hard 200-mile cap: an Ally farther away than this is never shown as a
  // result, available or not — see the SEARCH_ZOOM_MAX_MILES comment above.
  const withinRange = all.filter(a=>a.dist <= SEARCH_ZOOM_MAX_MILES);
  // Within that range, show the closest Allies regardless of whether
  // they're available right now — someone who breaks down overnight needs
  // to see everyone nearby and how long each one's wait is, not just
  // whoever happens to be on-hours this minute. Contact info stays hidden
  // for anyone currently off-hours (see allyPopupHtml / the result cards
  // below); the map pin color (green/red) is the at-a-glance signal for who
  // to reach out to right now.
  const ranked = withinRange.slice(0, SEARCH_MAX_SHOWN);
  const availableCount = ranked.filter(isAvailableNow).length;
  status.textContent = ranked.length
    ? (availableCount ? `${availableCount} of the ${ranked.length} closest Allies (within ${SEARCH_ZOOM_MAX_MILES} mi) are available right now:` : `No Allies within ${SEARCH_ZOOM_MAX_MILES} mi are available right now — here's who's closest and when they're back:`)
    : `No Allies within ${SEARCH_ZOOM_MAX_MILES} miles yet.`;
  const zoomRadius = computeZoomRadiusMiles(latitude, longitude, withinRange);
  renderFindMap({lat:latitude,lng:longitude}, ranked, zoomRadius);
  results.innerHTML = ranked.map(a=>{
    const availableNow = isAvailableNow(a);
    return `
    <div class="result">
      <div class="badge-pin" style="background:${pinColorFor(a)}">${a.initials}</div>
      <div class="info">
        <b>${a.name}</b>
        <span>${a.label}</span>
        <div>
          ${servicesForKits(a.kits).map(s=>`<span class="chip">${s}</span>`).join('')}
          <span class="chip hours" style="${availableNow ? '' : 'background:color-mix(in srgb, var(--pending) 12%, transparent);color:var(--pending);'}">${availableNow ? 'Available now' : formatWaitLabel(a)}</span>
        </div>
        ${a.bio ? `<div class="bio">${a.bio}</div>` : ''}
        ${availableNow ? '' : `<div class="bio" style="font-style:normal;">Contact info hidden while off-hours.</div>`}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <div class="dist">${a.dist.toFixed(1)} mi</div>
        <div class="actions">
          ${availableNow && a.contact.includes('call') ? `<a href="tel:${a.phone}" title="Call">${phoneIcon()}</a>` : ''}
          ${availableNow && a.contact.includes('text') ? `<a href="sms:${a.phone}" title="Text">${textIcon()}</a>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('locateBtn').addEventListener('click', ()=>{
  const btn=document.getElementById('locateBtn'), status=document.getElementById('statusLine'), results=document.getElementById('results');
  const noteEl = document.getElementById('areaSearchNote');
  btn.disabled=true; status.textContent='Locating…'; results.innerHTML=''; noteEl.style.display='none';
  if(!navigator.geolocation){ status.textContent='Location isn’t available in this browser — try searching your city, state or ZIP below instead.'; btn.disabled=false; return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    showResultsFor(pos.coords.latitude, pos.coords.longitude);
    btn.disabled=false;
  }, err=>{
    status.textContent = 'Couldn’t get your location (often blocked in this preview, or permission was denied) — try searching your city, state or ZIP below instead.';
    btn.disabled=false;
  });
});

async function runAreaSearch(){
  const input = document.getElementById('areaSearchInput'), noteEl = document.getElementById('areaSearchNote');
  const btn = document.getElementById('areaSearchBtn'), status = document.getElementById('statusLine');
  const query = input.value;
  if(!query.trim()) return;
  noteEl.style.display='none';
  btn.disabled = true; const prevLabel = btn.textContent; btn.textContent = 'Searching…';
  status.textContent = `Looking up "${query.trim()}"…`;
  const hit = await geocodeArea(query);
  btn.disabled = false; btn.textContent = prevLabel;
  if(!hit || hit.error){
    noteEl.style.display='block';
    noteEl.textContent = hit && hit.error
      ? 'Couldn’t reach the location lookup right now — try again in a moment, or use "Use my location" instead.'
      : `Couldn’t find "${query.trim()}" — double-check the spelling, or try a nearby city, state or ZIP.`;
    status.textContent = 'Showing every active Ally — pan and zoom the map, or tap a pin for details.';
    return;
  }
  noteEl.style.display='none';
  showResultsFor(hit.lat, hit.lng);
}
document.getElementById('areaSearchBtn').addEventListener('click', runAreaSearch);
document.getElementById('showAllBtn').addEventListener('click', e=>{ e.preventDefault(); renderAllAlliesOverview(); });

// Land on the full, zoomed-out map with every active Ally pinned — no search
// or location prompt required before someone can start panning around.
// Allies now load from Airtable first (see loadAlliesFromAirtable above),
// so the map/roster only render once that fetch resolves.
document.getElementById('statusLine').textContent = 'Loading Allies…';
loadAlliesFromAirtable().then(()=>{
  renderAllAlliesOverview();
  if(!ALLIES.length){
    document.getElementById('statusLine').textContent = 'No active Allies to show right now — check back soon.';
  }
});
document.getElementById('areaSearchInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); runAreaSearch(); } });

// A profile picture is now required for every Ally (Luke's call, 2026-09-24)
// — the old "AI avatar" / "skip for now" options are gone from the form, and
// selectedPhoto/photoType are always 'upload'/'Own Photo' going forward.
// existingPhotoUrl tracks whether the profile being edited already has a real
// photo on file in Airtable, so someone updating their hours later isn't
// forced to re-upload a photo they already have — only a brand-new profile,
// or an existing one that's never actually had a photo, must attach one.
let joinLat=null, joinLng=null, selectedPhoto='upload', existingPhotoUrl='';

document.querySelectorAll('#kitsPrefRow .check-opt').forEach(o=>o.addEventListener('click',()=>{
  const selCount = document.querySelectorAll('#kitsPrefRow .check-opt.sel').length;
  if(o.classList.contains('sel') && selCount===1) return; // keep at least one kit selected
  o.classList.toggle('sel');
}));

document.querySelectorAll('#contactPrefRow .check-opt').forEach(o=>o.addEventListener('click',()=>{
  const selCount = document.querySelectorAll('#contactPrefRow .check-opt.sel').length;
  if(o.classList.contains('sel') && selCount===1) return; // keep at least one method selected
  o.classList.toggle('sel');
}));

// --- availability schedule builder ---
const dayRowsEl = document.getElementById('dayRows');
const sameEveryDayEl = document.getElementById('sameEveryDay');
const masterScheduleEl = document.getElementById('masterSchedule');
const masterStartEl = document.getElementById('masterStart');
const masterEndEl = document.getElementById('masterEnd');
const master24El = document.getElementById('master24');

dayRowsEl.innerHTML = DAYS.map(d => `
  <div class="day-row" data-day="${d}">
    <div class="day-toggle sel">${d}</div>
    <div class="day-times">
      <input type="time" class="dStart" value="08:00">
      <span>to</span>
      <input type="time" class="dEnd" value="20:00">
    </div>
    <label class="day-24"><input type="checkbox" class="d24"> 24 hrs</label>
  </div>`).join('');

dayRowsEl.querySelectorAll('.day-row').forEach(row=>{
  row.querySelector('.day-toggle').addEventListener('click', ()=>{
    row.classList.toggle('off');
    row.querySelector('.day-toggle').classList.toggle('sel');
  });
  row.querySelector('.d24').addEventListener('change', e=>{
    row.classList.toggle('allday-on', e.target.checked);
  });
});

master24El.addEventListener('change', ()=>{
  document.querySelector('#masterSchedule .time-row').style.opacity = master24El.checked ? .35 : 1;
  document.querySelector('#masterSchedule .time-row').style.pointerEvents = master24El.checked ? 'none' : 'auto';
});

sameEveryDayEl.addEventListener('change', ()=>{
  if(sameEveryDayEl.checked){
    masterScheduleEl.style.display=''; dayRowsEl.style.display='none';
  } else {
    // seed the per-day rows from the master values as a starting point
    dayRowsEl.querySelectorAll('.day-row').forEach(row=>{
      row.querySelector('.dStart').value = masterStartEl.value;
      row.querySelector('.dEnd').value = masterEndEl.value;
      row.querySelector('.d24').checked = master24El.checked;
      row.classList.toggle('allday-on', master24El.checked);
    });
    masterScheduleEl.style.display='none'; dayRowsEl.style.display='';
  }
});

function collectSchedule(){
  if(sameEveryDayEl.checked){
    return DAYS.map(()=>({on:true, all24:master24El.checked, start:masterStartEl.value, end:masterEndEl.value}));
  }
  return Array.from(dayRowsEl.querySelectorAll('.day-row')).map(row=>({
    on: !row.classList.contains('off'),
    all24: row.querySelector('.d24').checked,
    start: row.querySelector('.dStart').value,
    end: row.querySelector('.dEnd').value,
  }));
}
function scheduleSummary(sch){
  if(sameEveryDayEl.checked){
    return master24El.checked ? 'available 24 hours, every day' : `available every day, ${masterStartEl.value}–${masterEndEl.value}`;
  }
  const onDays = sch.filter(d=>d.on);
  if(onDays.length===0) return 'no available days set';
  return DAYS.filter((d,i)=>sch[i].on).map((d,idx)=>{
    const s = onDays[idx];
    return `${d} ${s.all24 ? '24 hrs' : s.start+'–'+s.end}`;
  }).join(', ');
}

const bioEl = document.getElementById('jBio'), bioCount = document.getElementById('bioCount');
bioEl.addEventListener('input', ()=>{ bioCount.textContent = bioEl.value.length; });

// Reads the chosen file (if any) as a data URL, for sending up to the
// Profile Update webhook as base64 — the browser has no way to hand Airtable
// a plain file, so this is what actually gets a photo into that field.
function readPhotoFileAsDataUrl(){
  const input = document.getElementById('jPhoto');
  const file = input && input.files && input.files[0];
  if(!file) return Promise.resolve(null);
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve({dataUrl: reader.result, filename: file.name});
    reader.onerror = ()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
}
// --- join map: real Leaflet map with a draggable pin ---
let joinMapInstance = null, joinMarker = null;
const JOIN_DEFAULT_CENTER = [35.3, -80.9], JOIN_DEFAULT_ZOOM = 8;

function ensureJoinMap(){
  if(joinMapInstance) return joinMapInstance;
  joinMapInstance = L.map('joinMap', {scrollWheelZoom:false}).setView(JOIN_DEFAULT_CENTER, JOIN_DEFAULT_ZOOM);
  L.tileLayer(OSM_TILE_URL, {maxZoom:19, attribution:OSM_ATTRIBUTION}).addTo(joinMapInstance);
  joinMapInstance.on('click', e=>{ placeJoinPin(e.latlng.lat, e.latlng.lng, false); });
  return joinMapInstance;
}

function placeJoinPin(lat, lng, recenter){
  joinLat = lat; joinLng = lng;
  const map = ensureJoinMap();
  if(!joinMarker){
    joinMarker = L.marker([lat,lng], {icon: pinDivIcon(cssVar('--accent'), 34), draggable:true}).addTo(map);
    joinMarker.on('dragend', ()=>{
      const ll = joinMarker.getLatLng(); joinLat=ll.lat; joinLng=ll.lng;
      const note=document.getElementById('geoNote'); note.textContent='Pin placed — drag it, or tap elsewhere on the map, to fine-tune.'; note.style.color='var(--good)';
    });
  } else {
    joinMarker.setLatLng([lat,lng]);
  }
  if(recenter) map.setView([lat,lng], 11);
  const note=document.getElementById('geoNote'); note.textContent='Pin placed — drag it, or tap elsewhere on the map, to fine-tune.'; note.style.color='var(--good)';
}

document.getElementById('jAreaBtn').addEventListener('click', async ()=>{
  const input = document.getElementById('jAreaInput'), note=document.getElementById('geoNote'), btn=document.getElementById('jAreaBtn');
  const query = input.value;
  if(!query.trim()) return;
  btn.disabled = true; const prevLabel = btn.textContent; btn.textContent = 'Finding…';
  note.textContent = 'Looking that up…'; note.style.color='';
  const hit = await geocodeArea(query);
  btn.disabled = false; btn.textContent = prevLabel;
  if(!hit || hit.error){
    note.textContent = hit && hit.error
      ? 'Couldn’t reach the location lookup right now — try again, or tap the map to drop a pin instead.'
      : `Couldn't find "${query.trim()}" — try a nearby city, state or ZIP, or tap the map to drop a pin instead.`;
    note.style.color='var(--pending)';
    return;
  }
  note.style.color='';
  placeJoinPin(hit.lat, hit.lng, true);
});
document.getElementById('jAreaInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); document.getElementById('jAreaBtn').click(); } });

document.getElementById('jGeoBtn').addEventListener('click', ()=>{
  const note=document.getElementById('geoNote');
  note.textContent='Locating…'; note.style.color='';
  navigator.geolocation.getCurrentPosition(pos=>{
    placeJoinPin(pos.coords.latitude, pos.coords.longitude, true);
  }, ()=>{ note.textContent='Couldn’t capture your location (permission denied, or unavailable) — search your area above or tap the map to drop a pin.'; note.style.color='var(--pending)'; });
});

// Leaflet needs a visible, correctly-sized container to lay tiles out — the Join
// map only becomes visible when its tab is opened, so (re)size it each time.
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click', ()=>{
  if(t.dataset.tab==='join'){
    ensureJoinMap();
    setTimeout(()=>joinMapInstance.invalidateSize(), 0);
  }
  if(t.dataset.tab==='find' && findMapInstance){
    setTimeout(()=>findMapInstance.invalidateSize(), 0);
  }
}));
// ===================================================================
// Become-an-Ally: buy first, then edit forever via a private link
// ===================================================================
// The flow, end to end:
//   1. Someone buys the Tow System, Jump Kit, Pump Kit, or the Full Recovery
//      Kit bundle (external — not yet wired up; see the "Shop Aqua-Tow
//      kits" link below).
//   2. A Make.com scenario watching that purchase creates one row in the
//      Aqua-Tow Allies Airtable base, generates a random "Edit Token", sets
//      Status to "Verified & Live" (the purchase itself IS the
//      verification now — no manual order-number check), and emails the
//      buyer a link back to this page: https://<your-domain>/allies?ally=<token>
//   3. Opening that link loads this "How to Become an Ally" tab straight
//      into their own profile form, prefilled with whatever's already on
//      file (blank the first time), pulled via PROFILE_LOOKUP_WEBHOOK.
//   4. Saving changes POSTs to PROFILE_UPDATE_WEBHOOK, which finds the
//      Airtable row by Edit Token and updates it. Same link works forever —
//      there's no login, the token in the URL IS the credential, so treat
//      it like a password (don't post it publicly, do let people re-request
//      it if lost).
//
// Live Make.com scenarios (both built + tested 2026-09-21):
//   - "Aqua-Tow Ally Profile Lookup"  — GET ?token=... → JSON fields, or 404
//   - "Aqua-Tow Ally Profile Update"  — POST token + fields → updates the
//     Airtable row, responds {"success":true} (200) or {"error":...} (404)
// Both scenarios need to be toggled ON (Immediately as data arrives) in
// Make.com for these to work live. Luke upgraded off the Free tier's
// 2-active-scenario cap on 2026-09-24, so these two can now run alongside
// "Aqua-Tow Allies Map Feed" (the scenario that feeds the public map below)
// without juggling which ones are switched on.
const PROFILE_LOOKUP_WEBHOOK = 'https://hook.us2.make.com/1otpbfx45vpb4ds2i8vrj7okjg7ny8pt';
const PROFILE_UPDATE_WEBHOOK = 'https://hook.us2.make.com/eaue84ss6pkidiyer546rr1nswc09ehj';

function hoursStringFor(dayEntry){
  if(!dayEntry.on) return 'Off';
  if(dayEntry.all24) return '24 hours';
  return `${dayEntry.start}-${dayEntry.end}`;
}
function parseHoursString(s){
  if(!s || s==='Off') return {on:false, all24:false, start:'08:00', end:'20:00'};
  if(s==='24 hours') return {on:true, all24:true, start:'', end:''};
  const [start,end] = s.split('-');
  return {on:true, all24:false, start: start||'08:00', end: end||'20:00'};
}
const PHOTO_TYPE_LABELS = { upload: 'Own Photo', ai: 'AI Avatar', skip: 'None (initials only)' };
const PHOTO_LABEL_TO_KEY = { 'Own Photo':'upload', 'AI Avatar':'ai', 'None (initials only)':'skip' };
const CONTACT_METHOD_LABELS = { call: 'Call', text: 'Text' };
const CONTACT_LABEL_TO_VAL = { Call: 'call', Text: 'text' };

// Leftover client-side test-profile shim from before Allies were wired up to
// Airtable — kept only as a safety net for a hand-typed demo token. ALLIES
// is empty at the moment this file runs (it's only populated later, once
// loadAlliesFromAirtable() resolves), so this stays permanently empty in
// production and every real editToken correctly falls through to the live
// PROFILE_LOOKUP_WEBHOOK/PROFILE_UPDATE_WEBHOOK path below.
const TEST_PROFILES = {};
ALLIES.forEach(a=>{
  if(!a.editToken) return;
  TEST_PROFILES[a.editToken] = {
    fullName: a.name,
    orderNumber: a.orderNumber || '',
    kitPurchased: kitsLabel(a.kits),
    phone: a.phone,
    contactMethods: a.contact.map(c=>CONTACT_METHOD_LABELS[c] || c),
    locationLabel: a.label,
    latitude: a.lat,
    longitude: a.lng,
    hoursMon: hoursStringFor(a.schedule[0]),
    hoursTue: hoursStringFor(a.schedule[1]),
    hoursWed: hoursStringFor(a.schedule[2]),
    hoursThu: hoursStringFor(a.schedule[3]),
    hoursFri: hoursStringFor(a.schedule[4]),
    hoursSat: hoursStringFor(a.schedule[5]),
    hoursSun: hoursStringFor(a.schedule[6]),
    bio: a.bio || '',
    photoType: PHOTO_TYPE_LABELS[a.photoType || 'skip'] || 'None (initials only)'
  };
});

function populateSchedule(hoursArr){
  const parsed = hoursArr.map(parseHoursString);
  const allSame = parsed.every(d=> d.on===parsed[0].on && d.all24===parsed[0].all24 && d.start===parsed[0].start && d.end===parsed[0].end);
  if(allSame && parsed[0].on){
    sameEveryDayEl.checked = true;
    master24El.checked = parsed[0].all24;
    masterStartEl.value = parsed[0].start || '08:00';
    masterEndEl.value = parsed[0].end || '20:00';
    masterScheduleEl.style.display=''; dayRowsEl.style.display='none';
    const timeRow = document.querySelector('#masterSchedule .time-row');
    timeRow.style.opacity = master24El.checked ? .35 : 1;
    timeRow.style.pointerEvents = master24El.checked ? 'none' : 'auto';
  } else {
    sameEveryDayEl.checked = false;
    masterScheduleEl.style.display='none'; dayRowsEl.style.display='';
    dayRowsEl.querySelectorAll('.day-row').forEach((row,i)=>{
      const d = parsed[i];
      row.classList.toggle('off', !d.on);
      row.querySelector('.day-toggle').classList.toggle('sel', d.on);
      row.querySelector('.dStart').value = d.start || '08:00';
      row.querySelector('.dEnd').value = d.end || '20:00';
      row.querySelector('.d24').checked = d.all24;
      row.classList.toggle('allday-on', d.all24);
    });
  }
}

function populateForm(data){
  document.getElementById('jName').value = data.fullName || '';
  document.getElementById('jOrder').value = data.orderNumber || '';
  const ownedKits = data.kitPurchased === 'Full Recovery Kit'
    ? ['Tow System','Jump Kit','Pump Kit']
    : String(data.kitPurchased||'Tow System').split(',').map(s=>s.trim()).filter(Boolean);
  document.querySelectorAll('#kitsPrefRow .check-opt').forEach(o=>o.classList.toggle('sel', ownedKits.includes(o.dataset.val)));
  document.getElementById('jPhone').value = data.phone || '';
  // contactMethods comes back as a real array from TEST_PROFILES, but as a
  // comma-separated string (e.g. "Call, Text") from the live Make.com
  // Profile Lookup scenario — Make's IML can't emit an escaped-quote JSON
  // array, so it serializes the field as plain comma-separated text instead.
  const contactMethodsRaw = Array.isArray(data.contactMethods)
    ? data.contactMethods
    : String(data.contactMethods||'').split(',').map(s=>s.trim()).filter(Boolean);
  const methods = contactMethodsRaw.map(m=>CONTACT_LABEL_TO_VAL[m] || String(m).toLowerCase());
  document.querySelectorAll('#contactPrefRow .check-opt').forEach(o=>o.classList.toggle('sel', methods.includes(o.dataset.val)));
  populateSchedule([data.hoursMon,data.hoursTue,data.hoursWed,data.hoursThu,data.hoursFri,data.hoursSat,data.hoursSun]);
  document.getElementById('jAreaInput').value = data.locationLabel || '';
  if(typeof data.latitude === 'number' && typeof data.longitude === 'number'){
    ensureJoinMap();
    placeJoinPin(data.latitude, data.longitude, true);
  }
  document.getElementById('jBio').value = data.bio || '';
  document.getElementById('bioCount').textContent = (data.bio||'').length;
  existingPhotoUrl = firstAttachmentUrl(data.Photo) || '';
  const photoNote = document.getElementById('photoExistingNote');
  if(existingPhotoUrl){
    photoNote.style.display = 'block';
    photoNote.textContent = "You already have a photo on file — only choose a new one below if you'd like to replace it.";
  } else {
    photoNote.style.display = 'none';
  }
}

let currentEditToken = null;

function showGate(){
  document.getElementById('joinGate').style.display = 'block';
  document.getElementById('joinCard').style.display = 'none';
}
function showProfileForm(){
  document.getElementById('joinGate').style.display = 'none';
  document.getElementById('joinCard').style.display = 'block';
}

async function loadProfileByToken(token){
  currentEditToken = token;
  showProfileForm();
  const note = document.getElementById('profileLoadNote');
  note.style.display = 'block';
  note.style.color = ''; note.style.borderColor = '';
  if(TEST_PROFILES[token]){
    populateForm(TEST_PROFILES[token]);
    note.style.color = 'var(--pending)'; note.style.borderColor = 'var(--pending)';
    note.innerHTML = '<b>Test profile</b> — this loaded from a sample record built into the page, not from Airtable. Try editing it and hitting Save to see how the flow feels; nothing here is written back yet.';
    return;
  }
  if(PROFILE_LOOKUP_WEBHOOK === 'YOUR_MAKE_LOOKUP_WEBHOOK_URL'){
    note.style.color = 'var(--pending)'; note.style.borderColor = 'var(--pending)';
    note.innerHTML = '<b>Setup needed:</b> the Make.com lookup automation isn’t connected yet, so this preview can’t pull an existing profile. The form below still works for previewing the layout — wire up PROFILE_LOOKUP_WEBHOOK near the bottom of this file’s script to make it load real data.';
    return;
  }
  note.textContent = 'Loading your profile…';
  try{
    const res = await fetch(`${PROFILE_LOOKUP_WEBHOOK}?token=${encodeURIComponent(token)}`);
    if(!res.ok) throw new Error('lookup failed: ' + res.status);
    const data = await res.json();
    populateForm(data);
    note.style.display = 'none';
  }catch(err){
    console.error(err);
    note.style.color = 'var(--pending)'; note.style.borderColor = 'var(--pending)';
    note.textContent = "Couldn't load your profile from this link. Double-check it was pasted in full, or contact Aqua-Tow if it keeps happening.";
  }
}

document.getElementById('pasteLinkBtn').addEventListener('click', ()=>{
  const raw = document.getElementById('pasteLinkInput').value.trim();
  const note = document.getElementById('pasteLinkNote');
  if(!raw){ note.style.display='block'; note.textContent='Paste the link (or just the code) from your email first.'; return; }
  let token = raw;
  try{ const u = new URL(raw); const p = u.searchParams.get('ally'); if(p) token = p; }catch(_e){ /* not a full URL — treat input as the bare token */ }
  // Load directly instead of reassigning window.location.search — inside
  // GoDaddy's sandboxed Custom Code iframe, this frame's own location isn't
  // a real, reloadable page URL, so a reload-based approach wouldn't work.
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  document.querySelector('.tab[data-tab="join"]').classList.add('active');
  document.getElementById('panel-join').classList.add('active');
  loadProfileByToken(token);
});
document.getElementById('pasteLinkInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); document.getElementById('pasteLinkBtn').click(); } });

document.getElementById('jSubmitBtn').addEventListener('click', async ()=>{
  const name=document.getElementById('jName').value.trim();
  const order=document.getElementById('jOrder').value.trim();
  const phone=document.getElementById('jPhone').value.trim();
  const bio=document.getElementById('jBio').value.trim();
  const locationLabel=document.getElementById('jAreaInput').value.trim() || 'Custom pin location';
  const methods = Array.from(document.querySelectorAll('#contactPrefRow .check-opt.sel')).map(o=>CONTACT_METHOD_LABELS[o.dataset.val] || o.dataset.val);
  const selectedKits = Array.from(document.querySelectorAll('#kitsPrefRow .check-opt.sel')).map(o=>o.dataset.val);
  const schedule = collectSchedule();
  const statusNote = document.getElementById('saveStatusNote');
  statusNote.style.display = 'none';
 if(!name){ statusNote.style.display='block'; statusNote.textContent='Please enter your name.'; return; }
if(selectedKits.length===0){ statusNote.style.display='block'; statusNote.textContent='Please select at least one kit you own.'; return; }
if(methods.length===0){ statusNote.style.display='block'; statusNote.textContent='Please choose at least one way to be contacted.'; return; }
if(schedule.every(d=>!d.on)){ statusNote.style.display='block'; statusNote.textContent='Please set at least one available day.'; return; }
if(joinLat===null || joinLng===null){ statusNote.style.display='block'; statusNote.textContent='Please set your rough location on the map first.'; return; }
if(!currentEditToken){ statusNote.style.display='block'; statusNote.textContent="Something's off — this page doesn't have your profile link's code. Try opening your email link again."; return; }
  const jPhotoInput = document.getElementById('jPhoto');
  const hasNewPhotoFile = jPhotoInput && jPhotoInput.files && jPhotoInput.files[0];
  // Photo upload is optional for now (Luke's call, 2026-09-26) — the photo-
      // upload feature is on hold while an Airtable-side upload issue gets
      // sorted out, so this no longer blocks saving a profile.
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  let photoFile = null;
  if(hasNewPhotoFile){
    try{ photoFile = await readPhotoFileAsDataUrl(); }
    catch(e){
      console.error('Could not read photo file:', e);
      submitBtn.disabled = false; submitBtn.textContent = 'Save my profile';
      statusNote.style.display = 'block';
      statusNote.style.color = 'var(--pending)'; statusNote.style.borderColor = 'var(--pending)';
      statusNote.textContent = "Couldn't read that photo file — try a different image, or try again.";
      return;
    }
  }

  const payload = {
    editToken: currentEditToken,
    fullName: name,
    orderNumber: order,
    kitPurchased: kitsLabel(selectedKits),
    phone: phone,
    contactMethods: methods,
    locationLabel: locationLabel,
    latitude: joinLat,
    longitude: joinLng,
    hoursMon: hoursStringFor(schedule[0]),
    hoursTue: hoursStringFor(schedule[1]),
    hoursWed: hoursStringFor(schedule[2]),
    hoursThu: hoursStringFor(schedule[3]),
    hoursFri: hoursStringFor(schedule[4]),
    hoursSat: hoursStringFor(schedule[5]),
    hoursSun: hoursStringFor(schedule[6]),
    bio: bio,
    photoType: PHOTO_TYPE_LABELS[selectedPhoto] || 'Own Photo'
  };
  // Only sent when a new file was actually chosen — see the Make.com
  // "Aqua-Tow Ally Profile Update" scenario for how this base64 payload gets
  // turned into a real Airtable attachment on the Photo field.
  if(photoFile){ payload.photoBase64 = photoFile.dataUrl; payload.photoFilename = photoFile.filename; }

  if(TEST_PROFILES[currentEditToken]){
    setTimeout(()=>{
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save my profile';
      statusNote.style.display = 'block';
      statusNote.style.color = 'var(--pending)'; statusNote.style.borderColor = 'var(--pending)';
      statusNote.innerHTML = `<b>Looks good (test mode)</b> — this is a sample profile, so nothing was actually written to Airtable. You'd be reachable by <b>${methods.join(' and ')}</b> — ${scheduleSummary(schedule)} — once this is connected to real data.`;
    }, 300);
    return;
  }

  if(PROFILE_UPDATE_WEBHOOK === 'YOUR_MAKE_UPDATE_WEBHOOK_URL'){
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save my profile';
    statusNote.style.display = 'block';
    statusNote.style.color = 'var(--pending)'; statusNote.style.borderColor = 'var(--pending)';
    statusNote.innerHTML = '<b>Setup needed:</b> the Make.com save automation isn’t connected yet, so this won’t persist. Wire up PROFILE_UPDATE_WEBHOOK near the bottom of this file’s script.';
    return;
  }

  fetch(PROFILE_UPDATE_WEBHOOK, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  }).then(res => {
    if(!res.ok) throw new Error('Webhook responded with ' + res.status);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save my profile';
    statusNote.style.display = 'block';
    statusNote.style.color = 'var(--good)'; statusNote.style.borderColor = 'var(--good)';
    statusNote.innerHTML = `<b>Saved.</b> You're reachable by <b>${methods.join(' and ')}</b> — ${scheduleSummary(schedule)}. Come back to this same link anytime to update your profile.`;
  }).catch(err => {
    console.error(err);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save my profile';
    statusNote.style.display = 'block';
    statusNote.style.color = 'var(--pending)'; statusNote.style.borderColor = 'var(--pending)';
    statusNote.textContent = "Something went wrong saving your profile. Please check your internet connection and try again, or contact Aqua-Tow directly.";
  });
});

// GoDaddy's "Custom Code" embed widget renders this whole page inside a
// sandboxed iframe (loaded via a javascript:/srcdoc URL, not a normal page
// load) — so window.location.search here is ALWAYS empty, even though the
// real browser address bar has the ?ally=<token> the customer actually
// clicked. The real query string lives on the parent (top-level) page
// instead. Same-origin, so window.parent.location is reachable; fall back to
// this frame's own location if that ever isn't true (e.g. previewing this
// file directly, outside any iframe).
function getPageSearchParams(){
  try{
    if(window.parent && window.parent !== window && window.parent.location && window.parent.location.search){
      return new URLSearchParams(window.parent.location.search);
    }
  }catch(e){ /* cross-origin parent — fall back below */ }
  return new URLSearchParams(window.location.search);
}

// Land straight on a person's own profile if they arrived via their emailed
// link (…?ally=<token>) — otherwise show the "buy first" gate.
(function initBecomeAllyGate(){
  const token = getPageSearchParams().get('ally');
  if(token){
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    document.querySelector('.tab[data-tab="join"]').classList.add('active');
    document.getElementById('panel-join').classList.add('active');
    // Landing here directly via a link skips the normal .tab click handler
    // (further down this file) that would otherwise initialize the join map
    // — so without this, a brand-new Ally with no saved pin yet (every
    // first-time signup, before populateForm() has real coordinates to drop
    // a pin at) sees a permanently blank map box with nothing responding to
    // clicks or drags.
    ensureJoinMap();
    setTimeout(()=>{ if(joinMapInstance) joinMapInstance.invalidateSize(); }, 0);
    loadProfileByToken(token);
  } else {
    showGate();
  }
})();


// ===================================================================
// Site-wide Terms & Conditions gate + Ally waiver gate (added v3.6,
// 2026-09-24, appended below the existing code above rather than editing
// it in place — see the HTML file's version-history comment for why).
// ===================================================================
// Blocks the whole page behind a click-to-accept overlay for EVERY visitor
// (not just people signing up as an Ally) — Luke asked for this so nobody
// can use the Find/Join/How pages without first seeing the "Aqua-Tow
// doesn't verify Allies and isn't liable" disclosure. Uses localStorage so
// a returning visitor on the same browser isn't shown it every single
// visit. IMPORTANT: inside GoDaddy's sandboxed Custom Code iframe,
// localStorage may be partitioned or blocked entirely — if writing/reading
// it throws or silently doesn't persist, this safely just shows the gate
// again on the next visit rather than skipping it. That's the correct
// failure direction for a liability disclosure (fail closed, not open).
const TERMS_STORAGE_KEY = 'aquaTowTermsAccepted_v1';
function termsAlreadyAccepted(){
  try{ return localStorage.getItem(TERMS_STORAGE_KEY) === 'yes'; }catch(e){ return false; }
}
function markTermsAccepted(){
  try{ localStorage.setItem(TERMS_STORAGE_KEY, 'yes'); }catch(e){ }
}
function showTermsGate(){
  const overlay = document.getElementById('tcOverlay');
  if(!overlay) return;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function hideTermsGate(){
  const overlay = document.getElementById('tcOverlay');
  if(!overlay) return;
  overlay.style.display = 'none';
  document.body.style.overflow = '';
}
(function initTermsGate(){
  const overlay = document.getElementById('tcOverlay');
  if(!overlay) return;
  if(termsAlreadyAccepted()){ hideTermsGate(); return; }
  showTermsGate();
  const acceptBtn = document.getElementById('tcAccept');
  const declineBtn = document.getElementById('tcDecline');
  if(acceptBtn) acceptBtn.addEventListener('click', ()=>{
    markTermsAccepted();
    hideTermsGate();
  });
  if(declineBtn) declineBtn.addEventListener('click', ()=>{
    const modal = overlay.querySelector('.tc-modal');
    if(modal){
      modal.innerHTML = '<h2>Terms Required</h2><div class="tc-body"><p>You will need to accept these terms to use Aqua-Tow Allies. You are welcome to come back anytime.</p></div><div class="tc-actions"><a class="tc-accept" style="text-decoration:none;display:flex;align-items:center;justify-content:center;" href="https://aqua-tow.com" target="_top">Return to Aqua-Tow</a></div>';
    }
  });
})();

// Ally waiver gate: a CAPTURING listener on the existing Save button that
// runs BEFORE that button's own save handler (defined earlier in this
// file) and can block the save entirely, without editing that handler.
(function initWaiverGate(){
  const submitBtn = document.getElementById('jSubmitBtn');
  if(!submitBtn) return;
  submitBtn.addEventListener('click', function(e){
    const waiverBox = document.getElementById('jWaiverAccept');
    if(!waiverBox || !waiverBox.checked){
      e.preventDefault();
      e.stopImmediatePropagation();
      const statusNote = document.getElementById('saveStatusNote');
if(statusNote){ statusNote.style.display='block'; statusNote.textContent="Please check the box confirming you have read and agree to the Aqua-Tow Ally Release and Waiver of Liability before saving your profile."; }
      const row = waiverBox && waiverBox.closest('.waiver-row');
      if(row) row.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }, true);
})();

// Lets the waiver link text (not just the arrow) open the full waiver text.
document.getElementById('waiverToggleLink')?.addEventListener('click', e=>{
  e.preventDefault();
  const d = document.getElementById('waiverDetails');
  if(d) d.open = !d.open;
});
