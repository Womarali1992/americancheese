/**
 * Predefined task templates for construction projects
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

// Foundation tasks
const foundationTasks: TaskTemplate[] = [
  {
    id: "FN1",
    title: "Form & Soil Preparation -CN31, CN 32-",
    description: "Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper (CN31, CN32).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "form",
    estimatedDuration: 2,
  },
  {
    id: "FN2",
    title: "Foundation Utilities Installation & Inspection (CN 33-35)",
    description: "Install foundation stub plumbing (with foam collars, termite shields) and HVAC gas lines; inspect utility placement and integrity (CN33–35).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN3",
    title: "Foundation Base & Reinforcement (36-39)",
    description: "Prepare foundation base with crushed stone; install vapor barrier, reinforcing wire mesh, and perimeter insulation (CN36–39).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN4",
    title: "Foundation Concrete Scheduling & Pre-Pour Inspection (CN 40,41)",
    description: "Schedule foundation concrete delivery and confirm finishers; inspect foundation forms and utility alignment before pour (CN40, CN41).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN5",
    title: "Foundation Slab Pour, Finish & Final Inspection (42-44)",
    description: "Pour foundation slab promptly, complete professional finish; inspect slab smoothness, drainage, and correct defects (CN42–44).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN6",
    title: "Foundation Concrete Payment",
    description: "Pay concrete supplier upon satisfactory foundation slab inspection (CN45).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
];

// Framing tasks
const framingTasks: TaskTemplate[] = [
  {
    id: "FR1",
    title: "Framing Prep: Roofing Material Selection & Ordering FR1",
    description: "Select shingle style, color, and material; bid labor/materials; order shingles/felt; verify specifications with roofer. FR 1-3",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2,
  },
  {
    id: "FR2",
    title: "Framing Detail: Drip Edge & Flashing Installation FR2",
    description: "Install 3\" metal drip edges on eaves (under felt) and rake edges (over felt), plus necessary flashing at walls/valleys. FR4 & FR6",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2,
  },
  {
    id: "FR3",
    title: "Framing Roof Cover: Felt & Shingle Installation FR3",
    description: "Immediately after roof-deck inspection, install roofing felt; then install shingles starting appropriately based on roof width and weather conditions. (FR5 & FR7)",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2,
  },
  {
    id: "FR4",
    title: "Framing Roof Wrap-Up: Gutter Coordination FR4",
    description: "Coordinate gutter installation to follow immediately after roofing completion. FR7A",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2,
  },
  {
    id: "FR5",
    title: "Framing Roof Closeout: Final Inspection & Payment FR5",
    description: "Conduct thorough roofing inspection according to checklist/specifications; pay roofing subcontractor after obtaining signed affidavit, deduct worker's compensation if applicable. (FR8 & FR9)",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2,
  },
];

// Roofing tasks
const roofingTasks: TaskTemplate[] = [
  {
    id: "-RF 1 -",
    title: "Roofing Prep: Shingle Selection, Bidding & Ordering (RF 1)",
    description: "Select shingle style, color, and material; bid labor/materials; order shingles/felt; verify specifications with roofer. (RF1–RF3)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2,
  },
  {
    id: "-RF 2 -",
    title: "Roofing Edge Protection: Drip Edge & Flashing Installation (RF 2)",
    description: "Install 3\" metal drip edges on eaves (under felt) and rake edges (over felt), plus necessary flashing at walls/valleys. (RF4 & RF6)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2,
  },
  {
    id: "-RF 3 -",
    title: "Roofing Application: Felt & Shingle Installation (RF 3)",
    description: "Immediately after roof-deck inspection, install roofing felt; then install shingles starting appropriately based on roof width and weather conditions. (RF5 & RF7)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2,
  },
  {
    id: "-RF 4 -",
    title: "Roofing Wrap-Up: Gutter Coordination (RF 4)",
    description: "Coordinate gutter installation to follow immediately after roofing completion. (RF7A)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2,
  },
  {
    id: "-RF 5 -",
    title: "Roofing Closeout: Inspection & Subcontractor Payment (RF 5)",
    description: "Conduct thorough roofing inspection according to checklist/specifications; pay roofing subcontractor after obtaining signed affidavit, deduct worker's compensation if applicable. (RF8 & RF9)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2,
  },
];

// Electrical tasks
const electricalTasks: TaskTemplate[] = [
  {
    id: "EL1",
    title: "Electrical: Determine requirements, fixtures, appliances, and bidding",
    description: "Determine electrical requirements by deciding where to place lighting fixtures, outlets, and switches. Make sure no switches are blocked by a door, and consider furniture placement. Even if your blueprint has an electrical diagram, verify or improve it. Investigate low voltage and fluorescent lighting, keeping in mind that fluorescent lights cannot be dimmed.",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL2",
    title: "Electrical: Arrange phone wiring and jack installations",
    description: "Determine if the phone company charges to wire the home for a modular phone system and how much they charge. Even if you plan on using wireless phones, install phone jacks in several locations. Schedule the phone company (or an electrician, if it's cheaper) to install modular phone wiring and jacks. Also consider transferring your existing phone number to your new home so you can keep the same number. (EL3, EL5)",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL3",
    title: "Electrical: Secure temporary hookup and install pole",
    description: "Apply for and obtain permission to hook up the temporary pole to the public power system, possibly placing a deposit. Arrange for the hookup early enough so that power is available by the time framing starts. Install the temporary electric pole within approximately 100 feet of the center of the house foundation (closer if possible). (EL6, EL7)",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL4",
    title: "Electrical: Oversee rough-in wiring (electrical, phone, cable, security)",
    description: "Perform rough-in electrical by running wiring through wall studs and ceiling joists. Mark locations where outlets and switches should go, or the electrician will place them at his discretion. Provide blocking near outlets if necessary.",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL5",
    title: "Electrical: Schedule rough-in inspection, corrections, and payment",
    description: "Schedule the electrical inspection (usually done by the electrician). Once the county inspector reviews and signs off on the rough-in wiring, correct any issues they note. After the inspection is passed and any corrections are made, pay the electrical subcontractor for the rough-in work, keeping a receipt or proof of payment. (EL10, EL11, EL12, EL13)",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL6",
    title: "Electrical: Coordinate garage doors and electric openers",
    description: "Install garage doors first (often handled by a specialist, not the electrician). Ensure that the garage door is properly in place so the electrician can hook up the opener. Next, install electric garage door openers and wire the necessary electrical connections. Keep remote controls in a secure location. (EL14, EL15)",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL7",
    title: "Electrical: Supervise finish installations, final inspections, and activate services",
    description: "Perform all finish electrical work, terminating wiring for switches, outlets, and other devices. Install major appliances such as refrigerators, washers, dryers, ovens, vent hoods, garage door openers, exhaust fans, and doorbells; the air compressor is also wired at this stage.",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
  {
    id: "EL8",
    title: "Electrical: Final payment, affidavit, and retainage",
    description: "Pay the electrical subcontractor the final amount, ensuring you get an affidavit signed. After power is turned on and all switches and outlets have been tested, pay the retainage (remaining balance) to fully finalize the contract. (EL21, EL22)",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
];

// Plumbing tasks
const plumbingTasks: TaskTemplate[] = [
  {
    id: "PL1",
    title: "Fixture Selection and Special Item Ordering (PL1)",
    description: "Determine type and quantity of plumbing fixtures (styles and colors), including: sinks (kitchen, baths, utility, wet bar, etc.), shower fixtures, toilets and toilet seats, exterior water spigots, water heater, garbage disposal, septic tank, sauna or steam room, water softener, refrigerator ice maker, and any other plumbing-related appliance.",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "fixture",
    estimatedDuration: 2,
  },
  {
    id: "PL2",
    title: "Bidding Management and Material Confirmation (PL2)",
    description: "Conduct a standard bidding process. Shop prices carefully, as bids may vary significantly depending on material selections and the subcontractor's pricing method. Decide on the type of piping to be used during this step. (PL2)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "bidding",
    estimatedDuration: 2,
  },
  {
    id: "PL3",
    title: "Coordination of Site Walkthrough and Utility Planning (PL3)",
    description: "Walk through the site with the plumber to confirm placement of plumbing systems and any special fixtures. Account for exterior finish (e.g., brick veneer), as this affects the extension of exterior faucets.",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "coordination",
    estimatedDuration: 2,
  },
  {
    id: "PL4",
    title: "Stub Plumbing and Large Fixture Placement Before Framing (PL4)",
    description: "Install stub plumbing before concrete slab is poured—after batter boards and strings are set—and confirm sewer line location. Place all large fixtures (e.g., large tubs, fiberglass shower stalls, hot tubs) before framing begins to avoid clearance issues. Consider chaining expensive fixtures to studs or pipes for security. (PL6 & PL7)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "stub",
    estimatedDuration: 2,
  },
  {
    id: "PL5",
    title: "Rough-In Plumbing Installation, Protection, and Testing Oversight (PL5)",
    description: "Install rough-in plumbing: hot (left) and cold (right) water lines, sewer, and vent pipe. Pipes should run through drilled holes in studs (not notched), with all required supports in place.",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "rough-in",
    estimatedDuration: 2,
  },
  {
    id: "PL6",
    title: "Rough-In Inspection, Corrections, and Payment Authorization (PL6)",
    description: "Schedule the plumbing inspector and be present during the inspection. No plumbing should be concealed before a rough-in certificate is issued. Use this opportunity to understand any required corrections and assess the plumber's workmanship.",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "rough-in",
    estimatedDuration: 2,
  },
  {
    id: "PL7",
    title: "Final Fixture Installation and System Performance Testing (PL7)",
    description: "Install all previously selected fixtures: sinks, faucets, toilets, and shower heads. Tap into the main water supply and test the full system. Open all faucets to bleed out air and flush the lines. Expect temporary discoloration in the water as debris and solvents are cleared. (PL17 & PL18)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "final",
    estimatedDuration: 2,
  },
  {
    id: "PL8",
    title: "Final Inspection, Corrections, Payment, and Compliance Documentation (PL8)",
    description: "Schedule and conduct the final plumbing inspection, ideally with the inspector present so you can clarify any issues. Address and correct all deficiencies found. Pay the plumbing subcontractor for final work and obtain a signed affidavit. Finally, pay the remaining plumber retainage to close out the project. (PL19, PL20, PL21 & PL22)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "final",
    estimatedDuration: 2,
  },
];

// HVAC tasks
const hvacTasks: TaskTemplate[] = [
  {
    id: "HV1",
    title: "HVAC Energy Audit & Requirements (HV1)",
    description: "Conduct an energy audit (often with help from local gas/electric companies) to determine your home's heating/cooling needs, decide whether to use a gas or electric dryer (and its location), and select the most suitable HVAC system by balancing cost and efficiency. (HV1, HV2)",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2,
  },
  {
    id: "HV2",
    title: "HVAC Bidding & Design (HV2)",
    description: "Manage the bidding process for the entire HVAC job (including a separate quote for ductwork), then finalize the HVAC system design by confirming equipment placement and the dryer exhaust location, ideally consulting with a gas company representative or inspector to prevent future issues. (HV3, HV4)",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2,
  },
  {
    id: "HV3",
    title: "HVAC Rough-In (Install, Inspect & Pay) (HV3)",
    description: "Install internal HVAC components (ducts, vents, returns) but hold off on external fixtures (like compressors) to avoid theft, schedule and attend the rough-in inspection with the county inspector, address any deficiencies noted, and then issue payment to the HVAC subcontractor for the rough-in phase—ensuring you receive a signed receipt. (HV5, HV6, HV7, HV8)",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2,
  },
  {
    id: "HV4",
    title: "HVAC Finish Work (HV4)",
    description: "Complete the HVAC system by installing the remaining components, such as the thermostat, registers, and the air conditioning compressor (charged with refrigerant), and verify the compressor's placement (arranging for a concrete pad if needed). (HV9)",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2,
  },
  {
    id: "HV5",
    title: "HVAC Final Inspection, Gas Hookup & Payments (HV5)",
    description: "Schedule the final HVAC inspection (ideally with the HVAC subcontractor and electrician present), correct any new deficiencies, contact the gas company to hook up service lines, note the gas-line route on your plat diagram, and finalize all HVAC payments—including any retainage—once the system is tested and fully operational. (HV10, HV11, HV12, HV13, HV14, HV15)",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2,
  },
];

// Barrier/Insulation tasks
const barrierTasks: TaskTemplate[] = [
  {
    id: "BR1",
    title: "Moisture Barrier Installation",
    description: "Install moisture barriers on exterior walls",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "moisture",
    estimatedDuration: 2,
  },
  {
    id: "BR2",
    title: "Wall Insulation",
    description: "Install insulation in exterior walls",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "insulation",
    estimatedDuration: 2,
  },
  {
    id: "BR3",
    title: "Ceiling/Attic Insulation",
    description: "Install insulation in ceilings and attic spaces",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "insulation",
    estimatedDuration: 2,
  },
  {
    id: "BR4",
    title: "Vapor Barrier Installation",
    description: "Install vapor barriers where required",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "vapor",
    estimatedDuration: 1,
  },
];

// Drywall tasks
const drywallTasks: TaskTemplate[] = [
  {
    id: "DW1",
    title: "Drywall Delivery and Staging",
    description: "Receive and stage drywall materials",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "DW2",
    title: "Drywall Hanging",
    description: "Install drywall sheets on walls and ceilings",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "installation",
    estimatedDuration: 4,
  },
  {
    id: "DW3",
    title: "Taping and Mudding",
    description: "Apply joint tape and compound to drywall seams",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "finishing",
    estimatedDuration: 3,
  },
  {
    id: "DW4",
    title: "Sanding",
    description: "Sand drywall surfaces for smooth finish",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "finishing",
    estimatedDuration: 2,
  },
  {
    id: "DW5",
    title: "Texture Application",
    description: "Apply texture to drywall surfaces (if specified)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "texture",
    estimatedDuration: 2,
  },
];

// Exterior tasks
const exteriorTasks: TaskTemplate[] = [
  {
    id: "EX1",
    title: "Exterior Siding Preparation",
    description: "Prepare exterior for siding installation",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "EX2",
    title: "Siding Installation",
    description: "Install exterior siding materials",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "siding",
    estimatedDuration: 4,
  },
  {
    id: "EX3",
    title: "Trim Installation",
    description: "Install exterior trim elements",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "trim",
    estimatedDuration: 2,
  },
  {
    id: "EX4",
    title: "Exterior Painting",
    description: "Paint or finish exterior surfaces",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "painting",
    estimatedDuration: 3,
  },
];

// Window tasks
const windowTasks: TaskTemplate[] = [
  {
    id: "WN1",
    title: "Window Delivery",
    description: "Receive and inspect windows",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "WN2",
    title: "Window Installation",
    description: "Install windows in prepared openings",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "installation",
    estimatedDuration: 2,
  },
  {
    id: "WN3",
    title: "Window Sealing and Flashing",
    description: "Seal and flash windows to prevent water penetration",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "sealing",
    estimatedDuration: 1,
  },
  {
    id: "WN4",
    title: "Window Trim Installation",
    description: "Install interior window trim",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "trim",
    estimatedDuration: 2,
  },
];

// Door tasks
const doorTasks: TaskTemplate[] = [
  {
    id: "DR1",
    title: "Door Delivery",
    description: "Receive and inspect doors",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "DR2",
    title: "Exterior Door Installation",
    description: "Install exterior entry doors",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "exterior",
    estimatedDuration: 1,
  },
  {
    id: "DR3",
    title: "Interior Door Installation",
    description: "Install interior doors throughout the structure",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "interior",
    estimatedDuration: 2,
  },
  {
    id: "DR4",
    title: "Door Hardware Installation",
    description: "Install doorknobs, hinges, and other hardware",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "hardware",
    estimatedDuration: 1,
  },
];

// Cabinet tasks
const cabinetTasks: TaskTemplate[] = [
  {
    id: "CB1",
    title: "Cabinet Delivery",
    description: "Receive and inspect cabinets",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "CB2",
    title: "Cabinet Layout",
    description: "Mark and prepare cabinet layout",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "CB3",
    title: "Base Cabinet Installation",
    description: "Install base cabinets",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "installation",
    estimatedDuration: 2,
  },
  {
    id: "CB4",
    title: "Wall Cabinet Installation",
    description: "Install wall cabinets",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "installation",
    estimatedDuration: 1,
  },
  {
    id: "CB5",
    title: "Cabinet Hardware Installation",
    description: "Install cabinet handles, knobs, and other hardware",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "hardware",
    estimatedDuration: 1,
  },
];

// Fixture tasks
const fixtureTasks: TaskTemplate[] = [
  {
    id: "FX1",
    title: "Bathroom Fixture Installation",
    description: "Install bathroom fixtures (toilet, sink, shower/tub)",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "bathroom",
    estimatedDuration: 2,
  },
  {
    id: "FX2",
    title: "Kitchen Fixture Installation",
    description: "Install kitchen fixtures (sink, faucet)",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "kitchen",
    estimatedDuration: 1,
  },
  {
    id: "FX3",
    title: "Appliance Installation",
    description: "Install major appliances",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "appliances",
    estimatedDuration: 1,
  },
  {
    id: "FX4",
    title: "Light Fixture Installation",
    description: "Install decorative light fixtures",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "lighting",
    estimatedDuration: 2,
  },
];

// Flooring tasks
const flooringTasks: TaskTemplate[] = [
  {
    id: "FL1",
    title: "Flooring Material Delivery",
    description: "Receive and acclimatize flooring materials",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "FL2",
    title: "Subfloor Preparation",
    description: "Prepare subfloor for flooring installation",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "FL3",
    title: "Tile Flooring Installation",
    description: "Install tile flooring in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "tile",
    estimatedDuration: 3,
  },
  {
    id: "FL4",
    title: "Hardwood Flooring Installation",
    description: "Install hardwood flooring in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "hardwood",
    estimatedDuration: 3,
  },
  {
    id: "FL5",
    title: "Carpet Installation",
    description: "Install carpet in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "carpet",
    estimatedDuration: 2,
  },
  {
    id: "FL6",
    title: "Vinyl/Laminate Flooring Installation",
    description: "Install vinyl or laminate flooring in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "vinyl",
    estimatedDuration: 2,
  },
];

// Permits and other administrative tasks
const permitTasks: TaskTemplate[] = [
  {
    id: "PM1",
    title: "Building Permit Application",
    description: "Apply for main building permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 14,
  },
  {
    id: "PM2",
    title: "Electrical Permit",
    description: "Obtain electrical work permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 7,
  },
  {
    id: "PM3",
    title: "Plumbing Permit",
    description: "Obtain plumbing work permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 7,
  },
  {
    id: "PM4",
    title: "HVAC Permit",
    description: "Obtain HVAC installation permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 7,
  },
  {
    id: "PM5",
    title: "Final Inspection",
    description: "Schedule and complete final building inspection",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "inspection",
    estimatedDuration: 1,
  },
];

// Organize all templates into a single, structured collection
export const taskTemplates: TaskTemplateCollection = {
  structural: {
    foundation: foundationTasks,
    framing: framingTasks,
    roofing: roofingTasks,
  },
  systems: {
    electrical: electricalTasks,
    plumbing: plumbingTasks,
    hvac: hvacTasks,
  },
  sheathing: {
    barriers: barrierTasks,
    drywall: drywallTasks,
    exteriors: exteriorTasks,
  },
  finishings: {
    windows: windowTasks,
    doors: doorTasks,
    cabinets: cabinetTasks,
    fixtures: fixtureTasks,
    flooring: flooringTasks,
  },
  Uncategorized: {
    permits: permitTasks,
    other: [],
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
