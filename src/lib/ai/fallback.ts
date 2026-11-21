import { scanCitizenReportInput } from "@/lib/security/promptGuard";
import type {
  AIAnalysis,
  IssueCategory,
  IssuePriority,
  MunicipalDepartment,
} from "@/types/issue";

export interface FallbackTriageInput {
  title: string;
  description: string;
  address?: string;
  categoryOverride?: IssueCategory | null;
  hasPhoto?: boolean;
}

interface HeuristicRule {
  keywords: RegExp;
  category: IssueCategory;
  department: MunicipalDepartment;
  baseUrgency: number;
  impact: string;
}

const CATEGORY_RULES: HeuristicRule[] = [
  {
    keywords:
      /\b(downed|live wire|power line|sparks?|electrocution|gas leak|collapse|sinkhole|emergency)\b/i,
    category: "Public Safety & Hazards",
    department: "Public Safety & Code Enforcement",
    baseUrgency: 92,
    impact: "Immediate life-safety risk to pedestrians, motorists, or nearby facilities.",
  },
  {
    keywords:
      /\b(traffic signal|traffic light|stoplight|intersection dark|signal outage|crosswalk signal)\b/i,
    category: "Traffic & Signals",
    department: "Transportation & Traffic Engineering",
    baseUrgency: 88,
    impact: "High intersection collision risk and peak-hour traffic congestion.",
  },
  {
    keywords:
      /\b(water main|water leak|burst pipe|flooding|storm drain|sewer|standing water|hydrant)\b/i,
    category: "Water & Drainage",
    department: "Water & Drainage",
    baseUrgency: 78,
    impact: "Roadway flooding, property water intrusion risk, and wasted municipal water.",
  },
  {
    keywords:
      /\b(pothole|asphalt|roadway|crater|sink|pavement|crosswalk|lane|bridge|curb)\b/i,
    category: "Road Infrastructure",
    department: "Public Works — Road Maintenance",
    baseUrgency: 72,
    impact: "Vehicle tire/suspension damage risk and hazardous cyclist or transit lane swerving.",
  },
  {
    keywords:
      /\b(streetlight|street light|lamp post|dark walkway|unlit|light outage|bulb out)\b/i,
    category: "Street Lighting",
    department: "Street Lighting & Power",
    baseUrgency: 70,
    impact: "Reduced nighttime pedestrian visibility and increased corridor safety concerns.",
  },
  {
    keywords:
      /\b(sidewalk|wheelchair|ada|ramp|trip hazard|broken concrete|curb cut)\b/i,
    category: "Sidewalks & Accessibility",
    department: "Public Works — Road Maintenance",
    baseUrgency: 64,
    impact: "Obstructs wheelchair accessibility and creates pedestrian tripping hazards.",
  },
  {
    keywords:
      /\b(tree|oak|limb|branch|park|bench|playground|fallen tree|foliage|overgrown)\b/i,
    category: "Parks & Forestry",
    department: "Parks & Forestry",
    baseUrgency: 56,
    impact: "Blocks public right-of-way or damages municipal park infrastructure.",
  },
  {
    keywords:
      /\b(garbage|trash|dumpster|litter|overflowing|waste|recycling|dumping|odor)\b/i,
    category: "Sanitation & Waste",
    department: "Sanitation & Solid Waste",
    baseUrgency: 52,
    impact: "Sanitation nuisance, pest attraction, and sidewalk obstruction.",
  },
];

const DEPARTMENT_BY_CATEGORY: Record<IssueCategory, MunicipalDepartment> = {
  "Road Infrastructure": "Public Works — Road Maintenance",
  "Street Lighting": "Street Lighting & Power",
  "Sanitation & Waste": "Sanitation & Solid Waste",
  "Water & Drainage": "Water & Drainage",
  "Parks & Forestry": "Parks & Forestry",
  "Traffic & Signals": "Transportation & Traffic Engineering",
  "Sidewalks & Accessibility": "Public Works — Road Maintenance",
  "Public Safety & Hazards": "Public Safety & Code Enforcement",
};

const CRITICAL_BOOST_REGEX =
  /\b(school|hospital|bus stop|wheelchair|blind|immediate|severe|deep|flooded|live|sparks|dark|collision|children)\b/i;
const LOW_MODIFIER_REGEX =
  /\b(minor|faded|cosmetic|small|light|peeling|slight)\b/i;

function scoreToPriority(score: number): IssuePriority {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function buildRejectedTriageResult(
  reason: string,
  promptInjectionDetected: boolean,
  model: string = "prompt-guard",
): AIAnalysis {
  return {
    category: "Public Safety & Hazards",
    confidence: 0,
    priority: "Low",
    urgencyScore: 1,
    recommendedDepartment: "Public Safety & Code Enforcement",
    estimatedImpact: "Submission blocked — not a valid municipal issue report.",
    reasoning: reason,
    imageAltText: "Report rejected by CivicResolve input validation.",
    source: "fallback",
    model,
    isValidCivicIssue: false,
    promptInjectionDetected,
    rejectionReason: reason,
  };
}

/**
 * Deterministic keyword and severity triage fallback used when Gemini API is
 * unavailable, rate-limited, or unconfigured in local/test environments.
 */
export function runDeterministicFallbackTriage(
  input: FallbackTriageInput,
): AIAnalysis {
  const guard = scanCitizenReportInput({
    title: input.title,
    description: input.description,
    address: input.address,
  });
  if (!guard.allowed) {
    return buildRejectedTriageResult(
      guard.rejectionReason ??
        "Report appears off-topic or contains invalid instructions.",
      guard.promptInjectionDetected,
    );
  }

  const combinedText = `${input.title} ${input.description} ${input.address ?? ""}`;
  const matchedRule = CATEGORY_RULES.find((rule) =>
    rule.keywords.test(combinedText),
  );

  const category: IssueCategory =
    input.categoryOverride ?? matchedRule?.category ?? "Road Infrastructure";

  const recommendedDepartment: MunicipalDepartment = input.categoryOverride
    ? DEPARTMENT_BY_CATEGORY[input.categoryOverride]
    : (matchedRule?.department ?? DEPARTMENT_BY_CATEGORY[category]);

  let urgencyScore = matchedRule?.baseUrgency ?? 55;
  if (CRITICAL_BOOST_REGEX.test(combinedText)) {
    urgencyScore += 12;
  }
  if (LOW_MODIFIER_REGEX.test(combinedText)) {
    urgencyScore -= 22;
  }
  if (input.hasPhoto) {
    urgencyScore += 3;
  }
  urgencyScore = Math.min(98, Math.max(15, Math.round(urgencyScore)));

  const priority = scoreToPriority(urgencyScore);
  const confidence = matchedRule ? 87 : 76;

  const estimatedImpact =
    matchedRule?.impact ??
    "Localized municipal infrastructure degradation requiring scheduled crew inspection.";

  const locationContext = input.address
    ? ` at ${input.address}`
    : "";

  const reasoning = `Deterministic civic triage classified this report under ${category}${locationContext} (${priority} priority, score ${urgencyScore}/100). Routed to ${recommendedDepartment} based on reported hazard severity and public right-of-way impact.`;

  const imageAltText = input.hasPhoto
    ? `Citizen-submitted photo documenting ${input.title.toLowerCase()}${locationContext}.`
    : `No field photo attached for ${input.title.toLowerCase()}.`;

  return {
    category,
    confidence,
    priority,
    urgencyScore,
    recommendedDepartment,
    estimatedImpact,
    reasoning,
    imageAltText,
    source: "fallback",
    model: "deterministic-fallback",
    isValidCivicIssue: true,
    promptInjectionDetected: false,
    rejectionReason: null,
  };
}
