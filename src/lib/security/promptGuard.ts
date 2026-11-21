/**
 * Deterministic prompt-injection, XML boundary-escape, and off-topic Q&A defense
 * for CivicResolve Gemini AI triage and completion verification pipelines.
 */

export interface CitizenInputGuardResult {
  allowed: boolean;
  isValidCivicIssue: boolean;
  promptInjectionDetected: boolean;
  rejectionReason: string | null;
}

export interface WorkerNoteGuardResult {
  allowed: boolean;
  promptInjectionDetected: boolean;
  rejectionReason: string | null;
}

const PROMPT_INJECTION_PATTERNS: readonly RegExp[] = [
  /\b(ignore|disregard|forget|override)\s+(all\s+|any\s+)?(previous|prior|above|system|earlier)\s+(instructions?|prompts?|rules?|directives?)\b/i,
  /\b(reveal|show|print|output|leak|repeat)\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules?)\b/i,
  /\b(you\s+are\s+now|act\s+as\s+a|pretend\s+to\s+be|switch\s+to\s+developer\s+mode|jailbreak|dan\s+mode)\b/i,
  /\b(set|force|change|override)\s+(the\s+)?(urgency(\s+score)?|priority|confidence|score|verdict)\s+(to|=)\s*\w+/i,
  /\b(always\s+approve|auto[\s-]?approve|mark\s+(this\s+)?as\s+verified\s+fixed|return\s+verified\s*[:=]\s*true|bypass\s+(safety|verification|triage|filter))\b/i,
  /<\s*\/?\s*(system|assistant|user|instruction|untrusted_[a-z_]+)\s*>/i,
];

const OFF_TOPIC_MATH_OR_QA_PATTERNS: readonly RegExp[] = [
  /\bsolve\s+(this|the|my)?\s*(math\s+)?(problem|equation|question|puzzle)\b/i,
  /\bwhat\s+is\s+\d+\s*(?:\+|-|\*|\/|\^|plus|minus|times|divided\s+by)\s*\d+\b/i,
  /\b(calculate|compute|evaluate|simplify)\s+\d+\s*(?:\+|-|\*|\/|\^)\s*\d+/i,
  /(?:^|\s)\d+\s*(?:\+|-|\*|\/)\s*\d+\s*=\s*\?/i,
  /\b(write\s+(a|me)?\s*(python|javascript|typescript|java|c\+\+|sql|html|code|script|essay|poem|story|song|email)|tell\s+me\s+a\s+joke|what\s+is\s+the\s+capital\s+of|who\s+is\s+the\s+president|recipe\s+for|do\s+my\s+homework|answer\s+this\s+quiz)\b/i,
];

const CIVIC_DOMAIN_KEYWORDS =
  /\b(pothole|road|street|highway|lane|asphalt|pavement|crater|curb|kerb|sidewalk|footpath|ramp|wheelchair|crosswalk|zebra|bridge|flyover|streetlight|street\s+light|lamp|pole|light|outage|unlit|dark|wire|cable|power|electric|transformer|spark|traffic|signal|stoplight|signage|junction|intersection|water|pipe|leak|main|burst|flood|flooding|waterlog|drain|drainage|sewer|manhole|grate|stormwater|garbage|trash|waste|bin|dumpster|litter|rubbish|sanitation|odor|smell|sewage|tree|branch|limb|park|bench|playground|fallen|foliage|hazard|broken|cracked|collapsed|damaged|blocked|clogged|overflowing|sinkhole|bus\s+stop|station|metro|footbridge|railing|wall|graffiti|debris|stray|mosquito)\b/i;

/**
 * Escapes XML angle brackets and strips ASCII control chars so untrusted user text
 * cannot close or spoof surrounding XML encapsulation tags.
 */
export function escapeXmlBoundaryContent(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

/**
 * Wraps untrusted key-value fields inside explicit XML boundary tags.
 */
export function wrapUntrustedXml(
  rootTag: string,
  fields: Record<string, string | null | undefined>,
): string {
  const lines = [`<${rootTag}>`];
  for (const [key, value] of Object.entries(fields)) {
    const safeTag = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeVal = escapeXmlBoundaryContent(value ?? "");
    lines.push(`  <${safeTag}>${safeVal}</${safeTag}>`);
  }
  lines.push(`</${rootTag}>`);
  return lines.join("\n");
}

/**
 * Deterministic pre-scanner for Citizen issue reports.
 * Evaluates BOTH title and description to block prompt injections and off-topic
 * math/coding/trivia queries before they ever reach Gemini or Firestore.
 */
export function scanCitizenReportInput(input: {
  title: string;
  description: string;
  address?: string;
}): CitizenInputGuardResult {
  const fieldsToCheck = [
    input.title ?? "",
    input.description ?? "",
    input.address ?? "",
  ];
  const combined = fieldsToCheck.join(" ").trim();

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        allowed: false,
        isValidCivicIssue: false,
        promptInjectionDetected: true,
        rejectionReason:
          "Prompt injection or instruction-override language was detected. Please describe a real municipal infrastructure or public-service issue only.",
      };
    }
  }

  // Check both title and description individually for off-topic math/Q&A requests
  for (const field of [input.title ?? "", input.description ?? ""]) {
    for (const pattern of OFF_TOPIC_MATH_OR_QA_PATTERNS) {
      if (pattern.test(field)) {
        return {
          allowed: false,
          isValidCivicIssue: false,
          promptInjectionDetected: true,
          rejectionReason:
            "Off-topic math, coding, or general Q&A request detected. CivicResolve only triages genuine municipal infrastructure and public-service issues.",
        };
      }
    }
  }

  // If the description is purely non-civic chatter/question with zero civic cues
  const trimmedDesc = (input.description ?? "").trim();
  const hasCivicCueInDesc = CIVIC_DOMAIN_KEYWORDS.test(trimmedDesc);
  const hasCivicCueInTitle = CIVIC_DOMAIN_KEYWORDS.test(input.title ?? "");
  if (
    !hasCivicCueInDesc &&
    !hasCivicCueInTitle &&
    (/\?$/.test(trimmedDesc) || /^(hi|hello|hey|test|asdf|qwerty)\b/i.test(trimmedDesc))
  ) {
    return {
      allowed: false,
      isValidCivicIssue: false,
      promptInjectionDetected: false,
      rejectionReason:
        "Both the title and description must describe an actual civic or municipal infrastructure problem (e.g., pothole, broken streetlight, water leak, blocked drain, or waste overflow).",
    };
  }

  return {
    allowed: true,
    isValidCivicIssue: true,
    promptInjectionDetected: false,
    rejectionReason: null,
  };
}

/**
 * Deterministic pre-scanner for Field Worker completion notes to prevent workers
 * from injecting override commands into Gemini completion verification.
 */
export function scanWorkerCompletionNote(note: string): WorkerNoteGuardResult {
  const trimmed = (note ?? "").trim();
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        promptInjectionDetected: true,
        rejectionReason:
          "Prompt-injection or approval-override phrasing was detected in the worker completion note. Rewrite with factual on-site repair details and re-submit for inspection.",
      };
    }
  }

  for (const pattern of OFF_TOPIC_MATH_OR_QA_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        promptInjectionDetected: true,
        rejectionReason:
          "Off-topic Q&A or non-repair instructions were detected in the completion summary. Describe the actual municipal repair performed.",
      };
    }
  }

  return {
    allowed: true,
    promptInjectionDetected: false,
    rejectionReason: null,
  };
}
