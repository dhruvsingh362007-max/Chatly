export const INITIAL_USER = {
  id: 'usr_ind_001',
  name: 'Amanpreet Singh',
  email: 'aman.singh@example.in',
  role: 'driver',
  phone: '+91 98765 43210',
  driverLicense: 'DL-PB102022004581',
  vehicles: [
    { plate: 'PB10AB1234', make: 'Maruti Suzuki', model: 'Swift ZXi', year: 2023, color: 'Magma Grey' },
    { plate: 'DL01CZ4592', make: 'Tata', model: 'Nexon EV Empowered', year: 2022, color: 'Teal Blue' }
  ],
  notificationsCount: 2
};

export const INITIAL_ADMIN = {
  id: 'adm_ind_007',
  name: 'Inspector Rakesh Verma',
  email: 'admin.verma@urbanmobility.gov.in',
  role: 'admin',
  badgeNumber: 'IN-TC-402',
  department: 'Municipal Parking Compliance Cell - Traffic Management Wing',
  jurisdiction: 'Metro Urban Zone 1'
};

export const INITIAL_VIOLATIONS = [
  {
    id: 'IND-VIO-2024-8841',
    vehiclePlate: 'PB10AB1234',
    vehicleDetails: '2023 Maruti Suzuki Swift (Magma Grey)',
    driverName: 'Amanpreet Singh',
    type: 'Expired Paid Parking Duration',
    category: 'Commercial Curbside Parking',
    location: 'Mall Road, Near Clock Tower, Zone C-2 (Kiosk #14), Ludhiana',
    gps: '30.9010° N, 75.8573° E',
    issueDate: '2024-10-28 14:15',
    dueDate: '2024-11-18',
    fineAmount: 500.0,
    lateFee: 0.0,
    status: 'Pending', // Pending, Under Dispute, Resolved, Overdue
    officerId: 'E-ENF-104',
    ordinanceCode: 'Sample Parking Guideline Rule PR-101.A (Commercial Duration Window)',
    evidenceImage: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    description: 'Vehicle parked 6 minutes past the paid parking token duration during high-turnover afternoon hours.',
    aiAssessment: {
      verdict: 'High Merit for Grace Window Review (Sample Demo)',
      confidenceScore: 88,
      summary: 'Ticket recorded 6 minutes post digital slip expiration. Under Sample Parking Guideline PR-101.B, an automated 10-minute grace window applies when a digital payment network latency is noted. Sample UPI gateway logs confirm a payment retry at 14:12.',
      reference: 'Sample Guideline Rule PR-101.B (Curbside Grace Window Benchmark)',
      legalGrounds: [
        'Sample Guideline Rule PR-101.B: Automated 10-minute digital grace window applicable',
        'UPI gateway transaction retry attempt timestamp matches 14:12',
        'Demonstration vehicle has zero prior citations in Zone C-2'
      ],
      recommendedPath: 'Submit demonstration appeal attaching UPI transaction attempt screenshot.',
      potentialFineReduction: '100% Fine Waiver (Demo)'
    },
    disputeDetails: null
  },
  {
    id: 'IND-VIO-2024-7930',
    vehiclePlate: 'PB10AB1234',
    vehicleDetails: '2023 Maruti Suzuki Swift (Magma Grey)',
    driverName: 'Amanpreet Singh',
    type: 'Designated No-Parking Zone (Yellow Line Marking)',
    category: 'Urban Roadway Maintenance',
    location: 'Connaught Place, Radial Road 3 (Inner Circle), New Delhi',
    gps: '28.6315° N, 77.2167° E',
    issueDate: '2024-10-14 09:35',
    dueDate: '2024-11-04',
    fineAmount: 1000.0,
    lateFee: 200.0,
    status: 'Under Dispute',
    officerId: 'TRAFFIC-DEL-21',
    ordinanceCode: 'Sample Urban Parking Guideline Rule PR-102 (Yellow Kerb Restriction)',
    evidenceImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    description: 'Vehicle halted along yellow curb restricted corridor during morning peak traffic clearance route.',
    aiAssessment: {
      verdict: 'Moderate Basis for Appeal (Sample Demo)',
      confidenceScore: 76,
      summary: 'Regulatory signboard obscured by temporary utility road barricades. Demonstration street photo verifies restriction board was non-legible within standard roadway approach distance.',
      reference: 'Sample Guideline Rule PR-102.D (Signage Visibility & Obstruction Standard)',
      legalGrounds: [
        'Sample Guideline Rule PR-102.D: Mandatory Visibility of Curbside Signage',
        'Temporary utility work barricade obscured regulatory signage'
      ],
      recommendedPath: 'Submit photo evidence showing construction barricade blocking the signage.',
      potentialFineReduction: 'Full Fine Waiver or Reduced Demonstration Surcharge'
    },
    disputeDetails: {
      submittedAt: '2024-10-16 11:20',
      reason: 'Signage was heavily obscured by temporary road repair barricades.',
      evidenceSubmitted: true,
      status: 'Under Demonstration Review by Parking Cell'
    }
  },
  {
    id: 'IND-VIO-2024-9104',
    vehiclePlate: 'DL01CZ4592',
    vehicleDetails: '2022 Tata Nexon EV (Teal Blue)',
    driverName: 'Amanpreet Singh',
    type: 'EV Charging Bay Idle Overstay',
    category: 'Clean Mobility Infrastructure',
    location: 'Cyber Hub Parking Deck, Level 1, Bay EV-04, Gurugram',
    gps: '28.4950° N, 77.0890° E',
    issueDate: '2024-11-01 11:10',
    dueDate: '2024-11-21',
    fineAmount: 750.0,
    lateFee: 0.0,
    status: 'Pending',
    officerId: 'SMART-CAM-09',
    ordinanceCode: 'Sample EV Infrastructure Guideline Rule PR-104 (Active Charging Bay Mandate)',
    evidenceImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    description: 'Vehicle occupied designated EV fast charging bay after charge session terminated prematurely.',
    aiAssessment: {
      verdict: 'Fair Claim with Telematics Log (Sample Demo)',
      confidenceScore: 70,
      summary: 'Public charger event log records sudden charging interruption triggered by grid voltage spike. Driver received app notification late due to basement parking signal latency.',
      reference: 'Sample EV Guideline Rule PR-104.C (Equipment Interruption Exception)',
      legalGrounds: [
        'Sample EV Guideline Rule PR-104.C: Technical hardware/grid interruption consideration',
        'Public charger event log corroborates abrupt session termination'
      ],
      recommendedPath: 'Attach charger telematics screenshot to request sample demonstration waiver.',
      potentialFineReduction: '100% Fine Waiver (Demo)'
    },
    disputeDetails: null
  },
  {
    id: 'IND-VIO-2024-6512',
    vehiclePlate: 'PB10AB1234',
    vehicleDetails: '2023 Maruti Suzuki Swift (Magma Grey)',
    driverName: 'Amanpreet Singh',
    type: 'Emergency Gate & Fire Hydrant Clearance Obstruction',
    category: 'Public Safety Zone',
    location: 'MG Road, Near Metro Pillar #124, Bengaluru',
    gps: '12.9716° N, 77.5946° E',
    issueDate: '2024-09-02 18:20',
    dueDate: '2024-09-25',
    fineAmount: 1500.0,
    lateFee: 0.0,
    status: 'Resolved',
    officerId: 'TRAFFIC-BLR-88',
    ordinanceCode: 'Sample Emergency Access Guideline Rule PR-103 (Emergency Gate Clearance)',
    evidenceImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    description: 'Vehicle parked within 3 meters of active emergency hospital entry gate.',
    aiAssessment: {
      verdict: 'Low Merit for Appeal (Sample Safety Rule)',
      confidenceScore: 18,
      summary: 'Vehicle parked within restricted emergency access zone. Sample safety guideline mandates strict clearance with zero discretionary buffer.',
      reference: 'Sample Emergency Access Guideline Rule PR-103',
      legalGrounds: [
        'Strict liability emergency vehicle passage guideline'
      ],
      recommendedPath: 'Prompt fee settlement completed to prevent penalty escalation.',
      potentialFineReduction: 'None'
    },
    disputeDetails: null,
    resolvedAt: '2024-09-08 10:14',
    resolutionMethod: 'Paid in Full via UPI Payment Gateway (₹1,500.00)'
  },
  {
    id: 'IND-VIO-2024-5402',
    vehiclePlate: 'PB10AB1234',
    vehicleDetails: '2023 Maruti Suzuki Swift (Magma Grey)',
    driverName: 'Amanpreet Singh',
    type: 'Commercial Corridor Double Parking',
    category: 'Commercial Carriage-way',
    location: 'FC Road, Near Goodluck Chowk, Pune',
    gps: '18.5204° N, 73.8567° E',
    issueDate: '2024-08-19 16:40',
    dueDate: '2024-09-10',
    fineAmount: 1000.0,
    lateFee: 0.0,
    status: 'Resolved',
    officerId: 'TRAFFIC-PUN-12',
    ordinanceCode: 'Sample Commercial Corridor Guideline Rule PR-105 (Loading Zone Stop)',
    evidenceImage: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    description: 'Vehicle temporarily double-parked on commercial stretch during urgent pharmacy supplies delivery.',
    aiAssessment: {
      verdict: 'Appeal Approved by Reviewer (Sample Demo)',
      confidenceScore: 90,
      summary: 'Driver presented signed urgent pharmacy delivery receipt. Temporary emergency commercial drop-off exception was applied.',
      reference: 'Sample Guideline Rule PR-105.B (Essential Medical Delivery Clause)',
      legalGrounds: [
        'Sample Guideline Rule PR-105.B: Urgent medical courier temporary stop exception',
        'Stamped medical distributor challan verified'
      ],
      recommendedPath: 'Dispute approved during sample demonstration review.',
      potentialFineReduction: '100% Fine Waived (₹0 owed)'
    },
    disputeDetails: {
      submittedAt: '2024-08-21 14:00',
      reason: 'Urgent medical delivery for nearby healthcare clinic.',
      status: 'Dispute Approved - Fine Dismissed (Demo)'
    },
    resolvedAt: '2024-08-25 16:30',
    resolutionMethod: 'Dispute Approved - Fine Waived (₹1,000.00 saved)'
  }
];

export const MUNICIPAL_RULES = [
  {
    id: 'RUL-IND-101',
    code: 'PR-101',
    title: 'Commercial District Paid Parking Hours',
    zone: 'Downtown Commercial Core (Zone C-1, C-2)',
    hours: 'Mon-Sat: 09:00 AM - 09:00 PM',
    rate: '₹30 / hr (3-hour limit)',
    fineAmount: 500,
    gracePeriodMinutes: 10,
    active: true,
    description: 'Regulates high-turnover commercial market parking. 10-minute digital grace window applied for payment gateway latency.'
  },
  {
    id: 'RUL-IND-102',
    code: 'PR-102',
    title: 'Designated No-Parking & Tow-Away Zones',
    zone: 'Arterial Ring Roads & High-Density Corridors',
    hours: '24 Hours / 7 Days a Week',
    rate: 'Strict Tow-Away Zone',
    fineAmount: 1000,
    gracePeriodMinutes: 0,
    active: true,
    description: 'Prohibits stopping along yellow line kerb markings. Regulatory boards must be clearly legible and unobstructed.'
  },
  {
    id: 'RUL-IND-103',
    code: 'PR-103',
    title: 'Emergency Gate & Fire Hydrant Clearance',
    zone: 'City-wide (All Hospital & Emergency Access Gates)',
    hours: '24 Hours / 7 Days a Week',
    rate: 'Strict Prohibition',
    fineAmount: 1500,
    gracePeriodMinutes: 0,
    active: true,
    description: 'Vehicles must maintain at least 3 meters clearance from emergency hospital gates, fire station exits, and hydrants.'
  },
  {
    id: 'RUL-IND-104',
    code: 'PR-104',
    title: 'Public EV Charging Stall Idle Regulation',
    zone: 'Designated Public Charging Stations & Garages',
    hours: '24 Hours (While Connected)',
    rate: '₹15/kWh charging + ₹2/min idle post 30-min buffer',
    fineAmount: 750,
    gracePeriodMinutes: 30,
    active: true,
    description: 'Discourages non-charging vehicles from occupying EV bays. Power grid interruptions considered upon telematics submission.'
  },
  {
    id: 'RUL-IND-105',
    code: 'PR-105',
    title: 'Residential Sector Overnight Parking Program',
    zone: 'Residential Sectors & Colony Gates',
    hours: 'Daily: 11:00 PM - 06:00 AM',
    rate: 'Resident Digital Sticker Token',
    fineAmount: 500,
    gracePeriodMinutes: 15,
    active: false,
    description: 'Configurable overnight residential token guideline to ensure clear passage for night emergency response vehicles.'
  }
];

export const INITIAL_REPORTED_VIOLATIONS = [
  {
    id: 'REP-IND-001',
    reportedBy: 'Citizen Reporter #440',
    vehiclePlate: 'HR26DQ1109',
    location: 'Sector 18 Market, Near Gate #2, Noida',
    violationType: 'Double Parking Blocking Bus Bay',
    timestamp: '2024-11-03 16:15',
    status: 'Verified by AI Vision (Sample Demo)',
    confidence: '95% confidence',
    notes: 'Commercial tempo parked blocking the public transit bus shelter.'
  },
  {
    id: 'REP-IND-002',
    reportedBy: 'Driver Amanpreet Singh',
    vehiclePlate: 'MH12DE8831',
    location: 'JM Road, Near Deccan Bus Stand, Pune',
    violationType: 'Emergency Gate Clearance Obstruction',
    timestamp: '2024-11-02 11:30',
    status: 'Pending Review by Parking Cell',
    confidence: '91% confidence',
    notes: 'Private sedan parked blocking the hospital ambulance gate ramp.'
  }
];

/**
 * Modular Knowledge Base Reference for Future Gemini API & RAG Integration.
 * Designed with structured chunks: metadata, query keywords, source guideline, and reference.
 */
export const SAMPLE_AI_KNOWLEDGE_BASE = [
  {
    id: 'KB-PR-101',
    queryKeywords: ['meter', 'expired', 'commercial', 'grace', '10 min', '10-minute', 'duration', 'ludhiana', 'mall road'],
    source: 'Sample Parking Guideline Rule PR-101 (Commercial Parking Window)',
    title: 'Grace Window & Digital Payment Latency',
    response: `### Sample AI Compliance Guidance [Demonstration Benchmark]

Under **Sample Parking Guideline Rule PR-101.B**, demonstration rules provide a **10-minute grace window** following digital parking token expiry if:
1. A payment transaction retry was recorded via the parking app/UPI kiosk around the time of expiry.
2. A temporary network or gateway latency event was recorded by the parking terminal.

**Suggested Resolution Path (Sample Demo):**
* **Option A: Submit Digital Receipt Appeal:** Attach your UPI or digital payment failure screenshot. In our sample demonstration dataset, this scenario yields high merit for fee reversal.
* **Option B: Prompt Settlement:** If the overstay was unassisted by payment issues, prompt settlement of ₹500 avoids administrative late additions.

*Note: This is an explainable AI demonstration based on configurable sample parking rules.*`
  },
  {
    id: 'KB-PR-102',
    queryKeywords: ['yellow', 'curb', 'kerb', 'sign', 'obscured', 'tree', 'barricade', 'no parking', 'connaught place', 'delhi'],
    source: 'Sample Urban Parking Guideline Rule PR-102 (Yellow Kerb Restriction)',
    title: 'Obscured Signage & Roadside Maintenance Standards',
    response: `### Sample AI Compliance Guidance [Demonstration Benchmark]

Under **Sample Urban Parking Guideline Rule PR-102.D**, parking restrictions require clear visibility:
* Official regulatory signage must be unobstructed and visible from a reasonable roadway approach distance.
* If utility construction barricades, tree branches, or temporary boards blocked the restriction sign, the evidentiary burden shifts to the issuing team.

**Actionable Steps:**
1. Capture dated photos showing the road approach where the sign is blocked.
2. Reference the obstruction in your informal demonstration appeal.

*Note: This is an educational demonstration prototype based on sample guidelines.*`
  },
  {
    id: 'KB-PR-103',
    queryKeywords: ['emergency', 'hospital', 'gate', 'fire', 'hydrant', 'clearance', 'bengaluru', 'mg road'],
    source: 'Sample Emergency Access Guideline Rule PR-103 (Emergency Gate Clearance)',
    title: 'Emergency Vehicle Gate & Fire Hydrant Clearance',
    response: `### Sample AI Regulatory Guidance [Demonstration Benchmark]

Under **Sample Emergency Access Guideline Rule PR-103**, public safety perimeters are strictly enforced:
* Vehicles must maintain at least **3 meters clearance** from hospital emergency gates, fire brigade exits, and active hydrants.
* Strict liability applies: brief temporary parking or lack of yellow paint does not qualify for an administrative waiver.

**Dispute Viability:**
* **Low Merit for Appeal (Sample Demo):** Safety guidelines prioritize unhindered emergency vehicle passage.

**Recommendation:** Proceed with standard demonstration fee clearance (₹1,500) to keep your vehicle record clean.`
  },
  {
    id: 'KB-PR-104',
    queryKeywords: ['ev', 'charging', 'idle', 'nexon', 'charger', 'battery', 'gurugram', 'cyber hub'],
    source: 'Sample EV Infrastructure Guideline Rule PR-104 (EV Charging Bay Compliance)',
    title: 'EV Charging Bay Regulations & Power Interruption Exceptions',
    response: `### Sample AI Guidelines [Demonstration Benchmark]

Under **Sample EV Infrastructure Guideline Rule PR-104**, dedicated EV bays are reserved for active charging:
* **Buffer Period:** 30 minutes following battery completion.
* **Defensible Demo Ground:** Power grid voltage drops or charging gun communication failures that prematurely abort the session.

You can submit the public charger telematics log for sample fee review.`
  }
];
