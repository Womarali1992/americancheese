import { Task } from "@/types";

// Import the TaskTemplate interface locally rather than from the shared file
interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  tier1Category: string;
  tier2Category: string;
  category: string;
  estimatedDuration: number;
}

// Pre-defined templates for the application
const HARDCODED_TEMPLATES: TaskTemplate[] = [
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
  {
    id: "SC1",
    title: "Select Siding materials, color, and style; conduct bidding. (SC1)",
    description: "Choose appropriate siding materials that match the desired aesthetic and performance requirements. Consider color, style, and coverage needs. Once decided, conduct a standard bidding process to compare pricing and contractor offerings. SC1, SC2",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "select",
    estimatedDuration: 2,
  },
  {
    id: "SC2",
    title: "Order Windows/doors; verify dimensions and install correctly. (SC2)",
    description: "Order all necessary windows and doors, ensuring that the dimensions are verified precisely before delivery. During installation, use proper shims, secure locks, and install all hardware according to manufacturer specifications for durability and performance. SC3, SC4",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "order",
    estimatedDuration: 2,
  },
  {
    id: "SC3",
    title: "Oversee Siding install, trim, caulking, inspection, and payments. (SC3)",
    description: "Supervise the installation of siding elements including flashing, trim, and caulking. Conduct a thorough inspection of the completed work, resolve any identified deficiencies, manage subcontractor payments while holding retainage as agreed, and ensure solutions are in place for material shrinkage over time. SC5, SC6, SC7, SC8, SC9, SC10, SC15, SC17",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "oversee",
    estimatedDuration: 2,
  },
  {
    id: "SC4",
    title: "Install Siding cornice; inspect, fix issues, and release retainage. (SC4)",
    description: "Install all cornice components including fascia, frieze boards, soffits, and eave vents. Schedule and complete an official inspection, correct any problems noted, handle final payment to the subcontractor, and release retainage once the work is approved. SC11, SC12, SC13, SC14, SC18",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "install",
    estimatedDuration: 2,
  },
  {
    id: "SC5",
    title: "Arrange Siding trim painting and caulking. (SC5)",
    description: "Coordinate the painting and caulking of exterior trim to ensure a weather-resistant and visually consistent finish. SC16",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "arrange",
    estimatedDuration: 2,
  },
  {
    id: "DR7",
    title: "Finalize Drywall Subcontract – DR7",
    description: "Pay the drywall subcontractor, collect a signed affidavit, and release final retainage after confirming quality, ideally post-first paint coat. (DR7, DR8)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "finalize",
    estimatedDuration: 2,
  },
  {
    id: "DR1",
    title: "Manage Drywall Procurement – DR1",
    description: "Handle the drywall bidding process, refer to contract specs, ask painters for quality sub referrals, and order materials if not supplied. Mark stud locations on floors before installation. (DR1, DR2)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "manage",
    estimatedDuration: 2,
  },
  {
    id: "DR3",
    title: "Install and Finish Drywall – DR3",
    description: "Hang drywall on all walls with metal edging on outside corners and tape on inside corners. Spackle and sand all joints and nail dimples through multiple coats to achieve a smooth finish. (DR3, DR4)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "install",
    estimatedDuration: 2,
  },
  {
    id: "DR5",
    title: "Inspect and Repair Drywall – DR5",
    description: "Use angled lighting to inspect drywall surfaces. Mark imperfections with a pencil and coordinate repairs. Save large scraps for potential future use. (DR5, DR6)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "inspect",
    estimatedDuration: 2,
  },
  {
    id: "IN1",
    title: "Plan Insulation work and bidding – IN1",
    description: "DETERMINE insulation requirements with help from local energy guidelines, and PERFORM standard bidding process to select a subcontractor. IN1, IN2",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "plan",
    estimatedDuration: 2,
  },
  {
    id: "IN3",
    title: "Install Insulation in walls and bathrooms – IN3",
    description: "INSTALL wall insulation in small spaces, around chimneys, offsets, and pipe penetrations. Ensure vapor barrier is securely stapled. INSTALL soundproofing insulation in bathrooms for noise control. IN3, IN4",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "install",
    estimatedDuration: 2,
  },
  {
    id: "IN5",
    title: "Install Insulation in floors and attic – IN5",
    description: "INSTALL floor insulation in crawl spaces and basement foundations using fiberglass and foam-in techniques. INSTALL attic insulation using batts or blown-in material. Layer properly to reduce air leaks and protect HVAC vents. IN5, IN6",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "install",
    estimatedDuration: 2,
  },
  {
    id: "IN7",
    title: "Inspect and correct Insulation work – IN7",
    description: "INSPECT insulation work for vapor barrier placement and thorough sealing around fixtures, plumbing, doors, and windows. CORRECT any issues found during inspection. IN7, IN8",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "inspect",
    estimatedDuration: 2,
  },
  {
    id: "IN9",
    title: "Finalize Insulation subcontractor payment – IN9",
    description: "PAY insulation subcontractor and obtain signed affidavit. PAY remaining retainage after final approval. IN9, IN10",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "finalize",
    estimatedDuration: 2,
  }
];

// Template cache - initialized with hardcoded templates for reliability
const taskTemplatesCache: {
  allTemplates: TaskTemplate[],
  templatesByTier1: Record<string, TaskTemplate[]>,
  templatesByTier2: Record<string, Record<string, TaskTemplate[]>>
} = {
  allTemplates: HARDCODED_TEMPLATES, // Initialize with hardcoded templates
  templatesByTier1: {},
  templatesByTier2: {}
};

// Initialize cache immediately when this module loads
(function initializeTemplateCache() {
  console.log("Initializing template cache with", HARDCODED_TEMPLATES.length, "templates");
  populateTemplateCaches();
})();

// Fetch task templates from the API
export async function fetchTemplates(): Promise<void> {
  try {
    // Fetch templates from the API
    const response = await fetch('/api/task-templates');
    
    if (!response.ok) {
      throw new Error('Failed to fetch task templates from API');
    }
    
    // Get template data from the API
    const templateData = await response.json();
    
    // If we have template data from the API, use it
    if (templateData && Array.isArray(templateData) && templateData.length > 0) {
      // Map API task data to our TaskTemplate interface
      const apiTemplates: TaskTemplate[] = templateData.map(task => ({
        id: task.templateId || `T${task.id}`,
        title: task.title,
        description: task.description || '',
        tier1Category: task.tier1Category || 'uncategorized',
        tier2Category: task.tier2Category || 'other',
        category: task.category || 'general',
        estimatedDuration: 2 // Default value
      }));
      
      // Initialize cache with templates from API
      taskTemplatesCache.allTemplates = apiTemplates;
      console.log("Successfully loaded templates from API:", taskTemplatesCache.allTemplates.length);
    } else {
      // Fallback to hardcoded templates if API returns empty data
      taskTemplatesCache.allTemplates = [...HARDCODED_TEMPLATES];
      console.log("Using hardcoded templates (API returned no data):", taskTemplatesCache.allTemplates.length);
    }
  } catch (error) {
    // If there's an error fetching from the API, use hardcoded templates
    console.error("Error fetching templates from API:", error);
    taskTemplatesCache.allTemplates = [...HARDCODED_TEMPLATES];
    console.log("Using hardcoded templates (API error):", taskTemplatesCache.allTemplates.length);
  }
  
  // Make sure the tier1 and tier2 caches are properly initialized
  populateTemplateCaches();
}

// Helper function to populate template caches
function populateTemplateCaches(): void {
  const templates = taskTemplatesCache.allTemplates || HARDCODED_TEMPLATES;
  
  // Clear caches first to ensure clean state
  taskTemplatesCache.templatesByTier1 = {};
  taskTemplatesCache.templatesByTier2 = {};
  
  // Populate tier1 cache
  templates.forEach(template => {
    const tier1 = template.tier1Category;
    if (!taskTemplatesCache.templatesByTier1[tier1]) {
      taskTemplatesCache.templatesByTier1[tier1] = [];
    }
    if (!taskTemplatesCache.templatesByTier1[tier1].some(t => t.id === template.id)) {
      taskTemplatesCache.templatesByTier1[tier1].push(template);
    }
  });
  
  // Populate tier2 cache
  templates.forEach(template => {
    const tier1 = template.tier1Category;
    const tier2 = template.tier2Category;
    
    if (!taskTemplatesCache.templatesByTier2[tier1]) {
      taskTemplatesCache.templatesByTier2[tier1] = {};
    }
    
    if (!taskTemplatesCache.templatesByTier2[tier1][tier2]) {
      taskTemplatesCache.templatesByTier2[tier1][tier2] = [];
    }
    
    if (!taskTemplatesCache.templatesByTier2[tier1][tier2].some(t => t.id === template.id)) {
      taskTemplatesCache.templatesByTier2[tier1][tier2].push(template);
    }
  });
}

// Helper functions to navigate the template structure
export function getAllTaskTemplates(): TaskTemplate[] {
  // If templates aren't loaded yet, initialize the cache with hardcoded templates
  if (!taskTemplatesCache.allTemplates || taskTemplatesCache.allTemplates.length === 0) {
    taskTemplatesCache.allTemplates = [...HARDCODED_TEMPLATES];
    populateTemplateCaches();
  }
  return taskTemplatesCache.allTemplates;
}

export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  if (taskTemplatesCache.templatesByTier1[tier1]) {
    return taskTemplatesCache.templatesByTier1[tier1];
  }
  
  // Filter all templates by tier1 category
  const templates = getAllTaskTemplates().filter(
    template => template.tier1Category === tier1
  );
  
  // Cache for future use
  taskTemplatesCache.templatesByTier1[tier1] = templates;
  return templates;
}

export function getTemplatesByTier2(tier1: string, tier2: string): TaskTemplate[] {
  if (taskTemplatesCache.templatesByTier2[tier1]?.[tier2]) {
    return taskTemplatesCache.templatesByTier2[tier1][tier2];
  }
  
  // Filter all templates by tier1 and tier2 categories
  const templates = getAllTaskTemplates().filter(
    template => template.tier1Category === tier1 && template.tier2Category === tier2
  );
  
  // Initialize tier1 cache if it doesn't exist
  if (!taskTemplatesCache.templatesByTier2[tier1]) {
    taskTemplatesCache.templatesByTier2[tier1] = {};
  }
  
  // Cache for future use
  taskTemplatesCache.templatesByTier2[tier1][tier2] = templates;
  return templates;
}

/**
 * This service provides helper functions to work with task templates and merge them
 * with real tasks from the database to provide a seamless experience for selecting
 * tasks, even those that haven't been created yet.
 */

// Convert a template to a Task object that can be used in the UI
export function templateToTask(template: TaskTemplate, projectId: number): Task {
  return {
    id: -1, // Will be replaced with a temporary ID
    title: template.title, // Now using the exact title without the prefix
    description: template.description,
    status: "not_started",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000).toISOString(),
    projectId: projectId,
    tier1Category: template.tier1Category,
    tier2Category: template.tier2Category,
    category: template.category,
    completed: false,
    contactIds: [],
    materialIds: [],
    materialsNeeded: null,
    // Add template ID as a special property to identify it
    templateId: template.id
  };
}

// Get a merged list of real tasks and template tasks
export function getMergedTasks(
  realTasks: Task[],
  projectId: number,
  selectedTier1?: string | null,
  selectedTier2?: string | null
): Task[] {
  // Debug logging
  console.log("getMergedTasks - Real tasks count:", realTasks.length);
  
  // Ensure realTasks is an array
  if (!Array.isArray(realTasks)) {
    console.warn("getMergedTasks received non-array for realTasks:", realTasks);
    realTasks = [];
  }
  
  // Get existing task IDs to avoid duplication
  const existingTaskTitles = new Set(realTasks.map(task => task.title));
  
  // Get templates based on selected tiers
  let templates: TaskTemplate[] = [];
  if (selectedTier1 && selectedTier2) {
    templates = getTemplatesByTier2(selectedTier1, selectedTier2);
    console.log(`getMergedTasks - Getting templates for tier1=${selectedTier1}, tier2=${selectedTier2}`);
  } else if (selectedTier1) {
    templates = getTemplatesByTier1(selectedTier1);
    console.log(`getMergedTasks - Getting templates for tier1=${selectedTier1} only`);
  } else {
    templates = getAllTaskTemplates();
    console.log("getMergedTasks - Getting ALL templates since no tiers selected");
  }
  
  console.log("getMergedTasks - Templates count:", templates.length);
  
  // Convert templates to tasks, avoiding duplicates with real tasks
  // Always include all templates (we're setting a new negative ID for each)
  const templateTasks = templates
    .map((template, index) => {
      // Use negative IDs to avoid conflicts with real tasks
      const task = templateToTask(template, projectId);
      task.id = -(index + 1); // Ensure each template has a unique negative ID
      return task;
    });
  
  console.log("getMergedTasks - Template tasks after filtering:", templateTasks.length);
  
  // Make a copy of real tasks to avoid mutation issues
  const realTasksCopy = [...realTasks];
  
  // Merge real tasks with template tasks
  const mergedTasks = [...realTasksCopy, ...templateTasks];
  
  console.log("getMergedTasks - Final merged tasks count:", mergedTasks.length);
  
  return mergedTasks;
}

// Check if a task is a template task
export function isTemplateTask(task: Task): boolean {
  return task.id < 0 || (task as any).templateId !== undefined;
}

// Helper function to filter tasks by tier1 and tier2 categories
export function filterTasksByCategories(
  tasks: Task[],
  selectedTier1?: string | null,
  selectedTier2?: string | null
): Task[] {
  if (!selectedTier1 && !selectedTier2) return tasks;
  
  return tasks.filter(task => {
    const tier1Match = !selectedTier1 || task.tier1Category === selectedTier1;
    const tier2Match = !selectedTier2 || task.tier2Category === selectedTier2;
    return tier1Match && tier2Match;
  });
}