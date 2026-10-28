/* =====================================================================
   DockReady Assessment — Aqua-Tow Waterfront Readiness
   ---------------------------------------------------------------------
   Lives on GitHub (aqua-tow/aqua-tow-allies), served via jsDelivr, and
   loaded by the GoDaddy Custom Code block on aqua-tow.com/readiness
   (see readiness-embed.html). The embed holds the styles and an empty
   <div id="dr-app">; this file builds every screen into it.

   To change wording, questions, actions or video IDs, edit DR_CONTENT
   below. After ANY change here, bump the ?v= on the <script src> in the
   GoDaddy embed, or visitors keep the cached old copy for up to a week.

   On submit, the full assessment is POSTed to the Make.com scenario
   "Waterfront Readiness – DockReady Lead", which saves it to the Airtable
   base "Aqua-Tow Waterfront Readiness" (table "Leads") and emails Luke.
   ===================================================================== */
(function () {
  'use strict';

  var WEBHOOK_URL = 'https://hook.us2.make.com/ljy9lihstikujs4fv9ebe551jjo1ocul';
  // Where the "Book a free 15-minute call" button goes. Swap for a
  // calendar link (Calendly, Outlook bookings, etc.) once there is one.
  var BOOK_CALL_URL = 'mailto:admin@aqua-tow.com?subject=DockReady%20results%20walkthrough';
  // The tiers and pricing page the "See your options" button opens.
  var PLANS_URL = 'https://aqua-tow.com/readiness-plans';

  // ------------------------------------------------------------------
  // CONTENT
  // ------------------------------------------------------------------
  var DR_CONTENT = {
    profile: [
      { key: 'businessType', label: 'What kind of waterfront business are you?',
        options: ['Resort / lodge', 'Marina', 'Campground / RV park', 'Boat or PWC rental', 'Charter / guide service', 'Lake association / HOA', 'Other'] },
      { key: 'state', label: 'What state are you in?', type: 'state' },
      { key: 'slips', label: 'How many boat slips or dock spaces?',
        options: ['None', '1–10', '11–50', '51–150', '150+'] },
      { key: 'boatsOut', label: 'How many guest or rental boats go out on a busy day?',
        options: ['None', '1–5', '6–20', '20+'] },
      { key: 'peakStaff', label: 'How many staff on a peak-season day?',
        options: ['1–5', '6–15', '16–40', '40+'] },
      { key: 'seasonalStaff', label: 'How much of your staff is seasonal?',
        options: ['Under 25%', '25–50%', '50–75%', 'Over 75%'] },
      { key: 'writtenPlan', label: 'Do you have a written emergency plan?',
        options: ['Yes, up to date', 'Yes, but outdated', 'No', 'Not sure'] },
      { key: 'lastDrill', label: 'When did your team last practice an emergency drill?',
        options: ['In the last 12 months', '1–3 years ago', 'Never', 'Not sure'] },
      { key: 'recentEmergency', label: 'Have you had a real on-water emergency in the last 3 years?',
        options: ['Yes', 'No', 'Prefer not to say'] }
    ],

    scenarios: [
      {
        key: 'sinking', short: 'Boat sinking at the dock',
        name: 'A boat sinking at your dock',
        gut: 'A boat starts sinking at your dock.',
        title: '“My boat’s sinking at the dock!”',
        line: '“Help — my boat’s sinking at the dock! The back end’s almost under. What do we do?”',
        tag: 'Your newest hire is the one standing here.',
        youtubeId: 'Exx9guAah4Y', youtubeEnd: 52,
        questions: [
          { q: 'Does every staff member know how to safely shut off shore power to a dock before anyone goes near a sinking boat?',
            action: 'Train every staff member to kill dock shore power before anyone approaches a sinking boat.' },
          { q: 'Is there a working dewatering pump on site that staff can get to in under 5 minutes?',
            action: 'Keep a working dewatering pump on site, staged where staff can reach it in under 5 minutes.' },
          { q: 'Is a 24/7 towing and recovery company’s number posted where staff will see it?',
            action: 'Post a 24/7 towing and recovery number where every staff member will see it.' },
          { q: 'Do you keep fuel-spill absorbent pads or boom on site for a boat leaking fuel as it sinks?',
            action: 'Stock fuel-spill absorbent pads and boom on site.' },
          { q: 'Is it written down who pays for and handles removing a sunk boat — owner, insurer, or you — and is that in your slip or rental agreement?',
            action: 'Put who pays for and handles sunk-boat removal in writing — and in your slip and rental agreements.' },
          { q: 'Do you know your state’s deadline for removing a sunken boat, who enforces it, and who gets fined if it’s missed?', expert: true,
            action: 'Learn your state’s sunken-boat removal deadline and who enforces it — before a boat goes down at your dock.' }
        ]
      },
      {
        key: 'overdue', short: 'Overdue boater',
        name: 'A boater who never came back',
        gut: 'A guest or customer doesn’t come back from the water by dark.',
        title: '“He never came back.”',
        line: '“My husband went out fishing this afternoon. He said he’d be back by dark. He’s not answering.”',
        tag: 'It’s dark in 30 minutes.',
        youtubeId: 'GyLT9osvvn0', youtubeEnd: 75,
        questions: [
          { q: 'Do you log when guests or rental boats go out, and when they’re expected back?',
            action: 'Start a simple out / expected-back log for every guest and rental boat.' },
          { q: 'Is there a set time after which staff call for help on an overdue boat, without waiting for a manager?',
            action: 'Set a fixed overdue time when any staff member calls for help — no manager needed.' },
          { q: 'Do staff know exactly who to call for your water — 911, county sheriff water patrol, or the Coast Guard?',
            action: 'Post who to call for your water: 911, sheriff water patrol, or the Coast Guard.' },
          { q: 'Could you give responders the boat’s description, the person’s description, and where they planned to go, within 5 minutes?',
            action: 'Capture boat, person and trip-plan details at check-out so responders get them in minutes.' },
          { q: 'Do you have a clear rule on whether your staff search on their own — and if they do, a boat with lights and a trained operator?',
            action: 'Decide in writing whether staff search — and if so, with what boat, lights and training.' },
          { q: 'Do you know whether your sheriff’s water patrol is actually on duty after dark — and how long it takes them to get a boat on your water at night?', expert: true,
            action: 'Call your sheriff’s water patrol and ask their after-dark response time for your lake. Plan around the real answer.' }
        ]
      },
      {
        key: 'storm', short: 'Storm in 20 minutes',
        name: 'A storm with boats still out',
        gut: 'A severe storm will hit in 20 minutes with boats and guests out.',
        title: '“Storm’s here in 20 minutes.”',
        line: '“Severe thunderstorm warning — 60 mile-an-hour winds, here in 20 minutes. We’ve got eight rentals out and a full beach.”',
        tag: 'Clock starts now.',
        youtubeId: 'BveG1XxudxE', youtubeEnd: 79,
        questions: [
          { q: 'Is one person assigned every day to watch the weather, with alerts that reach them (weather radio, alert app, radar)?',
            action: 'Assign a daily weather watcher, with alerts that actually reach them.' },
          { q: 'Can you reach every rental boat on the water fast — a horn signal, radio, or renters’ phone numbers on file?',
            action: 'Set up a fast recall for rental boats: horn signal, radio, or renters’ phones on file.' },
          { q: 'Do you have a lightning and shelter plan that clears docks, beaches and swim areas?',
            action: 'Write a lightning and shelter plan that clears docks, beaches and swim areas.' },
          { q: 'Is there a checklist for securing docked boats, lifts, and loose gear before high wind?',
            action: 'Create a high-wind checklist for securing boats, lifts and loose gear.' },
          { q: 'After a storm, do you run a headcount to confirm every guest and every boat is accounted for?',
            action: 'Run a post-storm headcount of every guest and every boat.' },
          { q: 'Do your staff know to turn docked boats bow-out, facing open water, before a storm? Waves breaking over a low stern can swamp a boat right at the dock.', expert: true,
            action: 'Before a storm, turn docked boats bow-out toward open water and double up the lines, so waves hit the bow instead of the low stern.' }
        ]
      },
      {
        key: 'fire', short: 'Fire at the fish house',
        name: 'A fire near your docks',
        gut: 'A fire breaks out at your fish-cleaning station or fuel dock.',
        title: '“Fire at the fish house!”',
        line: '“There’s a fire at the fish cleaning house — it’s getting close to the dock!”',
        tag: 'Where’s your nearest extinguisher?',
        youtubeId: '',
        questions: [
          { q: 'Are fire extinguishers mounted at the fish-cleaning station, fuel dock and docks, and inspected in the last 12 months?',
            action: 'Mount and inspect extinguishers at the fish-cleaning station, fuel dock and docks.' },
          { q: 'Has your staff actually been shown how to use a fire extinguisher?',
            action: 'Show every staff member how to use an extinguisher — hands on.' },
          { q: 'Do staff know where the shutoffs are for fuel pumps, propane and dock electrical?',
            action: 'Label the fuel, propane and dock electrical shutoffs, and teach staff where they are.' },
          { q: 'Is there a plan for moving people — and boats, if it’s safe — away from a fire near the docks?',
            action: 'Plan how to clear people — and boats, when safe — away from a dock fire.' },
          { q: 'Could staff give 911 your exact address and which dock or building to come to, without looking it up?',
            action: 'Post your exact 911 address and dock and building names by every phone.' },
          { q: 'Do your staff know that water spreads a gasoline fire — and are the extinguishers near fuel rated for Class B (flammable liquid) fires?', expert: true,
            action: 'Put Class B-rated extinguishers near fuel, and teach staff never to throw water on a fuel fire.' },
          { q: 'If a cabin or the main lodge catches fire, do you have a pump and enough hose to draw lake water and reach it? At a remote camp, the fire department can be a long way out.', expert: true,
            action: 'Get a portable fire pump with enough hose to reach every cabin and the lodge from the water, and train staff to start and run it.' }
        ]
      },
      {
        key: 'water', short: 'Person in the water',
        name: 'Someone in the water',
        gut: 'Someone falls off a dock and doesn’t come back up.',
        title: '“He went in — he’s not coming up!”',
        line: '“He fell in — he’s not coming up!”',
        tag: 'Is it safe to go in that water?',
        youtubeId: '',
        questions: [
          { q: 'Is a throwable flotation device (ring buoy or throw bag) mounted on every dock, and checked regularly?',
            action: 'Mount a throwable flotation device on every dock and check them regularly.' },
          { q: 'Do staff know never to jump in near docks with electrical power until it’s shut off (electric shock drowning risk)?',
            action: 'Teach staff never to enter the water near powered docks until the power is off.' },
          { q: 'Is at least one CPR and first-aid trained person on site every shift?',
            action: 'Have a CPR and first-aid trained person on site every shift.' },
          { q: 'Do you have an AED, and does every staff member know where it is?',
            action: 'Get an AED and make sure every staff member knows where it is.' },
          { q: 'Do your docks have ladders or reach poles so a person can be pulled out or climb out of the water?',
            action: 'Add ladders or reach poles so a person can get out of the water.' },
          { q: 'Do staff know that in cold water the first minute is the deadliest — cold shock makes people gasp and inhale water long before hypothermia sets in?', expert: true,
            action: 'Teach staff the 1-10-1 rule for cold water: 1 minute to control breathing, 10 minutes of useful movement, about 1 hour before hypothermia.' }
        ]
      },
      {
        key: 'airlift', short: 'Medical airlift',
        name: 'A medical helicopter landing',
        // Keep the helicopter out of this line: the gut check should not
        // hint at it. The scenario page reveals it.
        gut: 'A guest has a life-threatening emergency.',
        title: '“They’re sending a helicopter.”',
        line: '“The ambulance is 40 minutes out, so they’re launching a helicopter. Dispatch wants to know where it can land.”',
        tag: 'Everyone’s looking at you.',
        youtubeId: '',
        questions: [
          { q: 'Do you have a pre-chosen helicopter landing zone on or near your property — open, flat, and clear of trees, power lines and poles?', expert: true,
            action: 'Choose a helicopter landing zone with your local air-medical provider — open, flat and clear of wires and trees.' },
          { q: 'Do you know that landing zone’s GPS coordinates (latitude and longitude), and are they posted where staff can read them to dispatch?', expert: true,
            action: 'Write down the landing zone’s GPS coordinates and post them by every phone.' },
          { q: 'Do you know how to mark the landing zone so a pilot can find it — in daylight and at night?', expert: true,
            action: 'Ask your air-medical provider how they want the landing zone marked day and night, and keep that gear ready.' },
          { q: 'Do staff know to clear chairs, umbrellas, towels and loose gear, and keep people well back? Rotor wash turns them into projectiles.',
            action: 'Train staff to clear loose items and keep everyone well back when a helicopter lands.' },
          { q: 'Is someone assigned to meet the ambulance or helicopter crew and lead them straight to the patient?',
            action: 'Assign who meets responders and walks them to the patient.' },
          { q: 'Has your local air-medical service ever visited your property to look at where they would land?', expert: true,
            action: 'Invite your nearest air-medical service out for a landing-zone visit — many offer them to businesses.' }
        ]
      }
    ]
  };

  var STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','Outside the US'];

  var ANSWER_LABELS = { yes: 'Yes', no: 'No', unsure: 'Not sure' };

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  var SCN = DR_CONTENT.scenarios;
  var STEPS = ['welcome', 'profile', 'gut'];
  SCN.forEach(function (_s, i) { STEPS.push('s' + i); });
  STEPS.push('contact', 'results');

  var state = {
    step: 0,
    profile: {},
    conf: {},
    confTouched: {},
    answers: {},
    contact: { name: '', business: '', email: '', phone: '', role: '', walkthrough: false },
    error: ''
  };
  SCN.forEach(function (s) { state.conf[s.key] = 5; state.answers[s.key] = s.questions.map(function () { return null; }); });

  var root = document.getElementById('dr-app');
  if (!root) return;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // GoDaddy renders Custom Code inside a same-origin iframe, so the real
  // ?source=... from the QR code lives on the parent page's URL.
  function getParams() {
    try {
      if (window.parent && window.parent !== window && window.parent.location && window.parent.location.search) {
        return new URLSearchParams(window.parent.location.search);
      }
    } catch (e) { /* cross-origin parent — fall back */ }
    return new URLSearchParams(window.location.search);
  }
  var SOURCE = (getParams().get('source') || '').slice(0, 80);

  // Small vs large property, matching the Service Tiers rule: small is up to
  // 50 slips and up to 15 peak-day staff. Sets the price shown on the plans page.
  function propertySize() {
    var smallSlips = ['None', '1–10', '11–50'].indexOf(state.profile.slips) !== -1;
    var smallStaff = ['1–5', '6–15'].indexOf(state.profile.peakStaff) !== -1;
    return smallSlips && smallStaff ? 'small' : 'large';
  }
  function plansUrl() {
    return PLANS_URL + '?size=' + propertySize() + (SOURCE ? '&source=' + encodeURIComponent(SOURCE) : '');
  }

  function computeResults() {
    // Reality score per scenario = share of Yes answers, on the same 0–10
    // scale as the gut rating. Overall score = average of those, as 0–100.
    // Airtable's "DockReady Score" formula must match this.
    var rows = SCN.map(function (s) {
      var yes = state.answers[s.key].filter(function (a) { return a === 'yes'; }).length;
      var real = Math.round((yes / s.questions.length) * 10);
      var conf = Number(state.conf[s.key]);
      return { s: s, conf: conf, real: real, gap: conf - real };
    });
    var score = Math.round(rows.reduce(function (t, r) { return t + r.real; }, 0) * 100 / (SCN.length * 10));
    var band = score >= 80
      ? { name: 'Ready', note: 'Strong basics. Fine-tune and drill.' }
      : score >= 50
        ? { name: 'Gaps to close', note: 'Some of these would go wrong on a bad day.' }
        : { name: 'Exposed', note: 'A real emergency today would likely be improvised.' };
    var top = rows.slice().sort(function (a, b) { return b.gap - a.gap; })[0];
    var blind = top && top.gap >= 4 ? top : null;
    var lowest = rows.slice().sort(function (a, b) { return a.real - b.real; })[0];
    return { rows: rows, score: score, band: band, blind: blind, lowest: lowest };
  }

  function buildPayload(res) {
    var missed = [], detail = [];
    SCN.forEach(function (s) {
      var gaps = [];
      detail.push(s.name.toUpperCase() + ' (gut ' + state.conf[s.key] + '/10)');
      s.questions.forEach(function (q, i) {
        var a = state.answers[s.key][i];
        detail.push('- ' + q.q + ' → ' + (ANSWER_LABELS[a] || '—'));
        if (a !== 'yes') gaps.push('- ' + q.action + (q.expert ? ' [often missed]' : ''));
      });
      detail.push('');
      if (gaps.length) missed.push(s.name + ':\n' + gaps.join('\n'));
    });
    var p = {
      businessName: state.contact.business,
      contactName: state.contact.name,
      email: state.contact.email,
      phone: state.contact.phone,
      role: state.contact.role,
      wantsWalkthrough: !!state.contact.walkthrough,
      source: SOURCE,
      score: res.score,
      blindSpot: res.blind ? res.blind.s.name : '',
      missedItems: missed.join('\n\n'),
      answerDetail: detail.join('\n').trim()
    };
    DR_CONTENT.profile.forEach(function (f) { p[f.key] = state.profile[f.key] || ''; });
    var map = { sinking: 'Sinking', overdue: 'Overdue', storm: 'Storm', fire: 'Fire', water: 'Water', airlift: 'Airlift' };
    res.rows.forEach(function (r) {
      p['conf' + map[r.s.key]] = r.conf;
      p['real' + map[r.s.key]] = r.real;
    });
    return p;
  }

  function send(payload) {
    try {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function (err) { console.error('DockReady: could not send results', err); });
    } catch (err) { console.error('DockReady: could not send results', err); }
  }

  function scrollTop() {
    try { root.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { window.scrollTo(0, 0); }
  }

  // ------------------------------------------------------------------
  // SCREENS
  // ------------------------------------------------------------------
  function progress() {
    var total = STEPS.length - 2; // exclude welcome + results
    var pct = Math.round((state.step / (total + 1)) * 100);
    return '<div class="dr-progress" aria-hidden="true"><span style="width:' + pct + '%"></span></div>';
  }

  function errorLine() {
    return state.error ? '<p class="dr-error" role="alert">' + esc(state.error) + '</p>' : '';
  }

  function navButtons(nextLabel) {
    return '<div class="dr-nav">' +
      '<button type="button" class="dr-btn dr-btn-ghost" data-act="back">Back</button>' +
      '<button type="button" class="dr-btn dr-btn-primary" data-act="next">' + esc(nextLabel || 'Next') + '</button>' +
      '</div>';
  }

  function screenWelcome() {
    return '<section class="dr-screen dr-welcome">' +
      '<div class="dr-tag">Aqua-Tow Waterfront Readiness</div>' +
      '<h1>How ready is your waterfront, really?</h1>' +
      '<p class="dr-lede">Six real emergencies, shown the way they actually walk through your door. Answer honestly and see where your team is ready — and where it isn’t. Free, about 8 minutes.</p>' +
      '<button type="button" class="dr-btn dr-btn-primary dr-btn-big" data-act="next">Start the check</button>' +
      '<p class="dr-fine">No sales call unless you ask for one. Your results show on screen the moment you finish.</p>' +
      '<p class="dr-cred">Built by Aqua-Tow — 24/7 towing and sunken-boat recovery, working directly with insurers and state agencies.</p>' +
      '</section>';
  }

  function screenProfile() {
    var html = '<section class="dr-screen">' + progress() +
      '<div class="dr-kicker">Step 1 · Your business</div>' +
      '<h2>Tell us about your waterfront.</h2>' +
      '<p class="dr-sub">Quick taps — none of this is scored.</p>';
    DR_CONTENT.profile.forEach(function (f) {
      html += '<fieldset class="dr-field"><legend>' + esc(f.label) + '</legend>';
      if (f.type === 'state') {
        html += '<select class="dr-select" data-profile-select="' + f.key + '"><option value="">Choose a state…</option>' +
          STATES.map(function (st) {
            return '<option' + (state.profile[f.key] === st ? ' selected' : '') + '>' + esc(st) + '</option>';
          }).join('') + '</select>';
      } else {
        html += '<div class="dr-chips">' + f.options.map(function (o) {
          var sel = state.profile[f.key] === o;
          return '<button type="button" class="dr-chip' + (sel ? ' is-sel' : '') + '" aria-pressed="' + sel + '" data-profile="' + f.key + '" data-val="' + esc(o) + '">' + esc(o) + '</button>';
        }).join('') + '</div>';
      }
      html += '</fieldset>';
    });
    return html + errorLine() + navButtons() + '</section>';
  }

  function screenGut() {
    var html = '<section class="dr-screen">' + progress() +
      '<div class="dr-kicker">Step 2 · Gut check</div>' +
      '<h2>First, your gut.</h2>' +
      '<p class="dr-sub">If this happened today — with whoever is working right now — how ready would your team be? <b>1</b> = we’d be lost, <b>10</b> = we’d handle it without thinking.</p>';
    SCN.forEach(function (s) {
      var v = state.conf[s.key];
      html += '<div class="dr-slider">' +
        '<label for="dr-conf-' + s.key + '">' + esc(s.gut) + '</label>' +
        '<div class="dr-slider-row"><input type="range" min="1" max="10" step="1" id="dr-conf-' + s.key + '" data-conf="' + s.key + '" value="' + v + '">' +
        '<output class="dr-slider-val" id="dr-conf-out-' + s.key + '">' + v + '</output></div></div>';
    });
    return html + navButtons('Now let’s see') + '</section>';
  }

  function videoBlock(s) {
    if (s.youtubeId) {
      return '<div class="dr-video"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(s.youtubeId) +
        '?rel=0&playsinline=1&modestbranding=1' + (s.youtubeEnd ? '&end=' + s.youtubeEnd : '') + '" title="' + esc(s.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    }
    return '<div class="dr-video dr-video-ph">' +
      '<div class="dr-ph-badge">Video coming soon</div>' +
      '<p class="dr-ph-line">' + esc(s.line) + '</p>' +
      '<p class="dr-ph-tag">' + esc(s.tag) + '</p>' +
      '</div>';
  }

  function screenScenario(i) {
    var s = SCN[i];
    var html = '<section class="dr-screen">' + progress() +
      '<div class="dr-kicker">Scenario ' + (i + 1) + ' of ' + SCN.length + '</div>' +
      '<h2 class="dr-scn-title">' + esc(s.title) + '</h2>' +
      videoBlock(s) +
      '<h3 class="dr-really">How ready are you, really?</h3>';
    s.questions.forEach(function (q, qi) {
      var a = state.answers[s.key][qi];
      html += '<div class="dr-q' + (q.expert ? ' dr-q-expert' : '') + '">' +
        (q.expert ? '<span class="dr-expert">Often missed</span>' : '') +
        '<p>' + esc(q.q) + '</p><div class="dr-seg" role="group">' +
        ['yes', 'no', 'unsure'].map(function (k) {
          var sel = a === k;
          return '<button type="button" class="dr-seg-btn dr-seg-' + k + (sel ? ' is-sel' : '') + '" aria-pressed="' + sel + '" data-ans="' + s.key + '" data-qi="' + qi + '" data-val="' + k + '">' + ANSWER_LABELS[k] + '</button>';
        }).join('') + '</div></div>';
    });
    return html + errorLine() + navButtons(i === SCN.length - 1 ? 'See my results' : 'Next scenario') + '</section>';
  }

  function screenContact() {
    var c = state.contact;
    function input(id, key, label, type, req, ph) {
      return '<label class="dr-label" for="' + id + '">' + esc(label) + (req ? '' : ' <span>(optional)</span>') + '</label>' +
        '<input class="dr-input" id="' + id + '" type="' + type + '" data-contact="' + key + '" value="' + esc(c[key]) + '" placeholder="' + esc(ph) + '"' + (type === 'email' ? ' autocomplete="email"' : '') + '>';
    }
    var roles = ['Owner', 'Manager', 'Staff', 'Other'];
    return '<section class="dr-screen">' + progress() +
      '<div class="dr-kicker">Almost done</div>' +
      '<h2>Your results are ready.</h2>' +
      '<p class="dr-sub">Tell us where to send a copy. We won’t share your info or add you to a mailing list.</p>' +
      input('dr-c-name', 'name', 'Your name', 'text', true, 'Jane Smith') +
      input('dr-c-biz', 'business', 'Business name', 'text', true, 'Pine Point Resort') +
      input('dr-c-email', 'email', 'Email', 'email', true, 'jane@pinepointresort.com') +
      input('dr-c-phone', 'phone', 'Phone', 'tel', false, '(555) 555-0100') +
      '<fieldset class="dr-field"><legend>Your role <span>(optional)</span></legend><div class="dr-chips">' +
      roles.map(function (r) {
        var sel = c.role === r;
        return '<button type="button" class="dr-chip' + (sel ? ' is-sel' : '') + '" aria-pressed="' + sel + '" data-role="' + r + '">' + r + '</button>';
      }).join('') + '</div></fieldset>' +
      '<label class="dr-check"><input type="checkbox" data-contact-check="walkthrough"' + (c.walkthrough ? ' checked' : '') + '> I’d like a free 15-minute walkthrough of my results.</label>' +
      errorLine() + navButtons('Show my results') + '</section>';
  }

  function screenResults() {
    var res = state.results;
    var html = '<section class="dr-screen dr-results">' +
      '<div class="dr-kicker">Your DockReady results' + (state.contact.business ? ' · ' + esc(state.contact.business) : '') + '</div>' +
      '<div class="dr-score">' +
        '<div class="dr-score-num"><b>' + res.score + '</b><span>/ 100</span></div>' +
        '<div class="dr-score-band dr-band-' + (res.score >= 80 ? 'ready' : res.score >= 50 ? 'gaps' : 'exposed') + '">' +
          '<strong>' + esc(res.band.name) + '</strong><span>' + esc(res.band.note) + '</span></div>' +
      '</div>';

    if (res.blind) {
      html += '<div class="dr-callout"><div class="dr-callout-k">Biggest blind spot</div>' +
        '<p>You rated your team <b>' + res.blind.conf + '/10</b> on ' + esc(res.blind.s.name.toLowerCase()) +
        '. Your answers put you at <b>' + res.blind.real + '/10</b>. That’s the gap that costs the most on a bad day.</p></div>';
    } else {
      html += '<div class="dr-callout dr-callout-calm"><div class="dr-callout-k">You know where you stand</div>' +
        '<p>Your gut ratings were close to your answers — that’s rare. Your lowest area is <b>' + esc(res.lowest.s.name.toLowerCase()) +
        '</b> at <b>' + res.lowest.real + '/10</b>.</p></div>';
    }

    // One card per scenario: what they said vs. what their answers say,
    // then exactly what to fix for that scenario.
    html += '<h3 class="dr-h3">Scenario by scenario</h3>' +
      '<div class="dr-legend"><span class="dr-key dr-key-conf"></span>You said <span class="dr-key dr-key-real"></span>Your answers say</div>';
    res.rows.forEach(function (r) {
      var flag = r.gap >= 4;
      var items = r.s.questions.filter(function (_q, i) { return state.answers[r.s.key][i] !== 'yes'; });
      html += '<div class="dr-res-card' + (flag ? ' is-flag' : '') + '">' +
        '<div class="dr-bar-label">' + esc(r.s.short) + (flag ? ' <em>Blind spot</em>' : '') + '</div>' +
        '<div class="dr-bar"><span class="dr-bar-conf" style="width:' + (r.conf * 10) + '%"></span><b>' + r.conf + '</b></div>' +
        '<div class="dr-bar"><span class="dr-bar-real" style="width:' + (r.real * 10) + '%"></span><b>' + r.real + '</b></div>';
      if (items.length) {
        html += '<div class="dr-todo-k">What to fix</div><ul class="dr-todo">' +
          items.map(function (q) {
            return '<li>' + esc(q.action) + (q.expert ? ' <span class="dr-expert dr-expert-sm">Often missed</span>' : '') + '</li>';
          }).join('') + '</ul>';
      } else {
        html += '<p class="dr-res-ok">You answered yes to everything here. Keep drilling it.</p>';
      }
      html += '</div>';
    });

    html += '<div class="dr-cta">' +
      '<p>Aqua-Tow Waterfront Readiness helps resorts, marinas and waterfront businesses close these gaps — written plans, staff training, the right equipment on site, and a 24/7 recovery partner when it counts.</p>' +
      '<a class="dr-btn dr-btn-primary dr-btn-big" href="' + esc(plansUrl()) + '" target="_top">See your options</a>' +
      '<p style="margin:12px 0 0;text-align:center;font-size:.95rem">or <a href="' + esc(BOOK_CALL_URL) + '" target="_top" style="color:inherit;text-decoration:underline">book a free 15-minute call</a></p>' +
      '</div>' +
      '<p class="dr-disclaimer">This check is for general education only. It is not a safety inspection, certification or legal advice, and doesn’t replace guidance from your insurer, local authorities or a qualified professional.</p>' +
      '</section>';
    return html;
  }

  function render() {
    var id = STEPS[state.step];
    var html;
    if (id === 'welcome') html = screenWelcome();
    else if (id === 'profile') html = screenProfile();
    else if (id === 'gut') html = screenGut();
    else if (id === 'contact') html = screenContact();
    else if (id === 'results') html = screenResults();
    else html = screenScenario(Number(id.slice(1)));
    root.innerHTML = html;
  }

  // ------------------------------------------------------------------
  // VALIDATION + NAVIGATION
  // ------------------------------------------------------------------
  function validate() {
    var id = STEPS[state.step];
    if (id === 'profile') {
      var missing = DR_CONTENT.profile.filter(function (f) { return !state.profile[f.key]; });
      if (missing.length) return 'Please answer every question (' + missing.length + ' left).';
    } else if (id.charAt(0) === 's' && id !== 'welcome') {
      var key = SCN[Number(id.slice(1))].key;
      var left = state.answers[key].filter(function (a) { return !a; }).length;
      if (left) return 'Please answer every question (' + left + ' left).';
    } else if (id === 'contact') {
      var c = state.contact;
      if (!c.name.trim()) return 'Please enter your name.';
      if (!c.business.trim()) return 'Please enter your business name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) return 'Please enter a valid email address.';
    }
    return '';
  }

  function go(delta) {
    if (delta > 0) {
      var err = validate();
      if (err) { state.error = err; render(); var e = root.querySelector('.dr-error'); if (e) e.scrollIntoView({ block: 'center' }); return; }
      if (STEPS[state.step] === 'contact') {
        ['name', 'business', 'email', 'phone'].forEach(function (k) { state.contact[k] = state.contact[k].trim(); });
        state.results = computeResults();
        send(buildPayload(state.results));
      }
    }
    state.error = '';
    state.step = Math.max(0, Math.min(STEPS.length - 1, state.step + delta));
    render();
    scrollTop();
  }

  // ------------------------------------------------------------------
  // EVENTS (delegated)
  // ------------------------------------------------------------------
  root.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t || !root.contains(t)) return;
    if (t.dataset.act === 'next') return go(1);
    if (t.dataset.act === 'back') return go(-1);
    if (t.dataset.profile) {
      state.profile[t.dataset.profile] = t.dataset.val;
      t.parentNode.querySelectorAll('.dr-chip').forEach(function (b) {
        var on = b === t; b.classList.toggle('is-sel', on); b.setAttribute('aria-pressed', on);
      });
      return;
    }
    if (t.dataset.ans) {
      state.answers[t.dataset.ans][Number(t.dataset.qi)] = t.dataset.val;
      t.parentNode.querySelectorAll('.dr-seg-btn').forEach(function (b) {
        var on = b === t; b.classList.toggle('is-sel', on); b.setAttribute('aria-pressed', on);
      });
      return;
    }
    if (t.dataset.role) {
      state.contact.role = state.contact.role === t.dataset.role ? '' : t.dataset.role;
      t.parentNode.querySelectorAll('.dr-chip').forEach(function (b) {
        var on = b.dataset.role === state.contact.role; b.classList.toggle('is-sel', on); b.setAttribute('aria-pressed', on);
      });
    }
  });

  root.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.conf) {
      state.conf[t.dataset.conf] = Number(t.value);
      var out = document.getElementById('dr-conf-out-' + t.dataset.conf);
      if (out) out.textContent = t.value;
    } else if (t.dataset.contact) {
      state.contact[t.dataset.contact] = t.value;
    }
  });

  root.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.profileSelect) state.profile[t.dataset.profileSelect] = t.value;
    else if (t.dataset.contactCheck) state.contact[t.dataset.contactCheck] = t.checked;
  });

  render();
})();
