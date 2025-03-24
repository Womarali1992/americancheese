// Process task templates directly from hardcoded data and update the database
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extract Client from pg 
const { Client } = pg;

// Define task templates directly from the hardcoded values in our codebase
const taskTemplates = [
  // Foundation Tasks
  {
    id: "FN1",
    title: "Form & Soil Preparation -CN31, CN 32-",
    description: "Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper (CN31, CN32).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "form",
    estimatedDuration: 2
  },
  {
    id: "FN2",
    title: "Foundation Utilities Installation & Inspection (CN 33-35)",
    description: "Install foundation stub plumbing (with foam collars, termite shields) and HVAC gas lines; inspect utility placement and integrity (CN33–35).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2
  },
  {
    id: "FN3",
    title: "Foundation Base & Reinforcement (36-39)",
    description: "Prepare foundation base with crushed stone; install vapor barrier, reinforcing wire mesh, and perimeter insulation (CN36–39).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2
  },
  {
    id: "FN4",
    title: "Foundation Concrete Scheduling & Pre-Pour Inspection (CN 40,41)",
    description: "Schedule foundation concrete delivery and confirm finishers; inspect foundation forms and utility alignment before pour (CN40, CN41).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2
  },
  {
    id: "FN5",
    title: "Foundation Slab Pour, Finish & Final Inspection (42-44)",
    description: "Pour foundation slab promptly, complete professional finish; inspect slab smoothness, drainage, and correct defects (CN42–44).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2
  },
  {
    id: "FN6",
    title: "Foundation Concrete Payment",
    description: "Pay concrete supplier upon satisfactory foundation slab inspection (CN45).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2
  },
  
  // Framing Tasks
  {
    id: "FR1",
    title: "Framing Prep: Roofing Material Selection & Ordering FR1",
    description: "Select shingle style, color, and material; bid labor/materials; order shingles/felt; verify specifications with roofer. FR 1-3",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2
  },
  {
    id: "FR2",
    title: "Framing Detail: Drip Edge & Flashing Installation FR2",
    description: "Install 3\" metal drip edges on eaves (under felt) and rake edges (over felt), plus necessary flashing at walls/valleys. FR4 & FR6",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2
  },
  {
    id: "FR3",
    title: "Framing Roof Cover: Felt & Shingle Installation FR3",
    description: "Immediately after roof-deck inspection, install roofing felt; then install shingles starting appropriately based on roof width and weather conditions. (FR5 & FR7)",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2
  },
  {
    id: "FR4",
    title: "Framing Roof Wrap-Up: Gutter Coordination FR4",
    description: "Coordinate gutter installation to follow immediately after roofing completion. FR7A",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2
  },
  {
    id: "FR5",
    title: "Framing Roof Closeout: Final Inspection & Payment FR5",
    description: "Conduct thorough roofing inspection according to checklist/specifications; pay roofing subcontractor after obtaining signed affidavit, deduct worker's compensation if applicable. (FR8 & FR9)",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "framing",
    estimatedDuration: 2
  },
  
  // Roofing Tasks
  {
    id: "RF1",
    title: "Roofing Prep: Shingle Selection, Bidding & Ordering (RF 1)",
    description: "Select shingle style, color, and material; bid labor/materials; order shingles/felt; verify specifications with roofer. (RF1–RF3)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2
  },
  {
    id: "RF2",
    title: "Roofing Edge Protection: Drip Edge & Flashing Installation (RF 2)",
    description: "Install 3\" metal drip edges on eaves (under felt) and rake edges (over felt), plus necessary flashing at walls/valleys. (RF4 & RF6)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2
  },
  {
    id: "RF3",
    title: "Roofing Application: Felt & Shingle Installation (RF 3)",
    description: "Immediately after roof-deck inspection, install roofing felt; then install shingles starting appropriately based on roof width and weather conditions. (RF5 & RF7)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2
  },
  {
    id: "RF4",
    title: "Roofing Wrap-Up: Gutter Coordination (RF 4)",
    description: "Coordinate gutter installation to follow immediately after roofing completion. (RF7A)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2
  },
  {
    id: "RF5",
    title: "Roofing Closeout: Inspection & Subcontractor Payment (RF 5)",
    description: "Conduct thorough roofing inspection according to checklist/specifications; pay roofing subcontractor after obtaining signed affidavit, deduct worker's compensation if applicable. (RF8 & RF9)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2
  },
  
  // Plumbing Tasks
  {
    id: "PL1",
    title: "Fixture Selection and Special Item Ordering (PL1)",
    description: "Determine type and quantity of plumbing fixtures (styles and colors), including: sinks (kitchen, baths, utility, wet bar, etc.), shower fixtures, toilets and toilet seats, exterior water spigots, water heater, garbage disposal, septic tank, sauna or steam room, water softener, refrigerator ice maker, and any other plumbing-related appliance. Order special plumbing fixtures well in advance, as supply houses rarely stock large quantities. (PL1 & PL4)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "fixture",
    estimatedDuration: 2
  },
  {
    id: "PL2",
    title: "Bidding Management and Material Confirmation (PL2)",
    description: "Conduct a standard bidding process. Shop prices carefully, as bids may vary significantly depending on material selections and the subcontractor's pricing method. Decide on the type of piping to be used during this step. (PL2)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "bidding",
    estimatedDuration: 2
  },
  {
    id: "PL3",
    title: "Coordination of Site Walkthrough and Utility Planning (PL3)",
    description: "Walk through the site with the plumber to confirm placement of plumbing systems and any special fixtures. Account for exterior finish (e.g., brick veneer), as this affects the extension of exterior faucets. Also, mark the location of all fixtures (sinks, tubs, showers, toilets, outdoor spigots, wet bars, icemakers, utility tubs, washers, and water heater). Note vanity vs. pedestal sinks, drain end of tubs, and wall/ceiling areas to avoid for pipe runs (e.g., recessed lights or medicine cabinets). Apply for water connection and sewer tap, pay any required tap fee, and record the water meter number. Ask the plumber for a garden hose adapter for the water main. (PL3, PL5 & PL8)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "coordination",
    estimatedDuration: 2
  },
  
  // HVAC Tasks
  {
    id: "HV1",
    title: "HVAC Energy Audit & Requirements (HV1)",
    description: "Conduct an energy audit (often with help from local gas/electric companies) to determine your home's heating/cooling needs, decide whether to use a gas or electric dryer (and its location), and select the most suitable HVAC system by balancing cost and efficiency. (HV1, HV2)",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2
  },
  {
    id: "HV2",
    title: "HVAC Bidding & Design (HV2)",
    description: "Manage the bidding process for the entire HVAC job (including a separate quote for ductwork), then finalize the HVAC system design by confirming equipment placement and the dryer exhaust location, ideally consulting with a gas company representative or inspector to prevent future issues. (HV3, HV4)",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2
  },
  
  // Electrical Tasks
  {
    id: "EL1",
    title: "Electrical: Determine requirements, fixtures, appliances, and bidding",
    description: "Determine electrical requirements by deciding where to place lighting fixtures, outlets, and switches. Make sure no switches are blocked by a door, and consider furniture placement. Even if your blueprint has an electrical diagram, verify or improve it. Investigate low voltage and fluorescent lighting, keeping in mind that fluorescent lights cannot be dimmed. Select electrical fixtures and appliances by visiting lighting distributor showrooms, looking especially for energy-saving fluorescent options (though these cannot use a dimmer). Place special orders early, and test the doorbell sound before buying. Conduct a standard bidding process, obtaining pricing for installing each outlet, switch, and fixture. Electricians typically charge extra for wiring the service panel and any special work; use only a licensed electrician. (EL1, EL2, EL4)",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2
  },
  {
    id: "EL2",
    title: "Electrical: Arrange phone wiring and jack installations",
    description: "Determine if the phone company charges to wire the home for a modular phone system and how much they charge. Even if you plan on using wireless phones, install phone jacks in several locations. Schedule the phone company (or an electrician, if it's cheaper) to install modular phone wiring and jacks. Also consider transferring your existing phone number to your new home so you can keep the same number. (EL3, EL5)",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2
  },
  
  // Sheathing Tasks
  {
    id: "SC1",
    title: "Select Siding materials, color, and style; conduct bidding. (SC1)",
    description: "Choose appropriate siding materials that match the desired aesthetic and performance requirements. Consider color, style, and coverage needs. Once decided, conduct a standard bidding process to compare pricing and contractor offerings. SC1, SC2",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "select",
    estimatedDuration: 2
  },
  {
    id: "SC2",
    title: "Order Windows/doors; verify dimensions and install correctly. (SC2)",
    description: "Order all necessary windows and doors, ensuring that the dimensions are verified precisely before delivery. During installation, use proper shims, secure locks, and install all hardware according to manufacturer specifications for durability and performance. SC3, SC4",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "order",
    estimatedDuration: 2
  },
  {
    id: "SC3",
    title: "Oversee Siding install, trim, caulking, inspection, and payments. (SC3)",
    description: "Supervise the installation of siding elements including flashing, trim, and caulking. Conduct a thorough inspection of the completed work, resolve any identified deficiencies, manage subcontractor payments while holding retainage as agreed, and ensure solutions are in place for material shrinkage over time. SC5, SC6, SC7, SC8, SC9, SC10, SC15, SC17",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "oversee",
    estimatedDuration: 2
  },
  {
    id: "SC4",
    title: "Install Siding cornice; inspect, fix issues, and release retainage. (SC4)",
    description: "Install all cornice components including fascia, frieze boards, soffits, and eave vents. Schedule and complete an official inspection, correct any problems noted, handle final payment to the subcontractor, and release retainage once the work is approved. SC11, SC12, SC13, SC14, SC18",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "install",
    estimatedDuration: 2
  },
  {
    id: "SC5",
    title: "Arrange Siding trim painting and caulking. (SC5)",
    description: "Coordinate the painting and caulking of exterior trim to ensure a weather-resistant and visually consistent finish. SC16",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "arrange",
    estimatedDuration: 2
  },
  
  // Drywall Tasks
  {
    id: "DR7",
    title: "Finalize Drywall Subcontract – DR7",
    description: "Pay the drywall subcontractor, collect a signed affidavit, and release final retainage after confirming quality, ideally post-first paint coat. (DR7, DR8)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "finalize",
    estimatedDuration: 2
  },
  {
    id: "DR1",
    title: "Manage Drywall Procurement – DR1",
    description: "Handle the drywall bidding process, refer to contract specs, ask painters for quality sub referrals, and order materials if not supplied. Mark stud locations on floors before installation. (DR1, DR2)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "manage",
    estimatedDuration: 2
  },
  {
    id: "DR3",
    title: "Install and Finish Drywall – DR3",
    description: "Hang drywall on all walls with metal edging on outside corners and tape on inside corners. Spackle and sand all joints and nail dimples through multiple coats to achieve a smooth finish. (DR3, DR4)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "install",
    estimatedDuration: 2
  },
  {
    id: "DR5",
    title: "Inspect and Repair Drywall – DR5",
    description: "Use angled lighting to inspect drywall surfaces. Mark imperfections with a pencil and coordinate repairs. Save large scraps for potential future use. (DR5, DR6)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "inspect",
    estimatedDuration: 2
  },
  
  // Insulation Tasks
  {
    id: "IN1",
    title: "Plan Insulation work and bidding – IN1",
    description: "DETERMINE insulation requirements with help from local energy guidelines, and PERFORM standard bidding process to select a subcontractor. IN1, IN2",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "plan",
    estimatedDuration: 2
  },
  {
    id: "IN3",
    title: "Install Insulation in walls and bathrooms – IN3",
    description: "INSTALL wall insulation in small spaces, around chimneys, offsets, and pipe penetrations. Ensure vapor barrier is securely stapled. INSTALL soundproofing insulation in bathrooms for noise control. IN3, IN4",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "install",
    estimatedDuration: 2
  },
  {
    id: "IN5",
    title: "Install Insulation in floors and attic – IN5",
    description: "INSTALL floor insulation in crawl spaces and basement foundations using fiberglass and foam-in techniques. INSTALL attic insulation using batts or blown-in material. Layer properly to reduce air leaks and protect HVAC vents. IN5, IN6",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "install",
    estimatedDuration: 2
  },
  {
    id: "IN7",
    title: "Inspect and correct Insulation work – IN7",
    description: "INSPECT insulation work for vapor barrier placement and thorough sealing around fixtures, plumbing, doors, and windows. CORRECT any issues found during inspection. IN7, IN8",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "inspect",
    estimatedDuration: 2
  },
  {
    id: "IN9",
    title: "Finalize Insulation subcontractor payment – IN9",
    description: "PAY insulation subcontractor and obtain signed affidavit. PAY remaining retainage after final approval. IN9, IN10",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "finalize",
    estimatedDuration: 2
  }
];

async function updateTasksInDatabase() {
  console.log('Connecting to database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');

    // Get all projects to add tasks for each
    const projectResult = await client.query('SELECT id, name FROM projects');
    const projects = projectResult.rows;
    console.log(`Found ${projects.length} projects`);
    
    if (projects.length === 0) {
      console.log('No projects found, cannot add tasks');
      return;
    }
    
    // Delete all existing tasks
    console.log('Deleting all existing tasks...');
    await client.query('DELETE FROM tasks');
    console.log('Deleted all existing tasks');
    
    // Reset the sequence
    await client.query(`ALTER SEQUENCE tasks_id_seq RESTART WITH 1`);
    
    // Insert new tasks for each project
    console.log('Inserting new tasks for all projects...');
    for (const project of projects) {
      console.log(`Adding tasks for project ${project.id}: ${project.name}`);
      
      // For each task template, create a task for this project
      for (const template of taskTemplates) {
        if (template.id && template.title) {
          const query = `
            INSERT INTO tasks 
            (title, description, status, start_date, end_date, project_id, completed, category, tier1_category, tier2_category) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          
          const values = [
            template.title,
            template.description,
            'not_started',
            new Date().toISOString(),
            new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000).toISOString(),
            project.id, // Individual project ID
            false,
            template.category,
            template.tier1Category,
            template.tier2Category
          ];
          
          await client.query(query, values);
          console.log(`Inserted task: ${template.title} for project ${project.id}`);
        }
      }
    }
    
    console.log('All tasks updated successfully for all projects');
  } catch (error) {
    console.error('Error updating task templates:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the update
updateTasksInDatabase();