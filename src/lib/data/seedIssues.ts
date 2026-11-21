import type { Issue } from "@/types/issue";

/**
 * 8 realistic localized Indian civic issues across Tamil Nadu (Coimbatore, Chennai),
 * Karnataka (Bengaluru), Maharashtra (Mumbai), and Telangana (Hyderabad), preserving
 * the 8 canonical document IDs so re-seeding overwrites cleanly in place.
 */
export const SEED_ISSUES: Issue[] = [
  {
    id: "cr-2026-0421",
    referenceCode: "CR-2026-0421",
    title: "Traffic signal outage at Avinashi Road & Hopes College junction",
    description:
      "All four directions of the primary traffic light at the Hopes College arterial crossing have gone completely dark during morning peak hours, causing heavy congestion and pedestrian crossing risks near college bus stops.",
    category: "Traffic & Signals",
    status: "Reported",
    priority: "Critical",
    urgencyScore: 96,
    department: "Transportation & Traffic Engineering",
    state: "Tamil Nadu",
    city: "Coimbatore",
    location: {
      address: "Avinashi Road & Hopes College Signal",
      city: "Coimbatore",
      state: "Tamil Nadu",
      district: "Peelamedu",
      lat: 11.0285,
      lng: 77.0226,
    },
    photoUrl: "/images/issues/traffic-signal.svg",
    photoAltText:
      "Intersection view showing unlit overhead traffic signal mast arm at Avinashi Road crossing.",
    upvotes: 112,
    upvotedBy: [],
    reporterUid: "citizen-seed-01",
    reporterName: "Karthik R. (Verified Citizen)",
    resolutionNote: null,
    completionReport: null,
    aiAnalysis: {
      category: "Traffic & Signals",
      confidence: 98,
      priority: "Critical",
      urgencyScore: 96,
      recommendedDepartment: "Transportation & Traffic Engineering",
      estimatedImpact:
        "High collision and pedestrian crossing hazard along Coimbatore's primary Avinashi Road corridor.",
      reasoning:
        "Complete signal blackout at a major multi-lane arterial intersection adjacent to educational institutions requires immediate traffic control and controller repair.",
      imageAltText:
        "Intersection view showing unlit overhead traffic signal mast arm at Avinashi Road crossing.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-21T08:15:00.000Z",
        note: "Submitted with intersection photo. Gemini AI scored urgency 96/100 (Critical) and routed to Transportation & Traffic Engineering.",
        updatedBy: "CivicResolve AI Triage",
      },
    ],
    createdAt: "2026-11-21T08:15:00.000Z",
    updatedAt: "2026-11-21T08:15:00.000Z",
  },
  {
    id: "cr-2026-0418",
    referenceCode: "CR-2026-0418",
    title: "Deep pothole near RS Puram DB Road bus stop",
    description:
      "Significant asphalt crater formed in the left bus bay along Diwan Bahadur Road in RS Puram. Rainwater is pooling inside, obscuring an estimated 8-inch depth and forcing two-wheelers and city buses to swerve.",
    category: "Road Infrastructure",
    status: "In Progress",
    priority: "High",
    urgencyScore: 84,
    department: "Public Works — Road Maintenance",
    state: "Tamil Nadu",
    city: "Coimbatore",
    location: {
      address: "Diwan Bahadur Road, near Gandhi Park Bus Stop",
      city: "Coimbatore",
      state: "Tamil Nadu",
      district: "RS Puram",
      lat: 11.0081,
      lng: 76.9516,
    },
    photoUrl: "/images/issues/pothole.svg",
    photoAltText:
      "Deep water-filled asphalt pothole along the curb lane adjacent to a municipal bus stop in RS Puram.",
    upvotes: 47,
    upvotedBy: [],
    reporterUid: "citizen-seed-02",
    reporterName: "Divya M. (Verified Citizen)",
    resolutionNote:
      "Site inspected by Coimbatore Corporation Road Crew #4; temporary barricades placed and hot-mix bitumen resurfacing scheduled.",
    completionReport: null,
    aiAnalysis: {
      category: "Road Infrastructure",
      confidence: 96,
      priority: "High",
      urgencyScore: 84,
      recommendedDepartment: "Public Works — Road Maintenance",
      estimatedImpact:
        "Acute two-wheeler skid hazard and unsafe bus lane swerving on a high-footfall commercial road.",
      reasoning:
        "Active arterial roadway defect adjacent to a public bus stop with standing water occluding depth. Escalated for rapid asphalt patching.",
      imageAltText:
        "Deep water-filled asphalt pothole along the curb lane adjacent to a municipal bus stop in RS Puram.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-19T09:14:00.000Z",
        note: "Report submitted with photo evidence. Gemini AI scored urgency 84/100 and recommended Public Works — Road Maintenance.",
        updatedBy: "CivicResolve AI Triage",
      },
      {
        status: "In Progress",
        timestamp: "2026-11-20T08:30:00.000Z",
        note: "Assigned to Road Maintenance Crew #4. Site inspected; hot-mix bitumen patch queued for completion.",
        updatedBy: "M. Alvarez (Ops Lead)",
      },
    ],
    createdAt: "2026-11-19T09:14:00.000Z",
    updatedAt: "2026-11-20T08:30:00.000Z",
  },
  {
    id: "cr-2026-0419",
    referenceCode: "CR-2026-0419",
    title: "Streetlight outage along Anna Nagar Tower Park walkway",
    description:
      "Three consecutive LED ornamental streetlights along the north pedestrian commuter walkway outside Anna Nagar Tower Park are completely dark after sunset, leaving a 150-meter stretch unlit.",
    category: "Street Lighting",
    status: "Reported",
    priority: "High",
    urgencyScore: 81,
    department: "Street Lighting & Power",
    state: "Tamil Nadu",
    city: "Chennai",
    location: {
      address: "3rd Main Road, Anna Nagar Tower Park North Gate",
      city: "Chennai",
      state: "Tamil Nadu",
      district: "Anna Nagar",
      lat: 13.085,
      lng: 80.2101,
    },
    photoUrl: "/images/issues/streetlight.svg",
    photoAltText:
      "Dusk view of an unlit ornamental park pathway lamppost along a dark pedestrian walkway in Chennai.",
    upvotes: 89,
    upvotedBy: [],
    reporterUid: "citizen-seed-03",
    reporterName: "Priya S. (Verified Citizen)",
    resolutionNote: null,
    completionReport: null,
    aiAnalysis: {
      category: "Street Lighting",
      confidence: 95,
      priority: "High",
      urgencyScore: 81,
      recommendedDepartment: "Street Lighting & Power",
      estimatedImpact:
        "Compromised evening pedestrian safety and visibility across a busy residential park walkway.",
      reasoning:
        "Multi-pole circuit outage rather than a single bulb failure indicates a feeder pillar or timer fault requiring electrical crew dispatch.",
      imageAltText:
        "Dusk view of an unlit ornamental park pathway lamppost along a dark pedestrian walkway in Chennai.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-20T18:45:00.000Z",
        note: "Reported via mobile upload. Gemini AI detected multi-fixture Street Lighting outage (81/100).",
        updatedBy: "CivicResolve AI Triage",
      },
    ],
    createdAt: "2026-11-20T18:45:00.000Z",
    updatedAt: "2026-11-20T18:45:00.000Z",
  },
  {
    id: "cr-2026-0415",
    referenceCode: "CR-2026-0415",
    title: "Blocked storm drain flooding Bellandur EcoSpace service road",
    description:
      "Stormwater grate along the Outer Ring Road service lane near EcoSpace is packed with silt and debris, causing ankle-deep waterlogging across the pedestrian crossing and bus boarding zone.",
    category: "Water & Drainage",
    status: "Reported",
    priority: "High",
    urgencyScore: 79,
    department: "Water & Drainage",
    state: "Karnataka",
    city: "Bengaluru",
    location: {
      address: "Outer Ring Road, EcoSpace Junction",
      city: "Bengaluru",
      state: "Karnataka",
      district: "Bellandur",
      lat: 12.9279,
      lng: 77.6762,
    },
    photoUrl: "/images/issues/storm-drain.svg",
    photoAltText:
      "Curb storm drain grate blocked by wet silt and leaves with pooled runoff covering the service road.",
    upvotes: 31,
    upvotedBy: [],
    reporterUid: "citizen-seed-04",
    reporterName: "Rohan N. (Verified Citizen)",
    resolutionNote: null,
    completionReport: null,
    aiAnalysis: {
      category: "Water & Drainage",
      confidence: 94,
      priority: "High",
      urgencyScore: 79,
      recommendedDepartment: "Water & Drainage",
      estimatedImpact:
        "Submerged pedestrian crossing and peak-hour bottleneck along the Outer Ring Road tech corridor.",
      reasoning:
        "Surface flooding over an active bus boarding point and stormwater inlet requires desilting suction unit clearing before evening showers.",
      imageAltText:
        "Curb storm drain grate blocked by wet silt and leaves with pooled runoff covering the service road.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-20T14:20:00.000Z",
        note: "Submitted by citizen. Routed to Water & Drainage with High priority (79/100).",
        updatedBy: "CivicResolve AI Triage",
      },
    ],
    createdAt: "2026-11-20T14:20:00.000Z",
    updatedAt: "2026-11-20T14:20:00.000Z",
  },
  {
    id: "cr-2026-0414",
    referenceCode: "CR-2026-0414",
    title: "Pressurized water main leak bubbling through Indiranagar footpath",
    description:
      "Clear potable water has been steadily gushing up from beneath the concrete valve chamber on 100 Feet Road near 12th Main for six hours, washing silt into the carriageway.",
    category: "Water & Drainage",
    status: "In Progress",
    priority: "High",
    urgencyScore: 76,
    department: "Water & Drainage",
    state: "Karnataka",
    city: "Bengaluru",
    location: {
      address: "100 Feet Road & 12th Main Junction",
      city: "Bengaluru",
      state: "Karnataka",
      district: "Indiranagar",
      lat: 12.9784,
      lng: 77.6408,
    },
    photoUrl: "/images/issues/water-leak.svg",
    photoAltText:
      "Water streaming from a cracked footpath valve chamber toward the carriageway in Indiranagar.",
    upvotes: 28,
    upvotedBy: [],
    reporterUid: "citizen-seed-05",
    reporterName: "Ananya K. (Verified Citizen)",
    resolutionNote:
      "Water supply valve isolation crew dispatched; acoustic leak detection underway to clamp lateral pipeline joint.",
    completionReport: null,
    aiAnalysis: {
      category: "Water & Drainage",
      confidence: 93,
      priority: "High",
      urgencyScore: 76,
      recommendedDepartment: "Water & Drainage",
      estimatedImpact:
        "Continuous treated water loss and sub-base footpath slab undermining.",
      reasoning:
        "Continuous pressurized water leak near a distribution valve chamber risks pavement undermining and slippery pedestrian approaches.",
      imageAltText:
        "Water streaming from a cracked footpath valve chamber toward the carriageway in Indiranagar.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-19T13:05:00.000Z",
        note: "Reported with photo of active valve chamber leak. Scored 76/100.",
        updatedBy: "CivicResolve AI Triage",
      },
      {
        status: "In Progress",
        timestamp: "2026-11-19T16:10:00.000Z",
        note: "Water distribution crew on site performing lateral shutoff valve inspection.",
        updatedBy: "Water Operations Desk — East Zone",
      },
    ],
    createdAt: "2026-11-19T13:05:00.000Z",
    updatedAt: "2026-11-19T16:10:00.000Z",
  },
  {
    id: "cr-2026-0412",
    referenceCode: "CR-2026-0412",
    title: "Fallen gulmohar limb & buckled footpath blocking Linking Road ramp",
    description:
      "A heavy gulmohar tree branch snapped during coastal wind gusts and landed across the raised concrete footpath slab on Linking Road in Bandra West, obstructing wheelchair and pedestrian passage.",
    category: "Sidewalks & Accessibility",
    status: "Pending Verification",
    priority: "Medium",
    urgencyScore: 62,
    department: "Parks & Forestry",
    state: "Maharashtra",
    city: "Mumbai",
    location: {
      address: "Linking Road, near National College",
      city: "Mumbai",
      state: "Maharashtra",
      district: "Bandra West",
      lat: 19.0607,
      lng: 72.8362,
    },
    photoUrl: "/images/issues/park-hazard.svg",
    photoAltText:
      "Large fallen tree branch resting across a concrete footpath and curb ramp in Bandra West.",
    upvotes: 19,
    upvotedBy: [],
    reporterUid: "citizen-seed-06",
    reporterName: "Siddharth D. (Verified Citizen)",
    resolutionNote:
      "Fallen gulmohar branches cleared and footpath paver blocks releveled by Ward H-West Crew #3; awaiting Municipal Authority sign-off.",
    completionReport: {
      afterPhotoUrl: "/images/issues/repaired-footpath.svg",
      workerUid: "demo-worker",
      workerName: "R. Selvam (Demo Field Worker)",
      workerNote:
        "Cut and hauled fallen gulmohar limb, reset four uplifted interlocking paver blocks, and reopened full wheelchair ramp access along Linking Road.",
      submittedAt: "2026-11-20T16:35:00.000Z",
      aiVerification: {
        verified: true,
        verdict: "Verified Fixed",
        confidence: 94,
        summary:
          "Side-by-side review confirms the fallen gulmohar obstruction and safety cones are completely cleared, footpath paver slabs sit flush, and unobstructed pedestrian/wheelchair access is restored.",
        recommendedAction: "Approve Resolution",
        model: "gemini-3.5-flash-lite",
        source: "gemini",
        analyzedAt: "2026-11-20T16:35:04.000Z",
      },
    },
    aiAnalysis: {
      category: "Sidewalks & Accessibility",
      confidence: 89,
      priority: "Medium",
      urgencyScore: 62,
      recommendedDepartment: "Parks & Forestry",
      estimatedImpact:
        "Complete obstruction of accessible footpath forcing pedestrians into busy Bandra traffic.",
      reasoning:
        "Accessible walkway blockage caused by fallen urban canopy limb requires forestry clearance followed by paver slab leveling.",
      imageAltText:
        "Large fallen tree branch resting across a concrete footpath and curb ramp in Bandra West.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-18T11:40:00.000Z",
        note: "Submitted by neighborhood resident; scored 62/100 Medium priority.",
        updatedBy: "CivicResolve AI Triage",
      },
      {
        status: "In Progress",
        timestamp: "2026-11-19T10:15:00.000Z",
        note: "Tree clearance unit assigned to remove branch; safety cones placed around footpath.",
        updatedBy: "Ward H-West Dispatch",
      },
      {
        status: "Pending Verification",
        timestamp: "2026-11-20T16:35:00.000Z",
        note: "Field work submitted with after-repair photo: \"Cut and hauled fallen gulmohar limb, reset four uplifted interlocking paver blocks, and reopened full wheelchair ramp access along Linking Road.\" Gemini AI Verification: Verified Fixed (94% confidence). Awaiting Municipal Authority approval.",
        updatedBy: "R. Selvam (Demo Field Worker)",
      },
    ],
    createdAt: "2026-11-18T11:40:00.000Z",
    updatedAt: "2026-11-20T16:35:00.000Z",
  },
  {
    id: "cr-2026-0409",
    referenceCode: "CR-2026-0409",
    title: "Overflowing public waste bins along Marine Drive promenade",
    description:
      "Three twin-compartment municipal trash and recycling bins near the Nariman Point seafront promenade have overflowed onto the pedestrian walkway, attracting stray birds and windblown litter.",
    category: "Sanitation & Waste",
    status: "Reported",
    priority: "Medium",
    urgencyScore: 48,
    department: "Sanitation & Solid Waste",
    state: "Maharashtra",
    city: "Mumbai",
    location: {
      address: "Netaji Subhash Chandra Road Promenade",
      city: "Mumbai",
      state: "Maharashtra",
      district: "Marine Drive",
      lat: 18.9432,
      lng: 72.8235,
    },
    photoUrl: "/images/issues/garbage.svg",
    photoAltText:
      "Overflowing municipal public waste and recycling bins along a paved coastal promenade.",
    upvotes: 16,
    upvotedBy: [],
    reporterUid: "citizen-seed-07",
    reporterName: "Meera P. (Verified Citizen)",
    resolutionNote: null,
    completionReport: null,
    aiAnalysis: {
      category: "Sanitation & Waste",
      confidence: 97,
      priority: "Medium",
      urgencyScore: 48,
      recommendedDepartment: "Sanitation & Solid Waste",
      estimatedImpact:
        "Windblown plastic waste entering the coastal promenade and seafront storm drains.",
      reasoning:
        "Multiple overflowing public receptacles along a high-visitation waterfront promenade warrant immediate off-cycle solid waste clearance.",
      imageAltText:
        "Overflowing municipal public waste and recycling bins along a paved coastal promenade.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-20T10:00:00.000Z",
        note: "Logged by citizen; routed to Sanitation & Solid Waste (48/100 Medium).",
        updatedBy: "CivicResolve AI Triage",
      },
    ],
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
  },
  {
    id: "cr-2026-0403",
    referenceCode: "CR-2026-0403",
    title: "Faded pedestrian crosswalk markings near Cyber Towers, HITEC City",
    description:
      "Thermoplastic white zebra crossing stripes outside the Cyber Towers metro approach in Madhapur have worn away, reducing pedestrian crossing visibility during evening office exits.",
    category: "Road Infrastructure",
    status: "Resolved",
    priority: "Low",
    urgencyScore: 32,
    department: "Public Works — Road Maintenance",
    state: "Telangana",
    city: "Hyderabad",
    location: {
      address: "HITEC City Main Road, Cyber Towers Junction",
      city: "Hyderabad",
      state: "Telangana",
      district: "Madhapur",
      lat: 17.4483,
      lng: 78.3915,
    },
    photoUrl: "/images/issues/crosswalk.svg",
    photoAltText:
      "Freshly repainted high-visibility white pedestrian crosswalk stripes in HITEC City, Hyderabad.",
    upvotes: 52,
    upvotedBy: [],
    reporterUid: "citizen-seed-08",
    reporterName: "Vikram T. (Verified Citizen)",
    resolutionNote:
      "GHMC Road Striping Unit applied new reflective thermoplastic zebra markings and verified pedestrian signage visibility.",
    completionReport: {
      afterPhotoUrl: "/images/issues/crosswalk.svg",
      workerUid: "demo-worker",
      workerName: "R. Selvam (Demo Field Worker)",
      workerNote:
        "Applied high-visibility hot-melt white thermoplastic zebra crossing stripes and cleaned pedestrian crossing sign near Cyber Towers gate.",
      submittedAt: "2026-11-18T12:20:00.000Z",
      aiVerification: {
        verified: true,
        verdict: "Verified Fixed",
        confidence: 96,
        summary:
          "After-repair evidence displays crisp, uniform white thermoplastic pedestrian stripes and clear signage visibility across the full carriageway.",
        recommendedAction: "Approve Resolution",
        model: "gemini-3.5-flash-lite",
        source: "gemini",
        analyzedAt: "2026-11-18T12:20:03.000Z",
      },
    },
    aiAnalysis: {
      category: "Road Infrastructure",
      confidence: 92,
      priority: "Low",
      urgencyScore: 32,
      recommendedDepartment: "Public Works — Road Maintenance",
      estimatedImpact:
        "Reduced pedestrian crosswalk contrast prior to thermoplastic repainting.",
      reasoning:
        "Non-emergency pavement marking wear scheduled for standard thermoplastic striping maintenance.",
      imageAltText:
        "Freshly repainted high-visibility white pedestrian crosswalk stripes in HITEC City, Hyderabad.",
      source: "gemini",
      model: "gemini-3.5-flash-lite",
    },
    statusHistory: [
      {
        status: "Reported",
        timestamp: "2026-11-14T08:40:00.000Z",
        note: "Citizen report received; routed to Public Works — Road Maintenance (32/100 Low).",
        updatedBy: "CivicResolve AI Triage",
      },
      {
        status: "In Progress",
        timestamp: "2026-11-16T09:15:00.000Z",
        note: "Assigned to Pavement Markings Unit for overnight HITEC City corridor striping.",
        updatedBy: "M. Alvarez (Ops Lead)",
      },
      {
        status: "Pending Verification",
        timestamp: "2026-11-18T12:20:00.000Z",
        note: "Field work submitted with after-repair photo. Gemini AI Verification: Verified Fixed (96% confidence). Awaiting Municipal Authority approval.",
        updatedBy: "R. Selvam (Demo Field Worker)",
      },
      {
        status: "Resolved",
        timestamp: "2026-11-18T15:45:00.000Z",
        note: "GHMC Road Striping Unit applied new reflective thermoplastic zebra markings and verified pedestrian signage visibility.",
        updatedBy: "M. Alvarez (Ops Lead)",
      },
    ],
    createdAt: "2026-11-14T08:40:00.000Z",
    updatedAt: "2026-11-18T15:45:00.000Z",
  },
];
