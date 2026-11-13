/*
  Dad's Famous Sourdough Loaf: all recipe content lives in this file.
  Edit quantities, step text, checks, photo captions and troubleshooting here.
  Text may contain simple HTML such as <b>bold</b>. Do not use a literal " or ' inside
  a string that is wrapped in the same quote character (use the curly ’ or escape it).
*/
window.SOURDOUGH = {

  /* Ingredients per loaf: [name, note, grams-or-amount per loaf, unit]. Scaled by loaf count. */
  ingredients: [
    ['Bread flour', '12.7%+ protein', 450, 'g'],
    ['Whole wheat flour', '', 50, 'g'],
    ['Water', '~85°F, for autolyse', 340, 'g'],
    ['Active starter', '100% hydration, at peak', 100, 'g'],
    ['Fine sea salt', '', 10, 'g'],
    ['Water, held back', 'added with the salt', 20, 'g'],
    ['Rice flour', 'banneton dusting', 1, ' tbsp']
  ],

  /*
    Starter feeds. ratio = starter : flour : water by weight. basePeakHrs = hours to peak at
    schedule.baseTempF (an estimate: correct it after timing your own starter). Amounts come
    from feedFor and make about 10% more than the dough needs; the leftover is next time’s starter.
  */
  feeds: {
    same: { name: 'Same-day feed', ratio: '1:1:1', basePeakHrs: 5, peaks: 'peaks in 4–6 hrs' },
    night: { name: 'Overnight feed', ratio: '1:5:5', basePeakHrs: 8.5, peaks: 'peaks in 9–12 hrs' }
  },
  /* [starter, flour, water] in grams for a feed key and loaf count. */
  feedFor: function (key, n) {
    if (key === 'night') return [10 * n, 50 * n, 50 * n];
    var g = Math.ceil(37.5 * n / 5) * 5;
    return [g, g, g];
  },

  /*
    Method steps: [name, duration, text]. Called with the loaf count (1, 2 or 4).
    For 4 loaves the amounts shown are per batch (two batches of 2).
  */
  stepsFor: function (n) {
    var m = n === 4 ? 2 : n;
    var per = n === 4 ? ' Two batches: these amounts are per batch.' : '';
    return [
      ['Autolyse', '45 min', 'In the KitchenAid bowl, mix ' + (450 * m) + 'g bread flour, ' + (50 * m) + 'g whole wheat, and ' + (340 * m) + 'g water with the dough hook on speed 1 for about 1 minute, just until no dry flour remains. Cover and rest.' + per],
      ['Add starter', '4 min', 'Add ' + (100 * m) + 'g starter at its peak. Speed 1 for 1 minute, then speed 2 for 3 minutes. Never go above speed 2 with bread dough.'],
      ['Salt and gluten', '3–5 min', 'Sprinkle in ' + (10 * m) + 'g salt, drizzle in the held-back ' + (20 * m) + 'g water on speed 2. Mix until the dough pulls away from the bowl sides. Do the windowpane test. Stop if dough temp passes 80°F.'],
      ['Bulk ferment', '4–5 hrs at 76°F', 'Move to a lightly oiled straight-sided container and mark the starting level. 3 sets of coil folds, 30 min apart, in the first 90 min. Done at 50–75% rise. Do not let it double.'],
      ['Preshape', '30 min rest', (n > 1 ? 'Divide into ' + n + ' equal pieces (weigh them). ' : '') + 'Unfloured counter, round with a bench scraper, rest uncovered.'],
      ['Final shape', '', 'Flour the top, flip, shape a tight boule or batard by dragging it toward you to build tension. Into a rice-floured banneton, seam side up.' + (n > 1 ? ' One banneton per loaf.' : '')],
      ['Cold retard', '12–20 hrs', 'Cover and refrigerate at 36–40°F. This is the blister step. After an overnight feed, plan 17–20 hrs so the bake lands the next morning.'],
      ['Preheat', '60 min', 'Lidded Dutch oven in the oven at 500°F.'],
      ['Score and bake covered', '20 min', 'Do the poke test. Straight from the fridge onto parchment. One decisive slash at 30–45°, about 1/2 inch deep. Load, cover, drop to 475°F.' + (n > 1 ? ' Other loaves wait in the fridge.' : '')],
      ['Bake uncovered', '20–25 min', 'Lid off, drop to 450°F. Bake to deep mahogany and 208°F internal.' + (n > 1 ? ' Then put the empty pot back at 500°F for 10 min and repeat steps 9–10 for each remaining loaf (about 55 min per loaf).' : '')],
      ['Cool', '2 hrs', 'On a rack before slicing. Cutting early makes the crumb gummy.']
    ];
  },

  /* Formula check rows: [label, small note, value] */
  formula: [
    ['Hydration', '410g water ÷ 550g flour per loaf', '74.5%'],
    ['Salt', 'target 1.8–2.2%', '1.8%'],
    ['Starter (inoculation)', 'target 15–25%', '20%'],
    ['Whole wheat', 'target 5–20%', '9%'],
    ['Dough temp', 'target 75–80°F', '76–78°F'],
    ['Cold proof', 'target 12–48 hrs', '14 hrs'],
    ['Internal temp when done', 'target 205–210°F', '208°F']
  ],

  /* Why it works cards: [title, text] */
  whyItWorks: [
    ['Height', 'Bread flour plus mixer kneading builds a strong gluten network that holds gas. Stopping bulk at 50–75% rise leaves fuel for oven spring. The lid traps steam so the crust stays soft long enough to expand.'],
    ['Blisters', 'The long cold proof builds acids and gas under a moist surface. Cold dough hitting a 475°F pot puffs those pockets and browns them.']
  ],

  beforeEveryBake: [
    'Starter doubles within 4–6 hrs of a same-day feed (1:1:1) at about 76°F',
    'Oven thermometer checked',
    'Container has a tape mark at the starting level',
    'Probe thermometer ready for dough and loaf temps'
  ],

  /* Readiness checks. ok = "Ready" box, no = "Not yet / too late" box, note = optional small note. */
  checks: [
    { when: 'Before step 2 · Starter', title: 'Use it at its peak',
      ok: '<b>Ready:</b> doubled or more since feeding (rubber band on the jar), domed top just starting to flatten, bubbly throughout, smells tangy and yeasty.',
      no: '<b>Not yet:</b> not doubled, so wait. <b>Too late:</b> collapsed with streaks down the jar, or smells like nail polish. Feed again and wait for the next peak.',
      note: 'Overnight feed: you will often meet it just past the peak. A dome starting to flatten is still ready. If it has not doubled yet, move it somewhere warm and wait while the autolyse rests.<br>Float test (optional): a spoonful that floats is ready. Whole wheat starters can sink even when ready, so trust the doubling first.' },
    { when: 'End of step 3 · Windowpane test', title: 'Gluten developed enough',
      ok: '<b>Ready:</b> a golf-ball piece stretches slowly into a thin, translucent sheet before tearing.',
      no: '<b>Tears fast:</b> mix 1–2 more minutes on speed 2. A partial windowpane is fine at this hydration; the folds finish the job.' },
    { when: 'End of step 4 · Bulk ferment', title: 'Stop at 50–75%, not doubled',
      ok: '<b>Ready:</b> 50–75% rise on the tape mark, domed edges, bubbles on top and sides, jiggles when you shake the container.',
      no: '<b>Not yet:</b> check every 30 min. <b>Doubled or sloppy:</b> shape now and expect less height.',
      note: 'Warm dough (78°F or more) keeps rising for a few hours in the fridge, so stop nearer 50%. In a cool kitchen, go toward 75%.' },
    { when: 'After cold proof · Poke test', title: 'Proofed and ready to bake',
      ok: '<b>Ready:</b> a floured finger poked 1/2 inch springs back slowly and leaves a small dent.',
      no: '<b>Springs back fast:</b> more fridge time, or 30–60 min at room temp. <b>No spring back:</b> bake now and score shallow.',
      note: 'Cold dough is stiff and springs back slowly either way, so this test is less reliable straight from the fridge. Use it as a tiebreaker after the bulk check.' },
    { when: 'End of step 10 · Done baking', title: 'Fully baked',
      ok: '<b>Ready:</b> 208°F internal, deep mahogany crust, hollow thump on the bottom.',
      no: '<b>Not yet:</b> 5 more minutes uncovered, then check again.' }
  ],

  /*
    Photo slots. k = file name in /photos (k.jpg, optional k.webp), t = title/caption,
    when = small label above the title, tip = how to take the shot.
  */
  photos: [
    { k: 'starter-fed', t: 'Starter, just fed', when: 'Right after feeding', tip: 'Side view of the jar with the rubber band at the starting level.' },
    { k: 'starter-peak', t: 'Starter at peak', when: 'Before step 2', tip: 'Same jar, same angle: the rise above the band and bubbles through the glass.' },
    { k: 'windowpane', t: 'Windowpane', when: 'End of step 3', tip: 'Stretched dough held up to a window so light shows through.' },
    { k: 'bulk-start', t: 'Bulk start', when: 'Start of step 4', tip: 'Container from the side, tape mark visible.' },
    { k: 'bulk-end', t: 'Bulk done', when: 'End of step 4', tip: 'Same spot and angle: rise vs. the tape mark, domed edges, side bubbles.' },
    { k: 'shaped', t: 'Shaped in banneton', when: 'Step 6', tip: 'Top-down, seam side up.' },
    { k: 'poke', t: 'Poke test', when: 'After cold proof', tip: 'Close-up of the dent right after poking.' },
    { k: 'scored', t: 'Scored', when: 'Step 9', tip: 'Top-down on parchment, just before it goes in the pot.' },
    { k: 'lid-off', t: 'Lid off', when: 'Start of step 10', tip: 'Straight down into the pot: oven spring and a pale crust.' },
    { k: 'finished', t: 'Finished loaf', when: 'Out of the oven', tip: 'Side profile at eye level for height and ear; add a blister close-up if you can.' },
    { k: 'crumb', t: 'Crumb', when: 'After the 2-hr cool', tip: 'Cut down the middle, straight-on, in daylight.' }
  ],

  /* Which photos appear as thumbnails under which method step (0-based step index). */
  stepPhotos: { 1: ['starter-fed', 'starter-peak'], 2: ['windowpane'], 3: ['bulk-start', 'bulk-end'], 5: ['shaped'], 8: ['poke', 'scored'], 9: ['lid-off', 'finished'], 10: ['crumb'] },

  /* Schedule math. Minutes unless the name says otherwise.
     Starter peak (per feed, see feeds above) and bulk ferment are measured at baseTempF and scale with kitchen temp:
     fermentation runs about twice as fast for every doubleEveryF degrees warmer (an estimate).
     Hands-on steps from nightFrom:00 up to nightTo:00 get flagged. */
  schedule: {
    bakeMin: 43, coolMin: 120, extraLoafMin: 55,
    baseTempF: 76, baseBulkHrs: 4.5, doubleEveryF: 18,
    defaultTempF: 72, minTempF: 65, maxTempF: 85,
    coldMinHrs: 12, coldMaxHrs: 20, defaultColdHrs: 14,
    nightFrom: 20, nightTo: 6
  },

  /* Troubleshooting sources: key -> [url, label] */
  sources: (function () {
    var KA = 'https://www.kingarthurbaking.com';
    return {
      notRising: [KA + '/blog/2024/12/19/why-is-my-sourdough-starter-not-rising', 'Why is my sourdough starter not rising?'],
      faq: [KA + '/learn/sourdough', 'King Arthur’s guide to sourdough'],
      tooActive: [KA + '/blog/2021/07/29/bread-coach-can-sourdough-starter-be-too-active', 'Can sourdough starter be too active?'],
      create: [KA + '/learn/guides/sourdough/create', 'Sourdough: create a starter'],
      tipsPdf: ['https://shop.kingarthurbaking.com/content/recipes/SourdoughTipsAndRecipes_2026.pdf', 'Sourdough Tips & Recipes (PDF)'],
      doughSlow: [KA + '/blog/2023/03/23/ask-the-bread-coach-my-dough-isnt-rising-what-now', 'My dough isn’t rising: what now?'],
      proofing: [KA + '/blog/2022/05/06/benefits-of-bread-proofing-box', 'How to ensure perfectly proofed bread'],
      crumb: [KA + '/blog/2020/11/05/how-to-produce-an-open-crumb-in-sourdough-bread', 'How to produce an open crumb'],
      risen: [KA + '/blog/2022/08/22/how-to-tell-if-bread-dough-has-risen-enough', 'How to tell if dough has risen enough'],
      banneton: [KA + '/blog/2023/01/25/bannetons-brotforms-proofing-baskets', 'Bannetons and proofing baskets: a guide'],
      ears: [KA + '/blog/2021/02/16/all-about-sourdough-ears', 'Everything to know about sourdough ears'],
      bottom: [KA + '/blog/2025/07/30/the-bottom-of-my-bread-gets-too-dark', 'Keep your bread’s bottom from getting too dark'],
      dark: [KA + '/blog/2021/11/03/ask-the-bread-coach-just-how-dark-should-i-be-baking-my-bread', 'Just how dark should I bake my bread?'],
      crusty: [KA + '/comment/521616', 'How to make crusty bread'],
      tips: [KA + '/blog/2015/08/11/sourdough-baking-tips', 'Sourdough baking tips']
    };
  })(),

  /* Troubleshooting: groups of [problem, [ordered fixes], [source keys]] */
  fixes: [
    { group: 'Starter', items: [
      ['Starter isn’t doubling', [
        'King Arthur’s yardstick: at 75°F or warmer, a healthy starter doubles within 6–8 hrs of feeding. A lively one on a same-day feed (1:1:1) gets there in 4–6 hrs. An overnight feed (1:5:5) is meant to take 9–12. Below 68°F it can take much longer.',
        'Move it somewhere warm (top of the fridge works) and feed with 80–90°F water.',
        'Give it a snack: swap 10–20% of the feeding flour for rye or whole wheat to speed it up.'], ['notRising']],
      ['Lots of small bubbles, but no rise', [
        'It’s probably too thin to trap gas. If it pours easily, feed it a bit more flour until it’s gloppy.',
        'Or feed with bread flour, which absorbs more water.'], ['faq']],
      ['Can’t tell if it doubled (it already fell)', [
        'Starters sink after they peak. Look for fresh residue on the jar sides above the current level; that’s proof it doubled.',
        'Underripe = hasn’t doubled yet. Overripe = doubled or tripled and sinking. Use it in between.'], ['tipsPdf']],
      ['Starter is “too active” and loaves slump', [
        'An overly active starter makes the dough overproof fast.',
        'Feed with less starter: e.g. 20g starter + 30g water + 50g flour instead of equal parts.'], ['tooActive', 'faq']],
      ['Coming out of the fridge for a bake', [
        'About 2 days before baking, take it out and feed it. Then feed twice a day, about 12 hrs apart.',
        'Make the last feeding 6–12 hrs before you mix the dough: a same-day feed that morning or an overnight feed the evening before (amounts on the Recipe tab).'], ['tipsPdf']],
      ['Gray or dark liquid on top', [
        'That’s “hooch” (alcohol) from a hungry starter. Normal. Stir it in or pour it off, then feed every 12 hrs until it doubles again.',
        'Toss it and start over only if you see mold, a pink or orange tint/streak, or it smells rotten.'], ['notRising', 'create']]
    ]},
    { group: 'Dough and rise', items: [
      ['Loaf spreads flat', [
        'Drop the held-back water first.',
        'Shorten bulk (stop at 50% rise).',
        'If bulk races ahead every time, your starter may be too active (see Starter above).'], ['tooActive']],
      ['Dough is rising slowly', [
        'Take its temperature. King Arthur aims for 75–80°F dough.',
        'If it’s cool, extend bulk by 25–50% instead of rushing it. Home bakers usually underferment, which gives squat, dense loaves.',
        'Warm spot trick: microwave a half-full jar of water for 2 min, then put the dough in the microwave with it (don’t turn it on).'], ['doughSlow']],
      ['Dense, tight crumb', [
        'Let bulk go longer (see above).',
        'Use starter when it just turns ripe, not long after; overripe starter adds acid that weakens gluten.',
        'Handle the dough gently at preshape and shape so you keep the gas.'], ['crumb']],
      ['Shaped loaf proofs too fast in the fridge', [
        'Put the loaves in the fridge uncovered for the first 30 min to pull the heat out, then cover them.'], ['tooActive']],
      ['Dough forms a dry skin', [
        'Keep it covered at every stage. A dry skin constricts the rise and stops full expansion.'], ['proofing']]
    ]},
    { group: 'Shaping, scoring, baking', items: [
      ['Dough sticks to the banneton', [
        'Shape gently: tears expose the sticky inside.',
        'Dust lightly but thoroughly with rice flour or semolina; a linen liner helps a lot.',
        'If it sticks, flip the banneton onto parchment and wait about 5 min. Gravity usually releases it.'], ['banneton']],
      ['No ear, or the score seals back up', [
        'Score at least 1/4–1/2 inch deep at a shallow angle so it doesn’t fuse in the oven.',
        'Overproofed dough doesn’t spring enough to open the score. Watch bulk and the poke test.',
        'Dough too weak or too wet: drop some held-back water, or add an extra set of folds.'], ['ears']],
      ['No blisters', [
        'Longer cold proof (18–24 hrs).',
        'Colder fridge, and bake straight from the fridge.'], []],
      ['Bottom crust burns', [
        'Dark-interior Dutch ovens run hot on the bottom. Don’t bake on the lowest rack.',
        'Make a foil disk about 1/4 inch thick to fit the pot bottom, plus one sheet of foil 3 inches up the sides. Preheat the pot with the foil in, and grease the foil before loading.',
        'Want a darker (not burned) bottom? Flatten the foil to 1/8 inch.'], ['bottom']],
      ['Pale crust', [
        'Pale crust means not enough heat or not enough steam. Your oven may run low; check it with an oven thermometer.',
        'Keep the lid on for the full 20 min, then bake longer uncovered. A thin strip of char on the ear means you went far enough.'], ['dark']]
    ]},
    { group: 'After the bake', items: [
      ['Gummy crumb', [
        'Cool the full 2 hours. Slicing hot bread makes it gummy.',
        'Bake to 208°F internal.',
        'Underproofed or overproofed loaves can also bake up dense and gummy in the center.'], ['risen']],
      ['Crust goes soft after cooling', [
        'Moisture from inside condenses on the crust in cool air. When it’s done, turn off the oven, crack the door a couple of inches, and let the loaf cool inside.'], ['crusty']],
      ['Want it more sour', [
        'Leave the shaped loaf in the fridge longer, even a few days. Past a point the yeast weakens and the rise suffers, so find your sweet spot.'], ['tips']]
    ]}
  ],

  attribution: 'Adapted from King Arthur Baking’s blog and sourdough guides.'
};
