import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'project_management',
  user: 'postgres',
  password: '123456'
});

const subtasks = [
  // Task 708 - remaining 3 subtasks
  {
    parentTaskId: 708,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: PAS (Problem-Agitate-Solve)

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:03] HOOK**
*Camera: Direct, warm eye contact*

"Single woman moving to Houston?"
*brief pause, lean in slightly*
"This is for you."

---

**[0:03-0:12] PROBLEM**

"You want two things: to feel SAFE... and to actually have a social life. Not just families everywhere. You want bars, restaurants, people your age."

*[beat]*

"The problem? Those two things seem impossible to get in the same place."

---

**[0:12-0:22] AGITATE**

"Most safe suburbs? Dead at night. Great if you want to Netflix alone forever."

*[slight eye roll]*

"Most nightlife areas? The reputation makes you nervous. Your mom's already texting you crime statistics."

*[jump cut]*

"So you're stuck scrolling between 'boring but safe' and 'fun but scary.' Lose-lose."

---

**[0:22-0:42] SOLVE**

"Here's what I tell my clients: you CAN have both. These neighborhoods deliver safety AND social:"

*[text overlay: 1. MONTROSE]*
"Montrose - artsy, walkable, great bar scene, but also super safe. My single women clients LOVE it here."

*[text overlay: 2. HEIGHTS]*
"The Heights - more laid back, amazing brunch spots, young professionals everywhere, solid safety stats."

*[text overlay: 3. MUSEUM DISTRICT]*
"Museum District - quieter energy, cultural vibes, parks, and very safe for walking alone."

*[text overlay: 4. UPPER KIRBY]*
"Upper Kirby - upscale, great restaurants, tons of young professionals, very well-lit at night."

"Each one has a different vibe. I can match you to the RIGHT one based on your personality."

---

## DELIVERY NOTES

- Tone: Empathetic, supportive, like a big sister giving advice
- Energy: 6/10 - warm but confident, not salesy
- The "your mom's texting you crime statistics" line should get a knowing smile
- When listing neighborhoods, slight pause between each - let them sink in
- "My single women clients" builds credibility without being pushy`
  },
  {
    parentTaskId: 708,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "DM me SINGLE for my safe + social neighborhood guide"
**Type:** Medium (DM keyword for lead capture)
**Goal:** Capture high-intent single women leads

---

## CLOSING SCRIPT (Word-for-word)

**[0:42-0:55]**

"Look - you shouldn't have to choose between safety and having a life."

*[direct to camera, sincere]*

"I've helped dozens of single women find their perfect Houston neighborhood. I know what matters to you."

*[point at camera]*

"DM me the word SINGLE - I'll send you my safe plus social neighborhood guide. It breaks down exactly which spots match which vibe."

---

## DELIVERY NOTES

- "You shouldn't have to choose" = validating their frustration
- "Dozens of single women" = social proof without bragging
- "I know what matters to you" = builds trust
- Point at camera on "DM me" - creates direct connection
- Don't rush the CTA - let each word land
- Energy: Bring it down from the middle section, more personal
- End with slight nod and warm smile

---

## WHY MEDIUM CTA WORKS HERE

- This is Promote pillar content (consideration stage)
- Single women are high-value leads - worth direct capture
- "SINGLE" keyword segments this audience specifically
- DM keyword creates automation opportunity (ManyChat)
- Guide delivery = value exchange, builds relationship
- Low friction: DM is easy, not asking them to call`
  },
  {
    parentTaskId: 708,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** TikTok
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 50-55 seconds
**Post date:** Friday, January 31, 2026
**Post time:** 7:00 PM CST

---

## FORMAT DETAILS

**Style:** Talking Head with Jump Cuts
**Location:** Clean, well-lit background (apartment or office)
**Lighting:** Ring light, warm tones
**Audio:** Direct to camera, no background music during speech

**Text overlays needed:**
- "1. MONTROSE" (0:24)
- "2. HEIGHTS" (0:28)
- "3. MUSEUM DISTRICT" (0:32)
- "4. UPPER KIRBY" (0:36)
- "DM 'SINGLE' for the guide" (0:48)

---

## CAPTION/DESCRIPTION

Single woman apartment hunting in Houston? 👋

Here's the truth: you CAN have safety AND a social life.

These 4 neighborhoods deliver both:
🎨 Montrose - artsy, walkable, great nightlife
🧔 Heights - brunch culture, young professionals
🏛️ Museum District - quiet, cultured, very safe
🛍️ Upper Kirby - upscale dining, well-lit

DM me "SINGLE" for my free safe + social neighborhood guide 💌

#singlewoman #houstonsafety #houstonsingles #movingalone #womensafety #houstonapartments

---

## PRODUCTION CHECKLIST

- [ ] Script finalized (subtasks 2-4)
- [ ] Filming location prepped
- [ ] Ring light / lighting ready
- [ ] Text overlay graphics created
- [ ] Jump cuts edited
- [ ] Audio levels checked
- [ ] Caption copied with hashtags
- [ ] ManyChat keyword "SINGLE" set up
- [ ] Scheduled for 7pm CST Friday`
  },

  // Task 709 - All 5 subtasks
  {
    parentTaskId: 709,
    title: "📚 Research Foundation",
    description: `## PERSONA: ALL AUDIENCES

**Profile:** Anyone searching for Houston apartments who has been overwhelmed by conflicting reviews.

**Key Evidence (Task 674, Subtask 3118):**
- 'Does anyone actually LIKE their apartment complex?'
- 'every apartment complex I look at has horrible reviews'
- 'Most apartments have terrible reviews... At this point if there are no roaches, I'm sold!'
- 'the price looks good while the reviews are terrifying'
- 'I can't find any reasonably priced apartments that haven't been bombarded by negative reviews'

---

## PAIN POINT: Terrifying Reviews Everywhere

**The Challenge:** Every apartment seems to have awful reviews - roaches, break-ins, terrible management. It feels impossible to find anywhere decent.

**The Reality:** Happy tenants rarely leave reviews. Only angry people write them. The review landscape is skewed negative.

**The Question:** How do you actually evaluate apartments when EVERY review is bad?

---

## WHY THIS COMBO WORKS

This addresses a universal frustration - the review paradox. Everyone searching for Houston apartments hits this wall. The Myth vs Reality framework provides a clear mental model for evaluating reviews, positioning you as the expert who can see through the noise.`
  },
  {
    parentTaskId: 709,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"Every Houston apartment has horrible reviews. Here's the truth."**

## HOOK TYPE: 🔮 Curiosity

**Why It Works:**
- States a universal frustration everyone has felt
- "Here's the truth" promises insider knowledge
- Curiosity gap - what IS the truth?
- Validates their experience (they're not crazy, reviews ARE bad)

## OPENING SCRIPT (First 3 Seconds)

**Word-for-word:**
"You've been searching for weeks." *[knowing look]* "Every place has roaches or break-ins in the reviews." *[slight pause]* "Sound familiar?"

**Delivery Notes:**
- Relatable, commiserating tone
- Like you're in on the struggle together
- Slight head shake on "every place"
- Energy: 6/10 - understanding, not hype
- End "Sound familiar?" with raised eyebrows, inviting agreement

## SOURCE QUOTE
'Does anyone actually LIKE their apartment complex?' - The exact frustration this addresses`
  },
  {
    parentTaskId: 709,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: Myth vs Reality

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*Camera: Knowing, sympathetic look*

"You've been searching for weeks."
*[slight pause]*
"Every place has roaches or break-ins in the reviews."
*[beat]*
"Sound familiar?"

---

**[0:05-0:12] MYTH**

"Here's what most people think:"
*[text overlay: MYTH]*
"If it has bad reviews, it must be bad."

*[head shake]*

"And that's why you're stuck."

---

**[0:12-0:40] REALITY**

*[text overlay: REALITY]*

"The truth? Only unhappy people write reviews. Happy tenants are too busy LIVING to post online."

*[jump cut]*

"So here's how to ACTUALLY read apartment reviews:"

*[text overlay: 1. PATTERNS]*
"ONE - Look for PATTERNS, not one-offs. One person saw a roach? Maybe they're messy. TWENTY people saw roaches? Red flag."

*[text overlay: 2. MANAGEMENT RESPONSE]*
"TWO - Check how management RESPONDS. Do they care? Do they fix things? That tells you more than the complaint itself."

*[text overlay: 3. DATES]*
"THREE - Look at DATES. New management? Old reviews don't count. Things change."

*[text overlay: 4. SPECIFICS]*
"FOUR - Specific beats vague. 'Roaches in unit 304' is useful. 'This place sucks' tells you nothing."

*[direct to camera]*

"A few angry reviews is NORMAL. Twenty people saying the exact same thing? Problem."

---

## DELIVERY NOTES

- Tone: Expert breaking down the system
- Energy: 7/10 - confident, teaching mode
- Hand gestures help emphasize each point
- The "only unhappy people write reviews" line should land like a revelation
- Numbers on screen help viewers track and remember`
  },
  {
    parentTaskId: 709,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "DM me REVIEWS for apartments that passed my filter"
**Type:** Medium (DM keyword for lead capture)
**Goal:** Capture leads who want pre-vetted apartment options

---

## CLOSING SCRIPT (Word-for-word)

**[0:40-0:55]**

"Now you know how to read reviews like a pro."

*[direct to camera, helpful]*

"But if you want to skip the research entirely? I've already done it."

*[lean in slightly]*

"DM me the word REVIEWS - I'll send you a list of Houston apartments that actually passed my filter. Real places, verified by me."

---

## DELIVERY NOTES

- "Now you know" = you just gave value, earned the ask
- "Skip the research entirely" = appeals to the overwhelmed
- "I've already done it" = you're the shortcut
- Point at camera on "DM me" - direct connection
- Confident but not pushy
- Energy: 6/10 - helpful expert, not salesy

---

## WHY MEDIUM CTA WORKS HERE

- This is Educate pillar content but has Promote energy
- Viewer just learned something valuable - reciprocity kicks in
- "REVIEWS" keyword captures apartment-intent leads
- Offering curated list = massive time savings
- Low friction: DM is easy, delivers real value`
  },
  {
    parentTaskId: 709,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** TikTok
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 50-55 seconds
**Post date:** Saturday, February 1, 2026
**Post time:** 9:00 AM CST

---

## FORMAT DETAILS

**Style:** Talking Head with Jump Cuts
**Location:** Clean background, good lighting
**Lighting:** Ring light or natural window light
**Audio:** Direct to camera, no background music

**Text overlays needed:**
- "MYTH" (0:07)
- "REALITY" (0:12)
- "1. PATTERNS" (0:18)
- "2. MANAGEMENT RESPONSE" (0:24)
- "3. DATES" (0:30)
- "4. SPECIFICS" (0:36)
- "DM 'REVIEWS'" (0:48)

---

## CAPTION/DESCRIPTION

Every Houston apartment has terrible reviews 😩

Here's the truth most people miss:

Only unhappy people write reviews. Happy tenants are too busy living.

How to ACTUALLY read reviews:
1️⃣ Look for PATTERNS (1 complaint = maybe. 20 = red flag)
2️⃣ Check management RESPONSE (do they care?)
3️⃣ Check DATES (new management = new reality)
4️⃣ Specifics > vague complaints

DM me "REVIEWS" for apartments that passed my filter ✅

#apartmentreviews #houstonapartments #apartmenthunting #movingtips #reviewtips

---

## PRODUCTION CHECKLIST

- [ ] Script finalized
- [ ] Text overlays created (6 total)
- [ ] Filming location prepped
- [ ] Ring light ready
- [ ] Filmed with jump cuts
- [ ] Text overlays synced
- [ ] Audio levels checked
- [ ] ManyChat keyword "REVIEWS" set up
- [ ] Scheduled for 9am CST Saturday`
  },

  // Task 710 - All 5 subtasks (Coffee shop tour)
  {
    parentTaskId: 710,
    title: "📚 Research Foundation",
    description: `## PERSONA: YOUNG PROFESSIONAL (Task 673, Subtask 3116)

**Profile:** Remote workers and young professionals seeking walkable neighborhoods with good coffee culture.

**Key Evidence:**
- 'coffee shops, restaurants, workout studios, bars'
- '32-year-old woman who loves walkable neighborhoods with coffee shops'
- 'remote worker... looking for somewhere walkable'
- 'We'd love walkability... good food/coffee'

---

## PAIN POINT: Finding the Right Work Environment

**The Challenge:** Remote workers need neighborhoods where they can work from cafes, have variety, and maintain work-life balance.

**The Solution:** Montrose delivers the ultimate coffee shop density for remote workers.

---

## WHY THIS COMBO WORKS

This is pure Entertain pillar content - showcasing lifestyle rather than solving a problem. It makes Montrose feel aspirational for remote workers while soft-selling neighborhood expertise. The comment CTA drives engagement without being salesy.`
  },
  {
    parentTaskId: 710,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"The neighborhood where you'll never run out of coffee shops"**

## HOOK TYPE: ✅ Benefit

**Why It Works:**
- Benefit-forward (endless options)
- Speaks to coffee culture lifestyle
- Creates curiosity (which neighborhood?)
- Aspirational for remote workers

## OPENING SCRIPT (First 5 Seconds)

**Word-for-word:**
*[Walking through Montrose, coffee in hand]*
"If coffee shops are your thing?" *[gesture around]* "You need to see this."

**Delivery Notes:**
- Casual, lifestyle vibe
- Walking shot establishes movement
- Holding coffee adds authenticity
- Energy: 7/10 - excited to share a discovery
- "You need to see this" = invitation, not instruction

## SOURCE QUOTE
'coffee shops, restaurants, workout studios, bars' - The exact lifestyle checklist`
  },
  {
    parentTaskId: 710,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: Story/Narrative (Neighborhood Tour)

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*[Walking through Montrose, coffee in hand]*

"If coffee shops are your thing?"
*[gesture at surroundings]*
"You need to see this."

---

**[0:05-0:40] TOUR - COFFEE SHOP SHOWCASE**

*[Walking shot, approaching Boomtown]*
"This is Montrose. Coffee shop HEAVEN."

*[B-roll: Boomtown Coffee exterior/interior]*
"Boomtown Coffee - the go-to for serious remote workers. Great wifi, good vibes."

*[B-roll: Blacksmith]*
"Blacksmith - tiny, cozy, feels like you're in Portland."

*[B-roll: Siphon Coffee]*
"Siphon Coffee - for when you want to get fancy with your pour-over."

*[B-roll: Catalina Coffee]*
"Catalina - neighborhood staple, everyone knows your name eventually."

*[B-roll: Double Trouble]*
"Double Trouble - for when you need caffeine AND a cocktail later."

*[Walking shot]*
"And those are just the famous ones. There's like twenty more independents within walking distance."

*[Stop, turn to camera]*
"This is remote worker PARADISE. Work from a different cafe every day for a month."

---

**[0:40-0:50] LIFESTYLE PAYOFF**

"Plus - bars, restaurants, boutiques - all walkable. You literally don't need a car to live here."

---

## DELIVERY NOTES

- Tone: Excited local showing off their neighborhood
- Energy: 8/10 - enthusiastic, lifestyle showcase
- Movement throughout keeps it dynamic
- Each coffee shop gets its own quick cut
- The "Portland" reference = shorthand for vibe
- "Paradise" might seem hyperbolic but hits for target audience`
  },
  {
    parentTaskId: 710,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "Comment: Are you a coffee shop person or brunch person? I'll tell you your neighborhood."
**Type:** Soft (Comment engagement for Entertain pillar)
**Goal:** Drive comments, algorithm boost, audience insight

---

## CLOSING SCRIPT (Word-for-word)

**[0:50-0:55]**

*[Direct to camera, friendly]*

"Question for you:"

*[point at camera]*

"Are you a coffee shop person or a brunch person?"

*[slight smile]*

"Comment below - I'll tell you which Houston neighborhood matches YOUR vibe."

---

## DELIVERY NOTES

- "Question for you" creates pause, attention
- Binary choice = easy to answer = more comments
- "Your vibe" = personalized, they feel seen
- Friendly, not demanding
- Slight smile at end = warm close
- Energy: 7/10 - conversational, inviting

---

## WHY SOFT CTA WORKS HERE

- This is Entertain pillar - no hard sell appropriate
- Comment CTA boosts algorithm (engagement signal)
- Creates conversation = relationship building
- Gives insight into audience preferences
- "I'll tell you" promises value for commenting
- Sets up future content based on responses`
  },
  {
    parentTaskId: 710,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** TikTok
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 50-55 seconds
**Post date:** Saturday, February 1, 2026
**Post time:** 12:00 PM CST

---

## FORMAT DETAILS

**Style:** Neighborhood Tour
**Location:** Montrose - multiple coffee shops
**Shooting:** Walking shots + B-roll of each cafe
**Audio:** Voiceover or direct to camera

**B-roll needed:**
- Boomtown Coffee exterior + interior
- Blacksmith storefront
- Siphon Coffee (pour-over action)
- Catalina Coffee
- Double Trouble
- General Montrose walking shots
- Coffee being made

---

## CAPTION/DESCRIPTION

The neighborhood where you'll NEVER run out of coffee shops ☕

Montrose = remote worker paradise:
☕ Boomtown Coffee
☕ Blacksmith
☕ Siphon Coffee
☕ Catalina Coffee
☕ Double Trouble
...and 20+ more within walking distance

Question: Are you a coffee shop person or brunch person?
Comment below - I'll tell you your Houston neighborhood! 👇

#montrose #houstoncoffee #remotework #coffeeshops #wfh #houstonlife

---

## PRODUCTION CHECKLIST

- [ ] Coffee shop list confirmed
- [ ] B-roll shot list created
- [ ] Walking route planned
- [ ] Each cafe filmed (exterior + vibe shot)
- [ ] Voiceover/talking head recorded
- [ ] Jump cuts edited
- [ ] Music added (upbeat, lifestyle)
- [ ] Captions added
- [ ] Scheduled for 12pm CST Saturday`
  },

  // Task 711 - All 5 subtasks (Neighborhood vibes breakdown)
  {
    parentTaskId: 711,
    title: "📚 Research Foundation",
    description: `## PERSONA: RELOCATOR (Task 673, Subtask 3114)

**Profile:** People moving to Houston who don't understand neighborhood differences.

**Key Evidence:**
- 'There's SO many areas and sub-sections of Houston with their own distinct vibes'
- 'Neighborhoods we keep hearing about are: Montrose, The Heights, Midtown, Rice Village, Museum District, East End, and Upper Kirby'
- 'we'd love honest takes on what they're actually like'
- 'What's the real day-to-day feel of the city?'

---

## PAIN POINT: Neighborhood Confusion (Task 674, Subtask 3122)

**The Challenge:** Houston is huge and every neighborhood claims to be "great." Relocators can't tell the difference between them or what each is really like.

**Key Quotes:**
- 'I'm not understanding the inner loop outer loop concept'
- 'there are so many suburbs and I'm overwhelmed'
- 'What's the vibe of Midtown/Heights/Montrose?'

---

## WHY THIS COMBO WORKS

This is pure Local pillar content - demonstrating insider neighborhood knowledge in a fun, shareable format. Quick vibe checks give relocators a mental map of Houston while positioning you as the neighborhood expert. Comment CTA drives engagement.`
  },
  {
    parentTaskId: 711,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"Houston neighborhood vibes: The honest breakdown"**

## HOOK TYPE: ✅ Benefit

**Why It Works:**
- "Honest" signals you won't sugarcoat
- "Breakdown" promises organized, digestible info
- "Vibes" is the exact language they use
- Appeals to anyone confused about Houston neighborhoods

## OPENING SCRIPT (First 5 Seconds)

**Word-for-word:**
"There's SO many areas in Houston." *[slight overwhelmed expression]* "Here's the real talk breakdown."

**Delivery Notes:**
- Acknowledge their overwhelm first
- "Real talk" = you're about to get honest
- Energy: 7/10 - helpful guide mode
- Quick pace to set up the list format

## SOURCE QUOTE
'There's SO many areas and sub-sections of Houston with their own distinct vibes' - Exact frustration expressed`
  },
  {
    parentTaskId: 711,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: List/Tips (Quick Vibe Check)

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*Camera: Friendly, ready to help*

"There's SO many areas in Houston."
*[slight overwhelmed expression]*
"Here's the real talk breakdown."

---

**[0:05-0:45] VIBE CHECK - RAPID FIRE**

*[text overlay: 🎨 MONTROSE]*
"Montrose - artsy, funky, LGBTQ-plus friendly. If you're creative or just hate boring, this is you."

*[jump cut, text overlay: 🧔 HEIGHTS]*
"The Heights - hipster energy, gentrified, incredible brunch culture. Everyone has a beard or a dog. Usually both."

*[jump cut, text overlay: 🎉 MIDTOWN]*
"Midtown - young, nightlife central, can get rowdy. If you're twenty-five and want to party, this is the spot."

*[jump cut, text overlay: 🏛️ MUSEUM DISTRICT]*
"Museum District - cultured, central, quieter vibes. For people who'd rather gallery hop than bar hop."

*[jump cut, text overlay: 🚀 EADO]*
"EaDo - up-and-coming, industrial-chic. The cool kids are moving here before it gets too expensive."

*[jump cut, text overlay: 🛍️ GALLERIA]*
"Galleria area - upscale shopping, nice restaurants, but traffic? Nightmare. Hope you like sitting in your car."

*[jump cut, text overlay: 🏥 MED CENTER]*
"Medical Center - practical, close to hospitals, great if you're a healthcare worker who doesn't want a commute."

---

## DELIVERY NOTES

- Tone: Fun, slightly roast-y but loving
- Energy: 8/10 - fast pace keeps attention
- Each neighborhood gets ONE vibe sentence
- The beard/dog joke should land with a slight smirk
- "Traffic nightmare" delivered with knowing eye roll
- Emojis on screen help visual memory`
  },
  {
    parentTaskId: 711,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "Which vibe are YOU? Comment below."
**Type:** Soft (Comment engagement for Local pillar)
**Goal:** Drive comments, understand audience, build community

---

## CLOSING SCRIPT (Word-for-word)

**[0:45-0:55]**

*[Direct to camera, inviting]*

"Alright, that's the quick and dirty."

*[point at camera]*

"Which vibe are YOU? Comment below."

*[slight smile]*

"And if you're not sure? I'll help you figure it out."

---

## DELIVERY NOTES

- "Quick and dirty" = casual, relatable
- Direct question drives action
- "I'll help you figure it out" = value offer for confused commenters
- Warm, approachable close
- Energy: 7/10 - conversational wrap-up

---

## WHY SOFT CTA WORKS HERE

- This is Local pillar content - pure value, no hard sell
- Comment CTA boosts engagement metrics
- Creates conversation in comments
- "I'll help you" invites relationship-building
- Comments give insight into audience preferences
- Easy to respond and build community`
  },
  {
    parentTaskId: 711,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** YouTube Shorts
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 50-55 seconds
**Post date:** Saturday, February 1, 2026
**Post time:** 4:00 PM CST

---

## FORMAT DETAILS

**Style:** Talking Head - Rapid Fire List
**Location:** Clean background or multiple neighborhood shots
**Audio:** Direct to camera, upbeat energy
**Pacing:** Fast cuts between neighborhoods

**Text overlays needed:**
- "🎨 MONTROSE" 
- "🧔 HEIGHTS"
- "🎉 MIDTOWN"
- "🏛️ MUSEUM DISTRICT"
- "🚀 EADO"
- "🛍️ GALLERIA"
- "🏥 MED CENTER"

**Optional B-roll:**
- Quick establishing shots of each area
- Street scenes that capture vibe

---

## CAPTION/DESCRIPTION

Houston neighborhood vibes - the REAL breakdown 🏠

🎨 MONTROSE - artsy, funky, creative
🧔 HEIGHTS - hipster, brunch, beards & dogs
🎉 MIDTOWN - young, nightlife, rowdy
🏛️ MUSEUM DISTRICT - cultured, quiet, central
🚀 EADO - up-and-coming, industrial cool
🛍️ GALLERIA - upscale shopping, traffic nightmare
🏥 MED CENTER - practical, hospital-adjacent

Which vibe are YOU? Comment below! 👇

#houstonvibes #houstonneighborhoods #movingtotexas #houstonguide #neighborhoodguide

---

## PRODUCTION CHECKLIST

- [ ] Script finalized with timing
- [ ] Emoji overlays created
- [ ] Filmed with jump cuts
- [ ] Fast-paced editing
- [ ] Text synced to speech
- [ ] Thumbnail created (YouTube)
- [ ] Scheduled for 4pm CST Saturday`
  },

  // Task 712 - All 5 subtasks (Tired of searching)
  {
    parentTaskId: 712,
    title: "📚 Research Foundation",
    description: `## PERSONA: ALL AUDIENCES (Overwhelmed Searchers)

**Profile:** Anyone who has hit the wall with apartment searching and is ready to give up.

**Key Evidence (Task 674, Subtask 3117):**
- 'I feel like a dog chasing cars looking at all of these options!'
- 'Apartment search has been one of the most stressful moments in life and I feel like giving up but I'm trying extremely hard not to'
- 'I'm a bit overwhelmed trying to find a decent place to live'
- 'touring apartments has been way more overwhelming than I expected'

---

## PAIN POINT: Overwhelm / Decision Paralysis

**The Challenge:** Weeks of searching, conflicting reviews, bait-and-switch tours, too many options. They're exhausted and ready to quit.

**The Solution:** Someone who actually knows Houston can do the work for them.

---

## WHY THIS COMBO WORKS

This is a Promote pillar weekend conversion post. It directly addresses the emotional exhaustion of apartment hunting and offers a clear solution: let an expert handle it. The Before/After framework shows transformation, and the Hard CTA captures leads ready to convert.`
  },
  {
    parentTaskId: 712,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"Tired of searching? Let me handle it for you."**

## HOOK TYPE: ✅ Benefit

**Why It Works:**
- Directly names their emotional state (tired)
- Offers immediate relief (let me handle it)
- Solution-forward, not problem-dwelling
- Simple, clear value proposition

## OPENING SCRIPT (First 3 Seconds)

**Word-for-word:**
*[Sincere, direct to camera]*
"If you've been scrolling for weeks and feeling defeated..."
*[softer tone]*
"This is for you."

**Delivery Notes:**
- Sincere, not salesy
- "Defeated" validates their emotional state
- "This is for you" = personal, direct
- Energy: 5/10 - calm, empathetic, not hype
- Eye contact throughout

## SOURCE QUOTE
'I feel like giving up but I'm trying extremely hard not to' - The exact emotional state`
  },
  {
    parentTaskId: 712,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: Before/After (Transformation)

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*Camera: Sincere, warm, direct*

"If you've been scrolling for weeks and feeling defeated..."
*[softer tone]*
"This is for you."

---

**[0:05-0:20] BEFORE - THE STRUGGLE**

"Let me guess your last few weeks:"

*[text overlay: BEFORE]*

"Endless Zillow scrolling. Every place has terrible reviews. You toured apartments that looked NOTHING like the photos."

*[slight knowing nod]*

"You've gotten ghosted by leasing offices. You're seeing the same listings recycled. You're starting to think every apartment in Houston is either a scam or a dump."

*[direct to camera]*

"You're EXHAUSTED. And honestly? You're ready to just pick something - ANYTHING - to make it stop."

---

**[0:20-0:35] TURNING POINT**

"But what if you didn't have to do this alone?"

*[text overlay: WHAT IF...]*

"What if someone who actually KNOWS Houston - every neighborhood, every building, every landlord's reputation - did the work FOR you?"

---

**[0:35-0:48] AFTER - THE SOLUTION**

*[text overlay: AFTER]*

"I match you with apartments that fit YOUR needs:"

*[tick off on fingers]*
"Your budget. Your neighborhood vibe. Your lifestyle priorities."

"I've already filtered out the scams, the bait-and-switch, the places with genuinely terrible management."

"No more guessing. No more disappointment. Just options that actually work."

---

## DELIVERY NOTES

- Tone: Empathetic expert, not pushy salesperson
- Energy: Start at 5/10, build to 7/10 on solution
- The "guess your last few weeks" creates connection
- "Ready to pick anything" = they'll nod in recognition
- "Did the work FOR you" = emphasis on FOR
- Confidence on the solution, not arrogance`
  },
  {
    parentTaskId: 712,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "Ready to end the frustration? DM me START and let's find your place."
**Type:** Hard (DM to convert - weekend conversion post)
**Goal:** Capture ready-to-act leads who want immediate help

---

## CLOSING SCRIPT (Word-for-word)

**[0:48-0:58]**

*[Direct to camera, confident but warm]*

"Ready to end the frustration?"

*[point at camera]*

"DM me the word START."

*[slight smile]*

"Let's find your place. For real this time."

---

## DELIVERY NOTES

- "Ready to end the frustration" = calls back to pain
- "START" = action word, feels like beginning something
- "Let's find your place" = partnership, not transaction
- "For real this time" = acknowledges their past disappointments
- Point at camera creates direct connection
- End with confidence + warmth
- Energy: 7/10 - assertive but caring

---

## WHY HARD CTA WORKS HERE

- This is Saturday evening Promote pillar = weekend decision time
- Entire video built emotional case for needing help
- Before/After showed clear transformation
- Audience is exhausted and ready to act
- "START" keyword captures high-intent leads
- Direct, clear action = higher conversion
- Weekend timing catches people in planning mode`
  },
  {
    parentTaskId: 712,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** TikTok
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 55-60 seconds
**Post date:** Saturday, February 1, 2026
**Post time:** 7:00 PM CST

---

## FORMAT DETAILS

**Style:** Talking Head - Emotional Connection
**Location:** Clean, warm background
**Lighting:** Soft, approachable (not harsh)
**Audio:** Direct to camera, sincere delivery
**Tone:** Empathetic expert, NOT salesy influencer

**Text overlays needed:**
- "BEFORE" (0:07)
- "WHAT IF..." (0:22)
- "AFTER" (0:35)
- "DM 'START'" (0:50)

---

## CAPTION/DESCRIPTION

Tired of apartment hunting? I get it. 😮‍💨

You've been at this for weeks:
❌ Endless scrolling
❌ Terrible reviews everywhere
❌ Photos that lie
❌ Bait and switch tours
❌ Ready to give up

What if someone who knows Houston did the work for you?

I match you with apartments that fit:
✅ Your budget
✅ Your neighborhood vibe
✅ Your lifestyle

Ready to end the frustration?
DM me "START" - let's find your place 🏠

#apartmenthelp #houstonapartments #apartmentlocator #tiredofsearching #houstonmoving

---

## PRODUCTION CHECKLIST

- [ ] Script finalized
- [ ] Sincere delivery practiced (not salesy)
- [ ] Text overlays created
- [ ] Warm lighting set up
- [ ] Filmed in one take per section
- [ ] Jump cuts edited
- [ ] Audio levels balanced
- [ ] ManyChat keyword "START" set up
- [ ] Intake form ready for DM responders
- [ ] Scheduled for 7pm CST Saturday`
  },

  // Task 713 - All 5 subtasks (You NEED a car)
  {
    parentTaskId: 713,
    title: "📚 Research Foundation",
    description: `## PERSONA: RELOCATOR (Task 673, Subtask 3114)

**Profile:** People moving to Houston from walkable cities who underestimate car dependency.

**Key Evidence:**
- 'I never cared for having a car... apartments are gorgeous and cheap but not close and Ubering would be $'
- 'My wife isn't a confident driver... Is it a necessity to have a car?'
- NYC transplant learning the hard way about car dependency
- Scottish family concerned about driving requirements

---

## PAIN POINT: Car Culture Shock

**The Challenge:** Relocators from NYC, Chicago, Europe, or other walkable cities assume they can get by without a car. They're wrong (mostly).

**The Reality:**
- Houston is built for cars, period
- Public transit exists but is limited
- Uber adds up fast ($300+/month)
- The city's scale is disorienting

**The Exception:** Inner Loop neighborhoods (Midtown, Montrose, Heights) are car-optional

---

## WHY THIS COMBO WORKS

This directly addresses the #1 relocation shock. The Myth vs Reality framework provides nuance - not just "you need a car" but WHERE you can and can't get by without one. Positions you as the expert who understands both sides.`
  },
  {
    parentTaskId: 713,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"Moving to Houston? You NEED a car. Here's why."**

## HOOK TYPE: ⚡ Shock

**Why It Works:**
- Direct statement challenges assumptions
- "NEED" is emphatic, attention-grabbing
- "Here's why" promises explanation
- Speaks directly to relocators' #1 concern

## OPENING SCRIPT (First 3 Seconds)

**Word-for-word:**
*[Direct, helpful tone]*
"Coming from NYC, Chicago, or Europe?"
*[lean in slightly]*
"Let me save you some pain."

**Delivery Notes:**
- Name the cities to identify your audience
- "Let me save you some pain" = you're helping, not lecturing
- Energy: 7/10 - confident, direct
- Slight lean creates intimacy

## SOURCE QUOTE
'My wife isn't a confident driver... Is it a necessity to have a car?' - The exact question being answered`
  },
  {
    parentTaskId: 713,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: Myth vs Reality

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*Camera: Direct, helpful*

"Coming from NYC, Chicago, or Europe?"
*[lean in slightly]*
"Let me save you some pain."

---

**[0:05-0:12] MYTH**

*[text overlay: MYTH]*
"'I'll figure out public transit. I'll Uber. I don't need a car.'"

*[knowing head shake]*

"I hear this EVERY week from relocators."

---

**[0:12-0:35] REALITY**

*[text overlay: REALITY]*

"Here's the truth: Houston is NOT built like your city."

*[tick off on fingers]*
"Buses exist - but routes are limited. The metro covers downtown and medical center. That's... mostly it."

*[show scale with hands]*
"The SPRAWL is real. Things that look close on the map? Fifteen miles apart. Twenty minutes in good traffic. Forty-five in bad."

*[direct to camera]*
"I had a client from NYC who said 'I'll just Uber everywhere.' Two weeks and three hundred dollars later, she bought a Honda."

---

**[0:35-0:48] THE EXCEPTION**

*[text overlay: EXCEPTION]*

"NOW - here's the good news."

"If you live INSIDE the loop - Midtown, Montrose, Heights - you CAN go car-optional."

"Walkable bars. Walkable restaurants. Bikeable errands."

"But anywhere OUTSIDE that loop? Car. Is. Mandatory."

*[direct to camera]*
"Houston is really two cities: a walkable urban core, and suburban sprawl. Know which one you're choosing."

---

## DELIVERY NOTES

- Tone: Helpful truth-teller, not judgmental
- Energy: 7/10 - engaging, not preachy
- The $300/Honda story should land with humor
- "Two cities" is the key insight to emphasize
- Hand gestures help visualize the sprawl
- Inside/outside loop distinction is crucial`
  },
  {
    parentTaskId: 713,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "Follow for more Houston truth bombs"
**Type:** Soft (Follow for Educate pillar)
**Goal:** Grow followers among relocators

---

## CLOSING SCRIPT (Word-for-word)

**[0:48-0:58]**

*[Direct to camera, helpful]*

"So - do you need a car in Houston?"

*[slight smile]*
"Depends entirely on where you live."

*[point at camera]*
"Follow me for more Houston truth bombs. I'll make sure you're not shocked like everyone else."

---

## DELIVERY NOTES

- Callback to "depends where you live" = nuanced answer
- "Truth bombs" = honest, valuable content promise
- "Not shocked like everyone else" = you'll be prepared
- Friendly point at camera, not aggressive
- Energy: 6/10 - helpful wrap-up
- End with confidence, slight smile

---

## WHY SOFT CTA WORKS HERE

- This is Educate pillar content (awareness stage)
- Just delivered value - follow is appropriate ask
- Not selling anything - building audience
- "Truth bombs" positions future content
- Relocators need ongoing guidance
- Low commitment = high follow rate`
  },
  {
    parentTaskId: 713,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** TikTok
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 55-60 seconds
**Post date:** Sunday, February 2, 2026
**Post time:** 9:00 AM CST

---

## FORMAT DETAILS

**Style:** Talking Head - Myth Buster
**Location:** Clean background
**Lighting:** Good, clear lighting
**Audio:** Direct to camera

**Text overlays needed:**
- "MYTH" (0:05)
- "REALITY" (0:12)
- "EXCEPTION" (0:35)

**Optional visuals:**
- Map of Houston showing scale
- Inner loop highlighted
- Distance comparisons

---

## CAPTION/DESCRIPTION

Moving to Houston from NYC/Chicago/Europe? 🚗

Let me save you some pain:

MYTH: "I'll Uber everywhere, I don't need a car"

REALITY: 
- Houston sprawl is REAL (everything is 15+ miles apart)
- Public transit is limited
- One client spent $300/month on Uber before buying a Honda

EXCEPTION:
If you live INSIDE the loop (Midtown, Montrose, Heights) - car optional ✅
OUTSIDE the loop? Car mandatory 🚗

Houston is two cities - know which one you're choosing.

Follow for more Houston truth bombs 💣

#houstontransit #needacar #movingtohouston #houstonreality #texaslife

---

## PRODUCTION CHECKLIST

- [ ] Script finalized
- [ ] Text overlays created
- [ ] Map visual created (optional)
- [ ] Filmed with energy
- [ ] Jump cuts edited
- [ ] Text synced to delivery
- [ ] Scheduled for 9am CST Sunday`
  },

  // Task 714 - All 5 subtasks (I toured 15 apartments)
  {
    parentTaskId: 714,
    title: "📚 Research Foundation",
    description: `## PERSONA: ALL AUDIENCES

**Profile:** Anyone in the apartment search process who wants to learn from someone else's experience.

**Key Evidence (Task 674, Subtask 3117):**
- 'touring apartments has been way more overwhelming than I expected'
- 'I feel like a dog chasing cars looking at all of these options!'
- 'every building is trying to offer a different kind of lifestyle'
- 'no one really explains what matters until you are already deep into the process'

---

## PAIN POINT: Overwhelm / Learning the Hard Way

**The Challenge:** Everyone makes the same mistakes when apartment hunting. Touring too many places, not knowing what to look for, falling for tricks.

**The Solution:** Learn from someone who already made the mistakes so you don't have to.

---

## WHY THIS COMBO WORKS

Story/Narrative framework creates personal connection. "I did this so you don't have to" is classic helpful content. The Save CTA is perfect for listicle content people want to reference later. Positions you as experienced guide.`
  },
  {
    parentTaskId: 714,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"I toured 15 apartments. Here's what I learned."**

## HOOK TYPE: 🔮 Curiosity

**Why It Works:**
- Specific number (15) adds credibility
- Personal experience = trust
- "What I learned" = curiosity gap
- Universal appeal - everyone tours apartments

## OPENING SCRIPT (First 3 Seconds)

**Word-for-word:**
*[Slightly tired but wiser energy]*
"15 tours. 3 weeks. 47 miles of driving."
*[direct to camera]*
"What did I learn?"

**Delivery Notes:**
- Play up the exhaustion slightly
- Numbers establish you've been through it
- "What did I learn" invites them in
- Energy: 6/10 - experienced, not hype
- Tired-but-wiser vibe

## SOURCE QUOTE
'touring apartments has been way more overwhelming than I expected' - Exactly what they're feeling`
  },
  {
    parentTaskId: 714,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: Story/Narrative (Lessons Learned)

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*Camera: Slightly tired but wiser energy*

"15 tours. 3 weeks. 47 miles of driving."
*[direct to camera]*
"What did I learn?"

---

**[0:05-0:45] 5 LESSONS**

*[text overlay: LESSON 1]*
"ONE - Photos LIE. Always. Ask for a VIDEO of the actual unit you'd be signing for. Not the model. YOUR unit."

*[jump cut, text overlay: LESSON 2]*
"TWO - Visit at NIGHT. That beautiful complex with the pool? At 10pm it might be a parking lot party. Tour during the day AND after dark."

*[jump cut, text overlay: LESSON 3]*
"THREE - Talk to residents in the parking lot. Just walk up and ask 'Hey, do you like living here?' They will tell you EVERYTHING. The leasing office won't."

*[jump cut, text overlay: LESSON 4]*
"FOUR - The best deals aren't advertised. Before you leave, ask: 'Do you have any move-in specials you're not posting online?' Half the time they do."

*[jump cut, text overlay: LESSON 5]*
"FIVE - Trust your GUT. If something feels off - weird smell, sketchy vibe, too-good-to-be-true price - it probably is. Walk away."

---

**[0:45-0:50] WRAP**

*[direct to camera, helpful]*

"15 apartments taught me those five things the hard way. Now you know without the driving."

---

## DELIVERY NOTES

- Tone: Experienced friend sharing wisdom
- Energy: 7/10 - helpful, slightly conspiratorial on tips
- Each lesson is a mini-revelation
- The parking lot tip should feel like insider knowledge
- "They will tell you EVERYTHING" - slight knowing smile
- Pace: quick but clear, each tip needs to land`
  },
  {
    parentTaskId: 714,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "Save this. It'll save you 15 tours."
**Type:** Soft (Save for Entertain/Educate)
**Goal:** Get saves (algorithm signal) + provide reference value

---

## CLOSING SCRIPT (Word-for-word)

**[0:50-0:58]**

*[Direct to camera, helpful]*

"Save this."

*[slight smile]*

"It'll save you 15 tours."

---

## DELIVERY NOTES

- Short, punchy close
- "Save this" is direct instruction
- "Save you 15 tours" = callback to hook
- Slight smile = friendly, not demanding
- Energy: 6/10 - helpful wrap-up
- Don't over-explain - the content spoke for itself

---

## WHY SAVE CTA WORKS HERE

- Listicle content = reference material people save
- Saves are strong algorithm signal (more than likes)
- "Save you 15 tours" = clear value proposition
- People actually WILL save useful tips content
- No ask for DM or follow - pure value play
- Builds trust for future promotional content`
  },
  {
    parentTaskId: 714,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** TikTok
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 55-60 seconds
**Post date:** Sunday, February 2, 2026
**Post time:** 12:00 PM CST

---

## FORMAT DETAILS

**Style:** Talking Head - Listicle/Tips
**Location:** Clean background
**Lighting:** Good lighting
**Audio:** Direct to camera
**Pacing:** Quick cuts between tips

**Text overlays needed:**
- "LESSON 1" through "LESSON 5"
- Optional: tip summaries

---

## CAPTION/DESCRIPTION

I toured 15 apartments so you don't have to 🏃

Here's what I learned:

1️⃣ Photos LIE - ask for video of YOUR actual unit
2️⃣ Visit at NIGHT - day tours hide the truth  
3️⃣ Talk to residents in the parking lot - they'll tell you everything
4️⃣ Ask about unadvertised specials - they exist
5️⃣ Trust your GUT - if it feels off, walk away

Save this - it'll save you 15 tours 🔖

#apartmenttour #lessonslearned #apartmenttips #houstonapartments #apartmenthunting

---

## PRODUCTION CHECKLIST

- [ ] Script finalized
- [ ] Text overlays created (5 lessons)
- [ ] Filmed with jump cuts
- [ ] Tired-but-wiser energy
- [ ] Each tip clearly delivered
- [ ] Quick pacing edited
- [ ] Scheduled for 12pm CST Sunday`
  },

  // Task 715 - All 5 subtasks (Remote worker WFH spots)
  {
    parentTaskId: 715,
    title: "📚 Research Foundation",
    description: `## PERSONA: YOUNG PROFESSIONAL (Task 673, Subtask 3116)

**Profile:** Remote workers looking for neighborhoods with good work-from-cafe culture.

**Key Evidence:**
- 'remote worker... looking for somewhere walkable'
- 'coffee shops, restaurants, workout studios'
- '28M remote worker' seeking quality of life
- Walkability + wifi + lifestyle balance priorities

---

## PAIN POINT: Finding Remote Work Paradise

**The Challenge:** Remote workers need more than just an apartment - they need a neighborhood that supports work-from-anywhere lifestyle.

**Key Needs:**
- Multiple cafe options (variety)
- Good wifi infrastructure
- Walkable to avoid commute
- Work-life balance amenities nearby

---

## WHY THIS COMBO WORKS

This is Promote pillar content targeting high-value young professional leads. Remote workers are often relocating or apartment hunting - perfect fit. The DM keyword captures leads with specific lifestyle needs you can serve.`
  },
  {
    parentTaskId: 715,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"Remote worker? Here are Houston's best work-from-cafe spots"**

## HOOK TYPE: ✅ Benefit

**Why It Works:**
- Identifies exact audience (remote worker)
- Benefit-forward (best spots)
- "Work-from-cafe" = lifestyle aspiration
- Practical, immediately useful

## OPENING SCRIPT (First 5 Seconds)

**Word-for-word:**
*[Friendly, lifestyle vibe]*
"Remote worker looking for your new home base?"
*[gesture]*
"These neighborhoods deliver."

**Delivery Notes:**
- "Home base" = both apartment and work spot
- Aspirational but practical tone
- Energy: 7/10 - enthusiastic guide
- Quick pace to set up the list

## SOURCE QUOTE
'remote worker... looking for somewhere walkable' - Exact use case`
  },
  {
    parentTaskId: 715,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: List/Tips (Top 3 Neighborhoods)

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*Camera: Friendly, lifestyle energy*

"Remote worker looking for your new home base?"
*[gesture]*
"These neighborhoods deliver."

---

**[0:05-0:40] TOP 3 WFH NEIGHBORHOODS**

*[text overlay: #1 MONTROSE]*
"Number one - MONTROSE."
"Coffee shops on every corner. Boomtown, Blacksmith, a dozen indie spots."
"Chill creative energy. Good wifi everywhere. This is remote worker heaven."

*[jump cut, text overlay: #2 HEIGHTS]*
"Number two - THE HEIGHTS."
"Quieter vibe for focus work. Great cafes along 19th Street."
"Less scene, more productivity. If you actually need to get stuff DONE."

*[jump cut, text overlay: #3 MUSEUM DISTRICT]*
"Number three - MUSEUM DISTRICT."
"Underrated for WFH. Libraries nearby if you need total quiet."
"Peaceful cafes. Parks for break walks. Very zen energy."

*[direct to camera]*
"And here's the key - all three have apartments WITHIN WALKING DISTANCE of these spots."
"So your commute is literally... walking downstairs."

---

## DELIVERY NOTES

- Tone: Helpful guide showing options
- Energy: 7/10 - enthusiastic but not manic
- Each neighborhood gets distinct personality
- "Remote worker heaven" should land with conviction
- "Actually need to get stuff DONE" = slight knowing look
- "Walking downstairs" = paint the lifestyle picture`
  },
  {
    parentTaskId: 715,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "DM me REMOTE for apartments near the best WFH spots"
**Type:** Medium (DM keyword for remote worker lead)
**Goal:** Capture high-value young professional remote worker leads

---

## CLOSING SCRIPT (Word-for-word)

**[0:40-0:55]**

*[Direct to camera, helpful]*

"Want to actually LIVE this lifestyle?"

*[lean in]*

"I know exactly which apartments are walking distance from the best cafes in each of these neighborhoods."

*[point at camera]*

"DM me REMOTE - I'll send you my list."

---

## DELIVERY NOTES

- "Actually LIVE this lifestyle" = aspirational language
- "I know exactly which apartments" = specific expertise
- "Walking distance from best cafes" = the unique value
- DM + keyword = clear action
- Energy: 7/10 - confident, helpful
- Point at camera creates connection

---

## WHY MEDIUM CTA WORKS HERE

- Promote pillar content = lead capture appropriate
- Remote workers are high-value relocator leads
- "REMOTE" keyword segments specific audience
- Lifestyle match = strong intent signal
- Low friction: DM is easy
- "My list" = curated value, worth the DM`
  },
  {
    parentTaskId: 715,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** YouTube Shorts
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 50-55 seconds
**Post date:** Sunday, February 2, 2026
**Post time:** 4:00 PM CST

---

## FORMAT DETAILS

**Style:** Neighborhood Guide - WFH Focus
**Location:** Clean background or cafe b-roll
**Lighting:** Good, professional
**Audio:** Direct to camera or voiceover

**Text overlays needed:**
- "#1 MONTROSE"
- "#2 HEIGHTS"  
- "#3 MUSEUM DISTRICT"
- "DM 'REMOTE'"

**Optional B-roll:**
- People working in cafes
- Coffee shop atmospheres
- Neighborhood walkability shots

---

## CAPTION/DESCRIPTION

Remote worker? These Houston neighborhoods are your paradise ☕💻

#1 MONTROSE
- Coffee shops everywhere
- Creative vibes, good wifi
- Remote worker heaven

#2 HEIGHTS  
- Quieter for focus work
- 19th Street cafe scene
- Get stuff DONE energy

#3 MUSEUM DISTRICT
- Libraries + peaceful cafes
- Parks for break walks
- Zen productivity vibes

Best part? Apartments within WALKING distance.

DM me "REMOTE" for my list of apartments near the best WFH spots 🏠

#remotework #wfh #houstoncoffee #digitalnomad #workfromcafe #houstonlife

---

## PRODUCTION CHECKLIST

- [ ] Script finalized
- [ ] Text overlays created
- [ ] B-roll of cafes (optional)
- [ ] Filmed with energy
- [ ] YouTube thumbnail created
- [ ] ManyChat keyword "REMOTE" set up
- [ ] Curated apartment list ready
- [ ] Scheduled for 4pm CST Sunday`
  },

  // Task 716 - All 5 subtasks (Why I started - personal story)
  {
    parentTaskId: 716,
    title: "📚 Research Foundation",
    description: `## PERSONA: ALL AUDIENCES

**Profile:** Anyone who wants to know the person behind the content - builds trust and connection.

---

## PAIN POINT: All Pain Points (Personal Experience)

This video references the universal struggles:
- Bait and switch photos (Task 674, Subtask 3148)
- Hidden fees nobody mentioned (Task 674, Subtask 3119)
- Neighborhood confusion (Task 674, Subtask 3122)
- Making mistakes, signing regrettable leases

---

## WHY PERSONAL STORY WORKS

**The Purpose:**
- Ends the week on a human note
- Builds trust through vulnerability
- Explains the "why" behind what you do
- Creates emotional connection
- Differentiates from faceless competitors

**The Story Arc:**
Setup → Conflict → Turning Point → Resolution

This is NOT about selling. It's about connecting.`
  },
  {
    parentTaskId: 716,
    title: "🎣 Hook & Opening",
    description: `## HOOK TEXT
**"Why I started helping people find apartments in Houston"**

## HOOK TYPE: 🔮 Curiosity (Personal Origin Story)

**Why It Works:**
- Origin stories create connection
- "Why" questions invite listening
- Personal = relatable
- People buy from people they trust

## OPENING SCRIPT (First 3 Seconds)

**Word-for-word:**
*[Vulnerable, personal tone]*
"Personal story time."
*[slight pause, direct to camera]*
"Here's why I do what I do."

**Delivery Notes:**
- Genuine, not performative vulnerability
- "Personal story time" signals this is different
- Slight pause creates anticipation
- Energy: 5/10 - calm, real, no hype
- Eye contact is crucial

## SOURCE QUOTE
Personal experience - no external source needed. Authenticity is the source.`
  },
  {
    parentTaskId: 716,
    title: "📝 Message Framework & Script",
    description: `## FRAMEWORK: Story/Narrative (Personal Origin)

---

## FULL SCRIPT (Word-for-word)

**[0:00-0:05] HOOK**
*Camera: Vulnerable, genuine*

"Personal story time."
*[slight pause, direct to camera]*
"Here's why I do what I do."

---

**[0:05-0:15] SETUP**

"I moved to Houston knowing nobody."
*[slight shake of head]*
"No family here. No friends. Just a job offer and a U-Haul."

---

**[0:15-0:35] CONFLICT**

"The apartment search was... brutal."

*[tick off on fingers]*
"Bait and switch photos. Hidden fees nobody warned me about. Neighborhoods I knew nothing about."

*[direct to camera, vulnerable]*
"I made mistakes. I signed a lease I regretted within a month."

"The walls were paper thin. The 'quiet neighborhood'? Next to a bar that blasted music until 2am."

"I felt stupid. I felt stuck. I spent a year counting down days until I could leave."

---

**[0:35-0:50] TURNING POINT + RESOLUTION**

"So when that lease was up, I obsessed."

"I spent two years learning every single neighborhood. Every apartment complex. Every landlord's reputation."

*[direct to camera, sincere]*

"I became the person I WISHED I had when I moved here."

*[slight pause]*

"Now I help people avoid the pain I went through. It's not about commissions. It's about getting you into the RIGHT place - so you don't spend a year counting down days like I did."

---

## DELIVERY NOTES

- Tone: Vulnerable, real, NOT salesy
- Energy: 5-6/10 - calm, sincere, human
- The "stupid, stuck" moment should feel genuine
- "2am bar music" = specific detail adds credibility
- "Person I wished I had" = the emotional core
- "Not about commissions" = addressing the objection preemptively
- This is relationship-building, not selling`
  },
  {
    parentTaskId: 716,
    title: "📣 CTA & Close",
    description: `## THE CTA

**Exact text:** "If this resonated, follow for more"
**Type:** Soft (Follow - Personal pillar, no hard sell)
**Goal:** Build connection, grow followers who trust you

---

## CLOSING SCRIPT (Word-for-word)

**[0:50-0:60]**

*[Direct to camera, warm]*

"That's my story."

*[slight smile]*

"If any of that resonated with you - if you're in the middle of your own apartment search and feeling lost..."

*[genuine]*

"Follow along. I've got you."

---

## DELIVERY NOTES

- "That's my story" = simple, vulnerable close
- "If that resonated" = conditional, not demanding
- "Feeling lost" = empathy, names their emotion
- "I've got you" = supportive, not salesy
- End with warmth, slight nod
- Energy: 5/10 - calm, human connection
- NO sales pitch - this is trust-building

---

## WHY SOFT CTA WORKS HERE

- Personal pillar content = NO hard sell ever
- Story just created emotional connection
- Hard CTA would break the spell
- "I've got you" is the softest possible ask
- Ends the week on authentic note
- People follow people they trust
- This plants seeds for future conversion`
  },
  {
    parentTaskId: 716,
    title: "🎬 Production & Distribution",
    description: `## PLATFORM SPECS

**Platform:** TikTok
**Dimensions:** 1080x1920 (9:16 vertical)
**Length:** 55-60 seconds
**Post date:** Sunday, February 2, 2026
**Post time:** 7:00 PM CST

---

## FORMAT DETAILS

**Style:** Talking Head - Personal Story
**Location:** Intimate setting (apartment, cozy background)
**Lighting:** Warm, soft (not harsh ring light)
**Audio:** Direct to camera, sincere delivery
**Tone:** Vulnerable, real, human

**NO text overlays needed** - this is pure storytelling

---

## CAPTION/DESCRIPTION

Why I do what I do 🏠

I moved to Houston knowing nobody. The apartment search was brutal.

- Bait and switch photos
- Hidden fees
- Signed a lease I regretted
- Paper thin walls, bar next door blasting until 2am
- Spent a year counting down days

So I obsessed. Spent 2 years learning every neighborhood, every complex, every landlord.

I became the person I wished I had when I moved here.

Now I help people avoid the pain I went through.

It's not about commissions. It's about getting you into the RIGHT place.

If this resonated, follow along. I've got you. ❤️

#mystory #whyido #houstonapartments #movingtotexas #personalbrand

---

## PRODUCTION NOTES

- This is the END OF WEEK video - finish strong with humanity
- NO sales pitch, NO hard CTA
- Genuine vulnerability > polished performance
- Practice but don't over-rehearse - authenticity matters
- Warm lighting, comfortable setting
- Single take sections, minimal cuts
- Let the story breathe

---

## PRODUCTION CHECKLIST

- [ ] Script internalized (not memorized word-for-word)
- [ ] Warm, intimate lighting set up
- [ ] Comfortable background/setting
- [ ] Filmed with genuine emotion
- [ ] Minimal editing - let story flow
- [ ] Caption written with heart
- [ ] Scheduled for 7pm CST Sunday (week closer)`
  }
];

async function createSubtasks() {
  const client = await pool.connect();
  
  try {
    let created = 0;
    
    for (const subtask of subtasks) {
      const result = await client.query(
        `INSERT INTO subtasks (parent_task_id, title, description, completed, sort_order, status, calendar_active)
         VALUES ($1, $2, $3, false, 0, 'not_started', false)
         RETURNING id`,
        [subtask.parentTaskId, subtask.title, subtask.description]
      );
      console.log(`Created: Task ${subtask.parentTaskId} - ${subtask.title} (ID: ${result.rows[0].id})`);
      created++;
    }
    
    console.log(`\n✅ Total subtasks created: ${created}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

createSubtasks().catch(console.error);
