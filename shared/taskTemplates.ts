/**
 * Predefined task templates for construction projects
 * Generated from Task Temp.csv
 */

// Helper interface for task templates
export interface TaskTemplate {
  id: string; 
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

// Task templates collection organized by tier1 and tier2 categories
export const taskTemplates: TaskTemplateCollection = {
  structural: {
    foundation: [
      {
        id: "FN1",
        title: "Form & Soil Preparation (FN1)",
        description: "Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper (CN31, CN32).",
        tier1Category: "structural",
        tier2Category: "foundation",
        category: "Foundation",
        estimatedDuration: 7
      },
      {
        id: "FN2",
        title: "Foundation Utilities Installation & Inspection (FN2)",
        description: "Install foundation stub plumbing (with foam collars, termite shields) and HVAC gas lines; inspect utility placement and integrity (CN33–35).",
        tier1Category: "structural",
        tier2Category: "foundation",
        category: "Foundation",
        estimatedDuration: 5
      },
      {
        id: "FN3",
        title: "Foundation Base & Reinforcement (FN3)",
        description: "Prepare foundation base with crushed stone; install vapor barrier, reinforcing wire mesh, and perimeter insulation (CN36–39).",
        tier1Category: "structural",
        tier2Category: "foundation",
        category: "Foundation",
        estimatedDuration: 6
      },
      {
        id: "FN4",
        title: "Foundation Concrete Scheduling & Pre-Pour Inspection (FN4)",
        description: "Schedule foundation concrete delivery and confirm finishers; inspect foundation forms and utility alignment before pour (CN40, CN41).",
        tier1Category: "structural",
        tier2Category: "foundation",
        category: "Foundation",
        estimatedDuration: 3
      },
      {
        id: "FN5",
        title: "Foundation Slab Pour, Finish & Final Inspection (FN5)",
        description: "Pour foundation slab promptly, complete professional finish; inspect slab smoothness, drainage, and correct defects (CN42–44).",
        tier1Category: "structural",
        tier2Category: "foundation",
        category: "Foundation",
        estimatedDuration: 4
      },
      {
        id: "FN6",
        title: "Foundation Concrete Payment (FN6)",
        description: "Pay concrete supplier upon satisfactory foundation slab inspection (CN45).",
        tier1Category: "structural",
        tier2Category: "foundation",
        category: "Foundation",
        estimatedDuration: 1
      }
    ],
    roofing: [
      {
        id: "RF1",
        title: "Roofing Prep: Shingle Selection, Bidding & Ordering (RF 1)",
        description: "Select shingle style, color, and material; bid labor/materials; order shingles/felt; verify specifications with roofer. (RF1–RF3)",
        tier1Category: "structural",
        tier2Category: "roofing",
        category: "Roofing",
        estimatedDuration: 7
      },
      {
        id: "RF2",
        title: "Roofing Edge Protection: Drip Edge & Flashing Installation (RF 2)",
        description: "Install 3\" metal drip edges on eaves (under felt) and rake edges (over felt), plus necessary flashing at walls/valleys. (RF4 & RF6)",
        tier1Category: "structural",
        tier2Category: "roofing",
        category: "Roofing",
        estimatedDuration: 4
      },
      {
        id: "RF3",
        title: "Roofing Application: Felt & Shingle Installation (RF 3)",
        description: "Immediately after roof-deck inspection, install roofing felt; then install shingles starting appropriately based on roof width and weather conditions. (RF5 & RF7)",
        tier1Category: "structural",
        tier2Category: "roofing",
        category: "Roofing",
        estimatedDuration: 7
      },
      {
        id: "RF4",
        title: "Roofing Wrap-Up: Gutter Coordination (RF 4)",
        description: "Coordinate gutter installation to follow immediately after roofing completion. (RF7A)",
        tier1Category: "structural",
        tier2Category: "roofing",
        category: "Roofing",
        estimatedDuration: 3
      },
      {
        id: "RF5",
        title: "Roofing Closeout: Inspection & Subcontractor Payment (RF 5)",
        description: "Conduct thorough roofing inspection according to checklist/specifications; pay roofing subcontractor after obtaining signed affidavit, deduct worker's compensation if applicable. (RF8 & RF9)",
        tier1Category: "structural",
        tier2Category: "roofing",
        category: "Roofing",
        estimatedDuration: 2
      }
    ]
  },
  systems: {
    plumbing: [
      {
        id: "PL1",
        title: "Fixture Selection and Special Item Ordering (PL1)",
        description: "Determine type and quantity of plumbing fixtures (styles and colors), including: sinks (kitchen, baths, utility, wet bar, etc.), shower fixtures, toilets and toilet seats, exterior water spigots, water heater, garbage disposal, septic tank, sauna or steam room, water softener, refrigerator ice maker, and any other plumbing-related appliance. Order special plumbing fixtures well in advance, as supply houses rarely stock large quantities. (PL1 & PL4)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 14
      },
      {
        id: "PL2",
        title: "Bidding Management and Material Confirmation (PL2)",
        description: "Conduct a standard bidding process. Shop prices carefully, as bids may vary significantly depending on material selections and the subcontractor's pricing method. Decide on the type of piping to be used during this step. (PL2)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 7
      },
      {
        id: "PL3",
        title: "Coordination of Site Walkthrough and Utility Planning (PL3)",
        description: "Walk through the site with the plumber to confirm placement of plumbing systems and any special fixtures. Account for exterior finish (e.g., brick veneer), as this affects the extension of exterior faucets. Also, mark the location of all fixtures (sinks, tubs, showers, toilets, outdoor spigots, wet bars, icemakers, utility tubs, washers, and water heater). Note vanity vs. pedestal sinks, drain end of tubs, and wall/ceiling areas to avoid for pipe runs (e.g., recessed lights or medicine cabinets). Apply for water connection and sewer tap, pay any required tap fee, and record the water meter number. Ask the plumber for a garden hose adapter for the water main. (PL3, PL5 & PL8)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 5
      },
      {
        id: "PL4",
        title: "Stub Plumbing and Large Fixture Placement Before Framing (PL4)",
        description: "Install stub plumbing before concrete slab is poured—after batter boards and strings are set—and confirm sewer line location. Place all large fixtures (e.g., large tubs, fiberglass shower stalls, hot tubs) before framing begins to avoid clearance issues. Consider chaining expensive fixtures to studs or pipes for security. (PL6 & PL7)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 6
      },
      {
        id: "PL5",
        title: "Rough-In Plumbing Installation, Protection, and Testing Oversight (PL5)",
        description: "Install rough-in plumbing: hot (left) and cold (right) water lines, sewer, and vent pipe. Pipes should run through drilled holes in studs (not notched), with all required supports in place. Use FHA metal straps to protect pipes from being punctured by drywall nails at cut-outs. Exterior spigots should not be located near pipe penetrations through the exterior wall—this prevents leaks from freezing or failure. Extend spigots outward to accommodate brick veneer. Conduct air-pressure testing on water pipes to ensure no leaks. Install the water meter and spigot early to provide masons with a water source. Mark pipe locations (especially water and gas lines) to avoid damage during digging. (PL9, PL10, PL11 & PL13)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 10
      },
      {
        id: "PL6",
        title: "Rough-In Inspection, Corrections, and Payment Authorization (PL6)",
        description: "Schedule the plumbing inspector and be present during the inspection. No plumbing should be concealed before a rough-in certificate is issued. Use this opportunity to understand any required corrections and assess the plumber's workmanship. Correct any problems found using the power of county enforcement and leverage (i.e., plumber hasn't been paid yet). Once approved, pay the plumber for rough-in and obtain a signed receipt or equivalent documentation. (PL12, PL14, PL15 & PL16)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 5
      },
      {
        id: "PL7",
        title: "Final Fixture Installation and System Performance Testing (PL7)",
        description: "Install all previously selected fixtures: sinks, faucets, toilets, and shower heads. Tap into the main water supply and test the full system. Open all faucets to bleed out air and flush the lines. Expect temporary discoloration in the water as debris and solvents are cleared. (PL17 & PL18)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 7
      },
      {
        id: "PL8",
        title: "Final Inspection, Corrections, Payment, and Compliance Documentation (PL8)",
        description: "Schedule and conduct the final plumbing inspection, ideally with the inspector present so you can clarify any issues. Address and correct all deficiencies found. Pay the plumbing subcontractor for final work and obtain a signed affidavit. Finally, pay the remaining plumber retainage to close out the project. (PL19, PL20, PL21 & PL22)",
        tier1Category: "systems",
        tier2Category: "plumbing",
        category: "Plumbing",
        estimatedDuration: 3
      }
    ],
    hvac: [
      {
        id: "HV1",
        title: "HVAC Energy Audit & Requirements (HV1)",
        description: "Conduct an energy audit (often with help from local gas/electric companies) to determine your home's heating/cooling needs, decide whether to use a gas or electric dryer (and its location), and select the most suitable HVAC system by balancing cost and efficiency. (HV1, HV2)",
        tier1Category: "systems",
        tier2Category: "hvac",
        category: "HVAC",
        estimatedDuration: 7
      },
      {
        id: "HV2",
        title: "HVAC Bidding & Design (HV2)",
        description: "Manage the bidding process for the entire HVAC job (including a separate quote for ductwork), then finalize the HVAC system design by confirming equipment placement and the dryer exhaust location, ideally consulting with a gas company representative or inspector to prevent future issues. (HV3, HV4)",
        tier1Category: "systems",
        tier2Category: "hvac",
        category: "HVAC",
        estimatedDuration: 10
      },
      {
        id: "HV3",
        title: "HVAC Rough-In (Install, Inspect & Pay) (HV3)",
        description: "Install internal HVAC components (ducts, vents, returns) but hold off on external fixtures (like compressors) to avoid theft, schedule and attend the rough-in inspection with the county inspector, address any deficiencies noted, and then issue payment to the HVAC subcontractor for the rough-in phase—ensuring you receive a signed receipt. (HV5, HV6, HV7, HV8)",
        tier1Category: "systems",
        tier2Category: "hvac",
        category: "HVAC",
        estimatedDuration: 14
      },
      {
        id: "HV4",
        title: "HVAC Finish Work (HV4)",
        description: "Complete the HVAC system by installing the remaining components, such as the thermostat, registers, and the air conditioning compressor (charged with refrigerant), and verify the compressor's placement (arranging for a concrete pad if needed). (HV9)",
        tier1Category: "systems",
        tier2Category: "hvac",
        category: "HVAC",
        estimatedDuration: 7
      },
      {
        id: "HV5",
        title: "HVAC Final Inspection, Gas Hookup & Payments (HV5)",
        description: "Schedule the final HVAC inspection (ideally with the HVAC subcontractor and electrician present), correct any new deficiencies, contact the gas company to hook up service lines, note the gas-line route on your plat diagram, and finalize all HVAC payments—including any retainage—once the system is tested and fully operational. (HV10, HV11, HV12, HV13, HV14, HV15)",
        tier1Category: "systems",
        tier2Category: "hvac",
        category: "HVAC",
        estimatedDuration: 7
      }
    ],
    electrical: [
      {
        id: "EL1",
        title: "Electrical: Determine requirements, fixtures, appliances, and bidding",
        description: "Determine electrical requirements by deciding where to place lighting fixtures, outlets, and switches. Make sure no switches are blocked by a door, and consider furniture placement. Even if your blueprint has an electrical diagram, verify or improve it. Investigate low voltage and fluorescent lighting, keeping in mind that fluorescent lights cannot be dimmed. Select electrical fixtures and appliances by visiting lighting distributor showrooms, looking especially for energy-saving fluorescent options (though these cannot use a dimmer). Place special orders early, and test the doorbell sound before buying. Conduct a standard bidding process, obtaining pricing for installing each outlet, switch, and fixture. Electricians typically charge extra for wiring the service panel and any special work; use only a licensed electrician. (EL1, EL2, EL4)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 14
      },
      {
        id: "EL2",
        title: "Electrical: Arrange phone wiring and jack installations",
        description: "Determine if the phone company charges to wire the home for a modular phone system and how much they charge. Even if you plan on using wireless phones, install phone jacks in several locations. Schedule the phone company (or an electrician, if it's cheaper) to install modular phone wiring and jacks. Also consider transferring your existing phone number to your new home so you can keep the same number. (EL3, EL5)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 5
      },
      {
        id: "EL3",
        title: "Electrical: Secure temporary hookup and install pole",
        description: "Apply for and obtain permission to hook up the temporary pole to the public power system, possibly placing a deposit. Arrange for the hookup early enough so that power is available by the time framing starts. Install the temporary electric pole within approximately 100 feet of the center of the house foundation (closer if possible). (EL6, EL7)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 7
      },
      {
        id: "EL4",
        title: "Electrical: Oversee rough-in wiring (electrical, phone, cable, security)",
        description: "Perform rough-in electrical by running wiring through wall studs and ceiling joists. Mark locations where outlets and switches should go, or the electrician will place them at his discretion. Provide blocking near outlets if necessary. This ensures that lights, switches, and outlets align with furniture and other planned elements. Install modular phone wiring and jacks, as well as any other desired wiring, such as speaker, cable TV, security, or computer lines. Pre-wiring is much easier now than after the walls are closed up. Many security system contractors pre-wire for free if you purchase their system. (EL8, EL9)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 14
      },
      {
        id: "EL5",
        title: "Electrical: Schedule rough-in inspection, corrections, and payment",
        description: "Schedule the electrical inspection (usually done by the electrician). Once the county inspector reviews and signs off on the rough-in wiring, correct any issues they note. After the inspection is passed and any corrections are made, pay the electrical subcontractor for the rough-in work, keeping a receipt or proof of payment. (EL10, EL11, EL12, EL13)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 5
      },
      {
        id: "EL6",
        title: "Electrical: Coordinate garage doors and electric openers",
        description: "Install garage doors first (often handled by a specialist, not the electrician). Ensure that the garage door is properly in place so the electrician can hook up the opener. Next, install electric garage door openers and wire the necessary electrical connections. Keep remote controls in a secure location. (EL14, EL15)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 7
      },
      {
        id: "EL7",
        title: "Electrical: Supervise finish installations, final inspections, and activate services",
        description: "Perform all finish electrical work, terminating wiring for switches, outlets, and other devices. Install major appliances such as refrigerators, washers, dryers, ovens, vent hoods, garage door openers, exhaust fans, and doorbells; the air compressor is also wired at this stage. Call the phone company to connect service. Schedule a final electrical inspection and have the electrician present to address any last-minute issues. Store appliance manuals and warranties safely. Correct any electrical problems if they arise, and then call the electrical utility to connect service. (EL16, EL17, EL18, EL19, EL20)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 10
      },
      {
        id: "EL8",
        title: "Electrical: Final payment, affidavit, and retainage",
        description: "Pay the electrical subcontractor the final amount, ensuring you get an affidavit signed. After power is turned on and all switches and outlets have been tested, pay the retainage (remaining balance) to fully finalize the contract. (EL21, EL22)",
        tier1Category: "systems",
        tier2Category: "electrical",
        category: "Electrical",
        estimatedDuration: 3
      }
    ]
  },
  seathing: {
    siding: [
      {
        id: "SC1",
        title: "Select Siding materials, color, and style; conduct bidding. (SC1)",
        description: "Choose appropriate siding materials that match the desired aesthetic and performance requirements. Consider color, style, and coverage needs. Once decided, conduct a standard bidding process to compare pricing and contractor offerings. SC1, SC2",
        tier1Category: "seathing",
        tier2Category: "siding",
        category: "Siding",
        estimatedDuration: 7
      },
      {
        id: "SC2",
        title: "Order Windows/doors; verify dimensions and install correctly. (SC2)",
        description: "Order all necessary windows and doors, ensuring that the dimensions are verified precisely before delivery. During installation, use proper shims, secure locks, and install all hardware according to manufacturer specifications for durability and performance. SC3, SC4",
        tier1Category: "seathing",
        tier2Category: "siding",
        category: "Siding",
        estimatedDuration: 14
      },
      {
        id: "SC3",
        title: "Oversee Siding install, trim, caulking, inspection, and payments. (SC3)",
        description: "Supervise the installation of siding elements including flashing, trim, and caulking. Conduct a thorough inspection of the completed work, resolve any identified deficiencies, manage subcontractor payments while holding retainage as agreed, and ensure solutions are in place for material shrinkage over time. SC5, SC6, SC7, SC8, SC9, SC10, SC15, SC17",
        tier1Category: "seathing",
        tier2Category: "siding",
        category: "Siding",
        estimatedDuration: 21
      },
      {
        id: "SC4",
        title: "Install Siding cornice; inspect, fix issues, and release retainage. (SC4)",
        description: "Install all cornice components including fascia, frieze boards, soffits, and eave vents. Schedule and complete an official inspection, correct any problems noted, handle final payment to the subcontractor, and release retainage once the work is approved. SC11, SC12, SC13, SC14, SC18",
        tier1Category: "seathing",
        tier2Category: "siding",
        category: "Siding",
        estimatedDuration: 10
      },
      {
        id: "SC5",
        title: "Arrange Siding trim painting and caulking. (SC5)",
        description: "Coordinate the painting and caulking of exterior trim to ensure a weather-resistant and visually consistent finish. SC16",
        tier1Category: "seathing",
        tier2Category: "siding",
        category: "Siding",
        estimatedDuration: 5
      }
    ],
    drywall: [
      {
        id: "DR1",
        title: "Manage Drywall Procurement – DR1",
        description: "Handle the drywall bidding process, refer to contract specs, ask painters for quality sub referrals, and order materials if not supplied. Mark stud locations on floors before installation. (DR1, DR2)",
        tier1Category: "seathing",
        tier2Category: "drywall",
        category: "Drywall",
        estimatedDuration: 7
      },
      {
        id: "DR3",
        title: "Install and Finish Drywall – DR3",
        description: "Hang drywall on all walls with metal edging on outside corners and tape on inside corners. Spackle and sand all joints and nail dimples through multiple coats to achieve a smooth finish. (DR3, DR4)",
        tier1Category: "seathing",
        tier2Category: "drywall",
        category: "Drywall",
        estimatedDuration: 14
      },
      {
        id: "DR5",
        title: "Inspect and Repair Drywall – DR5",
        description: "Use angled lighting to inspect drywall surfaces. Mark imperfections with a pencil and coordinate repairs. Save large scraps for potential future use. (DR5, DR6)",
        tier1Category: "seathing",
        tier2Category: "drywall",
        category: "Drywall",
        estimatedDuration: 7
      },
      {
        id: "DR7",
        title: "Finalize Drywall Subcontract – DR7",
        description: "Pay the drywall subcontractor, collect a signed affidavit, and release final retainage after confirming quality, ideally post-first paint coat. (DR7, DR8)",
        tier1Category: "seathing",
        tier2Category: "drywall",
        category: "Drywall",
        estimatedDuration: 2
      }
    ],
    insulation: [
      {
        id: "IN1",
        title: "Plan Insulation work and bidding – IN1",
        description: "DETERMINE insulation requirements with help from local energy guidelines, and PERFORM standard bidding process to select a subcontractor. IN1, IN2",
        tier1Category: "seathing",
        tier2Category: "insulation",
        category: "Insulation",
        estimatedDuration: 7
      },
      {
        id: "IN3",
        title: "Install Insulation in walls and bathrooms – IN3",
        description: "INSTALL wall insulation in small spaces, around chimneys, offsets, and pipe penetrations; ADD additional insulation around bathrooms, with proper vapor barriers. IN3, IN4",
        tier1Category: "seathing",
        tier2Category: "insulation",
        category: "Insulation",
        estimatedDuration: 10
      }
    ]
  }
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