/**
 * Predefined task templates for construction projects - Generated from CSV
 * These templates will be available for selection when associating materials with tasks,
 * even if they haven't been created as active tasks in the system yet.
 */

// Helper interface for task templates
export interface TaskTemplate {
  id: string; // Using a string ID format like "FN1" for easier identification
  title: string;
  description: string;
  tier1Category: string;
  tier2Category: string;
  category: string;
  estimatedDuration: number; // In days
}

// Organize templates by tier1 and tier2 categories
export interface TaskTemplateCollection {
  [tier1: string]: {
    [tier2: string]: TaskTemplate[];
  };
}

// Task template data from CSV file
// Foundation tasks
const foundationTasks: TaskTemplate[] = [
  {
    id: "FN1",
    title: "Form & Soil Preparation (FN1)",
    description: "Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper (CN31, CN32).",
    tier1Category: "Structural",
    tier2Category: "Foundation",
    category: "foundation",
    estimatedDuration: 3,
  },
  {
    id: "FN2",
    title: "Foundation Utilities Installation & Inspection (FN2)",
    description: "Install foundation stub plumbing (with foam collars, termite shields) and HVAC gas lines; inspect utility placement and integrity (CN33–35).",
    tier1Category: "Structural",
    tier2Category: "Foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN3",
    title: "Foundation Base & Reinforcement (FN3)",
    description: "Prepare foundation base with crushed stone; install vapor barrier, reinforcing wire mesh, and perimeter insulation (CN36–39).",
    tier1Category: "Structural",
    tier2Category: "Foundation",
    category: "foundation",
    estimatedDuration: 5,
  },
  {
    id: "FN4",
    title: "Foundation Concrete Scheduling & Pre-Pour Inspection (FN4)",
    description: "Schedule foundation concrete delivery and confirm finishers; inspect foundation forms and utility alignment before pour (CN40, CN41).",
    tier1Category: "Structural",
    tier2Category: "Foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN5",
    title: "Foundation Slab Pour, Finish & Final Inspection (FN5)",
    description: "Pour foundation slab promptly, complete professional finish; inspect slab smoothness, drainage, and correct defects (CN42–44).",
    tier1Category: "Structural",
    tier2Category: "Foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN6",
    title: "Foundation Concrete Payment (FN6)",
    description: "Pay concrete supplier upon satisfactory foundation slab inspection (CN45).",
    tier1Category: "Structural",
    tier2Category: "Foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
];

// Roofing tasks - Consolidated into comprehensive roofing project
const roofingTasks: TaskTemplate[] = [
  {
    id: "RF_COMPLETE",
    title: "Complete Roofing Installation Project",
    description: "COMPREHENSIVE ROOFING PROJECT including all phases:\n\n" +
                "1. PREPARATION & MATERIAL SELECTION (RF1-RF3):\n" +
                "• Select shingle style, color, and material\n" +
                "• Conduct bidding process for labor and materials\n" +
                "• Order shingles, felt, and verify specifications with roofer\n\n" +
                "2. EDGE PROTECTION & FLASHING (RF4 & RF6):\n" +
                "• Install 3 metal drip edges on eaves (under felt)\n" +
                "• Install rake edges (over felt)\n" +
                "• Install necessary flashing at walls and valleys\n\n" +
                "3. FELT & SHINGLE INSTALLATION (RF5 & RF7):\n" +
                "• Install roofing felt immediately after roof-deck inspection\n" +
                "• Install shingles starting appropriately based on roof width\n" +
                "• Account for weather conditions during installation\n\n" +
                "4. GUTTER COORDINATION (RF7A):\n" +
                "• Coordinate gutter installation to follow immediately after roofing completion\n\n" +
                "5. INSPECTION & PAYMENT (RF8 & RF9):\n" +
                "• Conduct thorough roofing inspection according to checklist and specifications\n" +
                "• Pay roofing subcontractor after obtaining signed affidavit\n" +
                "• Deduct worker's compensation if applicable",
    tier1Category: "Structural",
    tier2Category: "Roofing",
    category: "roofing",
    estimatedDuration: 23, // Sum of all individual durations (2+7+7+5+2)
  },
];

// Framing tasks - Individual and comprehensive templates
const framingTasks: TaskTemplate[] = [
  // Individual Framing Tasks (FR1-FR10)
  {
    id: "FR1",
    title: "Framing Bidding Process (FR1)",
    description: "Conduct competitive bidding process for materials and labor. Get quotes from multiple framing contractors and lumber suppliers. Compare pricing and evaluate contractor qualifications.",
    tier1Category: "Structural",
    tier2Category: "Framing", 
    category: "framing",
    estimatedDuration: 3
  },
  {
    id: "FR2",
    title: "Framing Crew Meeting & Project Review (FR2)",
    description: "Meet with selected framing crew to review project details, blueprints, and specifications. Discuss timeline, material requirements, and any special considerations.",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing", 
    estimatedDuration: 1
  },
  {
    id: "FR3",
    title: "Electrical Service Confirmation (FR3)",
    description: "Confirm electrical service is on order and temporary power will be available when framing starts. Coordinate with electrical contractor for service timing.",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing",
    estimatedDuration: 1
  },
  {
    id: "FR4", 
    title: "Special Materials Ordering (FR4)",
    description: "Place orders for special framing materials early (engineered beams, specialty lumber, hardware, etc.) to avoid delays during construction.",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing",
    estimatedDuration: 2
  },
  {
    id: "FR5",
    title: "Lumber Delivery & Storage (FR5)",
    description: "Receive and store framing lumber on flat, dry platform. Organize materials for efficient access and protect from weather.",
    tier1Category: "Structural", 
    tier2Category: "Framing",
    category: "framing",
    estimatedDuration: 1
  },
  {
    id: "FR6",
    title: "Site Layout for Framing (FR6)", 
    description: "Mark site layout for framing. Transfer measurements from foundation to establish wall locations and openings.",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing",
    estimatedDuration: 1
  },
  {
    id: "FR7",
    title: "Moisture Barrier Installation (FR7)",
    description: "Install moisture barrier on foundation walls. Ensure proper overlap and sealing to prevent moisture infiltration.",
    tier1Category: "Structural",
    tier2Category: "Framing", 
    category: "framing",
    estimatedDuration: 1
  },
  {
    id: "FR8",
    title: "Sill Plate Installation (FR8)",
    description: "Anchor pressure-treated sill plate to embedded anchor bolts. Check for level and square, using shims as needed.",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing",
    estimatedDuration: 2
  },
  {
    id: "FR9", 
    title: "Floor Joist Installation (FR9)",
    description: "Install floor joists using 2x10s or I-joists per plans. Check spacing, level, and proper bearing. Install bridging as required.",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing", 
    estimatedDuration: 3
  },
  {
    id: "FR10",
    title: "Subfloor Installation (FR10)",
    description: "Install exterior-grade tongue-and-groove plywood subfloor. Glue and nail per specifications. Check for squeaks and proper attachment.",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing",
    estimatedDuration: 2
  },
  // Comprehensive template 
  {
    id: "FR_COMPLETE",
    title: "Complete House Framing Project",
    description: "COMPREHENSIVE FRAMING PROJECT including all phases:\n\n" +
                "1. PLANNING & PREPARATION (FR1-FR4):\n" +
                "• Conduct competitive bidding process for materials and labor\n" +
                "• Meet with framing crew to review project details\n" +
                "• Confirm electrical service is on order\n" +
                "• Place orders for special materials early\n\n" +
                "2. SITE PREPARATION & SILL PLATE (FR5-FR8):\n" +
                "• Receive and store framing lumber on flat, dry platform\n" +
                "• Mark site layout for framing\n" +
                "• Install moisture barrier on foundation\n" +
                "• Anchor pressure-treated sill plate to embedded lag bolts\n\n" +
                "3. FIRST FLOOR CONSTRUCTION (FR9-FR10):\n" +
                "• Install floor joists using 2x10s or I-joists\n" +
                "• Install exterior-grade tongue-and-groove plywood subfloor\n" +
                "• Position large fixtures before framing partitions\n" +
                "• Frame exterior walls and first-floor partitions\n" +
                "• Plumb and line walls for proper alignment\n\n" +
                "4. SECOND FLOOR CONSTRUCTION:\n" +
                "• Frame and install second floor joists and subfloor\n" +
                "• Position large items before interior partitions\n" +
                "• Frame second floor exterior walls and partitions\n" +
                "• Install ceiling joists if roof is stick-built\n\n" +
                "5. ROOF FRAMING & DECKING (FR20-FR22):\n" +
                "• Frame roof using stick framing or prefab trusses\n" +
                "• Install roof deck with staggered 4x8 plywood sheets\n" +
                "• Use ply clips for stability between rafters\n" +
                "• Issue first framing payment (around 45%)\n\n" +
                "6. DRY-IN & FIREPLACE INSTALLATION:\n" +
                "• Apply lapped tar paper over roof deck\n" +
                "• Frame chimney chases with plywood or rain caps\n" +
                "• Install prefab fireplaces meeting minimum size requirements\n\n" +
                "7. ARCHITECTURAL FEATURES & SHEATHING (FR26-FR29):\n" +
                "• Build dormers, skylights, tray ceilings, bay windows\n" +
                "• Install sheathing on all exterior walls\n" +
                "• Inspect for gaps and seal minor issues\n\n" +
                "8. OPENINGS & BACKING:\n" +
                "• Remove temporary bracing\n" +
                "• Install exterior windows and doors with waterproofing\n" +
                "• Add dead wood backing for drywall and fixtures\n\n" +
                "9. FINAL FEATURES & INSPECTION:\n" +
                "• Install roof ventilators on rear side\n" +
                "• Frame decks with pressure-treated lumber\n" +
                "• Perform final framing inspection\n" +
                "• Schedule loan officer site visit for rough framing draw\n\n" +
                "10. PAYMENT & CONTRACT CLOSEOUT:\n" +
                "• Address any final framing issues\n" +
                "• Finalize payments and close out labor contracts",
    tier1Category: "Structural",
    tier2Category: "Framing",
    category: "framing",
    estimatedDuration: 60, // Sum of all individual durations (12 tasks × 5 days each)
  },
];

// Plumbing tasks
const plumbingTasks: TaskTemplate[] = [
  {
    id: "PL1",
    title: "Fixture Selection and Special Item Ordering (PL1)",
    description: "Determine type and quantity of plumbing fixtures (styles and colors), including: sinks (kitchen, baths, utility, wet bar, etc.), shower fixtures, toilets and toilet seats, exterior water spigots, water heater, garbage disposal, septic tank, sauna or steam room, water softener, refrigerator ice maker, and any other plumbing-related appliance. Order special plumbing fixtures well in advance, as supply houses rarely stock large quantities. (PL1 & PL4)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 7,
  },
  {
    id: "PL2",
    title: "Bidding Management and Material Confirmation (PL2)",
    description: "Conduct a standard bidding process. Shop prices carefully, as bids may vary significantly depending on material selections and the subcontractor’s pricing method. Decide on the type of piping to be used during this step. (PL2)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 2,
  },
  {
    id: "PL3",
    title: "Coordination of Site Walkthrough and Utility Planning (PL3)",
    description: "Walk through the site with the plumber to confirm placement of plumbing systems and any special fixtures. Account for exterior finish (e.g., brick veneer), as this affects the extension of exterior faucets. Also, mark the location of all fixtures (sinks, tubs, showers, toilets, outdoor spigots, wet bars, icemakers, utility tubs, washers, and water heater). Note vanity vs. pedestal sinks, drain end of tubs, and wall/ceiling areas to avoid for pipe runs (e.g., recessed lights or medicine cabinets). Apply for water connection and sewer tap, pay any required tap fee, and record the water meter number. Ask the plumber for a garden hose adapter for the water main. (PL3, PL5 & PL8)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 3,
  },
  {
    id: "PL4",
    title: "Stub Plumbing and Large Fixture Placement Before Framing (PL4)",
    description: "Install stub plumbing before concrete slab is poured—after batter boards and strings are set—and confirm sewer line location. Place all large fixtures (e.g., large tubs, fiberglass shower stalls, hot tubs) before framing begins to avoid clearance issues. Consider chaining expensive fixtures to studs or pipes for security. (PL6 & PL7)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 7,
  },
  {
    id: "PL5",
    title: "Rough-In Plumbing Installation, Protection, and Testing Oversight (PL5)",
    description: "Install rough-in plumbing: hot (left) and cold (right) water lines, sewer, and vent pipe. Pipes should run through drilled holes in studs (not notched), with all required supports in place. Use FHA metal straps to protect pipes from being punctured by drywall nails at cut-outs. Exterior spigots should not be located near pipe penetrations through the exterior wall—this prevents leaks from freezing or failure. Extend spigots outward to accommodate brick veneer. Conduct air-pressure testing on water pipes to ensure no leaks. Install the water meter and spigot early to provide masons with a water source. Mark pipe locations (especially water and gas lines) to avoid damage during digging. (PL9, PL10, PL11 & PL13)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 7,
  },
  {
    id: "PL6",
    title: "Rough-In Inspection, Corrections, and Payment Authorization (PL6)",
    description: "Schedule the plumbing inspector and be present during the inspection. No plumbing should be concealed before a rough-in certificate is issued. Use this opportunity to understand any required corrections and assess the plumber's workmanship. Correct any problems found using the power of county enforcement and leverage (i.e., plumber hasn’t been paid yet). Once approved, pay the plumber for rough-in and obtain a signed receipt or equivalent documentation. (PL12, PL14, PL15 & PL16)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 2,
  },
  {
    id: "PL7",
    title: "Final Fixture Installation and System Performance Testing (PL7)",
    description: "Install all previously selected fixtures: sinks, faucets, toilets, and shower heads. Tap into the main water supply and test the full system. Open all faucets to bleed out air and flush the lines. Expect temporary discoloration in the water as debris and solvents are cleared. (PL17 & PL18)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 7,
  },
  {
    id: "PL8",
    title: "Final Inspection, Corrections, Payment, and Compliance Documentation (PL8)",
    description: "Schedule and conduct the final plumbing inspection, ideally with the inspector present so you can clarify any issues. Address and correct all deficiencies found. Pay the plumbing subcontractor for final work and obtain a signed affidavit. Finally, pay the remaining plumber retainage to close out the project. (PL19, PL20, PL21 & PL22)",
    tier1Category: "Systems",
    tier2Category: "Plumbing",
    category: "plumbing",
    estimatedDuration: 2,
  },
];

// Hvac tasks
const hvacTasks: TaskTemplate[] = [
  {
    id: "HV1",
    title: "HVAC Energy Audit & Requirements (HV1)",
    description: "Conduct an energy audit (often with help from local gas/electric companies) to determine your home’s heating/cooling needs, decide whether to use a gas or electric dryer (and its location), and select the most suitable HVAC system by balancing cost and efficiency. (HV1, HV2)",
    tier1Category: "Systems",
    tier2Category: "HVAC",
    category: "hvac",
    estimatedDuration: 6,
  },
  {
    id: "HV2",
    title: "HVAC Bidding & Design (HV2)",
    description: "Manage the bidding process for the entire HVAC job (including a separate quote for ductwork), then finalize the HVAC system design by confirming equipment placement and the dryer exhaust location, ideally consulting with a gas company representative or inspector to prevent future issues. (HV3, HV4)",
    tier1Category: "Systems",
    tier2Category: "HVAC",
    category: "hvac",
    estimatedDuration: 6,
  },
  {
    id: "HV3",
    title: "HVAC Rough-In (Install, Inspect & Pay) (HV3)",
    description: "Install internal HVAC components (ducts, vents, returns) but hold off on external fixtures (like compressors) to avoid theft, schedule and attend the rough-in inspection with the county inspector, address any deficiencies noted, and then issue payment to the HVAC subcontractor for the rough-in phase—ensuring you receive a signed receipt. (HV5, HV6, HV7, HV8)",
    tier1Category: "Systems",
    tier2Category: "HVAC",
    category: "hvac",
    estimatedDuration: 7,
  },
  {
    id: "HV4",
    title: "HVAC Finish Work (HV4)",
    description: "Complete the HVAC system by installing the remaining components, such as the thermostat, registers, and the air conditioning compressor (charged with refrigerant), and verify the compressor’s placement (arranging for a concrete pad if needed). (HV9)",
    tier1Category: "Systems",
    tier2Category: "HVAC",
    category: "hvac",
    estimatedDuration: 6,
  },
  {
    id: "HV5",
    title: "HVAC Final Inspection, Gas Hookup & Payments (HV5)",
    description: "Schedule the final HVAC inspection (ideally with the HVAC subcontractor and electrician present), correct any new deficiencies, contact the gas company to hook up service lines, note the gas-line route on your plat diagram, and finalize all HVAC payments—including any retainage—once the system is tested and fully operational. (HV10, HV11, HV12, HV13, HV14, HV15)",
    tier1Category: "Systems",
    tier2Category: "HVAC",
    category: "hvac",
    estimatedDuration: 6,
  },
];

// Electrical tasks
const electricalTasks: TaskTemplate[] = [
  {
    id: "EL1",
    title: "Electrical: Determine requirements, fixtures, appliances, and bidding",
    description: "Determine electrical requirements by deciding where to place lighting fixtures, outlets, and switches. Make sure no switches are blocked by a door, and consider furniture placement. Even if your blueprint has an electrical diagram, verify or improve it. Investigate low voltage and fluorescent lighting, keeping in mind that fluorescent lights cannot be dimmed. Select electrical fixtures and appliances by visiting lighting distributor showrooms, looking especially for energy-saving fluorescent options (though these cannot use a dimmer). Place special orders early, and test the doorbell sound before buying. Conduct a standard bidding process, obtaining pricing for installing each outlet, switch, and fixture. Electricians typically charge extra for wiring the service panel and any special work; use only a licensed electrician. (EL1, EL2, EL4)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL2",
    title: "Electrical: Arrange phone wiring and jack installations",
    description: "Determine if the phone company charges to wire the home for a modular phone system and how much they charge. Even if you plan on using wireless phones, install phone jacks in several locations. Schedule the phone company (or an electrician, if it’s cheaper) to install modular phone wiring and jacks. Also consider transferring your existing phone number to your new home so you can keep the same number. (EL3, EL5)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 7,
  },
  {
    id: "EL3",
    title: "Electrical: Secure temporary hookup and install pole",
    description: "Apply for and obtain permission to hook up the temporary pole to the public power system, possibly placing a deposit. Arrange for the hookup early enough so that power is available by the time framing starts. Install the temporary electric pole within approximately 100 feet of the center of the house foundation (closer if possible). (EL6, EL7)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 7,
  },
  {
    id: "EL4",
    title: "Electrical: Oversee rough-in wiring (electrical, phone, cable, security)",
    description: "Perform rough-in electrical by running wiring through wall studs and ceiling joists. Mark locations where outlets and switches should go, or the electrician will place them at his discretion. Provide blocking near outlets if necessary. This ensures that lights, switches, and outlets align with furniture and other planned elements. Install modular phone wiring and jacks, as well as any other desired wiring, such as speaker, cable TV, security, or computer lines. Pre-wiring is much easier now than after the walls are closed up. Many security system contractors pre-wire for free if you purchase their system. (EL8, EL9)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 7,
  },
  {
    id: "EL5",
    title: "Electrical: Schedule rough-in inspection, corrections, and payment",
    description: "Schedule the electrical inspection (usually done by the electrician). Once the county inspector reviews and signs off on the rough-in wiring, correct any issues they note. After the inspection is passed and any corrections are made, pay the electrical subcontractor for the rough-in work, keeping a receipt or proof of payment. (EL10, EL11, EL12, EL13)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL6",
    title: "Electrical: Coordinate garage doors and electric openers",
    description: "Install garage doors first (often handled by a specialist, not the electrician). Ensure that the garage door is properly in place so the electrician can hook up the opener. Next, install electric garage door openers and wire the necessary electrical connections. Keep remote controls in a secure location. (EL14, EL15)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 7,
  },
  {
    id: "EL7",
    title: "Electrical: Supervise finish installations, final inspections, and activate services",
    description: "Perform all finish electrical work, terminating wiring for switches, outlets, and other devices. Install major appliances such as refrigerators, washers, dryers, ovens, vent hoods, garage door openers, exhaust fans, and doorbells; the air compressor is also wired at this stage. Call the phone company to connect service. Schedule a final electrical inspection and have the electrician present to address any last-minute issues. Store appliance manuals and warranties safely. Correct any electrical problems if they arise, and then call the electrical utility to connect service. (EL16, EL17, EL18, EL19, EL20)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL8",
    title: "Electrical: Final payment, affidavit, and retainage",
    description: "Pay the electrical subcontractor the final amount, ensuring you get an affidavit signed. After power is turned on and all switches and outlets have been tested, pay the retainage (remaining balance) to fully finalize the contract. (EL21, EL22)",
    tier1Category: "Systems",
    tier2Category: "Electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
];

// Exteriors tasks
const exteriorsTasks: TaskTemplate[] = [
  {
    id: "SC1",
    title: "Select Siding materials, color, and style; conduct bidding. (SC1)",
    description: "Choose appropriate siding materials that match the desired aesthetic and performance requirements. Consider color, style, and coverage needs. Once decided, conduct a standard bidding process to compare pricing and contractor offerings. SC1, SC2",
    tier1Category: "Finishings",
    tier2Category: "Windows",
    category: "exteriors",
    estimatedDuration: 2,
  },
  {
    id: "SC2",
    title: "Order Windows/doors; verify dimensions and install correctly. (SC2)",
    description: "Order all necessary windows and doors, ensuring that the dimensions are verified precisely before delivery. During installation, use proper shims, secure locks, and install all hardware according to manufacturer specifications for durability and performance. SC3, SC4",
    tier1Category: "Finishings",
    tier2Category: "Windows",
    category: "exteriors",
    estimatedDuration: 7,
  },
  {
    id: "SC3",
    title: "Oversee Siding install, trim, caulking, inspection, and payments. (SC3)",
    description: "Supervise the installation of siding elements including flashing, trim, and caulking. Conduct a thorough inspection of the completed work, resolve any identified deficiencies, manage subcontractor payments while holding retainage as agreed, and ensure solutions are in place for material shrinkage over time. SC5, SC6, SC7, SC8, SC9, SC10, SC15, SC17",
    tier1Category: "Finishings",
    tier2Category: "Windows",
    category: "exteriors",
    estimatedDuration: 2,
  },
  {
    id: "SC4",
    title: "Install Siding cornice; inspect, fix issues, and release retainage. (SC4)",
    description: "Install all cornice components including fascia, frieze boards, soffits, and eave vents. Schedule and complete an official inspection, correct any problems noted, handle final payment to the subcontractor, and release retainage once the work is approved. SC11, SC12, SC13, SC14, SC18",
    tier1Category: "Finishings",
    tier2Category: "Windows",
    category: "exteriors",
    estimatedDuration: 7,
  },
  {
    id: "SC5",
    title: "Arrange Siding trim painting and caulking. (SC5)",
    description: "Coordinate the painting and caulking of exterior trim to ensure a weather-resistant and visually consistent finish. SC16",
    tier1Category: "Finishings",
    tier2Category: "Windows",
    category: "exteriors",
    estimatedDuration: 5,
  },
];

// Drywall tasks
const drywallTasks: TaskTemplate[] = [
  {
    id: "DR7",
    title: "Finalize Drywall Subcontract – DR7",
    description: "Pay the drywall subcontractor, collect a signed affidavit, and release final retainage after confirming quality, ideally post-first paint coat. (DR7, DR8)",
    tier1Category: "Finishings",
    tier2Category: "Drywall",
    category: "drywall",
    estimatedDuration: 5,
  },
  {
    id: "DR1",
    title: "Manage Drywall Procurement – DR1",
    description: "Handle the drywall bidding process, refer to contract specs, ask painters for quality sub referrals, and order materials if not supplied. Mark stud locations on floors before installation. (DR1, DR2)",
    tier1Category: "Finishings",
    tier2Category: "Drywall",
    category: "drywall",
    estimatedDuration: 5,
  },
  {
    id: "DR3",
    title: "Install and Finish Drywall – DR3",
    description: "Hang drywall on all walls with metal edging on outside corners and tape on inside corners. Spackle and sand all joints and nail dimples through multiple coats to achieve a smooth finish. (DR3, DR4)",
    tier1Category: "Finishings",
    tier2Category: "Drywall",
    category: "drywall",
    estimatedDuration: 7,
  },
  {
    id: "DR5",
    title: "Inspect and Repair Drywall – DR5",
    description: "Use angled lighting to inspect drywall surfaces. Mark imperfections with a pencil and coordinate repairs. Save large scraps for potential future use. (DR5, DR6)",
    tier1Category: "Finishings",
    tier2Category: "Drywall",
    category: "drywall",
    estimatedDuration: 5,
  },
];

// Barriers tasks - Consolidated into comprehensive insulation task
const barriersTasks: TaskTemplate[] = [
  {
    id: "IN_COMPLETE",
    title: "Complete Insulation & Vapor Barrier Installation",
    description: "COMPREHENSIVE INSULATION PROJECT including all phases:\n\n" +
                "1. PLANNING & BIDDING (IN1-IN2):\n" +
                "• Determine insulation requirements with local energy guidelines\n" +
                "• Perform standard bidding process to select subcontractor\n\n" +
                "2. WALL & BATHROOM INSULATION (IN3-IN4):\n" +
                "• Install wall insulation in small spaces, around chimneys, offsets, and pipe penetrations\n" +
                "• Ensure vapor barrier is securely stapled\n" +
                "• Install soundproofing insulation in bathrooms for noise control\n\n" +
                "3. FLOOR & ATTIC INSULATION (IN5-IN6):\n" +
                "• Install floor insulation in crawl spaces and basement foundations using fiberglass and foam-in techniques\n" +
                "• Install attic insulation using batts or blown-in material\n" +
                "• Layer properly to reduce air leaks and protect HVAC vents\n\n" +
                "4. INSPECTION & CORRECTIONS (IN7-IN8):\n" +
                "• Inspect insulation work for vapor barrier placement and thorough sealing\n" +
                "• Check around fixtures, plumbing, doors, and windows\n" +
                "• Correct any issues found during inspection\n\n" +
                "5. FINAL PAYMENT (IN9-IN10):\n" +
                "• Pay insulation subcontractor and obtain signed affidavit\n" +
                "• Pay remaining retainage after final approval",
    tier1Category: "Finishings",
    tier2Category: "Insulation",
    category: "barriers",
    estimatedDuration: 23, // Sum of all individual durations (2+7+7+5+2)
  },
];

// Landscaping tasks
const landscapingTasks: TaskTemplate[] = [
  {
    id: "LD1",
    title: "Evaluate and Plan Landscaping Site – LD1",
    description: "Evaluate the lot for trees, drainage, sun exposure, and home position. Develop and finalize a site plan with a landscape architect. Submit plans to officials and bank. (LD1, LD2, LD3, LD4, LD5, LD6)",
    tier1Category: "Sheathing",
    tier2Category: "Landscaping",
    category: "landscaping",
    estimatedDuration: 5,
  },
  {
    id: "LD7",
    title: "Prepare Lot with Fill and Soil – LD7",
    description: "Deliver clean, dry fill dirt and separate topsoil. Pay landscape architect if hired. (LD7, LD8)",
    tier1Category: "Sheathing",
    tier2Category: "Landscaping",
    category: "landscaping",
    estimatedDuration: 5,
  },
  {
    id: "LD9",
    title: "Test and Treat Soil – LD9",
    description: "Conduct soil tests, till the soil, apply conditioners, and treat as needed with fertilizer or gypsum. (LD9, LD10, LD11)",
    tier1Category: "Sheathing",
    tier2Category: "Landscaping",
    category: "landscaping",
    estimatedDuration: 5,
  },
  {
    id: "LD12",
    title: "Install Base Landscaping Systems – LD12",
    description: "Install underground sprinklers and plant flower bulbs. (LD12, LD13)",
    tier1Category: "Sheathing",
    tier2Category: "Landscaping",
    category: "landscaping",
    estimatedDuration: 7,
  },
  {
    id: "LD14",
    title: "Apply Grass and Water Lawn – LD14",
    description: "Apply seed or sod, soak lawn or sprinkle lightly depending on method, and roll with a heavy cylinder. (LD14, LD15)",
    tier1Category: "Sheathing",
    tier2Category: "Landscaping",
    category: "landscaping",
    estimatedDuration: 5,
  },
  {
    id: "LD16",
    title: "Plant and Prepare Landscape Features – LD16",
    description: "Install bushes and trees, prepare landscaped islands with mulch or straw, and install the mailbox if needed. (LD16, LD17, LD18)",
    tier1Category: "Sheathing",
    tier2Category: "Landscaping",
    category: "landscaping",
    estimatedDuration: 5,
  },
  {
    id: "LD19",
    title: "Inspect and Finalize Landscaping – LD19",
    description: "Inspect all landscaping work, correct any issues, pay the landscaping subcontractor, and release retainage once grass is established. (LD19, LD20, LD21, LD22)",
    tier1Category: "Sheathing",
    tier2Category: "Landscaping",
    category: "landscaping",
    estimatedDuration: 5,
  },
];

// Trim tasks
const trimTasks: TaskTemplate[] = [
  {
    id: "TR1",
    title: "Plan Trim Materials and Treatments – TR1",
    description: "Determine trim needs, review millwork samples, mark walls for different treatments, and select moulding, window, and door frames. (TR1, TR2)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 5,
  },
  {
    id: "TR3",
    title: "Install Trim Windows and Doors – TR3",
    description: "Install windows and exterior doors after framing. Emphasize high-quality trim around visible openings. Conduct standard bidding process. (TR3, TR4)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 7,
  },
  {
    id: "TR5",
    title: "Install Interior Doors and Casings – TR5",
    description: "Install interior doors, adjust door stops, and add window casings, aprons, and trim for cased openings. (TR5, TR6, TR7)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 7,
  },
  {
    id: "TR8",
    title: "Install Trim Moulding Details – TR8",
    description: "Add staircase moulding, crown moulding, base/base cap moulding, chair rails, and picture moulding. (TR8, TR9, TR10, TR11, TR12)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 7,
  },
  {
    id: "TR13",
    title: "Finish and Protect Trim Elements – TR13",
    description: "Install, sand, and stain paneling. Clean sliding door tracks and install thresholds, weather stripping, and shoe moulding. (TR13, TR14, TR15, TR16)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 5,
  },
  {
    id: "TR17",
    title: "Add Trim Hardware and Security – TR17",
    description: "Install hardware: door knobs, stops, locks, window hardware. Re-key locks and secure sliding doors. (TR17)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 5,
  },
  {
    id: "TR18",
    title: "Inspect and Correct Trim Work – TR18",
    description: "Inspect all trim work, correct imperfections, and complete any stain touch-ups. (TR18, TR19)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 5,
  },
  {
    id: "TR20",
    title: "Finalize Trim Subcontract – TR20",
    description: "Pay the trim subcontractor upon completion. (TR20)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "trim",
    estimatedDuration: 5,
  },
];

// Cabinentry tasks
const cabinentryTasks: TaskTemplate[] = [
  {
    id: "CB1",
    title: "Plan Cabinetry Design and Layout – CB1",
    description: "Confirm kitchen design, select cabinetry and countertop styles/colors, and complete layout diagrams for kitchen and baths. Include plumbing connection locations. (CB1, CB2, CB3)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 3,
  },
  {
    id: "CB4",
    title: "Coordinate Cabinetry Procurement – CB4",
    description: "Perform bidding process, purchase or construct cabinetry and countertops. Coordinate with subs, confirm appliance dimensions, and walk through structure to verify measurements after framing. (CB4, CB5)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 5,
  },
  {
    id: "CB6",
    title: "Finish Cabinetry Surfaces – CB6",
    description: "Stain, seal, or paint all cabinet woodwork before installation to avoid staining other areas. (CB6)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 5,
  },
  {
    id: "CB7",
    title: "Install Cabinetry Fixtures – CB7",
    description: "Install bathroom vanities, kitchen wall and base cabinets, making necessary cutouts. Install utility room cabinetry and countertops. (CB7, CB8, CB9, CB10, CB12)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 7,
  },
  {
    id: "CB11",
    title: "Install Cabinetry Hardware – CB11",
    description: "Install and adjust all hardware including pulls, hinges, and related fixtures. (CB11)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 7,
  },
  {
    id: "CB13",
    title: "Seal and Finish Cabinetry – CB13",
    description: "Caulk all joints between cabinetry and walls for a finished appearance. (CB13)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 5,
  },
  {
    id: "CB14",
    title: "Inspect and Touch Up Cabinetry – CB14",
    description: "Inspect all cabinetry and countertops, and repair any marks or scratches. (CB14, CB15)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 5,
  },
  {
    id: "CB16",
    title: "Finalize Cabinetry Subcontract – CB16",
    description: "Pay the cabinetry subcontractor and obtain a signed affidavit. (CB16)",
    tier1Category: "Sheathing",
    tier2Category: "Fixtures",
    category: "cabinentry",
    estimatedDuration: 5,
  },
];

// Flooring tasks
const flooringTasks: TaskTemplate[] = [
  {
    id: "FL1",
    title: "Select Flooring Materials and Coverage – FL1",
    description: "Choose carpet, hardwood, vinyl, and tile types, brands, colors, styles, and coverage. Limit variations for better pricing and less waste. (FL1, FL2, FL3, FL4)",
    tier1Category: "Sheathing",
    tier2Category: "Flooring",
    category: "flooring",
    estimatedDuration: 5,
  },
  {
    id: "FL5",
    title: "Conduct Flooring Bidding Process – FL5",
    description: "Get bids from suppliers and installers for flooring materials and labor. Use specialists for best pricing and installation options. (FL5)",
    tier1Category: "Sheathing",
    tier2Category: "Flooring",
    category: "flooring",
    estimatedDuration: 2,
  },
  {
    id: "FL6",
    title: "Order and Prepare Tile Installation – FL6",
    description: "Order tile and grout, ensuring consistent batches. Clean and prep the subfloor, fix squeaks, and install tile bases in showers. (FL6, FL7, FL8)",
    tier1Category: "Sheathing",
    tier2Category: "Flooring",
    category: "flooring",
    estimatedDuration: 7,
  },
  {
    id: "FL9",
    title: "Install Tile Flooring and Thresholds – FL9",
    description: "Apply tile adhesive, install tile and marble thresholds with spacers, and ensure secure tubs. Save extra tiles for future repairs. (FL9, FL10)",
    tier1Category: "Sheathing",
    tier2Category: "Flooring",
    category: "flooring",
    estimatedDuration: 7,
  },
  {
    id: "FL11",
    title: "Grout and Seal Tile Flooring – FL11",
    description: "Apply grout and sealant, inspect work, correct any issues, and seal grout after curing for three weeks. (FL11, FL12, FL13, FL14)",
    tier1Category: "Sheathing",
    tier2Category: "Flooring",
    category: "flooring",
    estimatedDuration: 5,
  },
  {
    id: "FL15",
    title: "Finalize Tile Subcontract – FL15",
    description: "Pay tile subcontractor and retainage after confirming floor stability and proper adhesion. Get a signed affidavit. (FL15, FL16)",
    tier1Category: "Sheathing",
    tier2Category: "Flooring",
    category: "flooring",
    estimatedDuration: 5,
  },
];

// Software Engineering tasks
const devopsTasks: TaskTemplate[] = [
  {
    id: "DO1",
    title: "Set Up Development Environment (DO1)",
    description: "Configure development tools, IDE setup, version control, and local development environment for all team members.",
    tier1Category: "Software Engineering",
    tier2Category: "DevOps & Infrastructure",
    category: "devops",
    estimatedDuration: 2
  },
  {
    id: "DO2", 
    title: "Configure CI/CD Pipeline (DO2)",
    description: "Set up continuous integration and deployment pipeline with automated testing, builds, and deployment processes.",
    tier1Category: "Software Engineering",
    tier2Category: "DevOps & Infrastructure", 
    category: "devops",
    estimatedDuration: 5
  },
  {
    id: "DO3",
    title: "Infrastructure Setup (DO3)",
    description: "Set up cloud infrastructure, databases, servers, and networking configuration for development and production environments.",
    tier1Category: "Software Engineering",
    tier2Category: "DevOps & Infrastructure",
    category: "devops", 
    estimatedDuration: 7
  },
  {
    id: "DO4",
    title: "Monitoring & Alerting (DO4)",
    description: "Implement application monitoring, logging, error tracking, and alerting systems for production applications.",
    tier1Category: "Software Engineering",
    tier2Category: "DevOps & Infrastructure",
    category: "devops",
    estimatedDuration: 3
  }
];

const architectureTasks: TaskTemplate[] = [
  {
    id: "AR1",
    title: "System Architecture Design (AR1)",
    description: "Design overall system architecture, define components, data flow, and integration patterns for the application.",
    tier1Category: "Software Engineering",
    tier2Category: "Architecture & Platform",
    category: "architecture",
    estimatedDuration: 5
  },
  {
    id: "AR2",
    title: "Technology Stack Selection (AR2)", 
    description: "Evaluate and select appropriate technologies, frameworks, databases, and third-party services for the project.",
    tier1Category: "Software Engineering",
    tier2Category: "Architecture & Platform",
    category: "architecture",
    estimatedDuration: 3
  },
  {
    id: "AR3",
    title: "Database Design & Schema (AR3)",
    description: "Design database schema, relationships, indexes, and data migration strategies for optimal performance.",
    tier1Category: "Software Engineering", 
    tier2Category: "Architecture & Platform",
    category: "architecture",
    estimatedDuration: 4
  }
];

const developmentTasks: TaskTemplate[] = [
  {
    id: "DE1",
    title: "Frontend Development (DE1)",
    description: "Implement user interface components, responsive design, and client-side functionality using modern frontend frameworks.",
    tier1Category: "Software Engineering",
    tier2Category: "Application Development",
    category: "development",
    estimatedDuration: 10
  },
  {
    id: "DE2",
    title: "Backend API Development (DE2)",
    description: "Build RESTful APIs, business logic, authentication, and database integration for server-side functionality.",
    tier1Category: "Software Engineering",
    tier2Category: "Application Development", 
    category: "development",
    estimatedDuration: 12
  },
  {
    id: "DE3",
    title: "Mobile App Development (DE3)",
    description: "Develop native or cross-platform mobile applications with platform-specific features and responsive design.",
    tier1Category: "Software Engineering",
    tier2Category: "Application Development",
    category: "development",
    estimatedDuration: 15
  }
];

const qualityTasks: TaskTemplate[] = [
  {
    id: "QA1",
    title: "Unit Testing & Test Coverage (QA1)",
    description: "Write comprehensive unit tests, integration tests, and achieve target test coverage for reliable code quality.",
    tier1Category: "Software Engineering",
    tier2Category: "Quality & Security",
    category: "testing",
    estimatedDuration: 5
  },
  {
    id: "QA2",
    title: "Security Audit & Penetration Testing (QA2)",
    description: "Conduct security assessment, vulnerability testing, and implement security best practices for data protection.",
    tier1Category: "Software Engineering",
    tier2Category: "Quality & Security",
    category: "security",
    estimatedDuration: 7
  },
  {
    id: "QA3", 
    title: "Performance Testing & Optimization (QA3)",
    description: "Test application performance, identify bottlenecks, and optimize for speed, scalability, and resource usage.",
    tier1Category: "Software Engineering",
    tier2Category: "Quality & Security",
    category: "performance",
    estimatedDuration: 4
  }
];

// Product Management tasks
const strategyTasks: TaskTemplate[] = [
  {
    id: "PM1",
    title: "Product Vision & Strategy (PM1)",
    description: "Define product vision, mission, strategic goals, and long-term roadmap aligned with business objectives.",
    tier1Category: "Product Management",
    tier2Category: "Strategy & Vision", 
    category: "strategy",
    estimatedDuration: 5
  },
  {
    id: "PM2",
    title: "Market Analysis & Competitive Research (PM2)",
    description: "Analyze target market, competitor landscape, pricing strategies, and market positioning opportunities.",
    tier1Category: "Product Management",
    tier2Category: "Strategy & Vision",
    category: "strategy",
    estimatedDuration: 7
  },
  {
    id: "PM3",
    title: "Success Metrics & KPIs (PM3)",
    description: "Define key performance indicators, success metrics, and measurement framework for product success.",
    tier1Category: "Product Management",
    tier2Category: "Strategy & Vision",
    category: "strategy", 
    estimatedDuration: 3
  }
];

const researchTasks: TaskTemplate[] = [
  {
    id: "RE1",
    title: "User Research & Interviews (RE1)",
    description: "Conduct user interviews, surveys, and research to understand user needs, pain points, and behaviors.",
    tier1Category: "Product Management",
    tier2Category: "Discovery & Research",
    category: "research",
    estimatedDuration: 8
  },
  {
    id: "RE2",
    title: "Market Validation & Testing (RE2)",
    description: "Validate product concepts through MVP testing, A/B testing, and user feedback collection.",
    tier1Category: "Product Management",
    tier2Category: "Discovery & Research",
    category: "research",
    estimatedDuration: 6
  },
  {
    id: "RE3",
    title: "Requirements Gathering (RE3)",
    description: "Gather and document functional requirements, user stories, and acceptance criteria for development.",
    tier1Category: "Product Management",
    tier2Category: "Discovery & Research",
    category: "requirements",
    estimatedDuration: 4
  }
];

const roadmapTasks: TaskTemplate[] = [
  {
    id: "RM1",
    title: "Product Roadmap Planning (RM1)",
    description: "Create detailed product roadmap with feature prioritization, timeline estimates, and resource allocation.",
    tier1Category: "Product Management",
    tier2Category: "Roadmap & Prioritization",
    category: "planning",
    estimatedDuration: 5
  },
  {
    id: "RM2",
    title: "Feature Prioritization (RM2)",
    description: "Prioritize features based on user value, business impact, technical complexity, and strategic alignment.",
    tier1Category: "Product Management",
    tier2Category: "Roadmap & Prioritization", 
    category: "planning",
    estimatedDuration: 3
  },
  {
    id: "RM3",
    title: "Sprint Planning & Backlog Management (RM3)",
    description: "Plan development sprints, manage product backlog, and coordinate with engineering teams for delivery.",
    tier1Category: "Product Management",
    tier2Category: "Roadmap & Prioritization",
    category: "planning",
    estimatedDuration: 2
  }
];

const deliveryTasks: TaskTemplate[] = [
  {
    id: "DL1",
    title: "Release Planning & Management (DL1)",
    description: "Plan product releases, coordinate launch activities, and manage release communications and rollout.",
    tier1Category: "Product Management",
    tier2Category: "Delivery & Lifecycle",
    category: "delivery",
    estimatedDuration: 4
  },
  {
    id: "DL2",
    title: "Product Analytics & Metrics (DL2)",
    description: "Set up product analytics, track user behavior, and analyze performance metrics for data-driven decisions.",
    tier1Category: "Product Management",
    tier2Category: "Delivery & Lifecycle",
    category: "analytics",
    estimatedDuration: 3
  },
  {
    id: "DL3",
    title: "Customer Feedback & Iteration (DL3)", 
    description: "Collect customer feedback, analyze usage patterns, and iterate on product features based on insights.",
    tier1Category: "Product Management",
    tier2Category: "Delivery & Lifecycle",
    category: "feedback",
    estimatedDuration: 5
  },
  {
    id: "DL4",
    title: "Product Lifecycle Management (DL4)",
    description: "Manage product lifecycle from launch to maturity, including feature deprecation and evolution planning.",
    tier1Category: "Product Management",
    tier2Category: "Delivery & Lifecycle",
    category: "lifecycle",
    estimatedDuration: 6
  }
];

// Design/UX tasks  
const uxResearchTasks: TaskTemplate[] = [
  {
    id: "UX1",
    title: "User Experience Research (UX1)",
    description: "Conduct UX research including user personas, journey mapping, and usability studies to inform design decisions.",
    tier1Category: "Design / UX",
    tier2Category: "Research and Usability",
    category: "ux",
    estimatedDuration: 6
  },
  {
    id: "UX2",
    title: "Usability Testing & Validation (UX2)",
    description: "Plan and execute usability testing sessions, analyze results, and validate design solutions with real users.",
    tier1Category: "Design / UX", 
    tier2Category: "Research and Usability",
    category: "usability",
    estimatedDuration: 5
  },
  {
    id: "UX3",
    title: "Accessibility Audit & Compliance (UX3)",
    description: "Audit designs for accessibility compliance, implement WCAG guidelines, and ensure inclusive user experiences.",
    tier1Category: "Design / UX",
    tier2Category: "Research and Usability",
    category: "accessibility",
    estimatedDuration: 4
  },
  {
    id: "UX4",
    title: "Design System & Style Guide (UX4)",
    description: "Create comprehensive design system with components, patterns, and style guide for consistent user experience.",
    tier1Category: "Design / UX",
    tier2Category: "Research and Usability", 
    category: "design-system",
    estimatedDuration: 8
  }
];

const uiDesignTasks: TaskTemplate[] = [
  {
    id: "UI1",
    title: "Wireframing & Information Architecture (UI1)",
    description: "Create wireframes, site maps, and information architecture to structure user interface and navigation.",
    tier1Category: "Design / UX",
    tier2Category: "UI/UX Design",
    category: "wireframing",
    estimatedDuration: 4
  },
  {
    id: "UI2",
    title: "High-Fidelity UI Design (UI2)", 
    description: "Design high-fidelity user interface mockups with visual hierarchy, typography, and color schemes.",
    tier1Category: "Design / UX",
    tier2Category: "UI/UX Design",
    category: "ui-design",
    estimatedDuration: 8
  },
  {
    id: "UI3",
    title: "Interactive Prototyping (UI3)",
    description: "Create interactive prototypes to demonstrate user flows, transitions, and micro-interactions for stakeholder review.",
    tier1Category: "Design / UX",
    tier2Category: "UI/UX Design",
    category: "prototyping", 
    estimatedDuration: 6
  }
];

const visualDesignTasks: TaskTemplate[] = [
  {
    id: "VD1",
    title: "Brand Identity & Visual Language (VD1)",
    description: "Develop brand identity, logo design, color palette, and visual language that aligns with product positioning.",
    tier1Category: "Design / UX",
    tier2Category: "Visual Design",
    category: "branding",
    estimatedDuration: 7
  },
  {
    id: "VD2",
    title: "Graphic Design & Assets (VD2)",
    description: "Create graphic design assets, illustrations, icons, and marketing materials for product and promotional use.",
    tier1Category: "Design / UX",
    tier2Category: "Visual Design",
    category: "graphics",
    estimatedDuration: 5
  },
  {
    id: "VD3",
    title: "Motion Design & Animations (VD3)",
    description: "Design motion graphics, animations, and micro-interactions to enhance user experience and engagement.",
    tier1Category: "Design / UX", 
    tier2Category: "Visual Design",
    category: "motion",
    estimatedDuration: 4
  }
];

const interactionTasks: TaskTemplate[] = [
  {
    id: "IX1",
    title: "User Flow Design (IX1)",
    description: "Map user flows, task flows, and user journeys to optimize the path users take through the application.",
    tier1Category: "Design / UX",
    tier2Category: "Interaction Design", 
    category: "user-flows",
    estimatedDuration: 5
  },
  {
    id: "IX2",
    title: "Interaction Patterns & Micro-interactions (IX2)",
    description: "Design interaction patterns, micro-interactions, and feedback mechanisms for intuitive user experiences.",
    tier1Category: "Design / UX",
    tier2Category: "Interaction Design",
    category: "interactions",
    estimatedDuration: 4
  },
  {
    id: "IX3",
    title: "Cross-Platform Design Consistency (IX3)",
    description: "Ensure consistent interaction design across web, mobile, and other platforms while respecting platform conventions.",
    tier1Category: "Design / UX",
    tier2Category: "Interaction Design",
    category: "cross-platform",
    estimatedDuration: 6
  }
];

// Marketing/GTM tasks
const positioningTasks: TaskTemplate[] = [
  {
    id: "MK1",
    title: "Brand Positioning & Messaging (MK1)",
    description: "Develop brand positioning, key messaging, value propositions, and differentiation strategy for target markets.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Positioning & Messaging",
    category: "positioning",
    estimatedDuration: 5
  },
  {
    id: "MK2",
    title: "Content Strategy & Creation (MK2)",
    description: "Create content strategy, blog posts, whitepapers, case studies, and marketing materials for audience engagement.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Positioning & Messaging",
    category: "content",
    estimatedDuration: 8
  },
  {
    id: "MK3",
    title: "Competitor Analysis & Market Intelligence (MK3)",
    description: "Analyze competitor strategies, pricing, positioning, and market trends to inform marketing strategy.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Positioning & Messaging",
    category: "competitive",
    estimatedDuration: 4
  },
  {
    id: "MK4",
    title: "Brand Guidelines & Voice (MK4)",
    description: "Establish brand guidelines, voice and tone, messaging framework, and communication standards.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Positioning & Messaging",
    category: "branding",
    estimatedDuration: 3
  }
];

const demandGenTasks: TaskTemplate[] = [
  {
    id: "DG1", 
    title: "Lead Generation Strategy (DG1)",
    description: "Develop multi-channel lead generation strategy including inbound, outbound, and partnership-based approaches.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Demand Gen & Acquisition",
    category: "lead-gen",
    estimatedDuration: 6
  },
  {
    id: "DG2",
    title: "Digital Marketing Campaigns (DG2)",
    description: "Plan and execute digital marketing campaigns across search, social, email, and display advertising channels.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Demand Gen & Acquisition",
    category: "digital",
    estimatedDuration: 7
  },
  {
    id: "DG3",
    title: "Marketing Automation & Nurturing (DG3)",
    description: "Set up marketing automation workflows, lead nurturing sequences, and scoring models for conversion optimization.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Demand Gen & Acquisition",
    category: "automation",
    estimatedDuration: 5
  }
];

const pricingTasks: TaskTemplate[] = [
  {
    id: "PR1",
    title: "Pricing Strategy & Model Development (PR1)",
    description: "Research and develop pricing strategy, pricing models, and packaging options based on market analysis and value.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Pricing & Packaging",
    category: "pricing",
    estimatedDuration: 6
  },
  {
    id: "PR2",
    title: "Package Design & Feature Bundling (PR2)",
    description: "Design product packages, feature bundles, and tiered offerings to maximize revenue and customer value.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Pricing & Packaging",
    category: "packaging",
    estimatedDuration: 4
  },
  {
    id: "PR3",
    title: "Pricing Testing & Optimization (PR3)",
    description: "Test pricing strategies through A/B testing, surveys, and market feedback to optimize conversion and revenue.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Pricing & Packaging",
    category: "testing",
    estimatedDuration: 5
  }
];

const launchTasks: TaskTemplate[] = [
  {
    id: "LA1",
    title: "Go-to-Market Strategy & Planning (LA1)",
    description: "Develop comprehensive go-to-market strategy including target segments, channels, timeline, and success metrics.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Launch & Analytics",
    category: "gtm-strategy",
    estimatedDuration: 7
  },
  {
    id: "LA2",
    title: "Product Launch Campaign (LA2)",
    description: "Execute product launch campaign with PR, media outreach, customer communications, and channel activation.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Launch & Analytics", 
    category: "launch",
    estimatedDuration: 8
  },
  {
    id: "LA3",
    title: "Marketing Analytics & Performance Tracking (LA3)",
    description: "Set up marketing analytics, attribution models, and performance dashboards to measure marketing effectiveness.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Launch & Analytics",
    category: "analytics",
    estimatedDuration: 4
  },
  {
    id: "LA4",
    title: "Customer Success & Retention Programs (LA4)",
    description: "Design customer success programs, retention strategies, and loyalty initiatives to maximize customer lifetime value.",
    tier1Category: "Marketing / Go-to-Market (GTM)",
    tier2Category: "Launch & Analytics",
    category: "customer-success", 
    estimatedDuration: 6
  }
];

// Empty Template Tasks - Generic templates for the Empty Template preset
const emptyPhase1TasksA: TaskTemplate[] = [
  {
    id: "EP1A1",
    title: "Sample Task 1A",
    description: "Rename this task to match your project needs - easy to customize",
    tier1Category: "Phase 1",
    tier2Category: "Task Category A",
    category: "category-a",
    estimatedDuration: 1,
  },
  {
    id: "EP1A2",
    title: "Sample Task 2A",
    description: "Another customizable task template - change title and description as needed",
    tier1Category: "Phase 1",
    tier2Category: "Task Category A",
    category: "category-a",
    estimatedDuration: 2,
  }
];

const emptyPhase1TasksB: TaskTemplate[] = [
  {
    id: "EP1B1",
    title: "Sample Task 1B",
    description: "Generic task template - modify to fit your workflow",
    tier1Category: "Phase 1",
    tier2Category: "Task Category B",
    category: "category-b",
    estimatedDuration: 1,
  },
  {
    id: "EP1B2",
    title: "Sample Task 2B",
    description: "Adaptable task template - rename and customize as needed",
    tier1Category: "Phase 1",
    tier2Category: "Task Category B",
    category: "category-b",
    estimatedDuration: 3,
  }
];

const emptyPhase1TasksC: TaskTemplate[] = [
  {
    id: "EP1C1",
    title: "Sample Task 1C",
    description: "Easy to modify - change to fit your specific requirements",
    tier1Category: "Phase 1",
    tier2Category: "Task Category C",
    category: "category-c",
    estimatedDuration: 2,
  }
];

const emptyPhase2TasksD: TaskTemplate[] = [
  {
    id: "EP2D1",
    title: "Sample Task 1D",
    description: "Flexible task template - adapt for your project type",
    tier1Category: "Phase 2",
    tier2Category: "Task Category D",
    category: "category-d",
    estimatedDuration: 1,
  },
  {
    id: "EP2D2",
    title: "Sample Task 2D",
    description: "Customizable template - modify title, description, and duration",
    tier1Category: "Phase 2",
    tier2Category: "Task Category D",
    category: "category-d",
    estimatedDuration: 2,
  }
];

const emptyPhase2TasksE: TaskTemplate[] = [
  {
    id: "EP2E1",
    title: "Sample Task 1E",
    description: "Generic template for your workflow - easy to rename",
    tier1Category: "Phase 2",
    tier2Category: "Task Category E",
    category: "category-e",
    estimatedDuration: 1,
  }
];

const emptyPhase2TasksF: TaskTemplate[] = [
  {
    id: "EP2F1",
    title: "Sample Task 1F",
    description: "Adaptable task - modify to match your process",
    tier1Category: "Phase 2",
    tier2Category: "Task Category F",
    category: "category-f",
    estimatedDuration: 3,
  }
];

const emptyPhase3TasksG: TaskTemplate[] = [
  {
    id: "EP3G1",
    title: "Sample Task 1G",
    description: "Template task - customize for your industry and workflow",
    tier1Category: "Phase 3",
    tier2Category: "Task Category G",
    category: "category-g",
    estimatedDuration: 2,
  }
];

const emptyPhase3TasksH: TaskTemplate[] = [
  {
    id: "EP3H1",
    title: "Sample Task 1H",
    description: "Easy to customize - rename to fit your specific needs",
    tier1Category: "Phase 3",
    tier2Category: "Task Category H",
    category: "category-h",
    estimatedDuration: 1,
  },
  {
    id: "EP3H2",
    title: "Sample Task 2H",
    description: "Another template task - modify as needed for your project",
    tier1Category: "Phase 3",
    tier2Category: "Task Category H",
    category: "category-h",
    estimatedDuration: 2,
  }
];

const emptyPhase3TasksI: TaskTemplate[] = [
  {
    id: "EP3I1",
    title: "Sample Task 1I",
    description: "Generic task template - adapt to your specific requirements",
    tier1Category: "Phase 3",
    tier2Category: "Task Category I",
    category: "category-i",
    estimatedDuration: 1,
  }
];

const emptyPhase4TasksJ: TaskTemplate[] = [
  {
    id: "EP4J1",
    title: "Sample Task 1J",
    description: "Final phase template - customize for your completion process",
    tier1Category: "Phase 4",
    tier2Category: "Task Category J",
    category: "category-j",
    estimatedDuration: 2,
  }
];

const emptyPhase4TasksK: TaskTemplate[] = [
  {
    id: "EP4K1",
    title: "Sample Task 1K",
    description: "Adaptable to your finalization workflow - easy to modify",
    tier1Category: "Phase 4",
    tier2Category: "Task Category K",
    category: "category-k",
    estimatedDuration: 1,
  }
];

const emptyPhase4TasksL: TaskTemplate[] = [
  {
    id: "EP4L1",
    title: "Sample Task 1L",
    description: "Last category template - rename and customize as needed",
    tier1Category: "Phase 4",
    tier2Category: "Task Category L",
    category: "category-l",
    estimatedDuration: 1,
  },
  {
    id: "EP4L2",
    title: "Sample Task 2L",
    description: "Final template task - modify to complete your workflow",
    tier1Category: "Phase 4",
    tier2Category: "Task Category L",
    category: "category-l",
    estimatedDuration: 3,
  }
];

// Workout Templates - Exercise templates for workout programs
const pushChestTasks: TaskTemplate[] = [
  {
    id: "PC1",
    title: "Bench Press",
    description: "Barbell or dumbbell bench press - 3 sets x 8-12 reps",
    tier1Category: "Push",
    tier2Category: "Chest",
    category: "chest",
    estimatedDuration: 1,
  },
  {
    id: "PC2",
    title: "Incline Press",
    description: "Incline barbell or dumbbell press - 3 sets x 8-12 reps",
    tier1Category: "Push",
    tier2Category: "Chest",
    category: "chest",
    estimatedDuration: 1,
  },
  {
    id: "PC3",
    title: "Chest Flyes",
    description: "Dumbbell or cable flyes - 3 sets x 12-15 reps",
    tier1Category: "Push",
    tier2Category: "Chest",
    category: "chest",
    estimatedDuration: 1,
  }
];

const pushShoulderTasks: TaskTemplate[] = [
  {
    id: "PS1",
    title: "Overhead Press",
    description: "Military press or dumbbell shoulder press - 3 sets x 8-12 reps",
    tier1Category: "Push",
    tier2Category: "Shoulders",
    category: "shoulders",
    estimatedDuration: 1,
  },
  {
    id: "PS2",
    title: "Lateral Raises",
    description: "Dumbbell lateral raises - 3 sets x 12-15 reps",
    tier1Category: "Push",
    tier2Category: "Shoulders",
    category: "shoulders",
    estimatedDuration: 1,
  },
  {
    id: "PS3",
    title: "Front Raises",
    description: "Dumbbell front raises - 3 sets x 12-15 reps",
    tier1Category: "Push",
    tier2Category: "Shoulders",
    category: "shoulders",
    estimatedDuration: 1,
  }
];

const pushTricepTasks: TaskTemplate[] = [
  {
    id: "PT1",
    title: "Tricep Dips",
    description: "Bodyweight or weighted dips - 3 sets x 8-15 reps",
    tier1Category: "Push",
    tier2Category: "Triceps",
    category: "triceps",
    estimatedDuration: 1,
  },
  {
    id: "PT2",
    title: "Tricep Extensions",
    description: "Overhead dumbbell or cable extensions - 3 sets x 10-15 reps",
    tier1Category: "Push",
    tier2Category: "Triceps",
    category: "triceps",
    estimatedDuration: 1,
  }
];

const pullBackTasks: TaskTemplate[] = [
  {
    id: "PB1",
    title: "Pull-ups/Chin-ups",
    description: "Bodyweight or assisted pull-ups - 3 sets x 5-12 reps",
    tier1Category: "Pull",
    tier2Category: "Back",
    category: "back",
    estimatedDuration: 1,
  },
  {
    id: "PB2",
    title: "Barbell Rows",
    description: "Bent-over barbell rows - 3 sets x 8-12 reps",
    tier1Category: "Pull",
    tier2Category: "Back",
    category: "back",
    estimatedDuration: 1,
  },
  {
    id: "PB3",
    title: "Lat Pulldowns",
    description: "Cable lat pulldowns - 3 sets x 10-15 reps",
    tier1Category: "Pull",
    tier2Category: "Back",
    category: "back",
    estimatedDuration: 1,
  }
];

const pullBicepTasks: TaskTemplate[] = [
  {
    id: "PBI1",
    title: "Bicep Curls",
    description: "Barbell or dumbbell curls - 3 sets x 10-15 reps",
    tier1Category: "Pull",
    tier2Category: "Biceps",
    category: "biceps",
    estimatedDuration: 1,
  },
  {
    id: "PBI2",
    title: "Hammer Curls",
    description: "Dumbbell hammer curls - 3 sets x 12-15 reps",
    tier1Category: "Pull",
    tier2Category: "Biceps",
    category: "biceps",
    estimatedDuration: 1,
  }
];

const pullRearDeltTasks: TaskTemplate[] = [
  {
    id: "PRD1",
    title: "Face Pulls",
    description: "Cable face pulls - 3 sets x 15-20 reps",
    tier1Category: "Pull",
    tier2Category: "Rear Delts",
    category: "rear-delts",
    estimatedDuration: 1,
  },
  {
    id: "PRD2",
    title: "Reverse Flyes",
    description: "Dumbbell reverse flyes - 3 sets x 12-15 reps",
    tier1Category: "Pull",
    tier2Category: "Rear Delts",
    category: "rear-delts",
    estimatedDuration: 1,
  }
];

const legQuadTasks: TaskTemplate[] = [
  {
    id: "LQ1",
    title: "Squats",
    description: "Barbell back squats - 3 sets x 8-12 reps",
    tier1Category: "Legs",
    tier2Category: "Quads",
    category: "quads",
    estimatedDuration: 1,
  },
  {
    id: "LQ2",
    title: "Leg Press",
    description: "Machine leg press - 3 sets x 12-15 reps",
    tier1Category: "Legs",
    tier2Category: "Quads",
    category: "quads",
    estimatedDuration: 1,
  },
  {
    id: "LQ3",
    title: "Lunges",
    description: "Walking or stationary lunges - 3 sets x 10 each leg",
    tier1Category: "Legs",
    tier2Category: "Quads",
    category: "quads",
    estimatedDuration: 1,
  }
];

const legGluteTasks: TaskTemplate[] = [
  {
    id: "LG1",
    title: "Hip Thrusts",
    description: "Barbell or bodyweight hip thrusts - 3 sets x 12-15 reps",
    tier1Category: "Legs",
    tier2Category: "Glutes",
    category: "glutes",
    estimatedDuration: 1,
  },
  {
    id: "LG2",
    title: "Glute Bridges",
    description: "Single or double leg glute bridges - 3 sets x 15-20 reps",
    tier1Category: "Legs",
    tier2Category: "Glutes",
    category: "glutes",
    estimatedDuration: 1,
  }
];

const legHamstringTasks: TaskTemplate[] = [
  {
    id: "LH1",
    title: "Romanian Deadlifts",
    description: "Barbell or dumbbell RDLs - 3 sets x 10-12 reps",
    tier1Category: "Legs",
    tier2Category: "Hamstrings",
    category: "hamstrings",
    estimatedDuration: 1,
  },
  {
    id: "LH2",
    title: "Leg Curls",
    description: "Machine hamstring curls - 3 sets x 12-15 reps",
    tier1Category: "Legs",
    tier2Category: "Hamstrings",
    category: "hamstrings",
    estimatedDuration: 1,
  }
];

const legCalfTasks: TaskTemplate[] = [
  {
    id: "LC1",
    title: "Calf Raises",
    description: "Standing or seated calf raises - 3 sets x 15-20 reps",
    tier1Category: "Legs",
    tier2Category: "Calves",
    category: "calves",
    estimatedDuration: 1,
  }
];

const cardioHIITTasks: TaskTemplate[] = [
  {
    id: "CH1",
    title: "Sprint Intervals",
    description: "30 seconds sprint, 90 seconds rest - 8-10 rounds",
    tier1Category: "Cardio",
    tier2Category: "HIIT",
    category: "hiit",
    estimatedDuration: 1,
  },
  {
    id: "CH2",
    title: "Bike Intervals",
    description: "High intensity bike intervals - 20 minutes",
    tier1Category: "Cardio",
    tier2Category: "HIIT",
    category: "hiit",
    estimatedDuration: 1,
  }
];

const cardioSteadyTasks: TaskTemplate[] = [
  {
    id: "CS1",
    title: "Treadmill Run",
    description: "Steady-state running - 30-45 minutes at moderate pace",
    tier1Category: "Cardio",
    tier2Category: "Steady State",
    category: "steady-state",
    estimatedDuration: 1,
  },
  {
    id: "CS2",
    title: "Cycling",
    description: "Steady cycling session - 45-60 minutes",
    tier1Category: "Cardio",
    tier2Category: "Steady State",
    category: "steady-state",
    estimatedDuration: 1,
  }
];

const cardioCircuitTasks: TaskTemplate[] = [
  {
    id: "CC1",
    title: "Circuit Training",
    description: "Full body circuit - 5 exercises, 3 rounds",
    tier1Category: "Cardio",
    tier2Category: "Circuit Training",
    category: "circuit",
    estimatedDuration: 1,
  }
];

// Marketing Templates - Comprehensive marketing funnel tasks
const brandPositioningTasks: TaskTemplate[] = [
  {
    id: "BP1",
    title: "Write positioning statement",
    description: "Craft clear positioning statement defining value proposition and differentiation",
    tier1Category: "Awareness",
    tier2Category: "Brand & Positioning",
    category: "brand-positioning",
    estimatedDuration: 3,
  },
  {
    id: "BP2",
    title: "Define ICPs & JTBDs",
    description: "Define Ideal Customer Profiles and Jobs-To-Be-Done framework",
    tier1Category: "Awareness",
    tier2Category: "Brand & Positioning",
    category: "brand-positioning",
    estimatedDuration: 5,
  },
  {
    id: "BP3",
    title: "Build messaging matrix",
    description: "Create messaging matrix for different audiences and use cases",
    tier1Category: "Awareness",
    tier2Category: "Brand & Positioning",
    category: "brand-positioning",
    estimatedDuration: 4,
  },
  {
    id: "BP4",
    title: "Create brand voice guide",
    description: "Develop brand voice and tone guidelines for consistent communication",
    tier1Category: "Awareness",
    tier2Category: "Brand & Positioning",
    category: "brand-positioning",
    estimatedDuration: 3,
  }
];

const contentMarketingTasks: TaskTemplate[] = [
  {
    id: "CM1",
    title: "Topic cluster plan",
    description: "Develop topic clusters and content pillar strategy",
    tier1Category: "Awareness",
    tier2Category: "Content Marketing",
    category: "content-marketing",
    estimatedDuration: 2,
  },
  {
    id: "CM2",
    title: "4 pillar posts + briefs",
    description: "Create 4 comprehensive pillar posts with detailed briefs",
    tier1Category: "Awareness",
    tier2Category: "Content Marketing",
    category: "content-marketing",
    estimatedDuration: 8,
  },
  {
    id: "CM3",
    title: "8-week content calendar",
    description: "Plan and schedule 8 weeks of content across all channels",
    tier1Category: "Awareness",
    tier2Category: "Content Marketing",
    category: "content-marketing",
    estimatedDuration: 3,
  },
  {
    id: "CM4",
    title: "Repurpose plan (post→short/video/email)",
    description: "Create content repurposing strategy for maximum reach",
    tier1Category: "Awareness",
    tier2Category: "Content Marketing",
    category: "content-marketing",
    estimatedDuration: 2,
  }
];

const seoTasks: TaskTemplate[] = [
  {
    id: "SEO1",
    title: "Keyword research & map",
    description: "Comprehensive keyword research and content mapping",
    tier1Category: "Awareness",
    tier2Category: "SEO (Organic)",
    category: "seo",
    estimatedDuration: 4,
  },
  {
    id: "SEO2",
    title: "On-page optimization (5 pages)",
    description: "Optimize 5 key pages for target keywords and user experience",
    tier1Category: "Awareness",
    tier2Category: "SEO (Organic)",
    category: "seo",
    estimatedDuration: 5,
  },
  {
    id: "SEO3",
    title: "Technical audit & fixes",
    description: "Conduct technical SEO audit and implement critical fixes",
    tier1Category: "Awareness",
    tier2Category: "SEO (Organic)",
    category: "seo",
    estimatedDuration: 6,
  },
  {
    id: "SEO4",
    title: "Internal linking pass",
    description: "Optimize internal linking structure for SEO and user flow",
    tier1Category: "Awareness",
    tier2Category: "SEO (Organic)",
    category: "seo",
    estimatedDuration: 3,
  },
  {
    id: "SEO5",
    title: "Schema markup (FAQ/HowTo)",
    description: "Implement structured data markup for enhanced search results",
    tier1Category: "Awareness",
    tier2Category: "SEO (Organic)",
    category: "seo",
    estimatedDuration: 2,
  }
];

const prTasks: TaskTemplate[] = [
  {
    id: "PR1",
    title: "Target outlet list (25)",
    description: "Research and compile list of 25 target media outlets and contacts",
    tier1Category: "Awareness",
    tier2Category: "PR & Thought Leadership",
    category: "pr-thought-leadership",
    estimatedDuration: 3,
  },
  {
    id: "PR2",
    title: "Founder POV angles (3)",
    description: "Develop 3 unique founder perspective angles for thought leadership",
    tier1Category: "Awareness",
    tier2Category: "PR & Thought Leadership",
    category: "pr-thought-leadership",
    estimatedDuration: 2,
  },
  {
    id: "PR3",
    title: "Contributed article pitch kit",
    description: "Create pitch kit for contributed articles and guest posts",
    tier1Category: "Awareness",
    tier2Category: "PR & Thought Leadership",
    category: "pr-thought-leadership",
    estimatedDuration: 2,
  },
  {
    id: "PR4",
    title: "Speaking/podcast pitch kit",
    description: "Develop speaking and podcast pitch materials and media kit",
    tier1Category: "Awareness",
    tier2Category: "PR & Thought Leadership",
    category: "pr-thought-leadership",
    estimatedDuration: 3,
  }
];

const organicSocialTasks: TaskTemplate[] = [
  {
    id: "OS1",
    title: "Define 3 content pillars",
    description: "Establish 3 core content pillars for consistent social messaging",
    tier1Category: "Awareness",
    tier2Category: "Organic Social",
    category: "organic-social",
    estimatedDuration: 2,
  },
  {
    id: "OS2",
    title: "Weekly posting system (4/wk)",
    description: "Create systematic approach for 4 weekly social media posts",
    tier1Category: "Awareness",
    tier2Category: "Organic Social",
    category: "organic-social",
    estimatedDuration: 2,
  },
  {
    id: "OS3",
    title: "Community engagement SOP",
    description: "Develop standard operating procedure for community engagement",
    tier1Category: "Awareness",
    tier2Category: "Organic Social",
    category: "organic-social",
    estimatedDuration: 1,
  },
  {
    id: "OS4",
    title: "Creator/UGC brief template",
    description: "Create templates for creator partnerships and UGC campaigns",
    tier1Category: "Awareness",
    tier2Category: "Organic Social",
    category: "organic-social",
    estimatedDuration: 2,
  }
];

const paidSearchTasks: TaskTemplate[] = [
  {
    id: "PSE1",
    title: "Campaign structure",
    description: "Design Google Ads campaign structure and account organization",
    tier1Category: "Acquisition",
    tier2Category: "Paid Search (SEM)",
    category: "paid-search",
    estimatedDuration: 2,
  },
  {
    id: "PSE2",
    title: "Keyword & negative lists",
    description: "Build comprehensive keyword lists and negative keyword lists",
    tier1Category: "Acquisition",
    tier2Category: "Paid Search (SEM)",
    category: "paid-search",
    estimatedDuration: 3,
  },
  {
    id: "PSE3",
    title: "3x RSA ad sets + extensions",
    description: "Create 3 responsive search ad sets with all relevant extensions",
    tier1Category: "Acquisition",
    tier2Category: "Paid Search (SEM)",
    category: "paid-search",
    estimatedDuration: 4,
  },
  {
    id: "PSE4",
    title: "Conversion tracking setup",
    description: "Implement comprehensive conversion tracking and analytics",
    tier1Category: "Acquisition",
    tier2Category: "Paid Search (SEM)",
    category: "paid-search",
    estimatedDuration: 2,
  }
];

const paidSocialTasks: TaskTemplate[] = [
  {
    id: "PSO1",
    title: "Creative matrix",
    description: "Develop creative testing matrix for social media ads",
    tier1Category: "Acquisition",
    tier2Category: "Paid Social",
    category: "paid-social",
    estimatedDuration: 2,
  },
  {
    id: "PSO2",
    title: "Audience setup (prospecting/retargeting)",
    description: "Configure prospecting and retargeting audiences for social ads",
    tier1Category: "Acquisition",
    tier2Category: "Paid Social",
    category: "paid-social",
    estimatedDuration: 3,
  },
  {
    id: "PSO3",
    title: "3 concepts × 3 variants",
    description: "Create 3 ad concepts with 3 variants each for testing",
    tier1Category: "Acquisition",
    tier2Category: "Paid Social",
    category: "paid-social",
    estimatedDuration: 5,
  },
  {
    id: "PSO4",
    title: "Landing page match test",
    description: "Test and optimize ad-to-landing page message matching",
    tier1Category: "Acquisition",
    tier2Category: "Paid Social",
    category: "paid-social",
    estimatedDuration: 2,
  }
];

const affiliatesTasks: TaskTemplate[] = [
  {
    id: "AF1",
    title: "Recruit list (30)",
    description: "Identify and compile list of 30 potential affiliate partners",
    tier1Category: "Acquisition",
    tier2Category: "Affiliates & Partnerships",
    category: "affiliates-partnerships",
    estimatedDuration: 4,
  },
  {
    id: "AF2",
    title: "Offer & terms sheet",
    description: "Create affiliate offer structure and partnership terms",
    tier1Category: "Acquisition",
    tier2Category: "Affiliates & Partnerships",
    category: "affiliates-partnerships",
    estimatedDuration: 2,
  },
  {
    id: "AF3",
    title: "Partner kit (UTMs, assets)",
    description: "Develop partner kit with tracking links and marketing assets",
    tier1Category: "Acquisition",
    tier2Category: "Affiliates & Partnerships",
    category: "affiliates-partnerships",
    estimatedDuration: 3,
  },
  {
    id: "AF4",
    title: "Monthly co-marketing plan",
    description: "Create monthly co-marketing campaign calendar and strategy",
    tier1Category: "Acquisition",
    tier2Category: "Affiliates & Partnerships",
    category: "affiliates-partnerships",
    estimatedDuration: 2,
  }
];

const influencerTasks: TaskTemplate[] = [
  {
    id: "IN1",
    title: "Brief + deliverables",
    description: "Create influencer brief template and deliverable specifications",
    tier1Category: "Acquisition",
    tier2Category: "Influencer / Creator",
    category: "influencer-creator",
    estimatedDuration: 2,
  },
  {
    id: "IN2",
    title: "Gifting/seeding workflow",
    description: "Establish product gifting and seeding workflow process",
    tier1Category: "Acquisition",
    tier2Category: "Influencer / Creator",
    category: "influencer-creator",
    estimatedDuration: 2,
  },
  {
    id: "IN3",
    title: "Whitelisting setup",
    description: "Set up social media whitelisting for amplification",
    tier1Category: "Acquisition",
    tier2Category: "Influencer / Creator",
    category: "influencer-creator",
    estimatedDuration: 1,
  },
  {
    id: "IN4",
    title: "Usage rights tracker",
    description: "Create system for tracking and managing content usage rights",
    tier1Category: "Acquisition",
    tier2Category: "Influencer / Creator",
    category: "influencer-creator",
    estimatedDuration: 1,
  }
];

const landingPagesTasks: TaskTemplate[] = [
  {
    id: "LP1",
    title: "Value-prop hierarchy",
    description: "Define value proposition hierarchy and messaging priority",
    tier1Category: "Activation & Conversion",
    tier2Category: "Landing Pages & CRO",
    category: "landing-pages-cro",
    estimatedDuration: 2,
  },
  {
    id: "LP2",
    title: "LP v1 wireframe + copy",
    description: "Create first version landing page wireframe and copy",
    tier1Category: "Activation & Conversion",
    tier2Category: "Landing Pages & CRO",
    category: "landing-pages-cro",
    estimatedDuration: 4,
  },
  {
    id: "LP3",
    title: "Heatmap/recording setup",
    description: "Implement heatmap and user recording tools for optimization",
    tier1Category: "Activation & Conversion",
    tier2Category: "Landing Pages & CRO",
    category: "landing-pages-cro",
    estimatedDuration: 1,
  },
  {
    id: "LP4",
    title: "A/B test backlog (10)",
    description: "Create backlog of 10 A/B test ideas for conversion optimization",
    tier1Category: "Activation & Conversion",
    tier2Category: "Landing Pages & CRO",
    category: "landing-pages-cro",
    estimatedDuration: 2,
  }
];

const leadMagnetsTasks: TaskTemplate[] = [
  {
    id: "LM1",
    title: "Magnet concept",
    description: "Develop lead magnet concept and value proposition",
    tier1Category: "Activation & Conversion",
    tier2Category: "Lead Magnets & Offers",
    category: "lead-magnets-offers",
    estimatedDuration: 2,
  },
  {
    id: "LM2",
    title: "Opt-in flow + thank-you page",
    description: "Design opt-in flow and thank-you page experience",
    tier1Category: "Activation & Conversion",
    tier2Category: "Lead Magnets & Offers",
    category: "lead-magnets-offers",
    estimatedDuration: 3,
  },
  {
    id: "LM3",
    title: "Nurture handoff to email",
    description: "Create seamless handoff from lead magnet to email nurture",
    tier1Category: "Activation & Conversion",
    tier2Category: "Lead Magnets & Offers",
    category: "lead-magnets-offers",
    estimatedDuration: 2,
  }
];

const onboardingTasks: TaskTemplate[] = [
  {
    id: "ON1",
    title: "First-run checklist",
    description: "Create first-run user experience checklist and flow",
    tier1Category: "Activation & Conversion",
    tier2Category: "Onboarding",
    category: "onboarding",
    estimatedDuration: 2,
  },
  {
    id: "ON2",
    title: "Activation emails (D1/D3/D7)",
    description: "Design activation email sequence for days 1, 3, and 7",
    tier1Category: "Activation & Conversion",
    tier2Category: "Onboarding",
    category: "onboarding",
    estimatedDuration: 3,
  },
  {
    id: "ON3",
    title: "In-app tips/empty states",
    description: "Create in-app guidance, tips, and empty state messaging",
    tier1Category: "Activation & Conversion",
    tier2Category: "Onboarding",
    category: "onboarding",
    estimatedDuration: 2,
  }
];

const salesEnablementTasks: TaskTemplate[] = [
  {
    id: "SE1",
    title: "One-pager & case study template",
    description: "Create sales one-pager and case study template",
    tier1Category: "Activation & Conversion",
    tier2Category: "Sales Enablement",
    category: "sales-enablement",
    estimatedDuration: 3,
  },
  {
    id: "SE2",
    title: "Demo script + objection bank",
    description: "Develop demo script and objection handling bank",
    tier1Category: "Activation & Conversion",
    tier2Category: "Sales Enablement",
    category: "sales-enablement",
    estimatedDuration: 4,
  },
  {
    id: "SE3",
    title: "CRM stages & SLAs",
    description: "Define CRM pipeline stages and service level agreements",
    tier1Category: "Activation & Conversion",
    tier2Category: "Sales Enablement",
    category: "sales-enablement",
    estimatedDuration: 2,
  }
];

const lifecycleEmailTasks: TaskTemplate[] = [
  {
    id: "LE1",
    title: "Welcome/Nurture (5 emails)",
    description: "Create 5-email welcome and nurture sequence",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Lifecycle Email/SMS",
    category: "lifecycle-email-sms",
    estimatedDuration: 5,
  },
  {
    id: "LE2",
    title: "Usage nudges (3)",
    description: "Design 3 usage nudge emails for inactive users",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Lifecycle Email/SMS",
    category: "lifecycle-email-sms",
    estimatedDuration: 3,
  },
  {
    id: "LE3",
    title: "Win-back (2)",
    description: "Create 2-email win-back campaign for churned users",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Lifecycle Email/SMS",
    category: "lifecycle-email-sms",
    estimatedDuration: 2,
  },
  {
    id: "LE4",
    title: "Reactivation triggers",
    description: "Set up automated reactivation triggers and conditions",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Lifecycle Email/SMS",
    category: "lifecycle-email-sms",
    estimatedDuration: 2,
  }
];

const customerEducationTasks: TaskTemplate[] = [
  {
    id: "CE1",
    title: "Monthly workshop/webinar",
    description: "Plan and execute monthly customer education workshop",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Customer Education & Community",
    category: "customer-education-community",
    estimatedDuration: 4,
  },
  {
    id: "CE2",
    title: "Help-hub articles (10)",
    description: "Create 10 comprehensive help center articles",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Customer Education & Community",
    category: "customer-education-community",
    estimatedDuration: 8,
  },
  {
    id: "CE3",
    title: "Community prompts calendar",
    description: "Develop monthly community engagement prompts calendar",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Customer Education & Community",
    category: "customer-education-community",
    estimatedDuration: 2,
  }
];

const loyaltyUpsellTasks: TaskTemplate[] = [
  {
    id: "LU1",
    title: "Tiered benefits map",
    description: "Design tiered loyalty benefits and rewards structure",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Loyalty, Upsell & Cross-sell",
    category: "loyalty-upsell-cross-sell",
    estimatedDuration: 3,
  },
  {
    id: "LU2",
    title: "In-product upsell placements",
    description: "Identify and design in-product upsell opportunity placements",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Loyalty, Upsell & Cross-sell",
    category: "loyalty-upsell-cross-sell",
    estimatedDuration: 2,
  },
  {
    id: "LU3",
    title: "Seasonal promo plan",
    description: "Create seasonal promotion calendar and campaign strategy",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Loyalty, Upsell & Cross-sell",
    category: "loyalty-upsell-cross-sell",
    estimatedDuration: 3,
  }
];

const referralUGCTasks: TaskTemplate[] = [
  {
    id: "RU1",
    title: "Referral offer + flow",
    description: "Design referral program offer structure and user flow",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Referral/UGC",
    category: "referral-ugc",
    estimatedDuration: 3,
  },
  {
    id: "RU2",
    title: "UGC request cadence",
    description: "Establish user-generated content request schedule and process",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Referral/UGC",
    category: "referral-ugc",
    estimatedDuration: 2,
  },
  {
    id: "RU3",
    title: "Review generation SOP",
    description: "Create standard operating procedure for review generation",
    tier1Category: "Retention & Advocacy",
    tier2Category: "Referral/UGC",
    category: "referral-ugc",
    estimatedDuration: 2,
  }
];

// Organize all templates into a single, structured collection
export const taskTemplates: TaskTemplateCollection = {
  'Push': {
    'Chest': pushChestTasks,
    'Shoulders': pushShoulderTasks,
    'Triceps': pushTricepTasks,
  },
  'Pull': {
    'Back': pullBackTasks,
    'Biceps': pullBicepTasks,
    'Rear Delts': pullRearDeltTasks,
  },
  'Legs': {
    'Quads': legQuadTasks,
    'Glutes': legGluteTasks,
    'Hamstrings': legHamstringTasks,
    'Calves': legCalfTasks,
  },
  'Cardio': {
    'HIIT': cardioHIITTasks,
    'Steady State': cardioSteadyTasks,
    'Circuit Training': cardioCircuitTasks,
  },
  'Awareness': {
    'Brand & Positioning': brandPositioningTasks,
    'Content Marketing': contentMarketingTasks,
    'SEO (Organic)': seoTasks,
    'PR & Thought Leadership': prTasks,
    'Organic Social': organicSocialTasks,
  },
  'Acquisition': {
    'Paid Search (SEM)': paidSearchTasks,
    'Paid Social': paidSocialTasks,
    'Affiliates & Partnerships': affiliatesTasks,
    'Influencer / Creator': influencerTasks,
  },
  'Activation & Conversion': {
    'Landing Pages & CRO': landingPagesTasks,
    'Lead Magnets & Offers': leadMagnetsTasks,
    'Onboarding': onboardingTasks,
    'Sales Enablement': salesEnablementTasks,
  },
  'Retention & Advocacy': {
    'Lifecycle Email/SMS': lifecycleEmailTasks,
    'Customer Education & Community': customerEducationTasks,
    'Loyalty, Upsell & Cross-sell': loyaltyUpsellTasks,
    'Referral/UGC': referralUGCTasks,
  },
  'Phase 1': {
    'Task Category A': emptyPhase1TasksA,
    'Task Category B': emptyPhase1TasksB,
    'Task Category C': emptyPhase1TasksC,
  },
  'Phase 2': {
    'Task Category D': emptyPhase2TasksD,
    'Task Category E': emptyPhase2TasksE,
    'Task Category F': emptyPhase2TasksF,
  },
  'Phase 3': {
    'Task Category G': emptyPhase3TasksG,
    'Task Category H': emptyPhase3TasksH,
    'Task Category I': emptyPhase3TasksI,
  },
  'Phase 4': {
    'Task Category J': emptyPhase4TasksJ,
    'Task Category K': emptyPhase4TasksK,
    'Task Category L': emptyPhase4TasksL,
  },
  'Structural': {
    Foundation: foundationTasks,
    Roofing: roofingTasks,
    Framing: framingTasks,
  },
  'Systems': {
    Plumbing: plumbingTasks,
    HVAC: hvacTasks,
    Electrical: electricalTasks,
  },
  'Sheathing': {
    Windows: exteriorsTasks,
    Drywall: drywallTasks,
    Insulation: barriersTasks,
  },
  'Finishings': {
    Landscaping: landscapingTasks,
    Fixtures: [...trimTasks, ...cabinentryTasks],
    Flooring: flooringTasks,
  },
  'Software Engineering': {
    'DevOps & Infrastructure': devopsTasks,
    'Architecture & Platform': architectureTasks,
    'Application Development': developmentTasks,
    'Quality & Security': qualityTasks,
  },
  'Product Management': {
    'Strategy & Vision': strategyTasks,
    'Discovery & Research': researchTasks,
    'Roadmap & Prioritization': roadmapTasks,
    'Delivery & Lifecycle': deliveryTasks,
  },
  'Design / UX': {
    'Research and Usability': uxResearchTasks,
    'UI/UX Design': uiDesignTasks,
    'Visual Design': visualDesignTasks,
    'Interaction Design': interactionTasks,
  },
  'Marketing / Go-to-Market (GTM)': {
    'Positioning & Messaging': positioningTasks,
    'Demand Gen & Acquisition': demandGenTasks,
    'Pricing & Packaging': pricingTasks,
    'Launch & Analytics': launchTasks,
  },
};

// Helper function to get all task templates as a flat array
export function getAllTaskTemplates(): TaskTemplate[] {
  const allTemplates: TaskTemplate[] = [];

  Object.values(taskTemplates).forEach((tier1Category) => {
    Object.values(tier1Category).forEach((templatesArray) => {
      allTemplates.push(...templatesArray);
    });
  });

  return allTemplates;
}

// Helper function to get task template by ID
export function getTaskTemplateById(id: string): TaskTemplate | undefined {
  return getAllTaskTemplates().find((template) => template.id === id);
}

// Helper function to get templates by tier1 category
export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  const templates: TaskTemplate[] = [];

  if (taskTemplates[tier1]) {
    Object.values(taskTemplates[tier1]).forEach((templatesArray) => {
      templates.push(...templatesArray);
    });
  }

  return templates;
}

// Helper function to get templates by tier1 and tier2 categories
export function getTemplatesByTier2(
  tier1: string,
  tier2: string,
): TaskTemplate[] {
  if (taskTemplates[tier1] && taskTemplates[tier1][tier2]) {
    return taskTemplates[tier1][tier2];
  }
  return [];
}

// Helper function for filtering tasks by task template categories
export function filterTasksByCategories(
  tasks: any[],
  filter: { tier1?: string; tier2?: string }
): any[] {
  if (!filter) {
    return tasks;
  }

  return tasks.filter((task) => {
    if (filter.tier1 && task.tier1Category !== filter.tier1) {
      return false;
    }
    if (filter.tier2 && task.tier2Category !== filter.tier2) {
      return false;
    }
    return true;
  });
}

// Helper function to get templates that match a specific preset
export function getTemplatesByPreset(presetId: string): TaskTemplate[] {
  const allTemplates = getAllTaskTemplates();

  // Define which categories belong to each preset
  const presetCategories: Record<string, string[]> = {
    'marketing': ['Awareness', 'Acquisition', 'Activation & Conversion', 'Retention & Advocacy'],
    'workout': ['Push', 'Pull', 'Legs', 'Cardio'],
    'empty-template': ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'],
    'home-builder': ['Permitting', 'Structural', 'Systems', 'Finishings'],
    'standard-construction': ['Structural', 'Systems', 'Sheathing', 'Finishings'],
    'software-development': ['Software Engineering', 'Product Management', 'Design / UX', 'Marketing / Go-to-Market (GTM)']
  };

  const allowedCategories = presetCategories[presetId];
  if (!allowedCategories) {
    // If preset not found, return all templates
    return allTemplates;
  }

  // Filter templates to only include those that match the preset's tier1 categories
  return allTemplates.filter(template => allowedCategories.includes(template.tier1Category));
}